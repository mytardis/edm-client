import {expect} from "chai";
import {EDMFileWatcher} from "../lib/file_watcher";
import {settings} from "../lib/settings";


describe("file watch cache", function () {
    before("set up test env", function () {
        const initArgs = {dataDir: './testdata'};
        settings.parseInitArgs(initArgs);
    });
});
