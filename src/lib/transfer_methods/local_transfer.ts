// ensuresymlink is broken here: import * as fs from 'fs-extra';
const fs = require('fs-extra');

import * as path from 'path';
import {TransferMethod} from './transfer_method';
import {CopyOptions} from "fs-extra";

import * as logger from "../logger";
import FileTransferJob from "../file_transfer_job";

const log = logger.log.child({'tags': ['transfer_method', 'local_transfer']});

export class LocalTransfer extends TransferMethod {

    /**
     * Copies a file to another local destination
     * Mainly used for testing, I suppose
     * @param transferJob
     * @param doneCallback
     */
    transfer(transferJob: FileTransferJob, doneCallback: Function) {

        const src = this.getFullSourcePath(transferJob);
        const dest = this.getFullDestPath(transferJob);

        fs.mkdirsSync(path.dirname(dest));

        this.emit('start', transferJob.fileTransferId, 0);
        if (fs.lstatSync(src).isSymbolicLink()) {
            // copy link
            let linkDest = fs.readlinkSync(src);
            // TODO: test if link exists and points correctly, else overwrite
            fs.symlink(linkDest, dest, (error) => {
                doneCallback();
                if (error) {
                    log.error({
                            err: error,
                            source: this.source,
                            destination: this.destination,
                            transferJob: transferJob,
                        },
                        `Failed to copy file: ${src} -> ${dest}`);
                    this.emit('fail', transferJob.fileTransferId, null, error);
                } else {
                    let stats = fs.lstatSync(src);
                    // below doesn't work, TODO: do this: http://stackoverflow.com/questions/10119242/softlinks-atime-and-mtime-modification
                    //fs.utimesSync(dest, stats.atime, stats.mtime);
                    log.debug({'from': dest, 'to': fs.readlinkSync(dest)},
                        'created link from -> to');
                    log.debug({
                            source: this.source,
                            destination: this.destination,
                            transferJob: transferJob,
                        },
                        `Copied file: ${src} -> ${dest}`);
                    this.emit('complete', transferJob.fileTransferId,
                        fs.lstatSync(dest).size);
                }
            });
        } else {
            fs.copy(src, dest, <CopyOptions>{
                    overwrite: false,
                    errorOnExist: true, dereference: false,
                    preserveTimestamps: true
                },
                (error) => {
                    doneCallback();
                    if (error) {
                        log.error({
                                err: error,
                                source: this.source,
                                destination: this.destination,
                                transferJob: transferJob,
                            },
                            `Failed to copy file: ${src} -> ${dest}`);
                        this.emit('fail',
                            transferJob.fileTransferId, null, error);
                    } else {
                        log.debug({
                                source: this.source,
                                destination: this.destination,
                                transferJob: transferJob,
                            },
                            `Copied file: ${src} -> ${dest}`);
                        this.emit('complete', transferJob.fileTransferId,
                            fs.lstatSync(dest).size);
                    }
                });
        }
    }
}
