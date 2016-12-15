const uuidV4 = require('uuid/v4');
import gql from "graphql-tag/index";

import {MutationOptions} from "apollo-client";
import {ApolloQueryResult} from "apollo-client";

import {EDMConnection} from "../edmKit/connection";
import EDMFile from "./file_tracking";

export class EDMQueries {

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

    public static getOrCreateFileMutation(file: EDMFile,
                                  source_name: string,
                                  mutation_id?: string) : MutationOptions {

        // TODO: Not yet supported by backend, but this is what we'd use
        //       Query to determine if a file needs to be transferred.
        //       Also returns some file stats to store in local PouchDB.
        //       We don't return atime, ctime, birthtime, mode (or hash)
        //       since these aren't (yet) stored in the local cache.
        // const mutation = gql`
        // mutation getOrCreateFile($input: GetOrCreateFileInput!) {
        //  getOrCreateFile(input: $input) {
        //     clientMutationId
        //     file {
        //       filepath
        //       size
        //       mtime
        //       file_transfers {
        //           transfer_status
        //           bytes_transferred
        //           destination {
        //               host_id
        //           }
        //       }
        //     }
        //  }
        // }`;
        if (mutation_id == null) {
            mutation_id = uuidV4();
        }

        const mutation = gql`
        mutation getOrCreateFile($input: GetOrCreateFileInput!) {
         getOrCreateFile(input: $input) {
            clientMutationId
            file {
              filepath
            }
         }
        }`;
        const vars = {
            "input": {
                "clientMutationId": mutation_id,
                "source": {"name": source_name},
                "file": file.getGqlVariables()
            }
        };

        return <MutationOptions>{
                mutation: mutation,
                variables: vars
        };
    }

    public static registerFileWithServer(
                                  file: EDMFile,
                                  source_name: string,
                                  connection: EDMConnection,
                                  mutation_id?: string): Promise<ApolloQueryResult> {

        const mutation = EDMQueries.getOrCreateFileMutation(
            file,
            source_name,
            mutation_id);

        return connection.mutate(mutation);
            // .then((value) => {
            //     // console.log(JSON.stringify(value));
            //     return value;
            // });
    }
}