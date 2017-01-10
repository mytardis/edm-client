/**
 * Transfer queue, starts threads or processes to handle file transfers
 */

import * as child_process from 'child_process';
import * as stream from 'stream';
import {queue} from 'async';

import {settings} from './settings';
import {TransferWorker} from "./transfer_worker";

class TransferQueueold {

    private queue: stream.Readable;
    private workers: any;

    constructor() {
        this.addWorker('1');
        // this.queue = queue(
        //     this.worker, settings.conf.appSettings.concurrency);
        this.queue = new stream.Readable({objectMode: true});
        this.queue._read() = function() {
            this.push(item);
        }
        this.queue.on('readable', () => {
            this.startWork();
        })
    }

    push(fileTransfer) {
        return this.queue.push(fileTransfer);
    }

    private startWork() {
        for (let worker of this.workers) {
            worker.start(this.queue);
        }
    }

    private addWorker(worker_id: string) {
        // this.workers[worker_id] = child_process.fork(
        //     `${__dirname}/lib/transfer_worker.js`, [worker_id], {silent: true});
        this.workers[worker_id] = new TransferWorker();
        // this.workers[worker_id].on('exit', () => {
        //     delete this.workers[worker_id];
        // })
    }
}



const Duplex = stream.Duplex;

const assign = require('./assign');

export class TransferQueue extends Duplex {
    options: any;

    constructor(options?: any) {
        let defaultStreamOptions = {
            objectMode: true,
            queueMethod: 'shift',
            highWaterMark: 100000,
        };

        super(defaultStreamOptions);
        this.options = options;
    }

    _read() {
        this.push(nextObject);
    }
}

export const transferQueue = new TransferQueue();
