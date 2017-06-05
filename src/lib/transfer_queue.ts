/**
 * Transfer queue, starts threads or processes to handle file transfers
 */

import * as path from 'path';
import * as events from 'events';
import * as AsyncQueue from 'async/queue';
import * as _ from "lodash";
// const PouchDB = require('pouchdb-node');
// PouchDB.plugin(require('pouchdb-upsert'));

import {ApolloQueryResult} from "apollo-client";

import {settings} from "./settings";
//import {LocalCache} from "./cache";
import FileTransferJob from "./file_transfer_job";
import {TransferMethod} from "./transfer_methods/transfer_method";
import {TransferMethodPlugins} from "./transfer_methods/transfer_method_plugins";
import {EDMQueries} from "./queries";

import * as logger from "./logger";
import {error} from "util";
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

    private _queue: AsyncQueue;
    private method: TransferMethod;
    private _paused: boolean = false;
    private destination: EDMDestination;

    get concurrency(): number {
        return this._queue.concurrency;
    }
    set concurrency(value: number) {
        this._queue.concurrency = value;
    }

    constructor(readonly destination_id: string, options?: any) {
        super();
        this.destination = settings.getDestination(this.destination_id, true);
        this.initTransferMethod();

        this._queue = new AsyncQueue((task, taskDone) => {
            this._doTask(task, taskDone);
            // == this.transferFile(task, taskDone);
        });
        this.concurrency = _.get(settings.conf.appSettings,
            'maxAsyncTransfersPerDestination', 1);
        this._queue.buffer = _.get(options, 'highWaterMark', 100000);

        // Fires when a task completes and running workers <= (
        // concurrency - buffer)
        // It seems async.queue might assume that buffer is always smaller than
        // concurrency - this will never fire if buffer is greater than
        // concurrency.
        // 'Unsaturated' in this context seems to mean something like:
        //  "if we were to send a full buffer to the remaining idle workers, we
        //   would still have some idle workers remaining".
        this._queue.unsaturated = () => {
            this.emit('unsaturated', this);
            this.queueTransfers();
            log.debug({event: 'unsaturated'}, `Queue ${this.destination_id}: became 
                unsaturated`);
        };

        // Fires when the number of running workers == concurrency.
        // Tasks will be buffered rather than consumed by workers immediately.
        this._queue.saturated = () => {
            this.emit('saturated', this);
            log.debug({event: 'saturated'}, `Queue ${this.destination_id}: workers 
                busy. Additional tasks will be queued.`);
        };

        // Fires when the last buffered item has given to a worker
        this._queue.empty = () => {
            this.emit('empty', this);
            log.debug({event: 'empty'}, `Queue: ${this.destination_id} became empty.`);
        };

        // Fires when the buffer is empty and all workers have finished
        this._queue.drain = () => {
            this.emit('drain', this);
            log.debug({event: 'drain'}, `Queue ${this.destination_id}: all workers 
                became idle, no tasks queued.`);
        };
    }

    activate() {
        this.queueTransfers();
    }

    private pullTransferJobs(amount?: number) {
        return EDMQueries.getPendingFileTransfers(
            this.destination_id, amount || 10);
    }

    private initTransferMethod() {
        if (this.method != null) return;
        let method_name = this.destination.host.transferMethod;
        let options = _.clone(this.destination.host.settings);
        options.destBasePath = this.destination.base;
        this.method = new (TransferMethodPlugins.getMethod(method_name))(
            this.destination
        );

        // These must be lambdas to preserve context of 'this'.
        // Could be avoided if we use a single EDMConnection singleton in
        // onUpdateProgress
        // We use once events so we don't need to even call removeListener
        // (since we can't remove a specific anonymous method) -
        // onUpdateProgress re-registers itself as a one time event every time
        // it's called.
        // TODO: handle 'fail' event
        this.method.on('start', (id, bytes) =>
            this.onTransferStart(id, bytes));
        this.method.on('progress', (id, bytes) =>
            this.onUpdateProgress(id, bytes));
        this.method.on('complete', (id, bytes) =>
            this.onTransferComplete(id, bytes));
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
        try {
            this.method.transfer(
                transferJob,
                doneCallback
            );
        } catch(error) {
            log.error(`transfer failed with error: ${error}`);
            log.debug(transferJob, "transferJob failed:");
            log.debug(error.stack, "");
            //TODO: proper error handling
        }
    }

    private onTransferStart(file_transfer_id: string, bytes_transferred: number) {
        log.info({
                event: 'start',
            queue_id: this.destination_id,
            file_transfer_id: file_transfer_id,
            bytes_transferred: bytes_transferred },
            `Transfer started, 
             file_transfer_id: ${file_transfer_id}, 
             queue_id: ${this.destination_id}, 
             bytes_transferred: ${bytes_transferred}`);
        this.onUpdateProgress(file_transfer_id, bytes_transferred);
    }

    private onUpdateProgress(file_transfer_id: string, bytes_transferred: number) {
        log.debug({
                event: 'progress',
            queue_id: this.destination_id,
            file_transfer_id: file_transfer_id,
            bytes_transferred: bytes_transferred },
            `Transfer progress, 
             file_transfer_id: ${file_transfer_id},
             queue_id: ${this.destination_id},
             bytes_transferred: ${bytes_transferred}`);

        let transfer = {
            id: file_transfer_id,
            bytes_transferred: bytes_transferred,
            status: "uploading"} as EDMCachedFileTransfer;

        EDMQueries.updateFileTransfer(transfer)
        .then((backendResponse) => {

            // TODO: Here (and in onTransferComplete), we need to check the
            // status of the file_transfer returned. If the status ==
            // 'cancelled', or the file_transfer record doesn't exist (record
            // deleted), cancel the transfer.
            log.debug({event: 'progress', result: backendResponse},
                `Updated backend with transfer progress: ${file_transfer_id}`);
        })
        .catch((error) => {
            log.error({
                    err: error,
                    event: 'progress',
                    queue_id: this.destination_id,
                    file_transfer_id: file_transfer_id,
                    bytes_transferred: bytes_transferred},
                `Failed to update transfer progress: ${file_transfer_id}`);
        });
    }

    private onTransferComplete(file_transfer_id: string,
                               bytes_transferred: number) {
        // TODO: Deal with network failure here, since we don't want the server
        //       never finding out about completed
        //       transfers (in the case where the server is unable to verify itself).
        //       (Retries at Apollo client level ?
        //        Persist in PouchDB and periodically retry until server
        //        responds, then remove record ? )
        log.info({
            event: 'complete',
            queue_id: this.destination_id,
            file_transfer_id: file_transfer_id,
            bytes_transferred: bytes_transferred
            },
            `Transfer complete, 
             file_transfer_id: ${file_transfer_id}, 
             queue_id: ${this.destination_id}, 
             bytes_transferred: ${bytes_transferred}`);

        let transfer = {
            id: file_transfer_id,
            bytes_transferred: bytes_transferred,
            status: "complete"} as EDMCachedFileTransfer;

        EDMQueries.updateFileTransfer(transfer)
        .then((backendResponse) => {
            log.debug({event: 'progress', result: backendResponse},
                `Updated backend with transfer complete status: ${file_transfer_id}`);

            this.emit('transfer_complete', file_transfer_id, bytes_transferred);
        })
        .catch((error) => {
            log.error({
                    err: error,
                    event: 'complete',
                    queue_id: this.destination_id,
                    file_transfer_id: file_transfer_id,
                    bytes_transferred: bytes_transferred
                },
                `Failed to update transfer complete status: ${file_transfer_id}`);
        });
    }

    getAvailableSpots() : number {
        return this.concurrency - this._queue.length();
    }

    queueTransfers() {
        // queue transfers available from the server for destination

        // step 1: check queue for available spots
        let q = this._queue;
        let spots = this.getAvailableSpots();
        // step 2: get available spots amount of transfers to start
        let transfers = this.pullTransferJobs(spots);
        // step 3: queue them
        transfers.result().then((result) => {
            let fts = result.data.currentClient.destination.fileTransfers.edges;
            let source = result.data.currentClient.destination.source;
            for (let edge of fts) {
                let ft = edge.node;
                // reformat ft into client ft object
                let ftJob = new FileTransferJob(
                    ft.id,
                    ft.file.filepath,
                    ft.file.filepath  // TODO: server provides destination path
                );
                log.debug(ftJob, "queuing file transfer job")
                this.queueTask(ftJob);
            }
        });
    }
}

export class QueuePool {
    private managers = {};

    getQueue(destination_id: string): TransferQueueManager {
        if (this.managers[destination_id] == null) {
            this.managers[destination_id] = new TransferQueueManager(destination_id);
        }
        return this.managers[destination_id];
    }

    isFull(queue_id: string): boolean {
        return this.getQueue(queue_id).isFull();
    }
}

export const TransferQueuePool = new QueuePool();
