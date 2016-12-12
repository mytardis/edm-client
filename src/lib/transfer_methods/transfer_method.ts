
abstract class TransferMethod {

    options: any;

    constructor(options) {
        this.options = options;
    }

    abstract transfer(path);
}
