/**
 * Testing local transfer method
 */

let chai = require('chai');
chai.use(require('chai-fs'));
let expect = chai.expect;

import {createNewTmpfile, createNewTmplink} from "../lib/testutils";
import {getTmpDirPath} from "../lib/testutils";

import * as _ from "lodash";
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
            'a_file_local_id_123',
            _.noop
        );
        localTransfer.on('complete', (id, _size, local_id) => {
            expect(path.join(destination_base_path,
                destination_rel_path)).to.be.a.file().and.equal(source_file);
            expect(id).to.equal('a_file_transfer_id');
            expect(local_id).to.equal('a_file_local_id_123');
            expect(_size).to.equal(16);
            done();
        });
    });

    it('should recreate a symlink', (done) => {
        // this.skip;  // might not need this test? TODO: add link transfer and test
        let source_dir = getTmpDirPath();
        let source_file = createNewTmpfile(source_dir, '16_bytes_content');
        let source_link = createNewTmplink(source_dir, source_file);
        let tmpfile_for_dangling_link = createNewTmpfile(
            source_dir, '16_bytes_content');
        let dangling_source_link = createNewTmplink(
            source_dir, tmpfile_for_dangling_link);
        fs.removeSync(tmpfile_for_dangling_link);
        let destination_base_path = getTmpDirPath();
        let destination_rel_path = path.basename(source_file);
        let destination_link_rel_path = path.basename(source_link);
        let options = <TransferMethodOptions>{
            destBasePath: destination_base_path,
        };
        let localTransfer = new LocalTransfer(options);
        localTransfer.transfer(
            source_link,
            destination_link_rel_path,
            'a_file_transfer_id2',
            'a_file_local_id_1234',
            _.noop
        );
        localTransfer.on('complete', (id, _size, local_id) => {
            // expect(path.join(destination_base_path,
            //     destination_rel_path)).to.be.a.file().and.equal(source_file);
            let link_loc = path.join(destination_base_path,
                destination_link_rel_path);
            expect(link_loc).to.be.a.file();
            expect(fs.lstatSync(link_loc).isSymbolicLink()).to.be.true;
            expect(fs.readlinkSync(link_loc)).to.equal(source_file);
            expect(id).to.equal('a_file_transfer_id2');
            expect(local_id).to.equal('a_file_local_id_1234');
            expect(_size).to.equal(100);
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
            'a_file_local_id_123',
            _.noop
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
