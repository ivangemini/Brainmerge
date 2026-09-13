export class Analytics {
    sink;
    constructor(sink = null) {
        this.sink = sink;
    }
    track(name, properties = {}) {
        // Event payloads are deliberately limited to gameplay aggregates. No account,
        // device, advertising or free-form player identifiers belong at this boundary.
        this.sink?.send(name, properties);
    }
}
export class BrowserEventAnalyticsSink {
    send(name, properties) {
        window.dispatchEvent(new CustomEvent('brainmerge:analytics', { detail: { name, properties } }));
    }
}
