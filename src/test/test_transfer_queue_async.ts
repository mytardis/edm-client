
import {expect} from "chai";
import * as nock from "nock";
import {randomString} from "../lib/testutils";
import {createNewTmpfile} from "../lib/testutils";
import {getTmpDirPath} from "../lib/testutils";
import {setupSettings} from "../lib/testutils";

const fs = require('fs-extra');
const path = require('path');
import * as tmp from 'tmp';

import {settings} from "../lib/settings";
import EDMFile from "../lib/file_tracking";
import {TransferQueuePool} from "../lib/transfer_queue";
import {LocalCache} from "../lib/cache";

let eventDebug = require('event-debug');

describe("The transfer _queue ", function () {

    const mutation_id = 'a44f9922-ebae-4864-ae46-678efa394e7d';
    // let host: EDMDestinationHost;
    // let destination: EDMDestination;
    // let source: EDMSource;
    // let transfer_job: FileTransferJob;
    let mockObjs: any;
    const dataDir = getTmpDirPath();

    function prepareForGqlRequest(replyData: any, times: number = 1): nock.Scope {
        return nock('http://localhost:4000').log(console.log)
            .defaultReplyHeaders({
                'Content-Type': 'application/json; charset=utf-8'
            })
            .filteringRequestBody(function(body) {
                 return '*';
            })
            .post('/api/v1/graphql', '*')
            .delay(300)
            .times(times)
            .reply(200, JSON.stringify(replyData));
    }

    // function setupSettings() {
    //     host = {
    //         id: randomString(),
    //         transfer_method: "dummy",
    //         settings: {}
    //     } as EDMDestinationHost;
    //
    //     destination = {
    //         id: randomString(),
    //         host_id: host.id,
    //         location: getTmpDirPath('edmtest_destination_'),
    //         exclusions: []
    //     } as EDMDestination;
    //
    //     source = {
    //         id: randomString(),
    //         name: "testing source",
    //         basepath: getTmpDirPath('edmtest_source_'),
    //         checkMethod: "cron",
    //         cronTime: "* */30 * * * *",
    //         destinations: [destination],
    //     } as EDMSource;
    //
    //     transfer_job = {
    //         file_local_id: randomString(),
    //         source_id: source.id,
    //         destination_id: destination.id,
    //         file_transfer_id: randomString(),
    //     } as FileTransferJob;
    //
    //     let config = {
    //         appSettings: {
    //             "dataDir": dataDir,
    //             "ignoreServerConfig": true
    //         },
    //         sources: [source],
    //         hosts: [host],
    //     } as Settings;
    //
    //     settings.setConfig(config);
    // }

    before(function () {
        tmp.setGracefulCleanup();

        // let initArgs = {
        //     dataDir: dataDir,
        //     serverSettings: {
        //         host: "localhost:4000",
        //         token: '_rand0m_JWT_t0ken'
        //     },
        // };
        // settings.parseInitArgs(initArgs);
    });

    beforeEach("setup settings", () => {
        mockObjs = setupSettings();
    });

    afterEach("cleanup after each test", () => {
        nock.cleanAll();
    });

    it("should be able to write many transfer jobs to the _queue, " +
        "receive 'transfer_complete' event when done", function (done) {
        const number_of_file_transfers = 10;

        // mockObjs = setupSettings();

        let replyData = {
            data: {
                updateFileTransfer: {
                    clientMutationId: mutation_id,
                    file_transfer: {
                        id: 'some_file_transfer_id__',
                        // status:"new" as TransferStatus,
                        // status: "queued" as TransferStatus,
                        status: "uploading" as TransferStatus,
                        bytes_transferred: 999,
                    },
                }
            }
        };
        // number_of_file_transfers * (DummyTransfer.percent_increment + 2)
        // - One request for new -> queued
        // - 10 requests for each increment in dummy transfer
        // - One request for finished
        let mockBackend = prepareForGqlRequest(replyData, 1);
        mockBackend.persist();

        let completed_transfers = 0;

        let tq = TransferQueuePool.getQueue(mockObjs.destination.id);
        eventDebug(tq);

        tq.on('finish', () => {
            console.log(`Queue ${tq.queue_id} -> 'finish' event`);
        });

        tq.on('transfer_complete', (id, bytes, file_local_id) => {
            console.log(`Transfer ${id} of file ${file_local_id} on queue ${tq.queue_id} completed (${bytes} bytes)`);
            completed_transfers++;
            if (completed_transfers == number_of_file_transfers) {
                // expect(mockBackend.isDone()).to.be.true;
                done();
            }
        });

        let jobs: FileTransferJob[] = [];
        for (let n=0; n < number_of_file_transfers; n++) {
            let job = {
                file_local_id: randomString(),
                source_id: mockObjs.source.id,
                destination_id: mockObjs.destination.id,
                file_transfer_id: randomString(),
            } as FileTransferJob;
            jobs.push(job);
            let saturated = tq.queueTask(job);
            expect(saturated).to.be.false;
        }
    });

    it("should add a file to the transfer _queue when it has pending file transfers", function (done) {
        // setupSettings();

        let now = Math.floor(Date.now() / 1000);

        let transferRecord = {
                id: randomString(),
                destination_id: mockObjs.destination.id,
                status: "new",
                bytes_transferred: 0,
        } as EDMCachedFileTransfer;

        let real_file = createNewTmpfile(mockObjs.source.basepath);
        real_file = path.basename(real_file);

        const _id = EDMFile.generateID(mockObjs.source.basepath, real_file);
        const size = 1024;
        const hash = EDMFile.computeHash(_id, size, now);
        let cachedFile = {
            _id: _id,
            mtime: now,
            size: size,
            hash: hash,
            source_id: mockObjs.source.id,
            transfers: [transferRecord],
        } as EDMCachedFile;

        let replyData = {
            data: {
                updateFileTransfer: {
                    clientMutationId: mutation_id,
                    file_transfer: {
                        id: transferRecord.id,
                        // status:"new" as TransferStatus,
                        // status: "queued" as TransferStatus,
                        status: "uploading" as TransferStatus,
                        bytes_transferred: 999,
                    },
                }
            }
        };
        let mockBackend = prepareForGqlRequest(replyData, 11);

        let tq = TransferQueuePool.getQueue(transferRecord.destination_id);

        eventDebug(tq);

        tq.on('transfer_complete', (transfer_id, bytes, file_local_id) => {
            console.info(`Transfer ${transfer_id} (file_local_id: ${file_local_id}) of ${bytes} bytes completed`);
            done();
        });

        const cache = LocalCache.cache;

        cache.addFile(cachedFile)
            .then((putResult) => {
                console.log(`Added new file to cache: ${putResult.id}`);
            })
            .catch((error) => {
                console.error(`Cache put failed: ${error}`);
            });
    });
});
