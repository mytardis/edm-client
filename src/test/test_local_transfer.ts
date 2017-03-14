/**
 * Testing local transfer method
 */

let chai = require('chai');
chai.use(require('chai-fs'));
let expect = chai.expect;

import * as fs from 'fs-extra';

import {LocalTransfer} from "../lib/transfer_methods/local_transfer";

describe("Local transfer method ", function() {

    after(function() {
        fs.removeSync('./test-sourcedir');
        fs.removeSync('./test-destination');
    });

    it('should copy a local file', (done) => {
        fs.mkdirsSync('./test-sourcedir');
        fs.writeFileSync('./test-sourcedir/testfile1.txt', 'testcontent123');
        let options = <TransferMethodOptions>{
            destBasePath: './test-destination',
        };
        let localTransfer = new LocalTransfer(options);
        localTransfer.transfer(
            './test-sourcedir/testfile1.txt',
            './test-sourcedir',
            '123',
            '1234'
        );
        localTransfer.on('complete', (id, _size, local_id) => {
            expect('./test-destination/testfile1.txt').to.be.a.file().and.equal(
                './test-sourcedir/testfile1.txt');
            expect(id).to.equal('123');
            expect(local_id).to.equal('1234');
            fs.removeSync('./test-sourcedir/testfile1.txt');
            fs.removeSync('./test-destination/testfile1.txt');
            done();
        });
    });
    it('should error if file exists', (done) => {
        after(function() {
            fs.removeSync('./test-sourcedir/testfile2.txt');
            fs.removeSync('./test-destination/testfile2.txt');
        });

        fs.mkdirsSync('./test-sourcedir');
        fs.writeFileSync('./test-sourcedir/testfile2.txt', 'testcontent123');
        fs.mkdirsSync('./test-destination');
        fs.writeFileSync('./test-destination/testfile2.txt', 'original123');
        let options = <TransferMethodOptions>{
            destBasePath: './test-destination',
        };
        let localTransfer = new LocalTransfer(options);
        localTransfer.transfer(
            './test-sourcedir/testfile2.txt',
            './test-sourcedir',
            '123',
            '1234'
        );
        localTransfer.on('fail', (id, _null, local_id, error) => {
            expect(error.toString()).to.contain(
                'test-destination/testfile2.txt already exists');
            expect('./test-destination/testfile2.txt').to.be.a.file()
                .with.content('original123');
            expect(id).to.equal('123');
            expect(local_id).to.equal('1234');
            done();
        });
        localTransfer.on('complete', (id, _size, local_id) => {
            expect('./test-destination/testfile2.txt').to.be.a.file()
                .with.content('original123');
            expect(id).to.equal('123');
            expect(local_id).to.equal('1234');
            done();
        });
    });
});
