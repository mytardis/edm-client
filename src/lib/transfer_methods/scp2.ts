/// <reference path="../../types.d.ts" />

// https://github.com/spmjs/node-scp2
import * as path from "path";

import { Client } from 'scp2';
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

    transfer(filepath: string, file_transfer_id: string, progressCallback?): Promise<string> {
        return new Promise((resolve, reject) => {
            this.client.upload(
                this.getSourcePath(filepath),
                this.getDestinationPath(filepath),
                (error) => {
                    if (error == null) {
                        resolve(file_transfer_id);
                    } else {
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

    // private handleError(error) {
    //     console.error(error);
    // }
}
