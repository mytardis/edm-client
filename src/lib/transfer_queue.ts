/**
 * Transfer queue, starts threads or processes to handle file transfers
 */

import * as path from 'path';
import * as events from 'events';
import * as AsyncQueue from 'async/queue';
import * as _ from "lodash";
const PouchDB = require('pouchdb-node');
PouchDB.plugin(require('pouchdb-upsert'));

import {ApolloQueryResult} from "apollo-client";

import {settings} from "./settings";
import {LocalCache} from "./cache";
import FileTransferJob from "./file_transfer_job";
import {TransferMethod} from "./transfer_methods/transfer_method";
import {TransferMethodPlugins} from "./transfer_methods/transfer_method_plugins";
import {EDMQueries} from "./queries";

import * as logger from "./logger";
const log = logger.log.child({'tags': ['transfer_queue']});

/**
 * This task _queue implementation implements parts of a stream.Duplex
 * interface (ITransferQueue) so that it can be used (almost) interchangeably
 * with other implementations (eg an alternative 'TransferStream')
 *
 * https://caolan.github.io/async/docs.html#queue
 * https://caolan.github.io/async/docs.html#QueueObject
 *
 */
export class TransferQueueManager extends events.EventEmitter  {

    public _queue: AsyncQueue;
    private method: TransferMethod;
    private _paused: boolean = false;

    get concurrency(): number {
        return this._queue.concurrency;
    }
    set concurrency(value: number) {
        this._queue.concurrency = value;
    }

    constructor(readonly queue_id: string, options?: any) {
        super();

        this._queue = new AsyncQueue((task, taskDone) => {
            this._doTask(task, taskDone);
        });
        this.concurrency = _.get(settings.conf.appSettings, 'maxAsyncTransfersPerDestination', 1);
        this._queue.buffer = _.get(options, 'highWaterMark', 100000);

        // Fires when a task completes and running workers <= (concurrency - buffer)
        // It seems async.queue might assume that buffer is always smaller than concurrency - this will never fire if
        // buffer is greater than concurrency.
        // 'Unsaturated' in this context seems to mean something like:
        //  "if we were to send a full buffer to the remaining idle workers, we would still have some idle workers
        //   remaining".
        this._queue.unsaturated = () => {
            this.emit('unsaturated', this);
            log.debug({event: 'unsaturated'}, `Queue ${this.queue_id}: became unsaturated`);
        };

        // Fires when the number of running workers == concurrency.
        // Tasks will be buffered rather than consumed by workers immediately.
        this._queue.saturated = () => {
            this.emit('saturated', this);
            log.debug({event: 'saturated'}, `Queue ${this.queue_id}: workers busy. Additional tasks will be queued.`);
        };

        // Fires when the last buffered item has given to a worker
        this._queue.empty = () => {
            this.emit('empty', this);
            log.debug({event: 'empty'}, `Queue: ${this.queue_id} became empty.`);
        };

        // Fires when the buffer is empty and all workers have finished
        this._queue.drain = () => {
            this.emit('drain', this);
            log.debug({event: 'drain'}, `Queue ${this.queue_id}: all workers became idle, no tasks queued.`);
        };
    }

    private initTransferMethod(destinationHost: EDMDestinationHost, destination: EDMDestination) {
        if (this.method != null) return;
        let method_name = destinationHost.transfer_method;
        let options = destinationHost.settings;
        options.destBasePath = destination.location;
        this.method = new (TransferMethodPlugins.getMethod(method_name))(options);

        // These must be lambdas to preserve context of 'this'.
        // Could be avoided if we use a single EDMConnection singleton in onUpdateProgress
        // We use once events so we don't need to even call removeListener (since we
        // can't remove a specific anonymous method) - onUpdateProgress re-registers itself
        // as a one time event every time it's called.
        this.method.on('start', (id, bytes, file_local_id) => this.onTransferStart(id, bytes, file_local_id));
        this.method.on('progress', (id, bytes, file_local_id) => this.onUpdateProgress(id, bytes, file_local_id));
        this.method.on('complete', (id, bytes, file_local_id) => this.onTransferComplete(id, bytes, file_local_id));
    }

    queueTask(job: FileTransferJob) {
        this._queue.push(job);
        return this.isPaused() || this.isFull();
    }

    _doTask(job: FileTransferJob, jobDoneCallback: Function) {
        this.transferFile(job, jobDoneCallback);
    }

    isFull() {
        return (this._queue.length() >= this._queue.buffer);
    }

    isPaused() {
        return this._paused;
    }

    pause() {
        this._paused = true;
        return this._queue.pause();
    }

    resume() {
        this._paused = false;
        return this._queue.resume();
    }

    private transferFile(transferJob: FileTransferJob, doneCallback) {

        const destinationHost = transferJob.getDestinationHost();
        const destination = settings.getDestination(transferJob.destination_id);
        this.initTransferMethod(destinationHost, destination);

        const filepath = LocalCache.cache.getFilePath(transferJob.file_local_id);
        const source = settings.getSource(transferJob.source_id);
        // TODO: destination_path will come from server as part of file_transfer
        //       in the future. For now, we mirror the relative path at the source
        const destination_path = path.relative(source.basepath, filepath);

        this.method.transfer(filepath,
                             destination_path,
                             transferJob.file_transfer_id,
                             transferJob.file_local_id,
                             doneCallback,
        );
    }

    private onTransferStart(file_transfer_id: string, bytes_transferred: number, file_local_id: string) {
        log.info({
            event: 'start',
            queue_id: this.queue_id,
            file_transfer_id: file_transfer_id,
            bytes_transferred: bytes_transferred,
            file_local_id: file_local_id},
            `Transfer started, file: ${file_local_id}, file_transfer_id: ${file_transfer_id}, queue_id: ${this.queue_id}, bytes_transferred: ${bytes_transferred}`);
        this.onUpdateProgress(file_transfer_id, bytes_transferred, file_local_id);
    }

