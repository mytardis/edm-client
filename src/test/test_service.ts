/**
 * Created by grischa on 16/8/16.
 *
 * Testing the Core Service class
 */

import {expect} from "chai";
import * as nock from "nock";
import gql from 'graphql-tag';

import {EDM} from "../lib/main";

describe("The service, ", function () {
    before(function () {
        // set up mock responder
        // let edmBackend = nock('http://localhost:4000').log(console.log)
        //     .defaultReplyHeaders({
        //         'Content-Type': 'application/json'
        //     })
        //      .filteringRequestBody(function(body) {
        //          return '*';
        //      })
        //     .post('/api/v1/graphql', '*')
        //     .reply(200, '{"MeQuery": "123"}');
    });
});
