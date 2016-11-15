import * as path from 'path';
var fs = require("fs-extra");
import * as through2 from 'through2';
import EDMFile from "./file_tracking";
import {EDMFileCache} from "./cache";


export class EDMFileWatcher {
    basedir: string;
    walker: any;
    cache: EDMFileCache;
    filters: any = [];

    constructor(basedir: string, exclude?: any) {
        this.basedir = basedir;
        this.files = [];
        this.cache = new EDMFileCache(basedir.replace(/\//g, '%2f'));
        if (typeof exclude !== "undefined") {
            const excluder = new RegExp(exclude);
            let exclude_filter = (path) => {
                return excluder.test(path);
            };
            this.filters.push(exclude_filter);
        }
    }

    walk(job?: any) {
        const walker = fs.walk(this.basedir);
        for (let filter of this.filters) {
            walker.pipe(through2.obj((item, enc, next) => {
                filter(item);
                next();
            }));
        }
        walker.on('readable', () => {
            this.handleFile(walker.read());
        })
        .on('end', () => this.endWalk())
        .on('error', (error) => this.handleError(error, job));
    }

    handleFile(file) {
        if (file === null) {
            console.log('file is null');
            return;
        }
        console.log(file);
        const relpath = path.relative(this.basedir, file.path);
        let edmFile = new EDMFile(this.basedir, relpath, file.stats);
        this.cache.getEntry(edmFile).then((result) => {
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
            // console.log(`${result._id} is in cache`);
        }).catch((error) => {
            if (error.name === "not_found") {
                edmFile.status = "unknown";
                this.cache.addEntry(edmFile)
            } else {
                console.error(error);
            }
        });
    }

    endWalk() {
        console.log("finished one walk");
    }

    private handleError(error: any, job?: any) {
        console.error(error);
        if (error.code == "ENOENT" &&
            error.path === path.resolve(this.basedir))
            if (typeof job !== "undefined") {
                console.error("stopping cron job");
                job.stop();
            }
    }
}
