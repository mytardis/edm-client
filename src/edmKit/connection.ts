/**
 * Created by grischa on 12/8/16.
 *
 * Get a connection to the Backend to run GraphQL query
 *
 */
/// <reference path="../types.d.ts" />
import * as fetch from 'isomorphic-fetch';
global['fetch'] = fetch;

import {createNetworkInterface, default as ApolloClient} from "apollo-client";
import {NetworkInterfaceOptions} from "apollo-client/transport/networkInterface";
import {settings} from "../lib/settings";
import {isNullOrUndefined} from "util";

// require('request').debug = true;

export class EDMConnection extends ApolloClient {
    private static _client: EDMConnection;
    private host: string;
    private token: string;

    constructor(host: string, token: string) {
        const graphqlEndpoint = `http://${host}/api/v1/graphql`;
        const networkInterface = createNetworkInterface(
            <NetworkInterfaceOptions>{uri: graphqlEndpoint});
        networkInterface.use([{
            applyMiddleware(req, next) {
                if (!req.options.headers) {
                    req.options.headers = {};
                }
                req.options.headers["authorization"] = `Bearer ${token}`;
                // TODO: Set proxy for requests
                //req.options.host = systemProxy.host;
                //req.options.port = systemProxy.port;
                next();
            }
        }]);

        super({networkInterface: networkInterface});
        this.host = host;
        this.token = token;
    }

    public static client() {
        const host = settings.conf.serverSettings.host;
        const token = settings.conf.serverSettings.token;

        if (true || isNullOrUndefined(EDMConnection._client) ||
            EDMConnection._client.host != host ||
            EDMConnection._client.token != token) {
            EDMConnection._client = new EDMConnection(host, token);
        }
        return EDMConnection._client;
    }
}

export const client = EDMConnection.client;
