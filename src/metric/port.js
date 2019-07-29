// process http metrics
const isPortReachable = require('is-port-reachable');
const log             = require('../utils/logging');

module.exports = {
    async process(item) {
        try {
            let host = item.url.split(":")[0];
            let port = item.url.split(":")[1] * 1;

            let isReachable = await isPortReachable(port, {host: host});

            if (isReachable) {
                return {metric: 100, status: 200, error: null}
            } else {
                return {metric: null, status: null, error: 'PORT_CLOSED'}
            }
        } catch (e) {
            log.error("(MetricCollector) IsPortReachable failed due to %s", e.toString());
            return {metric: null, status: null, error: 'CONFIGURATION'}
        }
    }
};