    private onUpdateProgress(file_transfer_id: string, bytes_transferred: number, file_local_id: string) {
        log.debug({
            event: 'progress',
            queue_id: this.queue_id,
            file_transfer_id: file_transfer_id,
            bytes_transferred: bytes_transferred,
            file_local_id: file_local_id},
            `Transfer progress, file: ${file_local_id}, file_transfer_id: ${file_transfer_id}, queue_id: ${this.queue_id}, bytes_transferred: ${bytes_transferred}`);

        let cachedTransfer = {
            id: file_transfer_id,
            bytes_transferred: bytes_transferred,
            status: "uploading"} as EDMCachedFileTransfer;

        LocalCache.cache._db.upsert(file_local_id, (doc) => {
            if (doc == null || doc.transfers == null) return doc;

            for (let xfer of doc.transfers) {
                if (xfer.id == file_transfer_id) {
                    xfer.status = cachedTransfer.status;
                    xfer.bytes_transferred = cachedTransfer.bytes_transferred;
                }
            }
            return doc;
        })
        .then((upsertResult) => {
            return EDMQueries.updateFileTransfer(cachedTransfer);
        })
        .then((backendResponse) => {

            // TODO: Here (and in onTransferComplete), we need to check the status of
            //       the file_transfer returned. If the status == 'cancelled', or the
            //       file_transfer record doesn't exist (record deleted), cancel the transfer.
            log.debug({event: 'progress', result: backendResponse},
                `Updated backend with transfer progress: ${file_transfer_id}`);
        })
        .catch((error) => {
            log.error({
                    err: error,
                    event: 'progress',
                    queue_id: this.queue_id,
                    file_transfer_id: file_transfer_id,
                    bytes_transferred: bytes_transferred,
                    file_local_id: file_local_id
                },
                `Failed to update transfer progress: ${file_transfer_id}`);
        });
    }

    private onTransferComplete(file_transfer_id: string, bytes_transferred: number, file_local_id: string) {
        // TODO: Deal with network failure here, since we don't want the server never finding out about completed
        //       transfers (in the case where the server is unable to verify itself).
        //       (Retries at Apollo client level ?
        //        Persist in PouchDB and periodically retry until server responds, then remove record ? )
        log.info({
            event: 'complete',
            queue_id: this.queue_id,
            file_transfer_id: file_transfer_id,
            bytes_transferred: bytes_transferred,
            file_local_id: file_local_id},
            `Transfer complete, file: ${file_local_id}, file_transfer_id: ${file_transfer_id}, queue_id: ${this.queue_id}, bytes_transferred: ${bytes_transferred}`);

        let cachedTransfer = {
            id: file_transfer_id,
            bytes_transferred: bytes_transferred,
            status: "complete"} as EDMCachedFileTransfer;

        LocalCache.cache._db.upsert(file_local_id, (doc) => {
            if (doc == null || doc.transfers == null) return doc;

            for (let xfer of doc.transfers) {
                if (xfer.id == file_transfer_id) {
                    xfer.status = cachedTransfer.status;
                    xfer.bytes_transferred = cachedTransfer.bytes_transferred;
                }
            }
            return doc;
        })
        .then((upsertResult) => {
            this.emit('transfer_complete', file_transfer_id, bytes_transferred, file_local_id);

            return EDMQueries.updateFileTransfer(cachedTransfer);
        })
        .then((backendResponse) => {
            log.debug({event: 'progress', result: backendResponse},
                `Updated backend with transfer complete status: ${file_transfer_id}`);
        })
        .catch((error) => {
            log.error({
                    err: error,
                    event: 'complete',
                    queue_id: this.queue_id,
                    file_transfer_id: file_transfer_id,
                    bytes_transferred: bytes_transferred,
                    file_local_id: file_local_id
                },
                `Failed to update transfer complete status: ${file_transfer_id}`);
        });
    }
}

export class QueuePool {
    private managers = {};

    constructor() {

    }

    getQueue(queue_id: string): TransferQueueManager {
        if (this.managers[queue_id] == null) {
            this.managers[queue_id] = new TransferQueueManager(queue_id);
        }
        return this.managers[queue_id];
    }

    createTransferJob(cachedFile: EDMCachedFile,
                      transfer: EDMCachedFileTransfer): FileTransferJob {
        return new FileTransferJob(
            transfer.id,
            cachedFile.source_id,
            transfer.destination_id,
            cachedFile._id);
    }

    // isSaturated(queue_id: string): boolean {
    //     return this.getQueue(queue_id).isSaturated();
    // }

    isFull(queue_id: string): boolean {
        return this.getQueue(queue_id).isFull();
    }

    // We return a Promise here, so cache.ts can deal with updating the local cached status
    // after the server responds
    // TODO: How to propagate the _queue saturation boolean signal also in this case ?
    queueTransfer(transfer_job: FileTransferJob): Promise<ApolloQueryResult<any>> {
        let queue_unsaturated: boolean = true;
        let q = this.getQueue(transfer_job.destination_id);

        if (q.isFull()) {
            return Promise.reject(new Error(`Queue ${q.queue_id} full, not queueing job.`));
        }

        return EDMQueries.updateFileTransfer({
                id: transfer_job.file_transfer_id,
                bytes_transferred: 0,
                status: 'queued'
            } as EDMCachedFileTransfer)
            .then((result) => {
                // we add this property to the ApolloQueryResult Promise to communicate queue saturation state
                result['queue_saturated'] = q.queueTask(transfer_job);
                return result;
            });
    }
}

export const TransferQueuePool = new QueuePool();
