
import {expect} from "chai";

import {EDM} from "../lib/main";
import {TransferQueue} from "../lib/transfer_queue";

describe("The transfer queue, ", function () {
    before(function () {
    });
    it("should do something for each task", function () {
        let tq = new TransferQueue();
        tq.push("app.js", "local", {
            "sourceBasePath": "./",
            "destBasePath": "/tmp"});
    });
});
