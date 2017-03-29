import * as _ from "lodash";
import * as logger from "../logger";
import {settings} from "../settings";

const Bunyan2Loggly = require('bunyan-loggly');
/*
 This is an example of attaching an additional logging stream.
 Since it relies on values from settings we need to subscribe to the
 settings 'ready' event to wait until the required values become available
 before initializing.
 */
export function attach_settings_events() {
    settings.once('ready', () => {
        const logglyConfig = {
            token: _.get(settings.conf.appSettings, 'logging.loggly.token', null),
            subdomain: _.get(settings.conf.appSettings, 'logging.loggly.subdomain', null),
            bufferLength: _.get(settings.conf.appSettings, 'logging.loggly.bufferLength', 1),
        };

        if (logglyConfig.token && logglyConfig.subdomain) {
            const logglyStream = new Bunyan2Loggly(logglyConfig, logglyConfig.bufferLength);
            logger.log.addStream({
                type: 'raw',
                stream: logglyStream,
                tags: ['edm-client'],
            });
        }
    });
}
