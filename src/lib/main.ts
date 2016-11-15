/**
 * The main app logic
 *
 * Runs watchers, checkers, actions etc.
 */
/// <reference path="../types.d.ts" />

import * as fs from "fs";
import * as fetch from 'isomorphic-fetch';
global['fetch'] = fetch;

import gql from 'graphql-tag';
import {ObservableQuery} from "apollo-client";
import {CronJob} from 'cron';

import {EDMConnection} from "../edmKit/connection";
import {settings} from "./settings";
import {EDMFileWatcher} from "./file_watcher";

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
        // TODO: add single config query for "config" command
    }

    backendQuery(): ObservableQuery {
        const query = gql`
query MeQuery {
  currentClient {
    id
    attributes
      sources {
      id
      name
      destinations {
        base
        id
        host {
          id
        }
      }
    }
    hosts {
      id
      settings
      name
    }
  }
}        `;
        return this.client.watchQuery({
            query: query,
            variables: {},
        })
    }

    startConfigPolling() {
        const backendQuery = this.backendQuery();
        backendQuery.subscribe({
            next: (value) => {
                let clientInfo = value.data.currentClient;
                print_json(settings);
                print_json(clientInfo.sources);
                this.stop();
                settings.parseConfigObject({
                    sources: clientInfo.sources,
                    hosts: clientInfo.hosts});
                this.setUp();
                print_json(settings.conf);
            },
            error: (error) => {
                console.log("configpoll error " + error);
            },
            complete: () => {console.log("configpoll complete")}});
        backendQuery.startPolling(EDM.pingBackendInterval);
    }

    start() {
        this.startConfigPolling();
    }

    setUp() {
        const sources = settings.conf.sources;
        for (let id in settings.conf.sources) {
            const source = settings.conf.sources[id];
            switch(source.checkMethod) {
                case "cron":
                    this.startWatcher(source);
                    break;
                case "fsnotify":
                    break;
                case "manual":
                default:
                    break;
            }
        }
    }

    private startWatcher(source: any) {
        const watcher = new EDMFileWatcher(source.basepath);
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
    }

    private stop() {
        // stop/delete all watchers etc
        this.watchers = [];
        for (let i in this.tasks) {
            this.tasks[i].stop();
        }
        this.tasks = [];
    }
}
