/// <reference path="../../types.d.ts" />

// https://github.com/spmjs/node-scp2
import * as path from "path";
import * as fs from 'fs-extra';

import {Client} from 'scp2';
import {TransferMethod} from './transfer_method';
import FileTransferJob from "../file_transfer_job";

/**
 * For testing, should use SFTP instead for symlink support
 */
export class SCP2Transfer extends TransferMethod {
    client: Client;

    constructor(readonly destination: EDMDestination) {
        super(destination);
        const hostSettings = this.destination.host.settings;
        const sshSettings = {
            host: hostSettings['host'],
            port: hostSettings['port'] || 22,
            username: hostSettings['username'],
        };
        if (hostSettings.hasOwnProperty('password'))
            sshSettings['password'] = hostSettings['password'];
        else if (hostSettings.hasOwnProperty('key'))
            sshSettings['key'] = hostSettings['key'];
        this.client = new Client(sshSettings);
    }

    transfer(transferJob: FileTransferJob, doneCallback: Function) {

        const filepath = this.getFullSourcePath(transferJob);
        const dest = this.getFullDestPath(transferJob);

        this.emit('start', transferJob.fileTransferId, 0);
        this.client.upload(
            filepath,
            dest,
            (error) => {
                doneCallback();
                if (error == null) {
                    this.emit('complete', transferJob.fileTransferId,
                        fs.statSync(dest).size);
                } else {
                    this.emit('fail', transferJob.fileTransferId, null, error);
                }
            });
    }

    // private getDestinationPath(dest_filepath: string) {
    //     return path.normalize(path.join(this.options.destBasePath, dest_filepath));
    // }
}
