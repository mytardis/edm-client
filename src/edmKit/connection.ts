/**
 * Created by grischa on 12/8/16.
 *
 * Get a connection to the Backend to run GraphQL query
 *
 */
/// <reference path="../types.d.ts" />
import {createNetworkInterface, default as ApolloClient} from "apollo-client";


// import * as fs from "fs";
// import { NetworkInterface, Request } from 'apollo-client/networkInterface';
// import { GraphQLResult } from 'graphql';
// var graphqlTools = require('graphql-tools');
// let mockServer = graphqlTools.mockServer;
//

// /**
//  * Mock networking
//  */
// export class MockServerNetworkInterface implements NetworkInterface {
//     mockServer: any;
//
//     constructor (schema: String, mocks = {}, preserveResolvers = false) {
//         this.mockServer = mockServer(schema, mocks, preserveResolvers);
//     }
//
//     public query(request: Request): Promise<GraphQLResult> {
//         let query = request.query.definitions[0]["name"].loc.source.body;
//         let variables = request.variables;
//         return this.mockServer.query(query, variables) as Promise<GraphQLResult>;
//     }
// }


export class EDMConnection extends ApolloClient {

    constructor(conf: EDMSettings) {
        const graphqlEndpoint = 'http://' + conf.serverSettings.host + '/api/v1/graphql';
        const networkInterface = createNetworkInterface(graphqlEndpoint);
        networkInterface.use([{
            applyMiddleware(req, next) {
                if (!req.options.headers) {
                    req.options.headers = {};  // Create the header object if needed.
                }
                req.options.headers["authorization"] = "Bearer " +
                    conf.serverSettings.token;
                // req.options.headers.authorization = "Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJVc2VyOjEiLCJleHAiOjE0NzY5NDc3MDksImlhdCI6MTQ3NDM1NTcwOSwiaXNzIjoiZWRtLWJhY2tlbmQiLCJqdGkiOiIwZWNhMGFiMi1lYWNhLTRjMDktODZkMi0wY2Y0ZTQ0ZDAyNGQiLCJwZW0iOnt9LCJzdWIiOiJVc2VyOjEiLCJ0eXAiOiJ0b2tlbiJ9.Bcv8fF1SWm1Z7QQPjPRpBZdtphVJ8vxIx8s1wX_GWuYeEbnKpf2Txg466takYM3OjrIr5Xa3q-L4kUEJVq9_3A";
                next();
            }
        }]);

        super({networkInterface: networkInterface});

        // see below for a local mock server configuration approach
        // and above for mockservernetworkinterface

        // const schema = fs.readFileSync('../schema.graphql').toString();
        //
        // let networkInterface: any;
        // if (this.opts.conf.serverSettings.host === 'serverless') {
        //     // let mockSchema = {
        //     //     RootQueryType: () => ({
        //     //         clients: {}
        //     //     }),
        //     //     InstrumentGroup: () => ({
        //     //         configurationBlob: JSON.stringify(this.opts.serverlessSettings),
        //     //     })
        //     // }
        //     // networkInterface = new MockServerNetworkInterface(
        //     //     schema, mockSchema);
        // } else {
        // }
        // this.client = new ApolloClient();
        //
        //
        // super(opts.serverAddress, {
        //     headers: {
        //         Authorization: 'Bearer ' + opts.token,
        //     },
        // });
    }
}
