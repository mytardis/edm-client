/**
 * Created by grischa on 6/10/16.
 * Modifications, Andrew Perry Nov 2016 - Mar 2017.
 */

import * as fs from "fs";
import * as path from "path";

export default class EDMFile {
    readonly _id: string;
    // UUID from the server. This could be used as a PouchDB secondary index
    remote_id: string;

    private _stats: fs.Stats;
    public get stats() {
        return this._stats;
    }
    public set stats(newStats: fs.Stats) {
        this._stats = newStats;
        this._updateHash();
    }

    _hash: string;
    public get hash(): string {
        return this._hash;
    }

    constructor(readonly source: EDMSource, readonly filepath: string) {
        this._id = this._generateID();
        this.updateStats();
    }

    public static generateID(basepath: string, filepath: string): string {
        return `file://${path.join(basepath, filepath)}`;
    }

    private _generateID(): string {
        return EDMFile.generateID(this.source.basepath, this.filepath);
    }

    private _updateHash() {
        this._hash = this._computeHash();
    }

    private _computeHash(): string {
        return EDMFile.computeHash(this._id, this.stats.size, this.stats.mtime.getTime());
    }

    public static computeHash(id: string, size: number, mtime: number): string {
        const format = 'psm';
        const hash = `${id}-${size}-${mtime}`;
        return `urn:${format}:${hash}`;
    }

    updateStats() {
        this.stats = fs.lstatSync(
            path.resolve(this.source.basepath, this.filepath));
    }

    getPouchDocument(): EDMCachedFile {
        return {
            _id: this._id,
            remote_id: this.remote_id,
            source_id: this.source.id,
            mtime: this.stats.mtime.getTime(),
            size: this.stats.size,
            hash: this.hash,
        } as EDMCachedFile;
    }
}
