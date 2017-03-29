import {expect} from "chai";
import * as _ from "lodash";
const fs = require('fs-extra');
import EDMFile from "../lib/file_tracking";
import {DummyTransfer} from "../lib/transfer_methods/dummy_transfer";

import * as logger from "../lib/logger";
const log = logger.log.child({'tags': ['test', 'test_transfer_method']});

describe("A transfer method ", function () {
    before(function () {

    });


    it("can show progress using the example 'dummy' transfer method", function (done) {
        this.timeout(5000);
        let file_transfer_id = "a-file-transfer-uuid";

        function logProgress(id: string, bytes: number, file_local_id: string) {
            log.debug({
                file_transfer_id: id,
                bytes_transferred: bytes,
                file_local_id: file_local_id},
                `Dummy transfer progress: ${id}: ${bytes} bytes`)
        }

        function logComplete(id: string, bytes: number, file_local_id: string) {
            log.debug({
                file_transfer_id: id,
                bytes_transferred: bytes,
                file_local_id: file_local_id},
                `Huzzah ${id} completed !`);
            done();
        }

        let dummy = new DummyTransfer({destBasePath: "/a/destination/path"});
        dummy.on('progress', logProgress);
        dummy.on('complete', logComplete);

        dummy.transfer(
            "/some/fake/absolute/filepath",
            file_transfer_id,
            EDMFile.generateID("/some/fake/absolute", "filepath"),
            'bla',
            _.noop
        );
    });
});
