/**
 * The main app logic
 *
 * Runs watchers, checkers, actions etc.
 */
/// <reference path="../types.d.ts" />

import * as fs from "fs";
var path = require("path-extra");
import * as fetch from 'isomorphic-fetch';
global['fetch'] = fetch;

import gql from 'graphql-tag';

import {EDMConnection} from "../edmKit/connection";
import {ObservableQuery} from "apollo-client";


export class EDM {
    static app_name: string = "Express Data Mover";
    static default_config_file_name: string = "edm-settings.json";
    static pingBackendInterval = 10000;

    conf: EDMSettings = {};
    client: EDMConnection;

    constructor(initArgs?: EDMInitArgs) {
        // initialise serverSettings
        this.conf.serverSettings = <ServerSettings>{};
        // first load configuration file
        if (typeof initArgs.configFilePath !== "undefined")
            if (fs.existsSync(initArgs.configFilePath))
                // use specified config file
                this.readConfigFile(path.normalize(initArgs.configFilePath));
            else {
                console.log("bad config file path: " + initArgs.configFilePath);
                process.exit(1);
            }
        else {
            // use default config file
            const dataDir = path.datadir(EDM.app_name);
            this.readConfigFile(
                path.join(dataDir, EDM.default_config_file_name));
        }
        // then override some settings if specified
        this.conf.serverSettings.host = initArgs.serverAddress ||
            this.conf.serverSettings.host || "localhost:4000";
        this.conf.serverSettings.token = initArgs.token;

        this.client = new EDMConnection(this.conf);
    }

    parseConfigObject(conf: Object) {
        // const sections = [
        //     "sources", "endpoints",
        //     "serverSettings", "appSettings"];
        for (let section in conf) {
            for (let entry in conf[section]) {
                this.conf[section][entry] = conf[section][entry];
            }
        }
    }

    readConfigFile(configFilePath: string) {
        let configuration: Object = {};
        if (fs.existsSync(configFilePath)) {
            let configFileBuffer = fs.readFileSync(configFilePath);
            configuration = JSON.parse(configFileBuffer.toString());
            this.parseConfigObject(configuration);
        }
    }

    writeConfigFile(configFilePath: string) {
        const dataDir = path.dirname(configFilePath);
        if (! fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, '700');
        }
        fs.writeFileSync(configFilePath,
                         JSON.stringify(JSON.stringify(this.conf), null, 2));
    }

    backendQuery(): ObservableQuery {
        const query = gql`
query MeQuery {
  currentUser {
    id
  }
  instrumentGroups(first: 10) {
    edges {
      node {
        id
        configurationBlob
      }
    }
  }
}        `;
        return this.client.watchQuery({
            query: query,
            variables: {},
        })
    }

    startConfigPolling() {
        const backendQuery = this.backendQuery();
        backendQuery.subscribe({
            next: (value) => {
                console.log(value);
            },
            error: (error) => {
                console.log("configpoll error " + error);
            },
            complete: () => {console.log("configpoll complete")}});
        backendQuery.startPolling(EDM.pingBackendInterval);
            // console.log(data);
            // const configString = data.instrumentGroups.edges[0].node.configurationBlob;
            // const config = JSON.parse(configString);
            // this.opts.parseConfigObject(config);
            // this.opts.writeConfigFile();
            // console.log("updated configuration");
            // this.loading = loading;
        // });
    }

    checkDirs() {
        console.log("checking directories");
        // this.opts.checkDirs.forEach((dir) => {
        //     console.log(dir);
        //     transferDir(dir, destination, transfer-settings);
        // });
    }

    watch(dir: string) {
        console.log('Setting up watcher for ' + dir);
        fs.watch(dir, {'recursive': true},
                 (event: string, filename: string) => {
                     console.log(event);
                     console.log(filename);
                 });
    }

    start() {
        this.startConfigPolling();
        // if (typeof this.checkDirsInterval !== undefined)
        //     console.log("checking dirs every " + this.checkDirsInterval /1000 +
        //                 " seconds");
        //     setInterval(() => {this.checkDirs()}, this.checkDirsInterval);
    }
}
