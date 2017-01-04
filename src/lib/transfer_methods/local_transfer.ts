import * as fs from 'fs-extra';
import * as path from 'path';


export class LocalTransfer extends TransferMethod {
    /**
     * copies a file to another local destination
     * Mainly used for testing, I suppose
     * @param path
     */

    transfer(filepath) {
        fs.copy(this.getSourcePath(filepath),
            this.getDestinationPath(filepath),
            this.finished)
    }

    private getSourcePath() {
        return path.join(this.options.sourceBasePath, this.filepath);
    }

    private getDestinationPath() {
        return path.join(this.options.destBasepath, this.filepath);
    }

    private finished(error) {
        console.error(error);
    }
}
