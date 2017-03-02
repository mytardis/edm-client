const uuidV4 = require('uuid/v4');
import gql from "graphql-tag/index";
import * as _ from "lodash";

import {MutationOptions} from "apollo-client";
import {ApolloQueryResult} from "apollo-client";
import {ObservableQuery} from "apollo-client";

import {settings} from "./settings";
import {EDMConnection} from "../edmKit/connection";
import EDMFile from "./file_tracking";

export class EDMQueries {

    private static _global_client: EDMConnection;

    private static get global_client(): EDMConnection {
        if (EDMQueries._global_client == null) {
            EDMQueries._global_client = new EDMConnection(
                settings.conf.serverSettings.host,
                settings.conf.serverSettings.token);
        }
        return EDMQueries._global_client;
    }

    public static configQuery(variables = {}, connection?: EDMConnection): ObservableQuery<any> {
        if (connection == null) connection = EDMQueries.global_client;

        const query = gql`query MeQuery {
                              currentClient {
                                id
                                attributes
                                  sources {
                                  id
                                  name
                                  settings
                                  destinations {
                                    id
                                    base
                                    host { id }
                                  }
                                }
                                hosts {
                                  id
                                  settings
                                  name
                                }
                              }
                            }`;

        return connection.watchQuery({
            query: query,
            variables: variables,
        });
    }

    public static checkFileQuery(file: EDMFile, source_name: string) {
        return gql`query checkFile {
                      currentClient {
                        sources(id: "${source_name}") {
                          file(id: "${file._id}") {
                            status
                            stats
                          }
                        }
                      }
                    }`;
    }

    public static createOrUpdateFileMutation(
        file: EDMFile,
        source_name: string,
        mutation_id?: string) : MutationOptions {

        if (mutation_id == null) {
            mutation_id = uuidV4();
        }

        const mutation = gql`
            mutation createOrUpdateFile($input: CreateOrUpdateFileInput!) {
                createOrUpdateFile(input: $input) {
                 clientMutationId
                    file {
                      filepath
                      file_transfers(first: 999) {
                        edges {
                          node {
                            id
                            status
                            bytes_transferred
                            destination {
                              id
                              host { id }
                            }
                          }
                        }
                      }
                    }
                  }
              }`;
        const vars = {
            "input": {
                "clientMutationId": mutation_id,
                "source": {"name": source_name},
                "file": EDMQueries.getEDMFileGqlVariables(file),
            }
        };

        return {
            mutation: mutation,
            variables: vars
        } as MutationOptions;
    }

    /**
     * Pagination in our GQL response means we need to unpack the list of
     * EDMCachedFileTransfer objects from an array edges = [node.node,
     * node.node, ...];
     * @param transfers_paginated
     * @private
     */
    public static unpackFileTransferResponse(transfers_paginated: GQLEdgeList): EDMCachedFileTransfer[] {
        if (transfers_paginated == null || transfers_paginated.edges == null) {
            return [];
        }

        let transfers = [];
        for (let node of transfers_paginated.edges) {
            let xfer = node.node;
            xfer.destination_id = xfer.destination.id;
            delete xfer.destination;
            transfers.push(xfer as EDMCachedFileTransfer);
        }
        return transfers as EDMCachedFileTransfer[];
    }

    public static getEDMFileGqlVariables(file: EDMFile) {
        let variables = _.pick(file.stats, ['size', 'mtime', 'atime', 'ctime', 'birthtime', 'mode']);
        variables['filepath'] = file.filepath;
        return variables;
    }

    public static registerFileWithServer(
                                  file: EDMFile,
                                  source_name: string,
                                  mutation_id?: string,
                                  connection?: EDMConnection): Promise<ApolloQueryResult<any>> {

        if (connection == null) connection = EDMQueries.global_client;

        const mutation = EDMQueries.createOrUpdateFileMutation(
            file,
            source_name,
            mutation_id);

        return connection.mutate(mutation);
    }

    public static updateFileTransfer(transfer: EDMCachedFileTransfer,
                                     connection?: EDMConnection): Promise<ApolloQueryResult<any>> {

        if (connection == null) connection = EDMQueries.global_client;

        const query = gql`
        mutation updateFileTransfer($input: UpdateFileTransferInput!) {
         updateFileTransfer(input: $input) {
          clientMutationId
          file_transfer {
              id
              status
              bytes_transferred
          }
         }
        }
        `;
        let xfer = _.omitBy({
            bytes_transferred: transfer.bytes_transferred,
            status: transfer.status
        }, _.isNil);

        const mutation = {
            mutation: query,
            variables: {
                id: transfer.id,
                file_transfer: xfer,
            }
        } as MutationOptions;

        return connection.mutate(mutation);
    }
}
