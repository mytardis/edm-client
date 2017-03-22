/// <reference path="../../types.d.ts" />

// https://github.com/spmjs/node-scp2
import * as path from "path";
import * as fs from 'fs-extra';

import {Client} from 'scp2';
import {TransferMethod} from './transfer_method';

export class SCP2Transfer extends TransferMethod {
    client: Client;

    constructor(options) {
        let sanitized_options = {};
        // insert sanitizing code here
        sanitized_options = options;
        super(sanitized_options);
        this.client = new Client(this.options.method_opts);
    }

    transfer(filepath: string,
             dest_filepath: string,
             transfer_id: string,
             file_local_id: string,
             doneCallback: Function) {

        const dest = this.getDestinationPath(dest_filepath);

        this.emit('start', transfer_id, 0, file_local_id);
        this.client.upload(
            filepath,
            dest,
            (error) => {
                doneCallback();
                if (error == null) {
                    this.emit('complete', transfer_id, fs.statSync(dest).size, file_local_id);
                } else {
                    this.emit('fail', transfer_id, null, file_local_id, error);
                }
            });
    }

    private getDestinationPath(dest_filepath: string) {
        return path.normalize(path.join(this.options.destBasePath, dest_filepath));
    }
}
