import * as assert from "assert";
import * as child_process from "child_process";
var path = require("path-extra");
import * as fs from "fs";
import {expect} from "chai";
import {EDM} from "../lib/main";
import * as yargs from "yargs";
import {settings, EDMSettings} from "../lib/settings";

describe("testing tests", function () {
    it("should be ok", () => {
        assert.ok(true, "This shouldn't fail");
    });
});

function ensure_cwd() {
    // This is because Visual Studio insists on running the test from a
    // shitty place
    // There is an open github issue about this already...
    if (path.basename(process.cwd()) === "test") {
        process.chdir("..");
    } else if (path.basename(process.cwd()) === "edm-client") {
        process.chdir("build");
    }
}

describe("run command line program", function() {
    this.timeout(5000);
    before("set up test env", function () {
        const initArgs = {dataDir: './testdata'};
        settings.parseInitArgs(initArgs);
    });
    it("should output help message to stdour when called with --help",
        (done) => {
            ensure_cwd();
            child_process.exec("node app.js --help", function(
                error: Error, stdout: Buffer, stderr: Buffer) {
                assert.equal(stdout.toString("utf8").slice(0, 34),
                    "Usage: edm-client [options] action");
                done();
            });
        });
    it("should output help message to stderr when called with bad action",
        (done) => {
            ensure_cwd();
            child_process.exec("node app.js brew coffee", function(
                error: Error, stdout: Buffer, stderr: Buffer) {
                assert.equal(stderr.toString("utf8").slice(0, 34),
                             "Usage: edm-client [options] action");
                done();
            });
        });
    it("should output configuration when called with config", function(done) {
        ensure_cwd();
        console.log(settings);
        // write config file
        fs.writeFileSync("test-edm-settings.json", JSON.stringify(
            {"appSettings": {"dataDir": "testdata"}, "serverSettings":{"host":"testhost:9000"}}, null, 2));
        child_process.exec("node app.js config -c test-edm-settings.json",
                           (error: Error, stdout: Buffer, stderr: Buffer) => {
            assert.equal(stdout.toString("utf8").trim(),
                         JSON.stringify(
                             {"appSettings": {"dataDir": "testdata"},
                                 "serverSettings":{"host":"testhost:9000"}},
                             null, 2));
            done();
        });
    })
});

describe("Configuration is built when starting the program, ", function () {
    var configLocation = path.join(
        process.cwd(), 'test-' + EDMSettings.default_config_file_name);
    before(function () {
        // set up configuration
        if (fs.existsSync(configLocation)) fs.unlinkSync(configLocation);
    });
    it.skip("should create a configuration file if none exists", function() {
        // need to override data dir for auto-creation
        expect(fs.existsSync(configLocation)).to.be.false;
        let initArgs = <EDMInitArgs>{
          configFilePath: configLocation,
        };
        let edm = new EDM();
        expect(fs.existsSync(configLocation)).to.be.true;
    })
    it("should read a configuration file from a standard location", function() {
    });
    it("should read a config file from --config location, ignore system one",
       function() {
    });
    it("should show an error if --config points nowhere or cannot be parsed",
       function() {
    });
    it("combine command line options with configuration file options",
       function() {

    });
    it("should contact the server for its configuration", function() {

    });
    it("should return information about its identity", function() {

    });
});

describe("Configuration options", function () {
    it("should have a default server setting",
        function(done) {
            ensure_cwd();
            child_process.exec("node app.js config", function(
                error: Error, stdout: Buffer, stderr: Buffer) {
                assert.equal(
                    JSON.parse(stdout.toString("utf8")).serverSettings.host,
                    "localhost:4000");
                done();
            });
        }
    ),
    it("should allow setting the server address with -s",
        function (done) {
            ensure_cwd();
            child_process.exec("node app.js -s edm.com config", function(
                error: Error, stdout: Buffer, stderr: Buffer) {
                    assert.equal(
                        JSON.parse(stdout.toString("utf8")).serverSettings.host,
                        "edm.com");
                    done();
            });
    });
    it("should allow setting the token with --token",
        function(done) {
            ensure_cwd();
            child_process.exec("node app.js -t abc123 config", function(
                error: Error, stdout: Buffer, stderr: Buffer) {
                    assert.equal(
                        JSON.parse(stdout.toString("utf8")).serverSettings.token,
                        "abc123");
                    done();
                });
        });
});
