import {expect} from "chai";
import {EDMFileWatcher} from "../lib/file_watcher";
import {settings} from "../lib/settings";


describe("file watch cache", function () {
    before("set up test env", function () {
        const initArgs = {dataDir: './testdata'};
        settings.parseInitArgs(initArgs);
    });
    it("should sync itself", function (done) {
        let watcher = new EDMFileWatcher('./lib');
        watcher.cache.sync().then((result) => {
            console.log(result);
            done();
        }).catch((error) => {
            console.error(error);
            done();
        })
    })
});
