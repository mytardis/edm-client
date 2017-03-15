import * as fs from 'fs-extra';
import * as path from 'path';
import {TransferMethod} from './transfer_method';
import {CopyOptions} from "fs-extra";

export class LocalTransfer extends TransferMethod {
    /**
     * Copies a file to another local destination
     * Mainly used for testing, I suppose
     * @param filepath
     * @param dest_filepath
     * @param file_transfer_id
     * @param file_local_id
     */

    transfer(filepath: string,
             dest_filepath: string,
             file_transfer_id: string,
             file_local_id: string) {
        const src = filepath;
        const dest = path.normalize(
            path.join(this.options.destBasePath, dest_filepath));

        fs.mkdirsSync(path.dirname(dest));

        fs.copy(src, dest, <CopyOptions>{overwrite: false, errorOnExist: true},
            (error) => {
                if (error) {
                    console.error(error);
                    this.emit(
                        'fail', file_transfer_id, null, file_local_id, error);
                } else {
                    this.emit('complete', file_transfer_id,
                              fs.statSync(dest).size, file_local_id);
                }
            });
    }
}
