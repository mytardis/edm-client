const uuidV4 = require('uuid/v4');
import gql from "graphql-tag/index";
import * as _ from "lodash";

import {MutationOptions} from "apollo-client";
import {ApolloQueryResult} from "apollo-client";
import {ObservableQuery} from "apollo-client";

import {client} from "../edmKit/connection";
import EDMFile from "./file_tracking";


export class EDMQueries {

    public static configQuery(variables = {})
    : ObservableQuery<any> {
        const query = gql`query MeQuery {
                              currentClient {
                                id
                                attributes
                                sources {
                                  id
                                  name
                                  settings
                                  basepath
                                  checkMethod
                                  cronTime
                                  destinations {
                                    id
                                    base
                                    hostId
                                  }
                                }
                                hosts {
                                  id
                                  transferMethod
                                  settings
                                  name
                                }
                              }
                            }`;

        return client().watchQuery({
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
                      fileTransfers(first: 999) {
                        edges {
                          node {
                            id
                            status
                            bytesTransferred
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
            input: {
                clientMutationId: mutation_id,
                source: {name: source_name},
                file: EDMQueries.getEDMFileGqlVariables(file),
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
    public static unpackFileTransferResponse(transfers_paginated: GQLEdgeList)
    : EDMCachedFileTransfer[] {
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
        let variables = _.pick(file.stats, ['size', 'mtime', 'atime', 'ctime',
            'birthtime', 'mode']);
        variables['filepath'] = file.filepath;
        return variables;
    }

    public static registerFileWithServer(
                                  file: EDMFile,
                                  source_name: string,
                                  mutation_id?: string)
    : Promise<ApolloQueryResult<any>> {

        const mutation = EDMQueries.createOrUpdateFileMutation(
            file,
            source_name,
            mutation_id);

        return client().mutate(mutation);
    }

    public static updateFileTransfer(
           transfer: EDMCachedFileTransfer)
    : Promise<ApolloQueryResult<any>> {

        const query = gql`
        mutation updateFileTransfer($input: UpdateFileTransferInput!) {
         updateFileTransfer(input: $input) {
          clientMutationId
          fileTransfer {
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
                    input: {
                        clientMutationId: uuidV4(),
                        id: transfer.id,
                        fileTransfer: xfer,
                    }
                }
        } as MutationOptions;

        return client().mutate(mutation);
    }

    public static checkoutFileTransfers(destination_id: string, amount: number)
    : Promise<ApolloQueryResult<any>> {
        const query = gql`
        mutation checkoutFileTransfers($input: CheckoutFileTransfersInput!) {
          checkoutFileTransfers(input: $input) {
            fileTransfers
          }
        }
        `;
        const mutation = {
            mutation: query,
            variables: {
                input: {
                    clientMutationId: uuidV4(),
                    destination_id: destination_id,
                    amount: amount,
                }
            }
        };
        return client().mutate(mutation);
    }

    public static getPendingFileTransfers(
        destination_id: string, amount: number)
    : ObservableQuery<any> {

        const query = gql`
            query getPendingFileTransfers(
                   $destId: String, $amount: Int, $status: String) {
                currentClient {
                    destination(id: $destId) {
                        base
                        id
                        host {
                            id
                            name
                            transferMethod
                        }
                        fileTransfers(first: $amount, status: $status) {
                            edges {
                                node {
                                    file {
                                        id
                                        filepath
                                        source {
                                            id
                                            basepath
                                        }
                                    }
                                    id
                                    status
                                }
                            }
                        }
                    }
                }
            }
        `;

        return client().watchQuery({
            query: query,
            variables: {
                destId: destination_id,
                amount: amount,
                status: "new",
            },
        });
    }
}
