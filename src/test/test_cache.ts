import {expect} from "chai";

import * as _ from "lodash";
import * as tmp from 'tmp';
const path = require('path');
const fs = require('fs-extra');

import {EDMFileCache} from "../lib/cache";
import EDMFile from "../lib/file_tracking";

import {settings} from "../lib/settings";


describe("file watch cache", function () {
    const dataDir = tmp.dirSync({ prefix: 'edmtest_'}).name;
    const dirToIngest = path.join(dataDir, 'tmp');
    const docKeys = ['_id', 'mtime', 'size', 'hash'];

    function createNewTmpfile(): string {
        let tmpobj = tmp.fileSync({ dir: dirToIngest, prefix: 'tmp-' });
        fs.outputFileSync(tmpobj.name, 'some data\n', function (err) { console.log(err) });
        return tmpobj.name;
    }

    before("set up test env", function () {
        tmp.setGracefulCleanup();
        fs.mkdirSync(dirToIngest);

        const initArgs = {dataDir: dataDir};
        settings.parseInitArgs(initArgs);
    });

    it("should store EDMCachedFile documents", (done) => {
        let datafilepath = createNewTmpfile();
        let file = new EDMFile(dirToIngest, path.basename(datafilepath));
        let doc = file.getPouchDocument();
        let cache = new EDMFileCache(dirToIngest);
        cache.addFile(doc)
            .then((success) => {
                console.log(success);
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
        let datafilepath = createNewTmpfile();
        let file = new EDMFile(dirToIngest, path.basename(datafilepath));
        let cache = new EDMFileCache(dirToIngest);
        cache.addFile(file)
            .then((success) => {
                console.log(success);
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
