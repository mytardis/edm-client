/**
 * Transfer queue, starts threads or processes to handle file transfers
 */
import * as events from 'events';
import * as child_process from 'child_process';
import * as AsyncQueue from 'async/queue';
import * as _ from "lodash";

import {TransferManager} from "./transfer_manager";

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

    constructor(readonly queue_id: string, manager?: TransferManager, options?: any) {
        super();
        this.options = options;
        this.highWaterMark = _.get(options, 'highWaterMark', 10000);
        if (manager != null) this.init(manager);
    }

    public init(manager: TransferManager) {
        this._queue = new AsyncQueue((task, taskDone) => {
            manager.doTask(task, taskDone);
        }, this.concurrency);
        this._queue.buffer = this.highWaterMark;

        // The unsaturated callback is probably most equivalent to the 'drain' event emitted by
        // node Writable streams. async.queue has it's own drain callback, but that fires when
        // the queue is empty.
        this._queue.unsaturated = () => {
            this.emit('drain');
            console.log(`${this.queue_id}: Queue ready to receive more jobs`);
        };

        // when then queue is empty and all workers have finished, we emit 'finish' similar to
        // when a node Writable stream has flushed all data
        this._queue.drain = () => {
            this.emit('finish');
            console.log(`${this.queue_id}: All jobs processed`);
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
        // TODO: async.queue has saturated / unsaturated callbacks and a buffer threshold that is
        //       similar to highWaterMark - maybe we should use these instead:
        //       https://caolan.github.io/async/queue.js.html#line50
        return (this._queue.length() < this.highWaterMark);
    }

    isPaused(): boolean {
        return false;
    }
}

export class TransferQueuePoolManager {
    private managers = {};

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

    queueTransfer(transfer_job: FileTransferJob): boolean {
        let q = TransferQueuePool.getQueue(transfer_job.destination_id);
        return q.write(transfer_job);
    }
}

export const TransferQueuePool = new TransferQueuePoolManager();
