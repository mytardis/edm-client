
import {expect} from "chai";
import * as nock from "nock";
import {randomString} from "../lib/testutils";
import {createNewTmpfile} from "../lib/testutils";
import {getTmpDirPath} from "../lib/testutils";
import {setupSettings} from "../lib/testutils";

const fs = require('fs-extra');
const path = require('path');
import * as tmp from 'tmp';

import EDMFile from "../lib/file_tracking";
import FileTransferJob from "../lib/file_transfer_job";
import {DummyTransfer} from "../lib/transfer_methods/dummy_transfer";
import {TransferQueuePool} from "../lib/transfer_queue";
import {LocalCache} from "../lib/cache";

import * as logger from "../lib/logger";
const log = logger.log.child({'tags': ['test', 'test_transfer_queue_async']});

let eventDebug = require('event-debug');

describe("The transfer _queue ", function () {

    const mutation_id = 'a44f9922-ebae-4864-ae46-678efa394e7d';
    let mockObjs: any;
    const dataDir = getTmpDirPath();

    function prepareForGqlRequest(replyData: any, times: number = 1): nock.Scope {
        return nock('http://localhost:4000') //.log(log.debug)
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

    before(function () {
        tmp.setGracefulCleanup();
    });

    beforeEach("setup settings", () => {
        mockObjs = setupSettings();
    });

    afterEach("cleanup after each test", () => {
        nock.cleanAll();
    });

    it("should be able to write many transfer jobs to the _queue, " +
        "receive 'transfer_complete' event when done", function (done) {
            this.timeout(10000);

        const number_of_file_transfers = 10;
        // this.timeout(1000 + (number_of_file_transfers * new DummyTransfer().total_time));

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

        tq.on('drain', () => {
            log.debug({event: 'drain', queue_id: tq.destination_id},
                `Queue ${tq.destination_id} -> 'drain' event`);
        });

        tq.on('empty', () => {
            log.debug({event: 'empty', queue_id: tq.destination_id},
                `Queue ${tq.destination_id} -> 'empty' event`);
        });

        tq.on('transfer_complete', (id, bytes) => {
            log.info({
                event: 'transfer_complete',
                queue_id: tq.destination_id,
                file_transfer_id: id,
                bytes_transferred: bytes,
            }, `Blaaaaa test: Transfer ${id} of file on queue ` +
                `${tq.destination_id} completed (${bytes} bytes)`);
            completed_transfers++;
            log.info(completed_transfers, "completed this many transfers")
            if (completed_transfers == number_of_file_transfers) {
                // expect(mockBackend.isDone()).to.be.true;
                done();
            }
        });
        let jobs: FileTransferJob[] = [];
        for (let n=0; n < number_of_file_transfers; n++) {
            let job = new FileTransferJob(
                randomString(),
                randomString(),
                randomString(),
            );
            log.debug(job, "submitting this job");
            jobs.push(job);
            let saturated = tq.queueTask(job);
            expect(saturated).to.be.false;
        }
    });

    it("should add a file to the transfer _queue when it has pending file transfers",
        function (done) {

            this.timeout(5000);

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
            // const hash = EDMFile.computeHash(_id, size, now);
            // let cachedFile = {
            //     _id: _id,
            //     mtime: now,
            //     size: size,
            //     hash: hash,
            //     source_id: mockObjs.source.id,
            //     transfers: [transferRecord],
            // } as EDMCachedFile;

            let replyData = {
                data: {
                    currentClient: {
                            destination: {
                                base: mockObjs.destination.base,
                                id: mockObjs.destination.id,
                                host: {
                                    id: 'host_id',
                                    name: 'test host',
                                    transferMethod: 'dummy',
                                    __typename: 'EDMHost',
                                },
                                fileTransfers: {
                                    edges: [
                                        {
                                            node: {
                                                id: transferRecord.id,
                                                file: {
                                                    id: 'a_file_id',
                                                    filepath: 'bla',
                                                    source: {
                                                        id: mockObjs.source.id,
                                                        basepath: mockObjs.source.basepath,
                                                        __typename: 'EDMSource',
                                                    },
                                                    // status:"new" as TransferStatus,
                                                    // status: "queued" as TransferStatus,
                                                    __typename: 'EDMFile',
                                                },
                                                status: "new" as TransferStatus,
                                                __typename: 'Node'
                                            },
                                            __typename: 'FileTransfer'
                                        }
                                    ],
                                    __typename: 'list'
                                },
                                __typename: 'EDMDestination'
                            },
                        __typename: 'Client'
                    }
                }
            };
            log.error(replyData, "preparing to mock with this data");
            let mockBackend = prepareForGqlRequest(replyData, 11);
            mockBackend.persist();
            let tq = TransferQueuePool.getQueue(transferRecord.destination_id);

            eventDebug(tq);

            tq.on('transfer_complete', (transfer_id, bytes) => {
                log.debug({
                    event: 'transfer_complete',
                    queue_id: tq.destination_id,
                    file_transfer_id: transfer_id,
                    bytes_transferred: bytes,
                }, `Transfer ${transfer_id} of` +
                    ` ${bytes} bytes completed`);
                expect(bytes).to.equal(size);
                done();
            });
            tq.queueTransfers();
        });
});
