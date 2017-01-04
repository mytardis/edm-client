
abstract class TransferMethod {
    /**
     * A transfer method is defined by a string and associated method class
     * (see transfer_queue).
     *
     * Each transfer method instance handles a single file.
     */
    options: any;

    constructor(options) {
        this.options = options;
    }

    abstract transfer(filepath);
    // executes the transfer
}
