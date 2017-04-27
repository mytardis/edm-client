// ensuresymlink is broken here: import * as fs from 'fs-extra';
const fs = require('fs-extra');

import * as path from 'path';
import {TransferMethod} from './transfer_method';
import {CopyOptions} from "fs-extra";

import * as logger from "../logger";
const log = logger.log.child({'tags': ['transfer_method', 'local_transfer']});

export class LocalTransfer extends TransferMethod {
    /**
     * Copies a file to another local destination
     * Mainly used for testing, I suppose
     * @param filepath
     * @param dest_filepath
     * @param transfer_id
     * @param file_local_id
     * @param doneCallback
     */

    transfer(filepath: string,
             dest_filepath: string,
             transfer_id: string,
             file_local_id: string,
             doneCallback?: Function) {
        const src = filepath;
        const dest = path.normalize(
            path.join(this.options.destBasePath, dest_filepath));

        fs.mkdirsSync(path.dirname(dest));

        this.emit('start', transfer_id, 0, file_local_id);
        if (fs.lstatSync(src).isSymbolicLink()) {
            // copy link
            let linkDest = fs.readlinkSync(src);
            // TODO: test if link exists and points correctly, else overwrite
            fs.symlink(linkDest, dest, (error) => {
                doneCallback();
                if (error) {
                    log.error({
                            err: error,
                            options: this.options,
                            filepath: filepath,
                            source_basepath: dest_filepath,
                            transfer_id: transfer_id,
                            file_local_id: file_local_id
                        },
                        `Failed to copy file: ${src} -> ${dest}`);
                    this.emit('fail', transfer_id, null, file_local_id, error);
                } else {
                    let stats = fs.lstatSync(src);
                    // below doesn't work, TODO: do this: http://stackoverflow.com/questions/10119242/softlinks-atime-and-mtime-modification
                    //fs.utimesSync(dest, stats.atime, stats.mtime);
                    log.debug({'from': dest, 'to': fs.readlinkSync(dest)},
                        'created link from -> to');
                    log.debug({
                            options: this.options,
                            filepath: filepath,
                            source_basepath: dest_filepath,
                            transfer_id: transfer_id,
                            file_local_id: file_local_id
                        },
                        `Copied file: ${src} -> ${dest}`);
                    this.emit('complete', transfer_id,
                        fs.lstatSync(dest).size, file_local_id);
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
                                options: this.options,
                                filepath: filepath,
                                source_basepath: dest_filepath,
                                transfer_id: transfer_id,
                                file_local_id: file_local_id
                            },
                            `Failed to copy file: ${src} -> ${dest}`);
                        this.emit('fail', transfer_id, null, file_local_id, error);
                    } else {
                        log.debug({
                                options: this.options,
                                filepath: filepath,
                                source_basepath: dest_filepath,
                                transfer_id: transfer_id,
                                file_local_id: file_local_id
                            },
                            `Copied file: ${src} -> ${dest}`);
                        this.emit('complete', transfer_id,
                            fs.lstatSync(dest).size, file_local_id);
                    }
                });
        }
    }
}
