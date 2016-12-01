/**
 * Created by grischa on 12/8/16.
 *
 * Get a connection to the Backend to run GraphQL query
 *
 */
/// <reference path="../types.d.ts" />
import {createNetworkInterface, default as ApolloClient} from "apollo-client";
import {NetworkInterfaceOptions} from "apollo-client/transport/networkInterface";

export class EDMConnection extends ApolloClient {

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
