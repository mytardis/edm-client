/**
 * Transfer queue, starts threads or processes to handle file transfers
 */

import {priorityQueue} from 'async';
import {settings} from './settings';
import {SCP2Transfer} from './transfer_methods/scp2';

class TransferQueue {

    queue: AsyncPriorityQueue<FileTransfer>;

    constructor() {
        this.queue = priorityQueue(
            this.worker, settings.conf.appSettings.concurrency);
    }

    worker(args, done) {
        // start file transfer, pass back error message if any
        done(this.transferFile(args.path, args.method, args.options));
    }

    transferFile(path, method, options) {
        let m = this.loadMethod(method, options);
        return m.transfer(path);
    }

    private loadMethod(method, options) {
        let methods = {
            'scp2': SCP2Transfer,
        }
        return methods[method](options);
    }
}
