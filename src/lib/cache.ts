/**
 * Created by grischa on 7/10/16.
 *
 * Database to remember status of files, specifically, whether files have
 * been processed and can be ignored.
 */
import * as fs from "fs";
import * as path from "path";

var PouchDB = require('pouchdb-node');
const querystring = require('querystring');

import EDMFile from './file_tracking';
import {settings} from "./settings";
import {EDMConnection} from "../edmKit/connection";
import {TransferQueuePool} from "./transfer_queue";

export class EDMFileCache {
    client: EDMConnection;
    readonly db_name: string;
    readonly source: EDMSource;
    readonly _db: any; // PouchDB.Database<EDMCachedFile>;
    private changes: any;

    //public static caches = {};

    constructor(source: EDMSource) {
        //EDMFileCache.caches[source.id] = this;

        this.source = source;
        this.db_name = querystring.escape(source.basepath);
        //this.db_name = querystring.escape(source.id);
        const db_base = path.normalize(path.join(
            settings.conf.appSettings.dataDir, 'data'));
        if (!fs.existsSync(db_base)) {
            fs.mkdirSync(db_base, '700');
        }

        const db_path = path.join(db_base, this.db_name);
        this._db = new PouchDB(db_path);
        this.client = new EDMConnection(
            settings.conf.serverSettings.host,
            settings.conf.serverSettings.token);
        this.changes = this._db.changes({live: true, include_docs: true})
            .on('change', (change) => {

                // console.log(`PouchDB on change event: ${this.basepath}\n${JSON.stringify(change)}\n`);

                let cachedFile = change.doc as EDMCachedFile;
                if (!change.deleted && cachedFile.transfers != null) {
                    this.queuePendingTransfers(cachedFile);
                }
            })
            .on('complete', (info) => {
                console.info(info);
                console.log("stopped listening for changes");
            })
            .on('error', (error) => {
                console.error(`pouchdb changes handling error: ${error}`)
            });
    }

    addFile(file: EDMFile | EDMCachedFile) {
        if (file instanceof EDMFile) {
            return this._db.put(file.getPouchDocument());
        } else {
            return this._db.put(file);
        }
    }

    getEntry(file: EDMFile | EDMCachedFile) {
        return this._db.get(file._id);
    }

    queuePendingTransfers(cachedFile: EDMCachedFile) {
        for (let xfer of cachedFile.transfers) {
            if (xfer.status === 'pending_upload') {
                // let fullpath = path.join(this.basepath, cachedFile._id);
                // let host = settings.conf.hosts[xfer.destination.host_id] as EDMDestinationHost;
                // let destination = {
                //     host: host,
                //     location: this.basepath,
                // } as EDMDestination;

                // TODO: How do we prevent a transfer being queued twice ?
                //       One way - as soon as transfer is queued, update the
                //       server with an 'uploading' status (and the local PouchDB
                //       EDMCachedFile record upon response). Will look misleading
                //       since 'queued' files will appear as stalled uploads.
                //       Maybe we need a 'queued' status to deal with that.
                //       If the upload fails, we need
                //       to revert that status - but this won't be possible for
                //       hard crash, so we need to persist transfers locally for
                //       recovery on restart.
                //
                //       Items currently queued and uploading transfers should
                //       be in a PouchDB so we can:
                //         - ensure we don't queue transfers twice
                //         - correct server state after a hard crash ('uploading'
                //           transfers in PouchDB need to resumed, or set back to
                //          'pending_upload' on server and deleted from local
                //          transfer cache)
                let xfer_job = TransferQueuePool.createTransferJob(this.source, cachedFile, xfer);
                let queued_ok = TransferQueuePool.queueTransfer(xfer_job);
                if (!queued_ok) {
                    // TODO: If the the stream is saturated (highWaterMark exceeded), we need to wait
                    //       until it emits the 'drain' event before attempting to queue more.
                    //       The stream will still internally buffer until it exceeds available memory,
                    //       even when saturated, but we should avoid doing this and respect back pressure.
                    throw Error(`[Not implemented]: TransferQueue ${xfer.destination_id} is saturated. File transfer ${xfer.id} must be queued later`);
                }
            }
        }
    }
}
