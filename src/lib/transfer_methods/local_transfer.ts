import * as fs from 'fs-extra';
import * as path from 'path';
import {TransferMethod} from './transfer_method';

export class LocalTransfer extends TransferMethod {
    /**
     * Copies a file to another local destination
     * Mainly used for testing, I suppose
     * @param filepath
     * @param source_basepath
     * @param file_transfer_id
     * @param file_local_id
     */

    transfer(filepath: string, source_basepath: string, file_transfer_id: string, file_local_id: string) {
        const src = filepath;
        const dest = this.getDestinationPath(filepath, source_basepath);

        // TODO: This doesn't create destination directories if they don't exist

        fs.copy(src, dest,
            (error) => {
                if (error) {
                    console.error(error);
                    this.emit('fail', file_transfer_id, null, file_local_id, error);
                } else {
                    this.emit('complete', file_transfer_id, fs.statSync(dest).size, file_local_id);
                }
            });
    }

    private getDestinationPath(filepath: string, source_basepath: string) {
        return path.join(this.options.destBasePath, path.relative(source_basepath, filepath));
    }
}
