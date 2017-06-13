import * as path from 'path';
import * as _ from "lodash";
const fs = require('fs-extra');
var klaw = require('klaw');

import {ApolloQueryResult} from "apollo-client";

import * as through2 from 'through2';
import EDMFile from "./file_tracking";
import {EDMQueries} from "./queries";

import * as logger from "./logger";
const log = logger.log.child({'tags': ['file_watcher']});

export class EDMFileWatcher {
    source: EDMSource;
    filters: any = [];
    lastWalkItems: any;

    constructor(source: any, exclude?: any) {
        this.source = source;
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

        this.register(edmFile)
        .catch((error) => {
            log.error({err: error, file: edmFile},
                `Failed to register and cache file: ${edmFile._id} (${edmFile.remote_id})`);
        })
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

    public register(localFile: EDMFile)
    : Promise<ApolloQueryResult<any>> {
        return EDMQueries.registerFileWithServer(localFile, this.source.name)
            .then((backendResponse) => {
                log.debug(backendResponse, 'Registered file with response:');
                return backendResponse;
            }, (error) => {
                log.error({error: error},
                    `Register file failed with error`)});
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
