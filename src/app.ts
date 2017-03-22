import * as path from "path";

import * as yargs from "yargs";

import {EDM} from "./lib/main";
import {settings} from "./lib/settings";

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
 * - onReadable service
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
    .command('onReadable', 'Start system service')
    .command('stop', 'Stop system service')
    .command('upload', 'Upload specific file or directory')
    .command('config', 'Show current configuration')
    .check(function(args: yargs.Argv, opts: any): yargs.Argv {
        if (['service', 'onReadable', 'stop', 'upload', 'config'].indexOf(
            args['_'][0]) === -1)
            throw Error("Please provide valid command");
        return args;
    })
    .option('c', {
        alias: 'config-file',
        demand: false,
        describe: 'Location of your configuration file',
        type: 'string'
    })
    .option('n', {
        alias: 'ignore-server-config',
        demand: false,
        describe: "Don't allow server to override clientside configuration",
        type: 'boolean'
    })
    .option('d', {
        alias: 'data-dir',
        demand: false,
        describe: 'Data directory',
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
        describe: 'Optionally, specify access token',
        type: 'string'
    })
    .help('h')
    .alias('h', 'help')
    .epilog('EDM moves your data faster - go to URL for more information')
    ;
let argv = args.argv;
let command: string = argv._[0];

let initArgs = <EDMInitArgs>{};

function argIsSet(attr: string) : boolean {
    return (argv.hasOwnProperty(attr) && (argv[attr] != null));
}

function getArg(attr: string,
                applyFn: Function | undefined = undefined,
                defaultValue: any = undefined) : any {
    if (argIsSet(attr)) {
        defaultValue = argv[attr];
    }
    if (applyFn && defaultValue != null) {
        return applyFn(defaultValue);
    } else {
        return defaultValue;
    }
}

initArgs.configFilePath = getArg("c", path.normalize);
initArgs.ignoreServerConfig = getArg("n");
initArgs.dataDir = getArg("d", path.normalize);
initArgs.serverAddress = getArg("s");
initArgs.token = getArg("t");

settings.parseInitArgs(initArgs);

let app = new EDM();

switch (command) {
    case "upload":
        console.log("Uploading files");
        break;
    case "config":
        console.log(JSON.stringify(settings.conf, null, 2));
        break;
    case "service":
        console.log("starting system service");
        break;
    case "onReadable":
    default:
        app.start();
        break;
}
