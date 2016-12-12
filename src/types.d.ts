
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
    concurrency?: number;
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
    | "pending_upload"
    | "uploading"
    | "interrupted"
    | "uploaded";

interface EDMCachedFile {
    _id: string;       // file path
    _rev?: string;     // PouchDB revision
    mtime: number;
    size: number;
    // status: FileStatus;
    hash: string;
    transfers: EDMFileTransfer[];
}

type TransferStatus = "pending_upload" | "uploading" | "complete" | "error";

interface EDMFileTransfer {
    destination: { host_id: string };
    transfer_status: TransferStatus;
    bytes_transferred: number;
}

interface FileTransfer {

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
