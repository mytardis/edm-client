/**
 * Testing local transfer method
 */

let chai = require('chai');
chai.use(require('chai-fs'));
let expect = chai.expect;

import {randomString} from "../lib/testutils";
import {createNewTmpfile} from "../lib/testutils";
import {getTmpDirPath} from "../lib/testutils";

import * as fs from 'fs-extra';
import * as tmp from 'tmp';
const path = require('path');

import {LocalTransfer} from "../lib/transfer_methods/local_transfer";

describe("Local transfer method ", function() {

    before(function() {
        tmp.setGracefulCleanup();
    });

    it('should copy a local file', (done) => {
        let source_dir = getTmpDirPath();
        let source_file = createNewTmpfile(source_dir, '16_bytes_content');
        let destination_base_path = getTmpDirPath();
        let destination_rel_path = path.basename(source_file);
        let options = <TransferMethodOptions>{
            destBasePath: destination_base_path,
        };
        let localTransfer = new LocalTransfer(options);
        localTransfer.transfer(
            source_file,
            destination_rel_path,
            'a_file_transfer_id',
            'a_file_local_id_123'
        );
        localTransfer.on('complete', (id, _size, local_id) => {
            expect(path.join(destination_base_path, destination_rel_path)).to.be.a.file().and.equal(source_file);
            expect(id).to.equal('a_file_transfer_id');
            expect(local_id).to.equal('a_file_local_id_123');
            expect(_size).to.equal(16);
            done();
        });
    });

    it('should error if file exists at destination', (done) => {
        let source_dir = getTmpDirPath();
        let source_file = createNewTmpfile(source_dir, '16_bytes_content');
        let destination_base_path = getTmpDirPath();
        let destination_rel_path = path.basename(source_file);
        let destination_file_full_path = path.join(destination_base_path, destination_rel_path)

        fs.mkdirsSync(destination_base_path);
        fs.writeFileSync(destination_file_full_path, '16_bytes_content');

        after(function() {
            fs.removeSync(destination_file_full_path);
        });

        let options = <TransferMethodOptions>{
            destBasePath: destination_base_path,
        };
        let localTransfer = new LocalTransfer(options);
        localTransfer.transfer(
            source_file,
            destination_rel_path,
            'a_file_transfer_id',
            'a_file_local_id_123'
        );

        localTransfer.on('fail', (id, _null, local_id, error) => {
            expect(error.toString()).to.contain(
                `${destination_file_full_path} already exists`);
            expect(destination_file_full_path).to.be.a.file()
                .with.content('16_bytes_content');
            expect(id).to.equal('a_file_transfer_id');
            expect(local_id).to.equal('a_file_local_id_123');
            done();
        });
        localTransfer.on('complete', (id, _size, local_id) => {
            expect(destination_file_full_path).to.be.a.file()
                .with.content('16_bytes_content');
            expect(id).to.equal('a_file_transfer_id');
            expect(local_id).to.equal('a_file_local_id_123');
            done();
        });
    });
});
