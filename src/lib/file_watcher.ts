var fs = require("fs-extra");

export class EDMFileWatcher {
    basedir: string;
    walker: any;
    files: Array<string>;
    
    constructor(basedir: string) {
        this.basedir = basedir;
        this.files = [];
        this.walker = fs.walk(this.basedir);
        this.walker.on('readable', () => {
            this.handleFile(this.walker.read());
        });
        this.walker.on('end', () => this.endWalk());
    }

    handleFile(file) {
        if (file === null) {
            console.log('file is null');
            return;
        }
        console.log(file.path);
        this.files.push(file.path);
    }

    endWalk() {
        console.log(this.files.length);
    }

}