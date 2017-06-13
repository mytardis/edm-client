import * as fs from 'fs-extra';
import * as path from 'path';
import {TransferMethod} from './transfer_method';

import * as logger from "../logger";
import FileTransferJob from "../file_transfer_job";

const log = logger.log.child({'tags': ['transfer_method', 'dummy_transfer']});

export class DummyTransfer extends TransferMethod {
    total_time: number = 500;
    total_bytes: number = 1024;
    percent_increment: number = 10;
    simulate_error_at?: number = null;

    private sleep(time: number) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }

    /**
     * An example TransferMethod that only logs that a transfer would happen,
     * doesn't transfer any files.
     * Sends progress, complete and fail events.
     *
     *
     * Things that could happen here in a real implementation:
     *  - Use child_process.fork to create a Node subprocess that handles
     * uploading, receive 'progress' and 'complete' events over child.send
     * channel, re-emit these here.
     *  - Use child_process.spawn to run an external binary to handle the
     * upload, monitor progress and completion over
     * spawned_child.stdout.on('data',()=>{}) events, forward as 'progress' and
     * 'complete' events. and 'complete' events.
     *  - Batch up multiple file transfers here before actually starting
     * upload.
     *    Eg, for a child_process.spawn of rsync or scp, it could be
     * advantageous to list multiple files on the commandline and spawn a
     * single process to upload them. This will only work if the
     * TransferQueueManager uses a persistent instance of the TransferMethod,
     * rather than creating a new TransferMethod instance for every file.
     *  - Automatically retry / resume transfers upon failures, before
     * eventually giving up and emitting a 'fail' event.
     *
     * @param transferJob
     * @param doneCallback
     */

    // transfer(filepath: string,
    //          dest_basepath: string,
    //          transfer_id: string,
    //          file_local_id: string,
    //          doneCallback: Function) {
    transfer(transferJob: FileTransferJob, doneCallback: Function) {

        this.emit('start', transferJob.fileTransferId, 0);
        const filepath = this.getFullSourcePath(transferJob);
        const destpath = this.getFullDestPath(transferJob);

        log.debug({
            source: this.source,
            destination: this.destination,
            transferJob: transferJob,
            filepath: filepath,
        }, `Pretending to transfer: ${filepath} -> ${destpath}`);

        // emit a bunch of progress events with increasing delays before they fire
        const byte_increment = Math.floor((this.percent_increment / 100) * this.total_bytes);
        for (let bytes = 0; bytes <= this.total_bytes; bytes += byte_increment) {
            this.sleep(this.total_time * (bytes / this.total_bytes)).then(() => {

                this.emit('progress', transferJob.fileTransferId, bytes);

                if (this.simulate_error_at != null && bytes >= this.simulate_error_at) {
                    let error = new Error('Something went wrong, transfer incomplete.');
                    log.error({err: error}, 'Transfer failed.')
                    doneCallback();
                    this.emit('fail', transferJob.fileTransferId, bytes, error);
                }
            });
        }

        // after total time has elapsed, emit final progress and the complete event
        this.sleep(this.total_time).then(() => {
            doneCallback();
            this.emit('progress', transferJob.fileTransferId, this.total_bytes);
            this.emit('complete', transferJob.fileTransferId, this.total_bytes);
        });
    }

    // private getDestinationPath(filepath: string, source_basepath: string) {
    //     return path.join(this.options.destBasePath, path.relative(source_basepath, filepath));
    // }
}
