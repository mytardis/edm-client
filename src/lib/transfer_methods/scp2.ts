/// <reference path="../../types.d.ts" />

// https://github.com/spmjs/node-scp2
import * as path from "path";

import { Client } from 'scp2';


export class SCP2Transfer extends TransferMethod {
    client: Client;

    constructor(options) {
        let sanitized_options = {};
        sanitized_options = options;
        super(sanitized_options);
        this.client = new Client(this.options.ssh_opts);
    }

    transfer(filepath) {
        this.client.upload(
            this.getSourcePath(filepath),
            this.getDestinationPath(filepath),
            this.handleError);
    }

    private getSourcePath(filepath) {
        return path.join(this.options.sourceBasePath, filepath);
    }

    private getDestinationPath(filepath) {
        return path.join(this.options.destinationBasePath, filepath);
    }

    private handleError(error) {
        console.error(error);
    }
}
