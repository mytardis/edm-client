/**
 * Created by grischa on 13/6/17.
 *
 * Adding OpenTracer to measure performance and track issues in the distributed
 * system
 */

import {initGlobalTracer, Tracer} from 'opentracing';
let initTracer = require('jaeger-client').initTracer;
let noopReporter = require('jaeger-client/src/reporters/noop_reporter').NoopReporter;

let jaegerConfig = {
    'serviceName': 'edm-client',
    'reporter': {
        // logSpans: false,
        agentHost: 'localhost',
        // agentPort: 5778,
        flushIntervalMs: 10,
    }
};
let options = {
    'tags': {
        'edm-client.version': '0.1',
    }
    // host: 'localhost',
    // port: 5778,
};

// TODO: disable tracing for production?
let debug = false;
if (debug) {
    initGlobalTracer(<Tracer>initTracer(jaegerConfig, options));
} else {
    initGlobalTracer(<Tracer>initTracer({reporter: noopReporter}, options));
}
