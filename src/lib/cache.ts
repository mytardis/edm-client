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
            if (xfer.status === 'new') {
                // TODO: How do we ensure jobs that fail to queue (backpressure or real failure) get requeued later ?
                // TODO: How do we prevent a transfer being queued twice ?

                //let queue_unsaturated: boolean = true;
                let xfer_job = TransferQueuePool.createTransferJob(this.source, cachedFile, xfer);
                TransferQueuePool.queueTransfer(xfer_job)
                    .then((result) => {
                        // update PouchDB with file transfer status = queued
                        console.log(`file_transfer updated: ${JSON.stringify(result)}`);
                    })
                    .catch(() => {
                        // we may catch a rejected Promise here if the job cannot be queued at this time
                        // eg, queue is rejecting jobs due to back-pressure or a network failure notifying the server

                        // TODO: How do we now catch 'new' transfers that didn't get queued here,
                        //       given that they won't be detected now unless the 'change' event fires again
                        //       for that EDMCachedFile record.
                    });

                // if (!queue_unsaturated) {
                //     // TODO: If the the queue is saturated (highWaterMark exceeded), we need to wait
                //     //       until it emits the 'drain' event before attempting to queue more to respect
                //     //       back pressure.
                //     throw Error(`[Not implemented]: TransferQueue ${xfer.destination_id} is saturated. File transfer ${xfer.id} must be queued later`);
                // }
            }
        }
    }
}
