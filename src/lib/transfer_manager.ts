import * as path from 'path';
import * as events from 'events';

import {settings} from "./settings";
import {TransferQueue} from "./transfer_queue";
import {TransferMethod} from "./transfer_methods/transfer_method";
import {TransferMethodPlugins} from "./transfer_methods/transfer_method_plugins";
import {EDMConnection} from "../edmKit/connection";
import {EDMQueries} from "./queries";

export class TransferManager extends events.EventEmitter {

    queue: ITransferQueue;
    concurrency: number;
    private client: EDMConnection;
    private method: TransferMethod;
    private _paused: boolean = false;

    constructor(queue_id: string, options?: any) {
        super();

        this.concurrency = settings.conf.appSettings.maxAsyncTransfers;

        if (this.client == null) {
            this.client = new EDMConnection(
                settings.conf.serverSettings.host,
                settings.conf.serverSettings.token);
        }

        this.queue = new TransferQueue(queue_id, this, options);
    }

    private initTransferMethod(destinationHost: EDMDestinationHost, destination: EDMDestination) {
        if (this.method != null) return;
        let method_name = destinationHost.transfer_method;
        let options = destinationHost.settings;
        options.destBasePath = destination.location;
        this.method = new (TransferMethodPlugins.getMethod(method_name))(options);

        // These must be lambdas to preserve context of 'this'.
        // Could be avoided if we use a single EDMConnection singleton in onUpdateProgress
        // We use once events so we don't need to even call removeListener (since we
        // can't remove a specific anonymous method) - onUpdateProgress re-registers itself
        // as a one time event every time it's called.
        this.method.on('start', (id, bytes) => this.onUpdateProgress(id, bytes));
        this.method.on('progress', (id, bytes) => this.onUpdateProgress(id, bytes));
        this.method.on('complete', (id, bytes) => this.onTransferComplete(id, bytes));
    }

    doTask(job, doneCallback) {
        this.transferFile(job);
        doneCallback();
    }

    isPaused() {
        return this._paused;
    }

    pause() {
        this._paused = true;
    }

    unpause() {
        this._paused = false;
    }

    private transferFile(transferJob: FileTransferJob) {

        let destinationHost = this.getDestinationHost(transferJob);
        let destination = settings.getDestination(transferJob.destination_id);
        this.initTransferMethod(destinationHost, destination);

        let filepath = this.getFilePath(transferJob);

        this.method.transfer(filepath, transferJob.file_transfer_id);
    }

    // TODO: This method probably belongs on a FileTransferJob class ?
    private getDestinationHost(transferJob: FileTransferJob): EDMDestinationHost {
        let host_id = settings.getDestination(transferJob.destination_id).host_id;
        let destinationHost = settings.getHost(host_id);
        return destinationHost;
    }

    // TODO: This method probably belongs on a FileTransferJob class ?
    private getFilePath(transferJob: FileTransferJob): string {
        let source = settings.getSource(transferJob.source_id);
        let filepath = path.join(source.basepath, transferJob.cached_file_id);
        return filepath;
    }

    private onUpdateProgress(file_transfer_id: string, bytes_transferred: number) {
        console.info(`Transfer {FileTransferJob: ${file_transfer_id}, ` +
                     `queue_id: ${this.queue.queue_id}, ` +
                     `bytes_transferred: ${bytes_transferred}}`);

        let cachedTransfer = {
            id: file_transfer_id,
            bytes_transferred: bytes_transferred,
            status: "uploading" } as EDMCachedFileTransfer;
        // TODO: Deal with failure here, since we don't want the server never finding out about completed
        //       transfers (in the case where the server is unable to verify itself).
        //       (Retries at Apollo client level ?
        //        Persist in PouchDB and periodically retry until server responds, then remove record ? )
        EDMQueries.updateFileTransfer(this.client, cachedTransfer);
    }

    private onTransferComplete(file_transfer_id: string, bytes_transferred: number) {
        this.onUpdateProgress(file_transfer_id, bytes_transferred);
        this.emit('transfer_complete', file_transfer_id, bytes_transferred);
    }
}
