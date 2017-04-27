import {settings} from "./settings";

export default class FileTransferJob {
    //_id: string;
    //method: TransferMethodName;
    //settings: any;

    constructor(readonly file_transfer_id: string,
                readonly source_id: string,
                readonly destination_id: string,
                readonly file_local_id: string) { }

    public getDestinationHost(): EDMDestinationHost {
        let host_id = settings.getDestination(this.destination_id).hostId;
        let destinationHost = settings.getHost(host_id);
        return destinationHost;
    }
}
