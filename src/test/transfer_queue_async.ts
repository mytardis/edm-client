
import {expect} from "chai";
const fs = require('fs-extra');
const path = require('path');
import * as tmp from 'tmp';

import {settings} from "../lib/settings";
import {TransferQueuePool} from "../lib/transfer_queue";
import {EDMFileCache} from "../lib/cache";

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
    // way we get a fresh TransferStream from the TransfersQueues pool for each test.
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

    it("should be able to write and read tasks many tasks from a queue", function (done) {
        const number_of_file_transfers = 10;

        setupSettings();

        let tq = TransferQueuePool.getQueue(destination.id);
        eventDebug(tq);

        tq.on('finish', () => {
            console.log(`Queue ${tq.queue_id} -> 'end' event`);
            done()
        });

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

        // TODO: Never fires ?
        manager.on('transfer_complete', (transfer_id, bytes) => {
            console.info(`Transfer ${transfer_id} of ${bytes} bytes completed`);
            done();
        });

        let cache = new EDMFileCache(source);

        cache.addFile(cachedFile)
            .then((putResult) => {
                console.log(`Added new file to cache: ${putResult.id}`);
            })
            .catch((error) => {
                console.error(`Cache put failed: ${error}`);
            });
    });
});
