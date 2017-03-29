import {expect} from "chai";

import * as _ from "lodash";
import * as tmp from 'tmp';
const path = require('path');
const fs = require('fs-extra');

import {createNewTmpfile} from "../lib/testutils";
import {getTmpDirPath} from "../lib/testutils";

import {EDMFileCache} from "../lib/cache";
import EDMFile from "../lib/file_tracking";

import {settings} from "../lib/settings";

import * as logger from "../lib/logger";
const log = logger.log.child({'tags': ['test', 'test_cache']});

describe("file watch cache", function () {
    let dataDir: string;
    let dirToIngest: string;
    const docKeys = ['_id', 'mtime', 'size', 'hash'];

    before("set up test env", function () {
        tmp.setGracefulCleanup();

        const initArgs = {dataDir: dataDir};
        settings.parseInitArgs(initArgs);
    });

    beforeEach("setup", () => {
        dataDir = getTmpDirPath();
        dirToIngest = getTmpDirPath();

        const initArgs = {dataDir: dataDir};
        settings.parseInitArgs(initArgs);
    });

    it("should store EDMCachedFile documents", (done) => {
        let datafilepath = createNewTmpfile(dirToIngest);
        const source = {
            id: "test_source",
            basepath: dirToIngest,
        } as EDMSource;

        let file = new EDMFile(source, path.basename(datafilepath));
        let doc = file.getPouchDocument();
        let cache = new EDMFileCache(dirToIngest);
        cache.addFile(doc)
            .then((success) => {
                log.debug({result: success});
                return cache._db.get(doc._id);
            })
            .then((retrieved) => {
                _.forEach(docKeys, (key) => {
                    expect(retrieved).to.have.property(key, doc[key]);
                });
                done();
            })
            .catch((error) => done(error));
    });

    it("should store EDMFile documents", (done) => {
        let datafilepath = createNewTmpfile(dirToIngest);
        const source = {
            id: "test_source",
            basepath: dirToIngest,
        } as EDMSource;

        let file = new EDMFile(source, path.basename(datafilepath));
        let cache = new EDMFileCache(dirToIngest);
        cache.addFile(file)
            .then((success) => {
                log.debug({result: success});
                return cache.getEntry(file);
            })
            .then((retrieved) => {
                _.forEach(docKeys, (key) => {
                    expect(retrieved).to.have.property(key, file.getPouchDocument()[key]);
                });
                done();
            })
            .catch((error) => done(error));
    });
});
