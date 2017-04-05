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

import * as logger from "./logger";
const log = logger.log.child({'tags': ['cache']});

export class EDMFileCache {
    readonly _db: any; // PouchDB.Database<EDMCachedFile>;
    private changes: any;

    constructor(readonly db_name: string = 'files') {
        this.db_name = querystring.escape(db_name);
        const db_base = path.normalize(path.join(
            settings.conf.appSettings.dataDir, 'data'));
        if (!fs.existsSync(db_base)) {
            fs.mkdirSync(db_base, '700');
        }

        const db_path = path.join(db_base, this.db_name);
        this._db = new PouchDB(db_path);
        this.changes = this._db.changes({live: true, include_docs: true})
            .on('change', (change) => {

                log.debug({event: 'change', result: change}, `PouchDB on change event: ${change.id}`);

                let cachedFile = change.doc as EDMCachedFile;
                if (!change.deleted && cachedFile.transfers != null) {
                    this.queuePendingTransfers(cachedFile);
                }
            })
            .on('complete', (info) => {
                log.info({event: 'complete', result: info},
                    "PouchDB changes event 'complete'. Stopped listening for changes.");
            })
            .on('error', (error) => {
                log.error({event: 'error', err: error}, `PouchDB changes event 'error'.`)
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
            // TODO: Stop any active transfers that have been cancelled
            //       by the backend server (eg in response to the file stats changing, destination deletion, etc)
            // if (xfer.status === 'cancelled' && TransferQueuePool.isTransferInProgress(xfer.id)) {
            //     TransferQueuePool.cancel(xfer.id)
            // }
            if (xfer.status === 'new') {
                //let queue_unsaturated: boolean = true;
                let xfer_job = TransferQueuePool.createTransferJob(cachedFile, xfer);

                if (TransferQueuePool.isFull(xfer.destination_id)) {
                    // TODO: How do we ensure jobs that fail to _queue (backpressure or real failure) get re-queued later ?

                    log.error(`[Not implemented]: TransferQueue ${xfer.destination_id} is full (maximum allowed queued tasks exceeded).`+
                                  `FileTransfer ${xfer.id} was not queued.`);
                    continue;
                }

                TransferQueuePool.queueTransfer(xfer_job)
                    .then((result) => {
                        // update PouchDB with file transfer status = queued
                        log.info({result: result}, `file_transfer updated: ${xfer.id}`);

                        if (result['queue_saturated']) {
                            log.error({result: result}, `[Not implemented]: TransferQueues ${xfer.destination_id} is now saturated.`);
                        }
                    })
                    .catch((error) => {
                        // we may catch a rejected Promise here if the job cannot be queued at this time
                        // eg, a network failure notifying the server
                        log.error({err: error}, `Failed to queue file_transfer: ${xfer.id}`);
                    });
            }
        }
    }
}

/*
 * This Singleton + getter wrapper class is used since:
 *   export const LocalCache = new EDMFileCache();
 * will fail immediately upon startup since settings won't yet be initialized, because
 * the EDMFileCache constructor uses settings.
 *
 * CacheProxy only instantiates the EDMFileCache instance on demand, and by that time settings (should) be
 * populated. There are probably other workarounds.
 */
export class CacheProxy {
    private _cache: EDMFileCache;
    public get cache(): EDMFileCache {
        if (this._cache == null) this._cache = new EDMFileCache();
        return this._cache;
    }
}

export const LocalCache = new CacheProxy();
