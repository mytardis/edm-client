/// <reference path="../types.d.ts" />

import * as events from 'events';
import * as fs from "fs-extra";
import * as path from "path";

import * as _ from "lodash";

var ospath = require("ospath");

import * as logger from "./logger";
const log = logger.log.child({'tags': ['settings']});

export class EDMSettings extends events.EventEmitter {
    static app_name: string = "Express Data Mover";
    static default_config_file_name: string = "edm-settings.json";

    conf: Settings = {};

    constructor() {
        super();
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
                log.error({err: error},
                   `Error reading/parsing config file: ${configFilePath}`);
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
                log.error({path: initArgs.configFilePath},
                    `Config file does not exist: ${initArgs.configFilePath}`);
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

        // We call this here since we need to wait until settings have been
        // created before allowing any loggers to attach to the settings 'ready' event.
        logger.init_settings_dependent_loggers();

        this.emit('ready');
    }

    private ensureDataDirExists() {
        if (! fs.existsSync(this.conf.appSettings.dataDir)) {
            fs.mkdirpSync(this.conf.appSettings.dataDir, '700');
        }
    }

    public getDestination(destination_id: string, getHost?: boolean)
    : EDMDestination {
        let destination = null;
        let dest_source_id = null;
        for (let source of this.conf.sources) {
            for (let dest of source.destinations) {
                if (dest.id === destination_id) {
                    destination = <EDMDestination>{
                        id: dest.id,
                        hostId: dest.hostId,
                        base: dest.base,
                        sourceId: source.id,
                        exclusions: dest.exclusions,
                    };
                    break;
                }
            }
            if (destination != null) break;
        }

        if (destination == null) throw Error(`Destination not found: ${destination_id}`);
        if (getHost) {
            destination.host = this.getHost(destination.hostId);
        }
        return destination;
    }

    public getSource(source_id: string): EDMSource {
        let source: EDMSource = _.find(this.conf.sources, {"id": source_id });
        if (source == null) throw Error(`Source not found: ${source_id}`);
        return source;
    }

    public getHost(host_id: string): EDMDestinationHost {
        let host: EDMDestinationHost = _.find(this.conf.hosts, {"id": host_id });
        if (host == null) throw Error(`Host not found: ${host_id}`);
        return host;
    }

    getDestinations(): Iterable<EDMDestination> {
        let destinations = new Set();
        for (let source of this.conf.sources) {
            for (let dest of source.destinations) {
                destinations.add(dest);
            }
        }
        return destinations.values();
    }
}

export const settings = new EDMSettings();
