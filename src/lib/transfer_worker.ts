
import {SCP2Transfer} from './transfer_methods/scp2';
import {LocalTransfer} from "./transfer_methods/local_transfer";
import {settings} from "./settings";


export class TransferWorker {

    concurrency: number;
    queue: AsyncQueue<FileTransfer>;

    constructor() {
        this.concurrency = settings.conf.appSettings.maxAsyncTransfers;
    }

    start(stream) {
        this.stream = stream;
        this.transfer
    }

    private worker(args, done) {
        // start file transfer, pass back error message if any
        done(this.transferFile(args.filepath, args.method, args.options));
    }

    private transferFile(path, method, options) {
        let m = TransferWorker.loadMethod(method, options);
        return m.transfer(path);
    }

    private static loadMethod(method, options) {
        let methods = {
            'local': LocalTransfer,
            'scp2': SCP2Transfer,
        };
        return methods[method](options);
    }
}
