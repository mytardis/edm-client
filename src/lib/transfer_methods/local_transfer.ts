import * as fs from 'fs-extra';
import * as path from 'path';
import {TransferMethod} from './transfer_method';

export class LocalTransfer extends TransferMethod {
    /**
     * Copies a file to another local destination
     * Mainly used for testing, I suppose
     * @param filepath
     * @param file_transfer_id
     * @param progressCallback
     */

    transfer(filepath: string, file_transfer_id: string, progressCallback?): Promise<string> {
        return new Promise((resolve, reject) => {
            fs.copy(this.getSourcePath(filepath),
                this.getDestinationPath(filepath),
                (error) => {
                    if (error == null) {
                        resolve(file_transfer_id);
                    } else {
                        console.error(error);
                        reject(error);
                    }
                });
        });
    }

    private getSourcePath(filepath: string) {
        return path.join(this.options.sourceBasePath, filepath);
    }

    private getDestinationPath(filepath: string) {
        return path.join(this.options.destBasePath, filepath);
    }

    // private finished(error) {
    //     console.error(error);
    // }
}
