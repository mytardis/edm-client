import * as fs from 'fs-extra';
import * as path from 'path';
import {TransferMethod} from './transfer_method';

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
     *  - Use child_process.fork to create a Node subprocess that handles uploading,
     *    receive 'progress' and 'complete' events over child.send channel, re-emit these here.
     *  - Use child_process.spawn to run an external binary to handle the upload, monitor
     *    progress and completion over spawned_child.stdout.on('data',()=>{}) events,
     *    forward as 'progress' and 'complete' events.
     *    and 'complete' events.
     *  - Batch up multiple file transfers here before actually starting upload.
     *    Eg, for a child_process.spawn of rsync or scp, it could be advantageous to
     *    list multiple files on the commandline and spawn a single process to upload them.
     *    This will only work if the TransferQueueManager uses a persistent instance of the TransferMethod,
     *    rather than creating a new TransferMethod instance for every file.
     *  - Automatically retry / resume transfers upon failures, before eventually giving up and
     *    emitting a 'fail' event.
     *
     * @param filepath
     * @param file_transfer_id
     */

    transfer(filepath: string, file_transfer_id: string) {

        this.emit('start', file_transfer_id, 0);

        console.info(`Pretending to transfer: ${filepath} -> ${this.getDestinationPath(filepath)}`);

        // emit a bunch of progress events with increasing delays before they fire
        const byte_increment = Math.floor((this.percent_increment / 100) * this.total_bytes);
        for (let bytes = 0; bytes <= this.total_bytes; bytes += byte_increment) {
            this.sleep(this.total_time * (bytes / this.total_bytes)).then(() => {

                this.emit('progress', file_transfer_id, bytes);

                if (this.simulate_error_at != null && bytes >= this.simulate_error_at) {
                    let error = "Something went wrong, transfer incomplete.";
                    this.emit('fail', file_transfer_id, bytes, error);
                }
            });
        };

        // after total time has elapsed, emit final progress and the complete event
        this.sleep(this.total_time).then(() => {
            this.emit('progress', file_transfer_id, this.total_bytes);
            this.emit('complete', file_transfer_id, this.total_bytes);
        });
    }

    private getDestinationPath(filepath: string) {
        return path.join(this.options.destBasePath, filepath);
    }
}
