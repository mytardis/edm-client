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
import {TransferMethod} from "./transfer_methods/transfer_method";
import {TransferMethodPlugins} from "./transfer_methods/transfer_method_plugins";
import {EDMQueries} from "./queries";

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
    private _saturated: boolean = false;

    get concurrency(): number {
        return this._queue.concurrency;
    }
    set concurrency(value: number) {
        this._queue.concurrency = value;
    }

    constructor(readonly queue_id: string, options?: any) {
        super();

        this._queue = new AsyncQueue((task, taskDone) => {
            this.doTask(task, taskDone);
        });
        this.concurrency = _.get(settings.conf.appSettings, 'maxAsyncTransfersPerDestination', 1);
        this._queue.buffer = _.get(options, 'highWaterMark', 10000);

        // The unsaturated callback is probably most equivalent to the 'drain' event emitted by
        // node Writable streams. async._queue has it's own drain callback, but that fires when
        // the _queue is empty.
        // TODO: This never seems to fire, so we also modulate _saturated in the drain event
        //       Seems to depend on 'concurrency' rather than 'buffer' high water mark value ?
        this._queue.unsaturated = () => {
            this._saturated = false;
            this.emit('drain');
            console.log(`${this.queue_id}: Queue ready to receive more jobs.`);
        };

        this._queue.saturated = () => {
            this._saturated = true;
            console.log(`${this.queue_id}: Queue is saturated.`);
        };

        // when then _queue is empty and all workers have finished, we emit 'finish' similar to
        // when a node Writable stream has flushed all data
        this._queue.drain = () => {
            this._saturated = false;
            this.emit('finish');
            console.log(`${this.queue_id}: Queue became empty.`);
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
        this.method.on('start', (id, bytes, file_local_id) => this.onUpdateProgress(id, bytes, file_local_id));
        this.method.on('progress', (id, bytes, file_local_id) => this.onUpdateProgress(id, bytes, file_local_id));
        this.method.on('complete', (id, bytes, file_local_id) => this.onTransferComplete(id, bytes, file_local_id));
    }

    queueTask(job: FileTransferJob) {
        this._queue.push(job);
        return this.isPaused() || this.isSaturated();
    }

    // write(job: FileTransferJob) {
    //     return this.queueTask(job);
    // }

    doTask(job, consumedCallback) {
        // TODO: we should consider making this method call blocking, so
        // queue 'finish' and 'empty' events behave as described in the async.queue docs
        this.transferFile(job);
        consumedCallback();
    }

    isSaturated() {
        return this._saturated;
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

    private transferFile(transferJob: FileTransferJob) {

        let destinationHost = this.getDestinationHost(transferJob);
        let destination = settings.getDestination(transferJob.destination_id);
        this.initTransferMethod(destinationHost, destination);

        let filepath = this.getFilePath(transferJob);

        this.method.transfer(filepath, transferJob.file_transfer_id, transferJob.file_local_id);
    }

    // TODO: This method probably belongs on a FileTransferJob class ?
    private getDestinationHost(transferJob: FileTransferJob): EDMDestinationHost {
        let host_id = settings.getDestination(transferJob.destination_id).host_id;
        let destinationHost = settings.getHost(host_id);
        return destinationHost;
    }

    // TODO: This method probably belongs on a FileTransferJob class ?
    private getFilePath(transferJob: FileTransferJob): string {
        let source = settings.getSource(transferJob.source_id);
        let filepath = path.join(source.basepath, transferJob.file_local_id);
        return filepath;
    }

    private onUpdateProgress(file_transfer_id: string, bytes_transferred: number, file_local_id: string) {
        console.info(`Transfer {FileTransferJob: ${file_transfer_id}, ` +
                     `queue_id: ${this._queue.queue_id}, ` +
                     `bytes_transferred: ${bytes_transferred}}`);

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
            console.log(`${JSON.stringify(backendResponse)}`);
        })
        .catch((error) => {
            console.log(`${error}`);
        });
    }

    private onTransferComplete(file_transfer_id: string, bytes_transferred: number, file_local_id: string) {
        // TODO: Deal with network failure here, since we don't want the server never finding out about completed
        //       transfers (in the case where the server is unable to verify itself).
        //       (Retries at Apollo client level ?
        //        Persist in PouchDB and periodically retry until server responds, then remove record ? )
        console.info(`Transfer complete {FileTransferJob: ${file_transfer_id}, ` +
                     `queue_id: ${this._queue.queue_id}, ` +
                     `bytes_transferred: ${bytes_transferred}}`);

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
            console.log(`${JSON.stringify(backendResponse)}`);
        })
        .catch((error) => {
            console.log(`${error}`);
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
        return {
            file_local_id: cachedFile._id,
            source_id: cachedFile.source_id,
            destination_id: transfer.destination_id,
            file_transfer_id: transfer.id,
        } as FileTransferJob;
    }

    // We return a Promise here, so cache.ts can deal with updating the local cached status
    // after the server responds
    // TODO: How to propagate the _queue saturation boolean signal also in this case ?
    queueTransfer(transfer_job: FileTransferJob): Promise<ApolloQueryResult<any>> {
        let queue_unsaturated: boolean = true;
        let q = this.getQueue(transfer_job.destination_id);

        if (q.isSaturated()) {
            return Promise.reject(new Error(`Queue ${q.queue_id} saturated, not queueing job.`));
        }

        return EDMQueries.updateFileTransfer({
                id: transfer_job.file_transfer_id,
                bytes_transferred: 0,
                status: 'queued'
            } as EDMCachedFileTransfer)
            .then((result) => {
                queue_unsaturated = q.queueTask(transfer_job);
                return result;
            });
            // .catch(() => {
            //     throw new Error("Failed to update server with file transfer status = queued. Job not queued.");
            // });

        //return queue_unsaturated;
    }
}

export const TransferQueuePool = new QueuePool();
