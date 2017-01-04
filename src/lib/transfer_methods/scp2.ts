/// <reference path="../../types.d.ts" />

// https://github.com/spmjs/node-scp2
import * as path from "path";

import { Client } from 'scp2';


export class SCP2Transfer extends TransferMethod {
    client: Client;

    constructor(options) {
        let sanitized_options = {};
        // insert sanitizing code here
        sanitized_options = options;
        super(sanitized_options);
        this.client = new Client(this.options.ssh_opts);
    }

    transfer(filepath) {
        this.client.upload(
            this.getSourcePath(),
            this.getDestinationPath(),
            this.handleError);
    }

    private getSourcePath() {
        return path.join(this.options.sourceBasePath, this.filepath);
    }

    private getDestinationPath() {
        return path.join(this.options.destinationBasePath, this.filepath);
    }

    private handleError(error) {
        console.error(error);
    }
}
