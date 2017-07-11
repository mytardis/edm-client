/**
 * These tests are supposed to integrate the complete system automatically.
 * Tasks to implement here:
 *  - Start EDM backend
 *  - Populate DB with data, i.e. set up client, source, host, destination
 *  - Set up example data in the source
 *  - Start EDM client
 *  - monitor destination for files
 *  - compare and quit or timeout and quit
 */

import * as child_process from 'child_process';
import {dirSync as tmpDirSync, setGracefulCleanup} from 'tmp';
import {expect} from "chai";
import * as fs from "fs-extra";

let edmBackendDir = '../edm-backend';
let dbDumpFile = 'src/integrationTest/dump.sql';


function startEDMBackend(done) {
    let command = 'docker-compose -f docker-compose.mysql.dev.yml up';
    let edm_backend = child_process.spawn(command, [], {
        cwd: edmBackendDir, shell: true});
    let doneCalled = false;
    edm_backend.stdout.on('data', (data: Buffer) => {
        //receiving backend output, log/debug here if necessary
        // console.log(data.toString('utf8'));
        if (data.toString('utf8').indexOf('Already up') > -1)
            if (!doneCalled) {
                done();
                doneCalled = true;
            }
    });
    edm_backend.stderr.on('data', (data: Buffer) => {
        // console.error(data.toString('utf8'));
    });
    edm_backend.on('close', (code) => {
        if (code === 0) console.log('edm_backend closed cleanly');
        else console.log('edm_backend closed with an error');
    });
}

/**
 * access backend db, execute given SQL string
 *
 * docker-compose exec has an issue with piping into it, hence using this
 * construct with getting the containerID
 */
function runSQLQuery(query) {
    let containerID = child_process.execSync(
        'docker-compose -f docker-compose.mysql.dev.yml ps -q db', {
            cwd: edmBackendDir}).toString('utf8').trim();
    // console.log(`Container ID is ${containerID}`);
    let output = child_process.execSync(`docker exec -i ${containerID} mysql`, {
            input: `use edm_backend_dev; ${query};`,
            cwd: edmBackendDir,
        }).toString('utf8');
    console.log(output);
}

/**
 * nothing for now, as using existing dev setup. For CI this needs to be added
 */
function populateDB() {
    // let query = fs.readFileSync(dbDumpFile);
    // runSQLQuery(query);
}

/**
 * clear file and file transfer entries
 */
function cleanFileEntries() {
    runSQLQuery('TRUNCATE TABLE file_transfers;');
    runSQLQuery('DELETE FROM files;');
}

function createSourceDir() : string {
    setGracefulCleanup();
    let sourceDir = tmpDirSync().name;
    // copy files to tmpdir
    let dirsToCopy = ['node_modules/tmp', 'node_modules/mocha'];
    for (let dirToCopy of dirsToCopy) {
        fs.copySync(dirToCopy, sourceDir);
    }
    return sourceDir;
}

function runEDM(args: string) {
    let token = "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJDbGllbnQ6MTE4MWY2NTctZDQ1Ny00ZDA2LWI4MzgtYzA4NTc5NWY0OWJlIiwiZXhwIjoxNTAxMjk3MDgxLCJpYXQiOjE0OTg3MDUwODEsImlzcyI6ImVkbS1iYWNrZW5kIiwianRpIjoiNzE1OWVmM2UtNjBkZi00ZDNmLWFlMWItZmM3MWU0Y2IyNGM4IiwicGVtIjp7fSwic3ViIjoiQ2xpZW50OjExODFmNjU3LWQ0NTctNGQwNi1iODM4LWMwODU3OTVmNDliZSIsInR5cCI6ImFjY2VzcyJ9.hdAq0MXr6cofr5xKg4KByHOSi-ZvrvqPqJfSKaRShbKEHZjrf9QwzeyexDTVOgSng-guDvoH-XpLIgCW_1r-vQ";
    return child_process.spawn(`node app.js run ${args}`, [], {
        shell: true,
        env: {'EDM_CLIENT_TOKEN': token},
        cwd: 'build',
    });
}

describe("Integration::The client and server", function() {
    before('start edm_backend', function(done) {
        this.timeout(30000);
        startEDMBackend(done);
        populateDB();
        let sourceDir = createSourceDir();
    });
    beforeEach('clean leftover files before tests', () => {
        cleanFileEntries();
    });
    it("should talk to each other", function(done) {
        let edmClient = runEDM('');
        console.log('started edm client');
        // console.log(edmClient);
        edmClient.stdout.on('data', (data: Buffer) => {
            console.log(data.toString('utf8'));
        });
        edmClient.stderr.on('data', (data: Buffer) => {
            console.error(data.toString('utf8'));
        });
        edmClient.on('close', () => {
            expect(false).to.be.true;
            done();
        });
        setTimeout(10000, () => {
            edmClient.kill('SIGTERM');
        });
    });
});
