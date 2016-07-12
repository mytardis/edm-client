
interface EDMInitArgs {
    serverAddress?: string,
    token?: string,
    configFilePath?: string,
}

interface ServerSettings {
    host?: string;
    connection?: string;
    interval?: number;
    token?: string;
}

interface EDMSettings {
    appSettings?: Object;
    endpoints?: Object;
    sections?: Object;
    serverSettings?: ServerSettings;
    sources?: Object;
}
