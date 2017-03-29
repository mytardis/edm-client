
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
    maxAsyncTransfersPerDestination?: number;
    dataDir?: string;
    ignoreServerConfig?: boolean;
    concurrency?: number;
    logging?: any;
}

interface Settings {
    appSettings?: AppSettings;
    //hosts?: any;
    hosts?: EDMDestinationHost[];
    sections?: any;
    serverSettings?: ServerSettings;
    sources?: EDMSource[];
}

// type FileStatus =
//     "unknown"
//     | "new"
//     | "modified"
//     | "verifying"
//     | "pending_upload"
//     | "uploading"
//     | "interrupted"
//     | "uploaded";

interface EDMCachedFile {
    _id: string;         // absolute file path (usually)
    _rev?: string;       // PouchDB revision
    remote_id?: string;  // ID assigned by backend server
    source_id: string;
    mtime: number;
    size: number;
    // status: FileStatus;
    hash: string;
    transfers: EDMCachedFileTransfer[];
}

type TransferStatus = "new" | "queued" | "uploading" | "complete" | "error";

interface EDMCachedFileTransfer {
    id: string;
    // file_local_id?: string; // _id in PouchDB 'files' database
    destination_id?: string;
    status?: TransferStatus;
    bytes_transferred?: number;
}

type FilesystemMonitorMethod =
    "cron"
    | "fsnotify"
    | "manual";

interface EDMSource {
    id: string;
    name: string;
    basepath: string;
    checkMethod: FilesystemMonitorMethod;
    cronTime?: string;
    destinations?: EDMDestination[];
}

interface EDMDestination {
    id: string;
    host_id: string;
    location: string;
    exclusions?: string[];
}

interface EDMDestinationHost {
    id: string;
    transfer_method: TransferMethodName;
    settings?: any;
}

type TransferMethodName = "dummy" | "local" | "scp2";

interface TransferMethodOptions {
    destBasePath?: string;
    sourceBasePath?: string;
    method_opts?: any;
    // Allows any property accessed like options['somePropName']. Dangerous.
    // [propName: string]: any;
}

interface GQLEdgeList {
    edges: any[];
}

declare module "scp2" {

    interface ScpOptions {
        port?: number;
        host?: string;
        username?: string;
        password?: string;
        paths?: string;
    }

    interface attrs {
        size: number;
        uid: number;
        gid: number;
        mode: number | string;
        atime: number;
        mtime: number;
    }

    interface writeOptions {
        destination: string;
        content: string;
        attrs: attrs;
        source: string;
    }

    export class Client {
        constructor(options: ScpOptions);
        sftp(callback: (err: string, sftp: Client) => void);
        close(): void;
        mkdir(dir: string, attrs: attrs, callback: (err: string) => void);
        write(options: writeOptions, callback: (err: string) => void);
        upload(src: string, destination: string, callback: (err: string) => void);
        download(src: string, destination: string, callback: (err: string) => void);
        on(eventName: string, callback: () => void);
    }

    export interface client {
        defaults(options: ScpOptions);
        scp(fileName: string, options: ScpOptions | string, errCallback?: (err: string) => void);
        scp(fileName: string, options: ScpOptions | string, glob: string, errCallback?: (err: string) => void);
    }
}
