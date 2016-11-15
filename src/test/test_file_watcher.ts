import {expect} from "chai";
import {EDMFileWatcher} from "../lib/file_watcher";
import {settings} from "../lib/settings";


describe("file watcher", function () {
    before("set up test env", function () {
        const initArgs = {dataDir: './testdata'};
        settings.parseInitArgs(initArgs);
    });
    it("should list files in a folder", function (done) {
        console.log(settings.conf.appSettings.dataDir)
        let watcher = new EDMFileWatcher('./lib');
        watcher.walker.on('end', () => {
            const numfiles = watcher.files.length;
            expect(numfiles).to.be.greaterThan(20);
            watcher.cache.db.allDocs().then((result) => {
                // db adds aren't always complete yet, can be improved
                expect(result.total_rows).to.be.lessThan(numfiles+1);
                done();
            });
        });
    })
});
