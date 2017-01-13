import {expect} from "chai";
const fs = require('fs-extra');
import {DummyTransfer} from "../lib/transfer_methods/dummy_transfer";

describe("A transfer method ", function () {
    before(function () {

    });


    it("can show progress using the example 'dummy' transfer method", function (done) {
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

        dummy.transfer("/some/fake/absolute/filepath", file_transfer_id);
    });
});