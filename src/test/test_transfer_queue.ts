
import {expect} from "chai";
const fs = require('fs-extra');
const path = require('path');
import * as tmp from 'tmp';

import {EDM} from "../lib/main";
import {settings} from "../lib/settings";
import {TransferQueue} from "../lib/transfer_queue";
import {TransferQueuePool} from "../lib/transfer_queue";
import EDMFile from "../lib/file_tracking"
import {EDMFileCache} from "../lib/cache";
import {DummyTransfer} from "../lib/transfer_methods/dummy_transfer";

var eventDebug = require('event-debug');

describe("The transfer queue ", function () {
    let host: EDMDestinationHost;
    let destination: EDMDestination;
    let source: EDMSource;
    let transfer_job: FileTransferJob;
    const dataDir = getTmpDirPath();

    function getTmpDirPath(prefix='edm_test') {
        return tmp.dirSync({ prefix: prefix}).name;
    }

    function createNewTmpfile(basepath, prefix='tmp-'): string {
        let tmpobj = tmp.fileSync({ dir: basepath, prefix: 'tmp-' });
        fs.outputFileSync(tmpobj.name, "some data\n", function (err) { console.log(err) });
        return tmpobj.name;
    }

    // Using a new random hostname for each test ensures that the EDMDestinationHost is unique for each test. This
    // way we get a fresh TransferQueue from the TransfersQueues pool for each test.
    function randomString() {
        return Math.random().toString(36).substring(7);
    }

    function setupSettings() {
        host = {
            id: randomString(),
            transfer_method: "dummy",
            settings: {}
        } as EDMDestinationHost;

        destination = {
            id: randomString(),
            host_id: host.id,
            location: getTmpDirPath('edmtest_destination_'),
            exclusions: []
        } as EDMDestination;

        source = {
            id: randomString(),
            name: "testing source",
            basepath: getTmpDirPath('edmtest_source_'),
            checkMethod: "cron",
            cronTime: "* */30 * * * *",
            destinations: [destination],
        };

        transfer_job = {
            cached_file_id: randomString(),
            source_id: source.id,
            destination_id: destination.id,
            file_transfer_id: randomString(),
        } as FileTransferJob;


        let config = {
            "appSettings": {
                "dataDir": dataDir,
                "ignoreServerConfig": true
            },
            "serverSettings": {"host": "testhost.example.com:9000"},
            "sources": [source],
            "hosts": [host],
        } as Settings;

        settings.setConfig(config);
    }

    before(function () {
        tmp.setGracefulCleanup();

        let initArgs = {dataDir: dataDir};
        settings.parseInitArgs(initArgs);
        setupSettings();
    });

    it("should be able to write and read tasks from a queue", function (done) {
        setupSettings();

        let tq = new TransferQueue(destination.id);

        let readable_events_fired: number = 0;
        let drain_events_fired: number = 0;
        tq.on('readable', () => {
            readable_events_fired++;
            console.log(`Queue ${tq.queue_id} -> 'readable' event.`);
        });
        tq.on('data', (obj) => {
            console.log(`Queue ${tq.queue_id} -> 'data' event:\n${JSON.stringify(obj)}`);
        });
        tq.on('drain', () => {
            // 'drain' will only be emitted when the internal stream buffer has
            // become full (stream.write(job) will return false), then empties and
            // can accept more writes
            drain_events_fired++;
            console.log(`Queue ${tq.queue_id} -> 'drain' event`);
        });
        tq.on('end', () => {
            console.log(`Queue ${tq.queue_id} became empty -> 'end' event.`);
            expect(readable_events_fired).to.equal(2);
            expect(drain_events_fired).to.equal(0);
            done();
        });

        expect(readable_events_fired).to.equal(0);
        tq.write(transfer_job);
        // because of the async firing of events, we can't expect readable_events_fired to be non-zero here
        // immediately. We can expect it to be incremented in the 'end' event, because 'readable' should always fire
        // before 'end'.

        let queued_job = tq.read();
        expect(transfer_job).to.equal(queued_job);

        queued_job = tq.read();
        expect(queued_job).to.be.null;
    });

    it("should be able to write and read tasks many tasks from a queue", function (done) {
        const number_of_file_transfers = 20000;

        setupSettings();

        let tq = new TransferQueue(destination.id);

        let readable_events_fired: number = 0;
        let drain_events_fired: number = 0;
        tq.on('readable', () => {
            readable_events_fired++;
            console.log(`Queue ${tq.queue_id} -> 'readable' event.`);
        });
        tq.on('data', (obj) => {
            //console.log(`Queue ${tq.queue_id} -> 'data' event:\n${JSON.stringify(obj)}`);
        });
        tq.on('drain', () => {
            // 'drain' will only be emitted when the internal stream buffer has
            // become full (stream.write(job) will return false), then empties and
            // can accept more writes
            drain_events_fired++;
            console.log(`Queue ${tq.queue_id} -> 'drain' event`);
        });
        tq.on('end', () => {
            console.log(`Queue ${tq.queue_id} became empty -> 'end' event.`);
            // even though we add many jobs 'readable' only fires twice - once when the stream first get data, and a
            // second time when it becomes empty
            expect(readable_events_fired).to.equal(2);
            expect(drain_events_fired).to.equal(0);
            done();
        });

        expect(readable_events_fired).to.equal(0);
        let jobs: FileTransferJob[] = [];
        for (let n=0; n < number_of_file_transfers; n++) {
            let job = {
                cached_file_id: randomString(),
                source_id: source.id,
                destination_id: destination.id,
                file_transfer_id: randomString(),
            } as FileTransferJob;
            jobs.push(job);
            let ok = tq.write(job);
            expect(ok).to.be.true;
        }

        for (let n=0; n < number_of_file_transfers; n++) {
            let queued_job = tq.read();
            expect(jobs[n]).to.equal(queued_job);
        }

        let queued_job = tq.read();
        expect(queued_job).to.be.null;
    });

    it("should get/create a destination specific queue from the pool, queue a transfer, read it back", function (done) {
        setupSettings();

        let tq = TransferQueuePool.getQueue(destination.id);

        tq.on('readable', () => {
            console.log(`Queue ${tq.queue_id} -> 'readable' event.`);
        });
        tq.on('end', () => {
            console.log(`Queue ${tq.queue_id} became empty -> 'end' event.`);
            // since the associated 'dummy' TransferManager will consumed anything added to the queue almost
            // immediately, 'end' should fire without requiring an explicit call to tq.read() in the test.
            setTimeout(() => {
                done();
            }, 200);
        });

        tq.write(transfer_job);
    });

    it("should add a file to the transfer queue when it has pending file transfers", function (done) {

        let now = Math.floor(Date.now() / 1000);

        let transferRecord = {
                id: randomString(),
                destination_id: destination.id,
                status: "pending_upload",
                bytes_transferred: 0,
        } as EDMCachedFileTransfer;

        let real_file = createNewTmpfile(source.basepath);
        real_file = path.basename(real_file);

        let cachedFile = {
            _id: real_file,
            mtime: now,
            size: 1024,
            hash: `${real_file}_1024_${now}`,
            transfers: [transferRecord],
        } as EDMCachedFile;

        let manager = TransferQueuePool.getManager(destination.id);
        let tq = manager.queue;

        tq.on('readable', () => {
            console.log(`Queue ${tq.queue_id} became readable`);
        });

        tq.on('data', (data: FileTransferJob) => {
            console.log('Got data:' + JSON.stringify(data));
            expect(data.cached_file_id).to.equal(cachedFile._id);
            // done();
        });

        tq.on('end', () => {
            console.log(`Queue ${tq.queue_id} became empty -> 'end' event.`);
            // done();
        });

        // TODO: Never fires ?
        manager.on('transfer_complete', (transfer_id, bytes) => {
            console.info(`Transfer ${transfer_id} of ${bytes} bytes completed`);
            done();
        });

        let cache = new EDMFileCache(source);

        // TODO: Adding via cache, tq.on('data') never fires but dummy transfer proceeds
        // cache.addFile(cachedFile)
        //     .then(() => {
        //         console.log(`Added new file to cache: ${cachedFile._id}`);
        //     })
        //     .catch((error) => {
        //         console.error(`Cache put failed: ${error}`);
        //     });

        // TODO: Calling this directly works for some reason, but having
        //       the cache do it via it's on('change') event doesn't ?
        cache.queuePendingTransfers(cachedFile);
    });
});
