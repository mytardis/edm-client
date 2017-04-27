import * as path from 'path';
import * as _ from "lodash";
const fs = require('fs-extra');
var klaw = require('klaw')

import {ApolloQueryResult} from "apollo-client";

import * as through2 from 'through2';
import EDMFile from "./file_tracking";
import {EDMFileCache} from "./cache";
import {EDMQueries} from "./queries";
import {LocalCache} from "./cache";

import * as logger from "./logger";
const log = logger.log.child({'tags': ['file_watcher']});

export class EDMFileWatcher {
    source: EDMSource;
    cache: EDMFileCache;
    filters: any = [];
    lastWalkItems: any;

    constructor(source: any, exclude?: any) {
        this.source = source;
        this.cache = LocalCache.cache;
        if (exclude != null) {
            const excluder = new RegExp(exclude);
            let exclude_filter = (path) => {
                return excluder.test(path);
            };
            this.filters.push(exclude_filter);
        }
    }

    walk(job?: any) {
        log.debug({}, `walking now, on source: ${this.source}`)
        // using https://github.com/jprichardson/node-klaw
        const walker = klaw(this.source.basepath);
        const items = [];
        for (let filter of this.filters) {
            walker.pipe(through2.obj((item, enc, next) => {
                filter(item);
                next();
            }));
        }
        walker.on('readable', () => {
            let item = walker.read();
            this.handleFile(item);
            items.push(item);
        })
        .on('end', () => {
            this.lastWalkItems = items;
            this.endWalk();
        })
        .on('error', (error) => this.handleError(error, job));
    }

    handleFile(file) {
        if (file == null) {
            log.debug('Skipping: file is null');
            return;
        }
        if (file.path === this.source.basepath) {
            log.debug("Skipping: file == basepath ('.')");
            return;
        }

        // console.log(file);
        const relpath = path.relative(this.source.basepath, file.path);
        let edmFile = new EDMFile(this.source, relpath);
        this.cache.getEntry(edmFile).then((cached) => {

            // compare on-disk to local db
            if (this.fileHasChanged(edmFile, cached)) {
                this.registerAndCache(edmFile, cached)
                    // .then((backendResponse) => {
                    //     console.log(`${JSON.stringify(backendResponse)}`);
                    //     this.cache.queuePendingTransfers(cached);
                    // })
                    .catch((error) => {
                        log.error({err: error, file: edmFile, cached: cached},
                            `Failed to register and cache file: ${edmFile._id} (${edmFile.remote_id})`);
                    })
            }
            log.debug({file: edmFile, cached: cached}, `File ${edmFile._id} is in local cache: ${cached._id}.`);
        }).catch((error) => {
            if (error.name === "not_found") {
                // new file (unknown to client, may be known to server if local cache was cleared)
                this.registerAndCache(edmFile).catch((error) => {
                    log.error({err: error, file: edmFile},
                        `Failed to register and cache file: ${edmFile._id} (${edmFile.remote_id})`);
                });
            } else {
                log.error({err: error, file: edmFile},
                    `Error checking local cache: ${edmFile._id} (${edmFile.remote_id})`);
            }
        });
    }

    endWalk() {
        log.debug({lastWalkItems: this.lastWalkItems}, "Finished one walk.");
    }

    private statsHaveChanged(file: EDMFile, cachedFile: EDMCachedFile) {
        return (file.stats.size !== cachedFile.size ||
                file.stats.mtime.getTime() !== cachedFile.mtime);
    }

    private fileHasChanged(file: EDMFile, cachedFile: EDMCachedFile) {
        return (this.statsHaveChanged(file, cachedFile) ||
                file.hash !== cachedFile.hash);
    }

    // private needsUpload(cachedRecord: EDMCachedFile) {
    //     return _.some(cachedRecord.transfers, {transfer_status: 'new' as TransferStatus});
    // }
    //
    // private pendingTransfers(cachedRecord: EDMCachedFile) {
    //     return _.filter(cachedRecord.transfers, {transfer_status: 'new' as TransferStatus});
    // }

    public registerAndCache(localFile: EDMFile, cachedRecord?: EDMCachedFile): Promise<ApolloQueryResult<any>> {
        let s = this.source;
        return EDMQueries.registerFileWithServer(localFile, this.source.name)
            .then((backendResponse) => {
                let doc: EDMCachedFile = localFile.getPouchDocument();
                if (cachedRecord != null) { // we are updating an existing record
                    doc._id = cachedRecord._id;
                    doc._rev = cachedRecord._rev;
                }
                const transfers: GQLEdgeList = _.get(backendResponse.data.createOrUpdateFile.file, 'file_transfers', null);
                doc.transfers = EDMQueries.unpackFileTransferResponse(transfers);
                this.cache.addFile(doc).catch((error) => {
                    log.error({err: error}, `Cache put failed: ${doc._id}`);
                });
                return backendResponse;
            });
            // .catch((error) => {
            //     // We get the main GQL error from the server in error.message
            //     // and a list in the array errors.graphQLErrors
            //     log.error({err: error, file: localFile, source: this.source},
            //                 `Failed to register and cache file: ${localFile._id} (${localFile.remote_id})`);
            // });
    }

    private handleError(error: any, job?: any) {
        log.error({err: error}, 'Error walking files.');
        if (error.code == 'ENOENT' &&
            error.path === path.resolve(this.source.basepath))
            if (job != null) {
                log.error({err: error}, 'Stopping cron job.');
                job.stop();
            }
    }
}
