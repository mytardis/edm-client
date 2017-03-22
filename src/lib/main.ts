/**
 * The main app logic
 *
 * Runs watchers, checkers, actions etc.
 */
/// <reference path="../types.d.ts" />

import * as fetch from 'isomorphic-fetch';
global['fetch'] = fetch;

import gql from 'graphql-tag';
import {ObservableQuery} from "apollo-client";
import {CronJob} from 'cron';

import {EDMConnection} from "../edmKit/connection";
import {settings} from "./settings";
import {EDMFileWatcher} from "./file_watcher";
import {EDMQueries} from "./queries";

function print_json(data) {
    console.log(JSON.stringify(data, null, 2))
}

export class EDM {
    static pingBackendInterval = 10000;

    client: EDMConnection;
    private tasks: any;
    private watchers: any;

    constructor() {
        this.client = new EDMConnection(
            settings.conf.serverSettings.host,
            settings.conf.serverSettings.token);
    }

    startConfigPolling() {
        const backendQuery = EDMQueries.configQuery({}, this.client);
        backendQuery.subscribe({
            next: (value) => {
                let clientInfo = value.data.currentClient;
                print_json(settings);
                print_json(clientInfo.sources);
                this.stop();
                if (!settings.conf.appSettings.ignoreServerConfig) {
                    settings.setConfig({
                        sources: clientInfo.sources,
                        hosts: clientInfo.hosts} as Settings);
                }
                this.setUp();
                print_json(settings.conf);
            },
            error: (error) => {
                console.log("configpoll error " + error);
                // TODO: restart startConfigPolling after a total_time
            },
            complete: () => {console.log("configpoll complete")}});
        backendQuery.startPolling(EDM.pingBackendInterval);
    }

    start() {
        this.startConfigPolling();
    }

    setUp() {
        for (let source of settings.conf.sources) {
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
    }

    private startWatcher(source: any) {
        const watcher = new EDMFileWatcher(source);
        this.watchers.push(watcher);
        const job = new CronJob({
            cronTime: source.cronTime,
            context: this,
            onTick: () => {
                try {
                    watcher.walk(job);
                } catch (e) {
                    job.stop();
                    console.error(`Error in watcher on ${source.basepath}`);
                }
            },
            start: true,
        });
        this.tasks.push(job);
        console.log(`Starting file watcher on ${source.basepath}`)
    }

    private stop() {
        // stop/delete all watchers etc
        this.watchers = [];
        if (this.tasks != null) {
            for (let task of this.tasks) {
                task.stop();
            }
        }
        this.tasks = [];
    }
}
