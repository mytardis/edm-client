/**
 * Transfer queue, starts threads or processes to handle file transfers
 */

import * as child_process from 'child_process';
import * as stream from 'stream';
import {queue} from 'async';

import {settings} from './settings';
import {TransferWorker} from "./transfer_worker";

export class TransferQueue {

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

export const transferQueue = new TransferQueue();


/** The klaw queue
 *
 * @type {"assert".internal|((value:any, message?:string)=>void)}
 */

import * as assert from 'assert';

let fs;

try {
  fs = require('graceful-fs');
} catch (e) {
  fs = require('fs');
}

import * as path from 'path';
const Readable = stream.Readable;
const Duplex = stream.Duplex;

import * as util from 'util';
import {inherits} from "util";

const assign = require('./assign');

class Transferer extends Duplex {
    options: any;

    constructor(options) {
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


Walker.prototype._read = function () {
  if (this.paths.length === 0) return this.push(null)
  var self = this
  var pathItem = this.paths[this.options.queueMethod]()

  self.fs.lstat(pathItem, function (err, stats) {
    var item = { path: pathItem, stats: stats }
    if (err) return self.emit('error', err, item)
    if (!stats.isDirectory()) return self.push(item)

    self.fs.readdir(pathItem, function (err, pathItems) {
      if (err) {
        self.push(item)
        return self.emit('error', err, item)
      }

      pathItems = pathItems.map(function (part) { return path.join(pathItem, part) })
      if (self.options.filter) pathItems = pathItems.filter(self.options.filter)
      if (self.options.pathSorter) pathItems.sort(self.options.pathSorter)
      pathItems.forEach(function (pi) { self.paths.push(pi) })

      self.push(item)
    })
  })
}

function walk (root, options) {
  return new Walker(root, options)
}

module.exports = walk
