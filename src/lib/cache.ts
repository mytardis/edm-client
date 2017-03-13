/**
 * Created by grischa on 7/10/16.
 *
 * Database to remember status of files, specifically, whether files have
 * been processed and can be ignored.
 */
import * as fs from "fs";
import * as path from "path";
import * as url from 'url';

const PouchDB = require('pouchdb-node');
const querystring = require('querystring');

import EDMFile from './file_tracking';
import {settings} from "./settings";
import {TransferQueuePool} from "./transfer_queue";

export class EDMFileCache {
    readonly _db: any; // PouchDB.Database<EDMCachedFile>;
    private changes: any;

    constructor(readonly db_name: string = 'files') {
        this.db_name = querystring.escape(db_name);
        //this.db_name = querystring.escape(source.id);
        const db_base = path.normalize(path.join(
            settings.conf.appSettings.dataDir, 'data'));
        if (!fs.existsSync(db_base)) {
            fs.mkdirSync(db_base, '700');
        }

        const db_path = path.join(db_base, this.db_name);
        this._db = new PouchDB(db_path);
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
            return this._db.put(file as EDMCachedFile);
        }
    }

    getEntry(file: EDMFile | EDMCachedFile) {
        return this._db.get(file._id);
    }

    /**
     * Given the ID of a file in the local cache, returns the full path of the file.
     *
     * @param file_local_id
     * @returns {string}
     */
    public getFilePath(file_local_id: string): string {
        // const filepath = file_local_id.replace(/^file:\/\//, '');
        let file_uri = url.parse(file_local_id);
        file_uri.protocol = '';
        file_uri.slashes = false;
        const filepath = url.format(file_uri);
        return filepath;
    }

    queuePendingTransfers(cachedFile: EDMCachedFile) {
        for (let xfer of cachedFile.transfers) {
            if (xfer.status === 'new') {
                // TODO: How do we ensure jobs that fail to _queue (backpressure or real failure) get re-queued later ?

                //let queue_unsaturated: boolean = true;
                let xfer_job = TransferQueuePool.createTransferJob(cachedFile, xfer);
                TransferQueuePool.queueTransfer(xfer_job)
                    .then((result) => {
                        // update PouchDB with file transfer status = queued
                        console.log(`file_transfer updated: ${JSON.stringify(result)}`);
                    })
                    .catch((error) => {
                        // we may catch a rejected Promise here if the job cannot be queued at this time
                        // eg, _queue is rejecting jobs due to back-pressure or a network failure notifying the server

                        // TODO: How do we now catch 'new' transfers that didn't get queued here,
                        //       given that they won't be detected now unless the 'change' event fires again
                        //       for that EDMCachedFile record.
                        throw Error(`ERROR: ${error}`);
                    });

                // if (!queue_unsaturated) {
                //     // TODO: If the the _queue is saturated (highWaterMark / buffer exceeded), we need to wait
                //     //       until it emits the 'drain' or 'unsaturated' event before attempting to _queue more to
                //     //       respect back pressure.
                //     throw Error(`[Not implemented]: TransferQueues ${xfer.destination_id} is saturated. File transfer ${xfer.id} must be queued later`);
                // }
            }
        }
    }
}

/*
 * This Singleton + getter wrapper class is used since:
 *   export const LocalCache = new EDMFileCache();
 * will fail immediately upon startup since settings won't yet be initialized, but
 * the EDMFileCache constructor uses settings.
 *
 * CacheProxy only instantiates the EDMFileCache instance on demand, and by then settings (should) be populated.
 * There are probably other workarounds.
 */
export class CacheProxy {
    private _cache: EDMFileCache;
    public get cache(): EDMFileCache {
        if (this._cache == null) this._cache = new EDMFileCache();
        return this._cache;
    }
}

export const LocalCache = new CacheProxy();
