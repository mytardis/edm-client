
import {expect} from "chai";
const fs = require('fs-extra');
const path = require('path');
import * as tmp from 'tmp';

import {EDM} from "../lib/main";
import {settings} from "../lib/settings";
import {TransferQueue} from "../lib/transfer_queue";
import {TransferManager} from "../lib/transfer_manager";
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
        //eventDebug(tq);

        let readable_events_fired: number = 0;
        let drain_events_fired: number = 0;
        tq.on('readable', () => {
            readable_events_fired++;
            console.log(`Queue ${tq.queue_id} -> 'readable' event.`);
        });

        // tq.on('data', (obj) => {
        //     console.log(`Queue ${tq.queue_id} -> 'data' event:\n${JSON.stringify(obj)}`);
        // });

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
        //eventDebug(tq);

        let readable_events_fired: number = 0;
        let drain_events_fired: number = 0;
        tq.on('readable', () => {
            readable_events_fired++;
            console.log(`Queue ${tq.queue_id} -> 'readable' event.`);
        });

        // tq.on('data', (obj) => {
        //     //console.log(`Queue ${tq.queue_id} -> 'data' event:\n${JSON.stringify(obj)}`);
        // });

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
        //eventDebug(tq);

        tq.on('readable', () => {
            console.log(`Queue ${tq.queue_id} -> 'readable' event.`);
        });
        tq.on('end', () => {
            console.log(`Queue ${tq.queue_id} became empty -> 'end' event.`);
            // since the associated 'dummy' TransferManager will consume anything added to the queue almost
            // immediately, 'end' should fire without requiring an explicit call to tq.read() in the test.
            setTimeout(() => {
                done();
            }, 200);
        });

        tq.write(transfer_job);
    });

    it("should allow pausing of a TransferManager", function (done) {
        setupSettings();

        let tq = TransferQueuePool.getQueue(destination.id);
        let manager = TransferQueuePool.getManager(destination.id);
        manager.pause();

        //eventDebug(tq);
        //eventDebug(manager);

        tq.on('readable', () => {
            console.log(`Queue ${tq.queue_id} -> 'readable' event.`);
            // When the associated TransferManager is paused we should be able to
            // read from the queue ourselves, since it won't consume jobs as they are added
            let queued_job = tq.read();
            expect(queued_job).to.equal(transfer_job);
            done();
        });

        tq.write(transfer_job);
    });

    it("should return the same manager/queue pair from the pool for a given destination_id", function (done) {
        setupSettings();

        let manager = TransferQueuePool.getManager("destination-id-1");
        let tq = TransferQueuePool.getQueue("destination-id-1");
        expect(manager.queue).to.equal(tq);

        let tq2 = TransferQueuePool.getQueue("destination-id-2");
        let manager2 = TransferQueuePool.getManager("destination-id-2");
        expect(manager2.queue).to.equal(tq2);

        expect(manager.queue).to.not.equal(tq2);
        expect(manager2.queue).to.not.equal(tq);

        done();
    });

    it("should add a file to the transfer queue when it has pending file transfers", function (done) {
        setupSettings();

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

        let manager = TransferQueuePool.getManager(transferRecord.destination_id);
        let tq = manager.queue;
        expect(manager.queue).to.equal(tq);

        eventDebug(manager);
        eventDebug(tq);

        tq.on('readable', () => {
            console.log(`Queue ${tq.queue_id} became readable`);
        });

        // Warning: Adding a 'data' event automatically reads off the queue into
        //          the attached function. If you do this, the TransferManager will
        //          never see the job since it will be pull off the queue before it can
        //          grab it.
        // tq.on('data', (data: FileTransferJob) => {
        //     console.log('Got data:' + JSON.stringify(data));
        //     expect(data.cached_file_id).to.equal(cachedFile._id);
        //     expect(tq.items.length).to.equal(0);
        //     done();
        // });

        tq.on('end', () => {
            console.log(`Queue ${tq.queue_id} became empty -> 'end' event.`);
        });

        // TODO: Never fires ?
        manager.on('transfer_complete', (transfer_id, bytes) => {
            console.info(`Transfer ${transfer_id} of ${bytes} bytes completed`);
            done();
        });

        let cache = new EDMFileCache(source);

        // TODO: Make this work (it actually reflect what would happen during a real file walk.
        //       Issue: Adding this way via cache, transfer never starts even though queuePendingTransfers is
        //       being called inside PouchDB 'change' event ?
        cache.addFile(cachedFile)
            .then(() => {
                console.log(`Added new file to cache: ${cachedFile._id}`);

                // // TEST:
                // // Pull the cached file record back from PouchDB so we are using
                // // the same thing a in the 'change' event ?
                // cache.getEntry(cachedFile).then((doc) => {
                //     cache.queuePendingTransfers(<EDMCachedFile>doc);
                // });

            })
            .catch((error) => {
                console.error(`Cache put failed: ${error}`);
            });

        // Calling this directly works for some reason, but having
        //       the cache do it via it's on('change') event doesn't ?
        // cache.queuePendingTransfers(cachedFile);
    });
});
