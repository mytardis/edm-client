/**
 * Created by grischa on 16/8/16.
 *
 * Testing the Core Service class
 */

import {expect} from "chai";
import * as nock from "nock";
const fs = require('fs-extra');
const path = require('path');
import * as tmp from 'tmp';

import {settings} from "../lib/settings";
import {EDMConnection} from "../edmKit/connection";
import EDMFile from "../lib/file_tracking";
import {EDMQueries} from "../lib/queries";


describe("A mock EDM backend service", function () {
    let mutation_id = 'a44f9922-ebae-4864-ae46-678efa394e7d';
    let dataDir: string;
    let tmpFile: tmp.SynchrounousResult;
    let expectedReplyData: any;

    function getTmpDirPath(prefix='edm_test') {
        return tmp.dirSync({ prefix: prefix}).name;
    }

    function createNewTmpfile(basepath, prefix='tmp-'): tmp.SynchrounousResult {
        let tmpobj = tmp.fileSync({ dir: basepath, prefix: 'tmp-' });
        fs.outputFileSync(tmpobj.name, "some data\n", function (err) { console.log(err) });
        return tmpobj;
    }

    before(function () {
        tmp.setGracefulCleanup();

        dataDir = getTmpDirPath();
        // set up mock responder
        tmpFile = createNewTmpfile(dataDir);

        expectedReplyData = {
            "data": {
                "createOrUpdateFile": {
                    "file": {
                        "filepath": tmpFile.name,
                        "file_transfers": {
                            "edges": [
                                {
                                    "node": {
                                        "status": "new" as TransferStatus,
                                        "id": "_some_EnCoDed_ID_1",
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
                                        "id": "_some_EnCoDed_ID_2",
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
        };

        let edmBackend = nock('http://localhost:4000').log(console.log)
            .defaultReplyHeaders({
                'Content-Type': 'application/json; charset=utf-8'
            })
            .filteringRequestBody(function(body) {
                 return '*';
            })
            .post('/api/v1/graphql', '*')
            .delay(300)
            .reply(200, JSON.stringify(expectedReplyData));

        let initArgs = {
            dataDir: dataDir,
            serverSettings: {
                host: "localhost:4000",
                token: '_rand0m_JWT_t0ken'
            },
        };
        settings.parseInitArgs(initArgs);
    });

    afterEach("cleanup after each test", () => {
        nock.cleanAll();
    });

    after(function() {
        tmpFile.removeCallback();
    });


    it("should allow a file to be registered via GraphQL mutation", (done) => {

        let initArgs = {
            dataDir: dataDir,
            serverSettings: {
                host: "localhost:4000",
                token: '_rand0m_JWT_t0ken'
            },
        };
        settings.parseInitArgs(initArgs);

        const sourceBasePath = dataDir;
        let source = {
            id: "test_source",
            basepath: sourceBasePath,
        } as EDMSource;

        let file = new EDMFile(source, path.basename(tmpFile.name));
        let promise = EDMQueries.registerFileWithServer(file, 'test source', mutation_id)
            .then((value) => {
                expect(JSON.stringify(value)).to.equal(JSON.stringify(expectedReplyData));
                done();
            })
            .catch((error) => {
                console.error(`Request error: ${error}`)
            });
    });
});
