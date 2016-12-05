import * as path from 'path';
const fs = require('fs-extra');
const querystring = require('querystring');
const uuidV4 = require('uuid/v4');

import gql from "graphql-tag/index";
import {MutationOptions} from "apollo-client";

import * as through2 from 'through2';
import {settings} from "./settings";
import {EDMConnection} from "../edmKit/connection";
import EDMFile from "./file_tracking";
import {EDMFileCache} from "./cache";


export class EDMFileWatcher {
    client: EDMConnection;
    source: any;            // TODO: define <EDMFileSource> interface ?
    basepath: string;        // TODO: make this: get basepath { return this.source.basepath };
    cache: EDMFileCache;
    filters: any = [];
    lastWalkItems: any;

    constructor(source: any, exclude?: any) {
        this.source = source;
        this.basepath = this.source.basepath;
        this.cache = new EDMFileCache(querystring.escape(this.basepath));
        if (exclude != null) {
            const excluder = new RegExp(exclude);
            let exclude_filter = (path) => {
                return excluder.test(path);
            };
            this.filters.push(exclude_filter);
        }
        this.client = new EDMConnection(
            settings.conf.serverSettings.host,
            settings.conf.serverSettings.token);
    }

    walk(job?: any) {
        // using https://github.com/jprichardson/node-klaw
        const walker = fs.walk(this.basepath);
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
            console.log('file is null');
            return;
        }
        if (file.path == this.basepath) {
            console.log("handleFile: skipping handling basepath '.' file")
            return;
        }

        console.log(file);
        const relpath = path.relative(this.basepath, file.path);
        let edmFile = new EDMFile(this.basepath, relpath, file.stats);
        this.cache.getEntry(edmFile).then((result) => {

            // compare on-disk to local db
            if (this.fileHasChanged(edmFile, result)) {
                let modified = edmFile.getPouchDocument();
                modified._id = result._id;
                modified._rev = result._rev;
                modified.status = 'modified';
                this.cache.db.put(modified);
            }
            else {

                switch (result.status) {
                    case "uploaded":
                        // do nothing
                        break;
                    case "uploading":
                        // check timestamp, flag for query
                        break;
                    case "interrupted":
                        // do nothing
                        break;
                    case "verifying":
                        // check timestamp, flag for query
                        break;
                    case "new":
                        // do nothing
                        break;
                    case "modified":
                        // do nothing
                        break;
                    case "unknown":
                    default:
                        // do nothing
                        break;
                }
            }
            console.log(`${result._id} is in cache`);
        }).catch((error) => {
            if (error.name === "not_found") {
                edmFile.status = "unknown";
                this.cache.addEntry(edmFile)
                this.registerFileWithServer(edmFile);
            } else {
                console.error(error);
            }
        });
    }

    endWalk() {
        console.info(this.lastWalkItems);
        console.log("finished one walk");
    }

    private statsHaveChanged(file: EDMFile, cachedFile: EDMCachedFile) {
        return (file.stats.size !== cachedFile.size ||
                file.stats.mtime.getTime() !== cachedFile.mtime);
    }

    private fileHasChanged(file: EDMFile, cachedFile: EDMCachedFile) {
        return (this.statsHaveChanged(file, cachedFile) ||
                file.hash === cachedFile.hash);
    }

    private registerFileWithServer(file: EDMFile) {
        const mutation = gql`
        mutation getOrCreateFile($input: GetOrCreateFileInput!) {
         getOrCreateFile(input: $input) {
            clientMutationId
            file {
              filepath
            }
         }
        }`;
        return this.client.mutate(
            <MutationOptions>{mutation: mutation,
            variables: {
                "input": {
                    "clientMutationId": uuidV4(),
                    "source": {"name": this.source.name},
                    "file": file.getGqlVariables()
                }
            }}).then((value) => { console.log(JSON.stringify(value))});
    }

    private handleError(error: any, job?: any) {
        console.error(error);
        if (error.code == "ENOENT" &&
            error.path === path.resolve(this.basepath))
            if (typeof job !== "undefined") {
                console.error("stopping cron job");
                job.stop();
            }
    }
}
