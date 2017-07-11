/**
 * The main app logic
 *
 * Runs watchers, checkers, actions etc.
 */
/// <reference path="../types.d.ts" />
import {ObservableQuery} from "apollo-client";
import {CronJob} from 'cron';
import {globalTracer, Span, Tags} from 'opentracing';

import {settings} from "./settings";
import {EDMFileWatcher} from "./file_watcher";
import {EDMQueries} from "./queries";

import * as logger from "./logger";
import {TransferQueuePool} from "./transfer_queue";
const log = logger.log.child({'tags': ['main']});

export class EDM {
    static pingBackendInterval = 10000;

    // client: EDMConnection;
    private tasks: any;
    private watchers: any;
    private transfersSubs: Map<string, ObservableQuery<any>>;
    span: Span;

    constructor() {
        // this.span = tracer.startSpan('EDM_class');
        // this.span.setTag(Tags.SAMPLING_PRIORITY, 2);
        // this.span.log({'event': 'EDM class constructed'});
        // this.client = new EDMConnection(
        //     settings.conf.serverSettings.host,
        //     settings.conf.serverSettings.token);
    }

    startConfigPolling() {
        // this.span.log({'event': 'set config polling'});
        const backendQuery = EDMQueries.configQuery({});
        backendQuery.subscribe({
            next: (value) => {
                // this.span.setTag(Tags.SPAN_KIND_MESSAGING_CONSUMER, true);
                // this.span.log({'event': 'new config'});
                let clientInfo = value.data.currentClient;
                this.stop();
                if (!settings.conf.appSettings.ignoreServerConfig) {
                    settings.setConfig({
                        sources: clientInfo.sources,
                        hosts: clientInfo.hosts} as Settings);
                }
                this.setUp();
                log.debug({settings: settings, currentClient: clientInfo},
                          "Received settings.");
                // this.span.finish();
            },
            error: (error) => {
                log.error({'err': error}, "configpoll error " + error);
                // TODO: restart startConfigPolling after a total_time
                // this.span.finish();
            },
            complete: () => {
                log.info("configpoll complete");
                // this.span.finish();
            }});
        backendQuery.startPolling(EDM.pingBackendInterval);
    }

    start() {
        this.startConfigPolling();
    }

    setUp() {
        for (let source of settings.conf.sources) {
            log.debug(source, 'setting up source');
            switch(source.checkMethod) {
                case "cron":
                    this.startWatcher(source);
                    break;
                case "fsnotify":
                    break;
                case "manual":
                    break;
                default:
                    break;
            }
        }
        this.startTransferPolling();
    }

    private startWatcher(source: any) {
        const watcher = new EDMFileWatcher(source);
        this.watchers.push(watcher);
        log.debug(source, 'About to start cronjob for this source');
        const job = new CronJob({
            cronTime: source.cronTime,
            context: this,
            onTick: () => {
                try {
                    watcher.walk(job);
                } catch (e) {
                    job.stop();
                    log.error({'err': e }, `Error in watcher on ${source.basepath}`);
                }
            },
            start: true,
        });
        this.tasks.push(job);
        log.info({}, `Starting file watcher on ${source.basepath}`)
    }

    private stop() {
        this.stopTransferPolling();
        // stop/delete all watchers etc
        this.watchers = [];
        if (this.tasks != null) {
            for (let task of this.tasks) {
                log.debug({}, 'stopping a job');
                task.stop();
            }
        }
        this.tasks = [];
    }

    private startTransferPolling() {
        // TODO: Stop any active transfers that have been cancelled by the
        // backend server (eg in response to the file stats changing,
        // destination deletion, etc)
        this.transfersSubs = new Map();  // later can be changed to GraphQL
        // subscriptions
        for (let destination of settings.getDestinations()) {
            this.transfersSubs[destination.id] = EDMQueries.getPendingFileTransfers(
                destination.id, 10);
            let query = this.transfersSubs[destination.id];
            query.subscribe({
                next: (value) => {
                    // new transfers, start/trigger queue
                    let transfers = value.data.currentClient.fileTransfers;
                    log.debug({destination: destination,
                        transfers: transfers}, "Received transfers.");
                    let queue = TransferQueuePool.getQueue(destination.id);
                    log.debug({'destination_id': queue.destination_id},
                        "activating queue");
                    queue.activate();
                    log.debug({}, "queue activated");
                },
                error: (error) => {
                    log.error({'err': error}, "transfers poll error " + error);
                },
                complete: () => {
                    log.info("transfer polling complete")
                }
            });
            query.startPolling(EDM.pingBackendInterval);
        }
    }

    private stopTransferPolling() {
        if (this.transfersSubs != undefined) {
            for (let [_dest_id, sub] of this.transfersSubs) {
                sub.stopPolling();
            }
        }
    }
}
