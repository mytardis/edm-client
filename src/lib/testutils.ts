const fs = require('fs-extra');
const path = require('path');
import * as tmp from 'tmp';
import SynchrounousResult = tmp.SynchrounousResult;

import {settings} from "../lib/settings";

export function getTmpDirPath(prefix='edm_test') {
    return tmp.dirSync({prefix: prefix}).name;
}

export function createNewTmpfile(basepath, data='some data\n', prefix='tmp-'): string {
    let tmpobj = tmp.fileSync({ dir: basepath, prefix: prefix });
    fs.outputFileSync(tmpobj.name, data, function (err) { console.log(err) });
    return tmpobj.name;
}

export function randomString() {
    return Math.random().toString(36).substring(7);
}

export function setupSettings(dataDir = null) {
    if (dataDir == null) dataDir = getTmpDirPath();

    let mockObjs: any = {};

    mockObjs.host = {
        id: randomString(),
        transfer_method: "dummy",
        settings: {}
    } as EDMDestinationHost;

    mockObjs.destination = {
        id: randomString(),
        host_id: mockObjs.host.id,
        location: getTmpDirPath('edmtest_destination_'),
        exclusions: []
    } as EDMDestination;

    mockObjs.source = {
        id: randomString(),
        name: "testing source",
        basepath: getTmpDirPath('edmtest_source_'),
        checkMethod: "cron",
        cronTime: "* */30 * * * *",
        destinations: [mockObjs.destination],
    } as EDMSource;

    mockObjs.transfer_job = {
        file_local_id: randomString(),
        source_id: mockObjs.source.id,
        destination_id: mockObjs.destination.id,
        file_transfer_id: randomString(),
    } as FileTransferJob;

    let initArgs = {
        dataDir: dataDir,
        serverSettings: {
            host: "localhost:4000",
            token: '_rand0m_JWT_t0ken'
        },
    };

    let config = {
        appSettings: {
            "dataDir": dataDir,
            "ignoreServerConfig": true
        },
        sources: [mockObjs.source],
        hosts: [mockObjs.host],
    } as Settings;

    settings.parseInitArgs(initArgs);
    settings.setConfig(config);

    return mockObjs;
}
