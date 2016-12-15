/**
 * Created by grischa on 16/8/16.
 *
 * Testing the Core Service class
 */

import {expect} from "chai";
import * as nock from "nock";
import * as tmp from 'tmp';

import {EDMConnection} from "../edmKit/connection";
import EDMFile from "../lib/file_tracking";
import {EDMQueries} from "../lib/queries";


describe("A mock EDM backend service", function () {
    let edmBackend;
    let mutation_id = 'a44f9922-ebae-4864-ae46-678efa394e7d';
    let tmpFile: tmp.SynchrounousResult;
    let expectedReplyData: any;

    before(function () {
        tmp.setGracefulCleanup();

        // set up mock responder
        tmpFile = tmp.fileSync({ prefix: 'tmp-' });

        expectedReplyData = {
            "data": {
                "getOrCreateFile": {
                    "clientMutationId": mutation_id,
                    "file": {
                        "filepath": tmpFile.name,
                        "file_transfers": [
                            { "transfer_status" : "complete",
                              "destination": {"host_id": "massive"}
                            },
                            {
                              "transfer_status" : "pending_upload",
                              "destination": {"host_id": "mytardis"}
                            },
                        ]
                    },
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
    });

    it("should allow a file to be registered via GraphQL mutation", function (done) {

        let connection = new EDMConnection('localhost:4000', '_rand0m_JWT_t0ken');
        let file = new EDMFile('/tmp/', tmpFile.name);
        let result = EDMQueries.registerFileWithServer(file, 'test source', connection, mutation_id)
            .then((value) => {
                expect(JSON.stringify(value)).to.equal(JSON.stringify(expectedReplyData));
            })
            .catch((error) => {
                console.error(`Request error: ${error}`)
            });
        done();
    });

    after(function() {
        tmpFile.removeCallback();
    })
});
