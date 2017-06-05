import {settings} from "./settings";

export default class FileTransferJob {
    //_id: string;
    //method: TransferMethodName;
    //settings: any;

    constructor(
        readonly fileTransferId: string,
        // readonly source: EDMSource,
        readonly sourceRelPath: string,
        // readonly destination: EDMDestination,
        readonly destRelPath: string,
        destMetadata?: any

        // readonly source_id: string,
        // readonly destination_id: string,
        // readonly source_filepath: string
    ) { }

    // public getDestinationHost(): EDMDestinationHost {
    //     let host_id = settings.getDestination(this.destination_id).hostId;
    //     return settings.getHost(host_id);
    // }
}
