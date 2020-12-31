

// all events will be prefixed with this event name
import TelemetryReporter from "vscode-extension-telemetry";

const extensionId = 'demo-extension';

// extension version will be reported as a property with each event
const extensionVersion = '1.0.0';

// the application insights key (also known as instrumentation key)
const key = '';

export function testTelemetry() {
    let reporter = new TelemetryReporter(extensionId, extensionVersion, key);
    for (let i = 0; i < 100; i++) {
        reporter.sendTelemetryEvent("event-A", {'prop1':'1111','prop2':'2222'}, {'value':1});
        reporter.sendTelemetryEvent("event-B", {'prop3':'333','prop2':'2222'}, {'value':2});

        try { console.log.apply(console, new Array(1000000000));} catch (error) {
            reporter.sendTelemetryException(error, {'error-prop1': '1111'}, {'value': 123});
        }
        try {console.log.apply(console, new Array(1000000000));} catch (error) {
            reporter.sendTelemetryErrorEvent('errorEvent-1', {
                'stringProp': 'some string',
                'stackProp': error.stack
            }, {'numericMeasure': 123}, ['stackProp']);
        }
    }
}

