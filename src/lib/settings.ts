/// <reference path="../types.d.ts" />

import * as fs from "fs";
import * as path from "path";

var ospath = require("ospath");


export class EDMSettings {
    static app_name: string = "Express Data Mover";
    static default_config_file_name: string = "edm-settings.json";

    conf: Settings = {};

    constructor() {
        this.conf.appSettings = <AppSettings>{};
        this.conf.serverSettings = {};
    }

    parseConfigObject(parsedConf: Object) {
        // const sections = [
        //     "sources", "endpoints",
        //     "serverSettings", "appSettings"];
        for (let section of ['appSettings', 'serverSettings']) {
            for (let entry in parsedConf[section]) {
                this.conf[section][entry] = parsedConf[section][entry];
            }
        }

        if ('sources' in parsedConf) {
            if (this.conf.sources == null) this.conf.sources = [];
            for (let source of parsedConf['sources']) {
                this.conf.sources.push(source);
            }
        }

        if ('hosts' in parsedConf) {
            if (this.conf.hosts == null) this.conf.hosts = {};
            let hosts = parsedConf['hosts'];
            for (let host in hosts) {
                let value = hosts[host];
                this.conf.hosts[host] = value;
            }
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
        if (initArgs.configFilePath != null)
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

        this.conf.appSettings.ignoreServerConfig = initArgs.ignoreServerConfig;

        // then override some settings if specified
        this.conf.appSettings.dataDir = initArgs.dataDir ||
            this.conf.appSettings.dataDir || ospath.data(EDMSettings.app_name);
        this.ensureDataDirExists();

        this.conf.serverSettings.host = initArgs.serverAddress ||
            this.conf.serverSettings.host || "localhost:4000";

        if (initArgs.token != null) {
            this.conf.serverSettings.token = initArgs.token;
        }
    }

    private ensureDataDirExists() {
        if (! fs.existsSync(this.conf.appSettings.dataDir)) {
            fs.mkdirSync(this.conf.appSettings.dataDir, '700');
        }
    }
}

export const settings = new EDMSettings();
