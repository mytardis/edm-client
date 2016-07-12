import * as assert from "assert";
import * as child_process from "child_process";
var path = require("path-extra");
import * as fs from "fs";
import {expect} from "chai";
import {EDM, EDMSettings} from "../lib/settings";
import * as yargs from "yargs";

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
    }
}

describe("run command line program", function() {
    this.timeout(5000);
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
        child_process.exec("node app.js config -c test-edm-settings.json", (error: Error, stdout: Buffer, stderr: Buffer) => {
            assert.equal(stdout.toString("utf8").trim(),
                         JSON.stringify(
                             {"serverSettings": {"host": "localhost", "interval": -1}}, null, 2));
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
        let args = yargs.default('c', configLocation).argv;
        let options = new EDMSettings(args);
        expect(fs.existsSync(configLocation)).to.be.true;
    })
    it("should read a configuration file from a standard location", function() {
        let opts = new EDMSettings(undefined);
    });
    it("should read a config file from --config location, ignore system one",
       function() {
    });
    it("should show an error if --config points nowhere or cannot be parsed",
       function() {
    });
    it("combine command line options with configuration file options", function() {

    });
    it("should contact the server for its configuration", function() {

    });
    it("should return information about its identity", function() {

    });
});

describe("Configuration options", function () {
    it("should allow setting the server address with -s",
       function () {
           // default value
           let defaultOptions = new EDMSettings(yargs.argv);
           expect(defaultOptions.conf.serverSettings.host).to.be.equal('localhost');
           // custom value
           let args = yargs.default('s', 'edm.com').argv;
           let options = new EDMSettings(args);
           expect(options.conf.serverSettings.host).to.be.equal('edm.com');
    });
    it("should allow setting the token with --token", function () {
        let args = yargs.default('token', 'abc123').argv;
        let options = new EDMSettings(args);
        expect(options.conf.serverSettings.token).to.be.equal('abc123');
    });
});
