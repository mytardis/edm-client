const fs = require('fs-extra');
const path = require('path');
import * as tmp from 'tmp';
import SynchrounousResult = tmp.SynchrounousResult;

import FileTransferJob from "../lib/file_transfer_job";
import {settings} from "../lib/settings";

import * as logger from "../lib/logger";
const log = logger.log.child({'tags': ['test', 'testutils']});

export function getTmpDirPath(prefix='edm_test') {
    return tmp.dirSync({prefix: prefix}).name;
}

export function createNewTmpfile(basepath, data='some data\n', prefix='tmp-'): string {
    let tmpobj = tmp.fileSync({ dir: basepath, prefix: prefix });
    try {
        fs.outputFileSync(tmpobj.name, data);
    } catch (error) {
        log.error({err: error}, `Error writing file: ${tmpobj.name}`);
    }
    return tmpobj.name;
}

export function createNewTmplink(basepath, link_dest, prefix='tmp-') {
    let tmplink = tmp.tmpNameSync({dir: basepath, prefix: prefix});
    try {
        fs.ensureSymlinkSync(link_dest, tmplink);
    } catch (error) {
        log.error({err: error, link_dest: link_dest, tmplink: tmplink},
            `Error creating link: ${tmplink}`);
    }
    return tmplink;
}

export function randomString() {
    return Math.random().toString(36).substring(7);
}

export function setupSettings(dataDir = null) {
    if (dataDir == null) dataDir = getTmpDirPath();

    let mockObjs: any = {};

    mockObjs.host = {
        id: randomString(),
        transferMethod: "dummy",
        settings: {}
    } as EDMDestinationHost;

    mockObjs.destination = {
        id: randomString(),
        hostId: mockObjs.host.id,
        base: getTmpDirPath('edmtest_destination_'),
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

    mockObjs.transfer_job = new FileTransferJob(
        randomString(),
        mockObjs.source.id,
        mockObjs.destination.id,
        randomString()
    );

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
