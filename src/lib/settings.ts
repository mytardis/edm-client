/// <reference path="../types.d.ts" />

import * as fs from "fs";
import * as path from "path";

import * as _ from "lodash";

var ospath = require("ospath");


export class EDMSettings {
    static app_name: string = "Express Data Mover";
    static default_config_file_name: string = "edm-settings.json";

    conf: Settings = {};

    constructor() {
        this.conf.appSettings = <AppSettings>{};
        this.conf.serverSettings = {};
    }

    setConfig(parsedConf: Settings) {
        // const sections = [
        //     "sources", "endpoints",
        //     "serverSettings", "appSettings"];
        for (let section of ['appSettings', 'serverSettings']) {
            for (let entry in parsedConf[section]) {
                this.conf[section][entry] = parsedConf[section][entry];
            }
        }

        this.conf.sources = _.get(parsedConf, 'sources', []);
        this.conf.hosts = _.get(parsedConf, 'hosts', []);
    }

    readConfigFile(configFilePath: string) {
        let configuration: Object = {};
        if (fs.existsSync(configFilePath)) {
            try {
                let configFileBuffer = fs.readFileSync(configFilePath);
                configuration = JSON.parse(configFileBuffer.toString());
                this.setConfig(configuration as Settings);
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
            if (fs.existsSync(initArgs.configFilePath)) {
                // use specified config file
                this.readConfigFile(path.normalize(initArgs.configFilePath));
            }
            else {
                console.log("bad config file path: " + initArgs.configFilePath);
                process.exit(1);
            }
        else {
            // use default config file
            this.readConfigFile(
                path.join(initArgs.dataDir || path.join(ospath.data(), EDMSettings.app_name),
                          EDMSettings.default_config_file_name));
        }

        this.conf.appSettings.ignoreServerConfig = initArgs.ignoreServerConfig;

        // then override some settings if specified
        this.conf.appSettings.dataDir = initArgs.dataDir ||
            this.conf.appSettings.dataDir || path.join(ospath.data(), EDMSettings.app_name);
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

    public getDestination(destination_id: string): EDMDestination {
        let destination = null;
        for (let source of this.conf.sources) {
            for (let dest of source.destinations) {
                if (dest.id === destination_id) {
                    destination = dest;
                    break;
                }
            }
            if (destination != null) break;
        }

        if (destination == null) throw Error(`Destination not found: ${destination_id}`);
        return destination;
    }

    public getSource(source_id: string): EDMSource {
        let source: EDMSource =  _.find(this.conf.sources, {"id": source_id });
        if (source == null) throw Error(`Source not found: ${source_id}`);
        return source;
    }

    public getHost(host_id: string): EDMDestinationHost {
        let host: EDMDestinationHost =  _.find(this.conf.hosts, {"id": host_id });
        if (host == null) throw Error(`Host not found: ${host_id}`);
        return host;
    }
}

export const settings = new EDMSettings();
