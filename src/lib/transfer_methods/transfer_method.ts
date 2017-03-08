import * as events from 'events';

export abstract class TransferMethod extends events.EventEmitter {
    /**
     * A transfer method is defined by a string and associated method class
     * (see transfer_queue).
     *
     * Each transfer method instance handles a single file.
     */

    constructor(public options?: TransferMethodOptions) {
        super();
    }

    // executes the transfer
    abstract transfer(filepath: string, transfer_id?: string);
}
