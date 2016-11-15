
interface EDMInitArgs {
    serverAddress?: string,
    token?: string,
    configFilePath?: string,
    dataDir?: string,
}

interface ServerSettings {
    host?: string;
    connection?: string;
    interval?: number;
    token?: string;
}

interface AppSettings {
    dataDir?: string;
}

interface Settings {
    appSettings?: AppSettings;
    hosts?: any;
    sections?: any;
    serverSettings?: ServerSettings;
    sources?: any;
}

interface EDMCachedFile {
    _id: string;  // file path
    mtime: number;
    size: number;
    status: string;
}
