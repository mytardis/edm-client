/**
 * Created by grischa on 12/8/16.
 *
 * Get a connection to the Backend to run GraphQL query
 *
 */
/// <reference path="../types.d.ts" />
import {createNetworkInterface, default as ApolloClient} from "apollo-client";
import {NetworkInterfaceOptions} from "apollo-client/transport/networkInterface";
import {settings} from "../lib/settings";

// require('request').debug = true;

export class EDMConnection extends ApolloClient {

    public static _global_client: EDMConnection = null;
    public static get global_client(): EDMConnection {
        if (EDMConnection._global_client == null) {
            EDMConnection._global_client = new EDMConnection(
                settings.conf.serverSettings.host,
                settings.conf.serverSettings.token);
        }
        return EDMConnection._global_client;
    }

    constructor(host: string, token: string) {
        const graphqlEndpoint = `http://${host}/api/v1/graphql`;
        const networkInterface = createNetworkInterface(<NetworkInterfaceOptions>{uri: graphqlEndpoint});
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
    }
}
