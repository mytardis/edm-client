/**
 * Transfer queue, starts threads or processes to handle file transfers
 */
import * as events from 'events';
import * as child_process from 'child_process';
import * as AsyncQueue from 'async/queue';
import * as _ from "lodash";

import {ApolloQueryResult} from "apollo-client";

import {settings} from './settings';
import {EDMConnection} from "../edmKit/connection";
import {TransferManager} from "./transfer_manager";
import {EDMQueries} from "./queries";

/**
 * This task queue implementation implements parts of a stream.Duplex interface (ITransferQueue)
 * so that it can be used (almost) interchangeably with other implementations (eg an alternative 'TransferStream')
 *
 * https://caolan.github.io/async/docs.html#queue
 * https://caolan.github.io/async/docs.html#QueueObject
 *
 */
export class TransferQueue extends events.EventEmitter implements ITransferQueue {
    public _queue: AsyncQueue;
    readonly options: any;
    readonly highWaterMark;
    readonly concurrency = 1;
    private _saturated: boolean = false;

    constructor(readonly queue_id: string, manager?: TransferManager, options?: any) {
        super();
        this.options = options;
        this.highWaterMark = _.get(options, 'highWaterMark', 10000);
        if (manager != null) this.init(manager);
    }

    init(manager: TransferManager) {
        this._queue = new AsyncQueue((task, taskDone) => {
            manager.doTask(task, taskDone);
        }, this.concurrency);
        this._queue.buffer = this.highWaterMark;

        // The unsaturated callback is probably most equivalent to the 'drain' event emitted by
        // node Writable streams. async.queue has it's own drain callback, but that fires when
        // the queue is empty.
        this._queue.unsaturated = () => {
            this._saturated = false;
            this.emit('drain');
            console.log(`${this.queue_id}: Queue ready to receive more jobs.`);
        };

        this._queue.saturated = () => {
            this._saturated = true;
            console.log(`${this.queue_id}: Queue is saturated.`);
        };

        // when then queue is empty and all workers have finished, we emit 'finish' similar to
        // when a node Writable stream has flushed all data
        this._queue.drain = () => {
            this.emit('finish');
            console.log(`${this.queue_id}: All jobs processed.`);
        };
    }

    pause() {
        return this._queue.pause();
    }

    resume() {
        return this._queue.resume();
    }

    write(job): boolean {
        if (this._queue == null) {
            throw new Error("Must call init(manager: TransferManager) before writing to TransferQueue");
        }

        this._queue.push(job);
        // Emulates stream back-pressure.
        // eg, returns false to signal the caller should back off until 'drain' event is sent
        return this.isSaturated();
    }

    isPaused(): boolean {
        return this._queue.paused;
    }

    isSaturated() {
        return this._saturated;
    }
}

export class TransferQueuePoolManager {
    private managers = {};
    private client: EDMConnection;

    constructor() {
        if (this.client == null) {
            this.client = new EDMConnection(
                settings.conf.serverSettings.host,
                settings.conf.serverSettings.token);
        }
    }

    getQueue(queue_id: string) {// : TransferStream {
        if (this.managers[queue_id] == null) {
            this.managers[queue_id] = new TransferManager(queue_id);
        }
        return this.managers[queue_id].queue;
    }

    getManager(queue_id: string): TransferManager {
        // ensure queue (and associated manager) is created
        this.getQueue(queue_id);
        return this.managers[queue_id];
    }

    createTransferJob(source: EDMSource,
                      cachedFile: EDMCachedFile,
                      transfer: EDMCachedFileTransfer): FileTransferJob {
        return {
            cached_file_id: cachedFile._id,
            source_id: source.id,
            destination_id: transfer.destination_id,
            file_transfer_id: transfer.id,
        } as FileTransferJob;
    }

    // We return a Promise here, so cache.ts can deal with updating the local cached status
    // based on Promise .then or .catch.
    // TODO: How to propagate the queue saturation boolean signal also in this case ?
    queueTransfer(transfer_job: FileTransferJob): Promise<ApolloQueryResult> {
        let queue_unsaturated: boolean = true;
        let q = TransferQueuePool.getQueue(transfer_job.destination_id);

        if (q.isSaturated()) {
            return Promise.reject(new Error(`Queue ${q.queue_id} saturated, not queueing job.`));
        }

        return EDMQueries.updateFileTransfer(this.client, <EDMCachedFileTransfer>{status: 'queued'})
            .then((result) => {
                queue_unsaturated = q.write(transfer_job);
                return result;
            });
            // .catch(() => {
            //     throw new Error("Failed to update server with file transfer status = queued. Job not queued.");
            // });

        //return queue_unsaturated;
    }
}

export const TransferQueuePool = new TransferQueuePoolManager();
