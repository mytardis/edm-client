/**
 * Transfer queue, starts threads or processes to handle file transfers
 */
import * as events from 'events';
import * as child_process from 'child_process';
import * as stream from 'stream';
import * as AsyncQueue from 'async/queue';
import * as _ from "lodash";

import {settings} from './settings';
import {TransferManager} from "./transfer_manager";

/**
 * This task queue implementation implements parts of a stream.Duplex interface (ITransferQueue)
 * so that it can be used (almost) interchangeably with other implementations (eg TransferStream)
 *
 * https://caolan.github.io/async/docs.html#queue
 *
 */
export class TransferQueue extends events.EventEmitter implements ITransferQueue {
    public _queue: AsyncQueue;
    readonly queue_id: string;
    readonly options: any;
    readonly highWaterMark;
    readonly concurrency = 1;

    constructor(queue_id: string, manager: TransferManager, options?: any) {
        super();
        this.queue_id = queue_id;
        this.options = options;
        this.highWaterMark = _.get(options, 'highWaterMark', 10000);
        this.init(manager);
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

/*
 stream.Duplex events:
 * 'readable' - when the readability state changes (new data becomes available, or stream becomes empty)
 *              Attaching this event can cause a call to ._read, buffering some data.
 *
 * 'data' - emitted whenever data it read from the stream.
 *          Attaching this event causes the stream to switch to flowing mode (_readableState.flowing=true).
 *
 * 'end' - emitted when all items have been read from the stream.
 *
 * 'drain' - if a call to stream.write(chunk) returns false, the 'drain' event will be emitted when
 *           it is appropriate to resume writing data to the stream.
 *           http://ey3ball.github.io/posts/2014/07/17/node-streams-back-pressure/
 *
 * 'finish' - indicates that no more data will be written to the stream. This would only happen as
 *           part of a clean shutdown, or if a destination_id was removed from settings.
 * 'close' - no more data will become available. This would only happen as part of a clean shutdown,
 *           or if a destination_id was removed from settings
 * 'error' - ... (stream must be manually ended to after error)
 * 'pipe' - when a Readable stream is attached as a pipe
 * 'unpipe' - when a Readable stream is detached
 */
export class TransferStream extends stream.Duplex implements ITransferQueue {

    readonly queue_id: string;
    readonly options: any;
    public items: Array<FileTransferJob> = [];

    constructor(queue_id: string, options?: any) {
        super({
            objectMode: true,
            highWaterMark: 10000,
            // This raises an error if only one of the readable or writable sides ends / closes.
            // allowHalfOpen: false,
        });
        this.queue_id = queue_id;
        this.options = options;
    }

    // https://nodejs.org/api/stream.html#stream_writable_write_chunk_encoding_callback_1
    _write(obj: FileTransferJob, _encoding, callback) {
        let old_length = this.items.length;
        this.items.push(obj);

        // We don't need to do this since the parent fires 'readable' when write method is called ??
        this.emit('readable');
        // if (old_length === 0) {
        //     this.emit('readable');
        // }
        if (callback != null) callback();
    }

    // https://nodejs.org/api/stream.html#stream_writable_writev_chunks_callback
    // _writev(obj: FileTransferJob, callback) {
    //     if (callback != null) callback();
    // }

    // https://nodejs.org/api/stream.html#stream_readable_read_size_1
    _read(n: number = 1) {
        let should_push: boolean;
        let pushed_count = 0;
        do {
            let item = this.items.shift();

            // should_push = this.push(item || false); // this prevents the stream ever firing 'end',
                                                       // keeps it readable (but floods the queue with falses)

            // NOTE: push MUST be called before a call to .read will allow ._read to be called again
            should_push = this.push(item || null); // send null once array is empty, fires 'end'
            pushed_count++;

        } while (this.items.length > 0 &&
        should_push &&
        pushed_count < n);
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
