import * as events from 'events';

export abstract class TransferMethod extends events.EventEmitter {
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

    constructor(public options?: TransferMethodOptions) {
        super();
    }

    // executes the transfer
    abstract transfer(
        filepath: string,
        dest_filepath: string,
        transfer_id: string,
        file_local_id: string,
        doneCallback: Function,
    );
}
