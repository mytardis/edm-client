/**
 * Transfer queue, starts threads or processes to handle file transfers
 */

import * as child_process from 'child_process';
import * as stream from 'stream';
import {queue} from 'async';
import * as _ from "lodash";

import {settings} from './settings';
import {TransferManager} from "./transfer_manager";

/*
 stream.Duplex events:
 * 'readable' - when the readability state changes (new data becomes available, or stream becomes empty)
 * 'data' - emitted whenever data it read from the stream.
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
 * 'error' - ...
 * 'pipe' - when a Readable stream is attached as a pipe
 * 'unpipe' - when a Readable stream is detached
 */
export class TransferQueue extends stream.Duplex {
    // readonly destination: EDMDestination;
    readonly queue_id: string;
    readonly options: any;
    private items: Array<FileTransferJob> = [];

    constructor(queue_id: string, options?: any) {
        super({
            objectMode: true,
            // queueMethod: 'shift',
            highWaterMark: 100000,
        });
        //this.destination = destination;
        this.queue_id = queue_id;
        this.options = options;
    }

    /*
     We don't create the associated TransferManager in the constructor since
     for testing we want to test the queue in isolation, without the TransferManager
     consuming jobs as we add them.
     */
    // initManager() {
    //     this.manager = new TransferManager(this);
    // }

    // https://nodejs.org/api/stream.html#stream_writable_write_chunk_encoding_callback_1
    _write(obj: FileTransferJob, _encoding, callback) {
        let old_length = this.items.length;
        this.items.push(obj);

        // We don't need to do this since the parent fires 'readable' when write method is called.
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
            should_push = this.push(this.items.shift() || null); // send null once array is empty
            pushed_count++;

            if (this.items.length === 0) {
                // Parent class automatically fires this when 'null' is pushed
                //this.emit('end');
                break;
            }

        } while (should_push && pushed_count < n);
    }
}

export class TransferQueuePoolManager {
    managers = {};

    getQueue(queue_id: string): TransferQueue {
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
