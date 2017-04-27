import * as loggly from './logging/loggly';

const bunyan = require('bunyan');
const PrettyStream = require('bunyan-prettystream');
const bunyanDebugStream = require('bunyan-debug-stream');

const prettyStdOut = new PrettyStream();
prettyStdOut.pipe(process.stdout);

// const prettyStdErr = new PrettyStream();
// prettyStdErr.pipe(process.stderr);

function get_stream() {
    if (process.env.EDM_LOG_LEVEL == 'debug') {
        return [
        {
            level: 'debug',
            type: 'raw',
            stream: prettyStdOut
        }]
    } else {
        return [{
            level: process.env.EDM_LOG_LEVEL || 'info',
            type: 'raw',
            stream: bunyanDebugStream({
                basepath: __dirname,
                forceColor: true,
                colors: {
                    'info': 'grey',
                    'error': ['red', 'bold']
                }
            })
        }
    ]
    }
}

export const log = bunyan.createLogger({
    name: 'edm-client',
    serializers: bunyanDebugStream.serializers,  // {err: bunyan.stdSerializers.err},
    streams: get_stream()

        // bunyan-debug-stream output is more compact than bunyan-prettystream

});

export function init_settings_dependent_loggers() {
    loggly.attach_settings_events();

    // Additional loggers that require settings to be populated prior
    // to initialization should be added here
}


/* An alternative - this is how we might setup winston,
 * if we weren't already using bunyan instead

const winston = require('winston');

//
// Configure CLI output on the default logger
//
winston.cli();

//
// Configure CLI on an instance of winston.Logger
//
export const log = new winston.Logger({
    transports: [
      new (winston.transports.Console)(
          {
              level: 'silly',
              json: false,
              timestamp: true,
              prettyPrint: true,
              colorize: true,
          }
      ),
      new winston.transports.File({
              name: 'edm-client.log',
              level: 'debug',
              timestamp: true,
              json: false,
              filename:'edm-client.log'
            }),
      // new winston.transports.File({
      //         name: 'edm-client-log.json',
      //         level: 'debug',
      //         timestamp: true
      //         json: true,
      //         filename:'edm-client-log.json'
      //       }),
    ],
    exitOnError: false
});
*/
