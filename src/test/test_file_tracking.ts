import {expect} from "chai";

const fs = require('fs-extra');
import * as path from "path";
import * as tmp from 'tmp';

import {createNewTmpfile} from "../lib/testutils";
import {getTmpDirPath} from "../lib/testutils";

import EDMFile from "../lib/file_tracking";
import {LocalCache} from "../lib/cache";
import {settings} from "../lib/settings";
import file = tmp.file;

import * as logger from "../lib/logger";
const log = logger.log.child({'tags': ['test', 'test_file_tracking']});

describe("file tracker", function () {

    before("set up test env", function () {
        const initArgs = {dataDir: getTmpDirPath()};
        settings.parseInitArgs(initArgs);
    });

    it("should hash a file and its metadata", function () {
        const sourceBasePath = getTmpDirPath();
        const source = {
            id: "test_source",
            basepath: sourceBasePath,
        } as EDMSource;

        const filePath = createNewTmpfile(sourceBasePath);
        let file = new EDMFile(source, path.basename(filePath));
        expect(file.hash).to.not.be.null;
        expect(file.hash).to.not.be.undefined;
        expect(file.stats).to.not.be.null;
        expect(file.stats).to.not.be.undefined;
        //expect(file._id).to.contain('file://');
        expect(file._id).to.equal(EDMFile.generateID(sourceBasePath, path.basename(filePath)));
        expect(file._id).to.contain(sourceBasePath);
        expect(file._id).to.contain(filePath);
    });

    it("should be able to test whether the file exists in the cache", (done) => {

        const sourceBasePath = getTmpDirPath();
        const source = {
            id: "test_source",
            basepath: sourceBasePath,
        } as EDMSource;

        const filePath = createNewTmpfile(sourceBasePath);
        let file = new EDMFile(source, filePath);

        const cache = LocalCache.cache;
        cache.getEntry(file)
        .then((result) => {
            log.debug({result: result});
            expect("should fail").to.equal("to find the file in the cache");
            done();
        })
        .catch((error) => {
            expect(error.name).to.equal("not_found");
            done();
        });
    });

    it("should be able to store its details in the cache and retrieve them", (done) => {
        const sourceBasePath = getTmpDirPath();
        const source = {
            id: "test_source",
            basepath: sourceBasePath,
        } as EDMSource;

        const filePath = createNewTmpfile(sourceBasePath);
        let file = new EDMFile(source, filePath);

        const cache = LocalCache.cache;

        cache.addFile(file)
            .then((putResult) => {
                log.debug({result: putResult}, `Added new file to cache: ${putResult._id}`);

                cache.getEntry(file)
                    .then((doc) => {
                        log.debug({result: doc}, `Found cached file record: ${doc._id}`);
                        expect(doc._id).to.equal(file._id);
                        expect(doc.hash).to.equal(file.hash);
                        expect(doc.size).to.equal(file.stats.size);
                        expect(doc.mtime).to.equal(file.stats.mtime.getTime());
                        done();
                    })
                    .catch((error) => {
                        expect("should fail").to.equal("because file IS in the cache");
                        done();
                    });
            })
            .catch((error) => {
                log.error({err: error}, `Cache put failed for file: ${file._id}`);
            });
    });
});
