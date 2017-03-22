import {expect} from "chai";
import * as _ from "lodash";
const fs = require('fs-extra');
import EDMFile from "../lib/file_tracking";
import {DummyTransfer} from "../lib/transfer_methods/dummy_transfer";

describe("A transfer method ", function () {
    before(function () {

    });


    it("can show progress using the example 'dummy' transfer method", function (done) {
        this.timeout(5000);
        let file_transfer_id = "a-file-transfer-uuid";
        function logProgress(id: string, bytes: number) {
            console.info(`${id}: ${bytes} bytes`)
        }

        let dummy = new DummyTransfer({destBasePath: "/a/destination/path"});
        dummy.on('progress', logProgress);
        dummy.on('complete', () => {
            console.info(`Huzzah ${file_transfer_id} completed !`);
            done();
        });

        dummy.transfer(
            "/some/fake/absolute/filepath",
            file_transfer_id,
            EDMFile.generateID("/some/fake/absolute", "filepath"),
            'bla',
            _.noop
        );
    });
});
