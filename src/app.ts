import * as yargs from "yargs";
var path = require("path-extra");
import {EDM} from "./lib/main";

/**
 * begin fancy load message and timeout
 */
function startup() {
    process.stderr.write("Starting EDM client. Please wait ");
    let loaded:boolean = false,
        loadTimeout:number = 2;

    for (let i:number = 0; i < loadTimeout; i++) {
        setTimeout(function ():void {
            process.stderr.write(".");
        }, i * 1000);
    }

    setTimeout(function ():void {
        if (!loaded) {
            console.log('problems starting up');
            process.exit(1);
        }
    }, loadTimeout * 1000);
    loaded = true;
}
/**
 * end fancy load message and timeout
 * TODO: use `loaded` variable for actual timeouts on issues
 */

/**
 * Command line options
 *
 * Actions:
 * informational
 * - show help
 * - show version
 * - show configuration
 *
 * background service
 * - start service
 * - install service
 * - stop service
 * - send command to service
 *
 * perform immediate task (no service)
 * - upload files
 * - check connectivity
 *
 *
 * Options:
 * connectivity:
 * - host
 * - port
 * - proxy
 *
 * configuration:
 * - config file location
 *
 * security:
 * - id
 * - credentials
 */

let args: yargs.Argv = yargs.usage("Usage: edm-client [options] action")
    .command('run', 'Run foreground service according to existing settings')
    .command('start', 'Start system service')
    .command('stop', 'Stop system service')
    .command('upload', 'Upload specific file or directory')
    .command('config', 'Show current configuration')
    .check(function(args: yargs.Argv, opts: any): yargs.Argv {
        if (['run', 'start', 'stop', 'upload', 'config'].indexOf(
            args['_'][0]) === -1)
            throw "Please provide valid command";
        return args;
    })
    .option('c', {
        alias: 'config-file',
        demand: false,
        describe: 'Optionally, specify location of your configuration file',
        type: 'string'
    })
    .option('s', {
        alias: 'server-address',
        demand: false,
        describe: 'Optionally, specify server address',
        type: 'string'
    })
    .option('t', {
        alias: 'token',
        demand: false,
        describe: 'Optionally, specify acces token',
        type: 'string'
    })
    .help('h')
    .alias('h', 'help')
    .epilog('EDM moves your data faster - go to URL for more information')
    ;
let argv = args.argv;
let command: string = argv._[0];

let initArgs = <EDMInitArgs>{};
if (argv.hasOwnProperty("c") && typeof(argv["c"]) !== "undefined") {
    initArgs.configFilePath = path.normalize(argv["c"]);
}
if (argv.hasOwnProperty("s") && typeof(argv["s"]) !== "undefined") {
    initArgs.serverAddress = path.normalize(argv["s"]);
}
if (argv.hasOwnProperty("t") && typeof(argv["t"]) !== "undefined") {
    initArgs.token = path.normalize(argv["t"]);
}

let app = new EDM(initArgs);

switch (command) {
    case "upload":
        console.log("Uploading files");
        break;
    case "start":
        console.log("starting system service");
        break;
    case "config":
        console.log(JSON.stringify(app.conf, null, 2));
        break;
    case "run":
    default:
        startup();
        app.start();
        break;
}
