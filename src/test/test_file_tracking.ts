import {expect} from "chai";

const fs = require('fs-extra');
import * as path from "path";
import * as tmp from 'tmp';

import EDMFile from "../lib/file_tracking";
import {EDMFileCache} from "../lib/cache";
import {settings} from "../lib/settings";
import file = tmp.file;


describe("file tracker", function () {

    function getTmpDir(): string {
        return tmp.dirSync({ prefix: 'edmtest_'}).name;
    }

    function createNewTmpfile(basePath: string): string {
        let tmpobj = tmp.fileSync({ dir: basePath, prefix: 'tmp-' });
        const data = Math.random().toString(18).substring(2);
        fs.outputFileSync(tmpobj.name, `${data}\n`, function (err) { console.log(err) });
        return tmpobj.name;
    }

    before("set up test env", function () {
        const initArgs = {dataDir: './testdata'};
        settings.parseInitArgs(initArgs);
    });

    it("should hash a file and its metadata", function () {
        console.log(settings.conf.appSettings.dataDir);

        const sourceBasePath = getTmpDir();
        const filePath = createNewTmpfile(sourceBasePath);
        let file = new EDMFile(sourceBasePath, filePath);
        expect(file.hash).to.not.be.null;
        expect(file.hash).to.not.be.undefined;
        expect(file.stats).to.not.be.null;
        expect(file.stats).to.not.be.undefined;
        //expect(file._id).to.contain('file://');
        expect(file._id).to.equal(filePath);
        expect(file._id).to.contain(sourceBasePath);
        expect(file._id).to.contain(filePath);
    });

    it("should be able to test whether the file exists in the cache", (done) => {

        const sourceBasePath = getTmpDir();
        const filePath = createNewTmpfile(sourceBasePath);
        let file = new EDMFile(sourceBasePath, filePath);

        let source = {
            id: "test_source",
            basepath: sourceBasePath,
        } as EDMSource;

        let cache = new EDMFileCache(source);
        cache.getEntry(file)
        .then((result) => {
            console.log(result);
            expect("should fail").to.equal("to find the file in the cache");
            done();
        })
        .catch((error) => {
            expect(error.name).to.equal("not_found");
            done();
        });
    });

    it("should be able to store its details in the cache and retrieve them", (done) => {
        const sourceBasePath = getTmpDir();
        const filePath = createNewTmpfile(sourceBasePath);
        let file = new EDMFile(sourceBasePath, filePath);

        let source = {
            id: "test_source",
            basepath: sourceBasePath,
        } as EDMSource;

        let cache = new EDMFileCache(source);

        cache.addFile(file)
            .then((putResult) => {
                console.log(`Added new file to cache: ${putResult._id}`);

                cache.getEntry(file)
                    .then((doc) => {
                        console.log(JSON.stringify(doc));
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
                console.error(`Cache put failed: ${error}`);
            });
    });
});
