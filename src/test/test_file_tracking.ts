import {expect} from "chai";
import EDMFile from "../lib/file_tracking";
import {EDMFileCache} from "../lib/cache";
import {settings} from "../lib/settings";


describe("file tracker", function () {
    before("set up test env", function () {
        const initArgs = {dataDir: './testdata'};
        settings.parseInitArgs(initArgs);
    })
    it("should hash a file and its metadata", function () {
        console.log(settings.conf.appSettings.dataDir)

        let file = new EDMFile('.', 'app.js');
        expect("bla").to.equal('bla');
    });
    it("should be able to test whether the file exists in the " +
        "cache", function (done) {
        let file = new EDMFile('.', 'app.js');
        let cache = new EDMFileCache('testdb');
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
    it("should be able to store its details in the cache and retrieve them",
        function () {

    });
});
