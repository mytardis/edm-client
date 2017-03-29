import * as fs from 'fs-extra';
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
        fs.copy(src, dest, <CopyOptions>{overwrite: false, errorOnExist: true},
            (error) => {
                doneCallback();
                if (error) {
                    log.error({
                        err: error,
                        options: this.options,
                        filepath: filepath,
                        source_basepath: dest_filepath,
                        transfer_id: transfer_id,
                        file_local_id: file_local_id},
                        `Failed to copy file: ${src} -> ${dest}`);
                    this.emit('fail', transfer_id, null, file_local_id, error);
                } else {
                    log.debug({                        options: this.options,
                        filepath: filepath,
                        source_basepath: dest_filepath,
                        transfer_id: transfer_id,
                        file_local_id: file_local_id},
                        `Copied file: ${src} -> ${dest}`);
                    this.emit('complete', transfer_id, fs.statSync(dest).size, file_local_id);
                }
            });
    }
}
