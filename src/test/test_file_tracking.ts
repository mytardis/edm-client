import {expect} from "chai";

const fs = require('fs-extra');
import * as path from "path";
import * as tmp from 'tmp';

import {createNewTmpfile} from "../lib/testutils";
import {getTmpDirPath} from "../lib/testutils";

import EDMFile from "../lib/file_tracking";
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
});
