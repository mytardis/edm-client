import * as events from 'events';
import * as path from 'path';

import FileTransferJob from "../file_transfer_job";
import {settings} from "../settings";

export abstract class TransferMethod extends events.EventEmitter {
    readonly source: EDMSource;

    /**
     * A transfer method is defined by a string and associated method class
     * (see transfer_method_plugins).
     *
     * TransferMethod instances typically handle a single file, but can internally queue
     * multiple calls to `transfer` to batch multiple files into one transfer.
     *
     * Implementations should emit the events:
     *   - start:     this.emit('start',    transfer_id, 0,     file_local_id);
     *   - progress:  this.emit('progress', transfer_id, bytes, file_local_id);
     *   - complete:  this.emit('complete', transfer_id, bytes, file_local_id);
     *   - fail:      this.emit('fail',     transfer_id, bytes, file_local_id, error);
     *
     * The `doneCallback` must be called on successful completion or failure to signal
     * to the queue that the worker slot can be released.
     *
     */
    constructor(
        readonly destination: EDMDestination) {
        super();
        if ( ! destination.hasOwnProperty('source'))
            this.source = settings.getSource(destination.sourceId);
        else this.source = destination.source;
    }

    /** executes the transfer
     * arguments:
     * @param transferJob
     * <FileTransferJob>{
     *   source
     *   sourceRelPath
     *   destination
     *   destRelPath
     *   destMetadata?
     * },
     * @param doneCallback
     * */
    abstract transfer(
        transferJob: FileTransferJob,
        doneCallback: Function,
    );

    /**
     * get full, absolute path of file on source file system
     *
     * @param transferJob
     * @returns {string}
     */
    protected getFullSourcePath(transferJob: FileTransferJob) {
        return path.normalize(
            path.join(this.source.basepath, transferJob.sourceRelPath));
    }

    /**
     * get full, absolute path on destination file system
     *
     * @param transferJob
     * @returns {string}
     */
    protected getFullDestPath(transferJob: FileTransferJob) {
        return path.normalize(
            path.join(this.destination.base, transferJob.destRelPath));;
    }
}
