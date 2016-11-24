
interface EDMInitArgs {
    serverAddress?: string,
    token?: string,
    configFilePath?: string,
    dataDir?: string,
    ignoreServerConfig?: boolean;
}

interface ServerSettings {
    host?: string;
    connection?: string;
    interval?: number;
    token?: string;
}

interface AppSettings {
    dataDir?: string;
    ignoreServerConfig?: boolean;
}

interface Settings {
    appSettings?: AppSettings;
    hosts?: any;
    sections?: any;
    serverSettings?: ServerSettings;
    sources?: any;
}

type FileStatus =
    "unknown"
    | "new"
    | "modified"
    | "verifying"
    | "uploading"
    | "interrupted"
    | "uploaded";

interface EDMCachedFile {
    _id: string;   // file path
    _rev?: string; // PouchDB revision
    mtime: number;
    size: number;
    status: FileStatus;
    hash: string;
}
