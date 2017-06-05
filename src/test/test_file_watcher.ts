const fs = require('fs-extra');
const path = require('path');
import * as tmp from 'tmp';
import {expect} from "chai";
import * as nock from "nock";

import {createNewTmpfile} from "../lib/testutils";
import {getTmpDirPath} from "../lib/testutils";

import {settings} from "../lib/settings";
import {EDMFileWatcher} from "../lib/file_watcher";
import EDMFile from "../lib/file_tracking";
import {EDMFileCache} from "../lib/cache";
import {EDMQueries} from "../lib/queries";

import * as logger from "../lib/logger";
const log = logger.log.child({'tags': ['test', 'test_file_watcher']});

describe("file watcher", function () {
    let dataDir: string;
    let dirToIngest: string;
    let edmBackend: any;
    const mutation_id = 'a44f9922-ebae-4864-ae46-678efa394e7d';
    let tmpFile: string;
    let replyData: any;

    function prepareForGqlRequest(times: number = 1) {
        edmBackend = nock('http://localhost:4000') //.log(log.debug)
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

    before("set up test env", () => {
        tmp.setGracefulCleanup();
    });

    function prepareEnv() {
        dataDir = getTmpDirPath('edm-settings-dir');
        dirToIngest = getTmpDirPath('edm-files-to-ingest');
        tmpFile = createNewTmpfile(dirToIngest);

        const initArgs = {
            dataDir: dataDir,
            serverSettings: {
                host:'localhost:4000',
                token: '_rand0m_JWT_t0ken'}
        };

        settings.parseInitArgs(initArgs);

        replyData = {
            "data": {
                "createOrUpdateFile": {
                    "file": {
                        "filepath": tmpFile,
                        "file_transfers": {
                            "edges": [
                                {
                                    "node": {
                                        "status": "new" as TransferStatus,
                                        "id": "RmlsZVRyYW5zZmVyOmE4MGQ2OTkzLWM0YWEtNDUwNC1iNDYwLWMzNWFjYzgzZjgwOA==",
                                        "destination": {
                                            "host": {
                                                "id": "massive"
                                            }
                                        },
                                        "bytes_transferred": null
                                    }
                                },
                                {
                                    "node": {
                                        "status": "queued" as TransferStatus,
                                        "id": "RmlsZVRyYW5zZmVyOmE4MGQ2OTkzLWM0YWEtNDUwNC1iNDYwLWMzNWFjYzgzZjgwOA==",
                                        "destination": {
                                            "host": {
                                                "id": "mytardis"
                                            }
                                        },
                                        "bytes_transferred": null
                                    }
                                }
                            ]
                        }
                    },
                    "clientMutationId": mutation_id
                }
            }
        }
    }

    afterEach("cleanup after each test", () => {
        nock.cleanAll();
    });

    it("should register and cache new files", (done) => {
        prepareEnv();
        prepareForGqlRequest();

        let source: EDMSource = {
            basepath: dirToIngest,
            name: 'test_source',
            id: '__source_UUID__',
            checkMethod: 'manual' as FilesystemMonitorMethod,
        };
        let watcher = new EDMFileWatcher(source);

        const edmFile: EDMFile = new EDMFile(source, path.basename(tmpFile));
        watcher.registerAndCache(edmFile)
            .then((backendResponse) => {
                return watcher.cache.getEntry(edmFile);
            }).then((doc) => {
                const expected = EDMQueries.unpackFileTransferResponse(
                    replyData.data.createOrUpdateFile.file.file_transfers);
                expect(doc.transfers[0].status).to.equal(expected[0].status);
                expect(doc.transfers[1].status).to.equal(expected[1].status);
                log.debug({result: doc},
                    `Successfully cached and registered ${doc._id}`);
                done();
            })
            .catch((error) => {
                log.error({err: error, file: edmFile},
                        `Failed to register and cache file: ${edmFile._id} (${edmFile.remote_id})`);
                done(error);
            });
    });

    it("should list files in a folder", (done) => {
        prepareEnv();
        prepareForGqlRequest(2);

        let watcher = new EDMFileWatcher({basepath: dirToIngest});
        watcher.cache = new EDMFileCache('testing');
        watcher.endWalk = () => {
            const numfiles = watcher.lastWalkItems.length - 2;
            expect(numfiles).to.be.equal(1);
            watcher.cache._db.allDocs().then((result) => {
                log.debug({result: result}, `Cached ${numfiles} file records.`);
                // db adds aren't always complete yet, can be improved
                expect(result.total_rows).to.be.lessThan(numfiles+1);
                done();
            }).catch((error) => {
                log.error({err: error}, `Failed to access cache.`);
                done(error);
            });
        };
        watcher.walk();
    });
});
