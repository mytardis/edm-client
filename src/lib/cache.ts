/**
 * Created by grischa on 7/10/16.
 *
 * Database to remember status of files, specifically, whether files have
 * been processed and can be ignored.
 */
import * as fs from "fs";
import * as path from "path";

var PouchDB = require('pouchdb-node');
import EDMFile from './file_tracking';
import {settings} from "./settings";
import {EDMConnection} from "../edmKit/connection";


export class EDMFileCache {
    client: EDMConnection;
    // db: PouchDB.Database<EDMCachedFile>;
    db_name: string;
    db: any;
    private changes: any;

    constructor(db_name: string) {
        this.db_name = db_name;
        const db_base = path.normalize(path.join(
            settings.conf.appSettings.dataDir, 'data'));
        if (! fs.existsSync(db_base)) {
            fs.mkdirSync(db_base, '700');
        }

        const db_path = path.join(db_base, db_name);
        this.db = new PouchDB(db_path);
        this.client = new EDMConnection(
            settings.conf.serverSettings.host,
            settings.conf.serverSettings.token);
        this.changes = this.db.changes({live: true, include_docs: true})
            .on('change', (change) => {
                // if (change.doc._dirty) {
                //     return;
                // }
                // switch(change.doc.status) {
                //     case "unknown":
                //         //this.queryServer(change.doc);
                //         break;
                //     case "uploaded":
                //         break;
                //     case "uploading":
                //         break;
                //     case "interrupted":
                //         this.db.update(change.doc, {_rev: change.doc._rev,
                //             status: "resume"});
                //         break;
                //     case "verifying":
                //         break;
                //     case "new":
                //         // start upload
                //         break;
                //     case "modified":
                //         break;
                //     default:
                //         break;
                // }
            })
            .on('complete', (info) => {
                console.info(info);
                console.log("stopped listening for changes");
            })
            .on('error', (error) => {
                console.error(`pouchdb changes handling error: ${error}`)
            });
    }

    addEntry(file: EDMFile) {
        return this.db.put(file.getPouchDocument());
    }

    getEntry(file: EDMFile) {
        return this.db.get(file._id);
    }
}
