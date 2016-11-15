/// <reference path="../types.d.ts" />

import * as fs from "fs";
import * as path from "path";

var ospath = require("ospath");


export class EDMSettings {
    static app_name: string = "Express Data Mover";
    static default_config_file_name: string = "edm-settings.json";

    conf: Settings = {};

    constructor() {
        this.conf.appSettings = {};
        this.conf.serverSettings = {};
    }

    parseConfigObject(conf: Object) {
        // const sections = [
        //     "sources", "endpoints",
        //     "serverSettings", "appSettings"];
        for (let section in ["appSettings", "serverSettings"]) {
            for (let entry in conf[section]) {
                this.conf[section][entry] = conf[section][entry];
            }
        }
        this.conf.sources = [];
        for (let source of conf["sources"]) {
            this.conf.sources.push(source);
        }
        this.conf.hosts = {};
        for (let host of conf["hosts"]) {
            this.conf.hosts[host.id] = host;
        }
    }

    readConfigFile(configFilePath: string) {
        let configuration: Object = {};
        if (fs.existsSync(configFilePath)) {
            try {
                let configFileBuffer = fs.readFileSync(configFilePath);
                configuration = JSON.parse(configFileBuffer.toString());
                this.parseConfigObject(configuration);
            } catch (error) {
                console.error(
                    `error: ${error} with config file at ${configFilePath}`);
                process.exit(1);
            }
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

    parseInitArgs(initArgs: EDMInitArgs) {
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
            this.readConfigFile(
                path.join(initArgs.dataDir || ospath.data(EDMSettings.app_name),
                          EDMSettings.default_config_file_name));
        }

        // then override some settings if specified
        this.conf.appSettings.dataDir = initArgs.dataDir ||
            this.conf.appSettings.dataDir || ospath.data(EDMSettings.app_name);
        this.ensureDataDirExists();

        this.conf.serverSettings.host = initArgs.serverAddress ||
            this.conf.serverSettings.host || "localhost:4000";

        this.conf.serverSettings.token = initArgs.token;
    }

    private ensureDataDirExists() {
        if (! fs.existsSync(this.conf.appSettings.dataDir)) {
            fs.mkdirSync(this.conf.appSettings.dataDir, '700');
        }
    }
}

export const settings = new EDMSettings();


// examples:
// "sources": [
//     {
//         "basepath": "/tmp/test-1",
//         "checkMethod": "watch, check, manual",
//         "checkInterval": 5,
//         "destinations": [
//             {
//                 "endpoint": "massive",
//                 "location": "/home/test/test-1",
//                 "exclusions": ["*~"]
//             },
//             {
//                 "endpoint": "store.monash",
//                 "location": "test-1-bucket"
//             }
//         ]
//     }
// ]
//
// "hosts": {
//     "massive": {
//         "transfer_method": "scp2",
//         "settings": {
//             "host": "massive.monash.edu",
//             "port": 22,
//             "username": "edm-tester",
//             "privateKey": "AAAABBBCCCCEEDSEFAEFAEFAEFwefaewf982y3fh9"
//         }
//     },
//     "mytardis": {
//         "transfer_method": "S3",
//         "settings": {
//             "EC2_ACCESS_KEY": "ABC123",
//             "EC2_SECRET_KEY": "CDE456"
//         }
//     }
// }
//
// "serverSettings": {
//     "host": "localhost:4000",
//     "connection": "poll, socket",
//     "interval": 5
// }
//
// "appSettings": {}
