// process http metrics
const log = require('../utils/logging');
const request = require('../utils/request_functions');

module.exports = {
    async process(item) {
        try {
            let response = await request.metric(item);

            if (response.statusCode === 404 || response.statusCode >= 500) {
                return {
                    metric: response.elapsedTime,
                    error : 'HTTP ERROR ' + response.statusCode,
                    status: response.statusCode
                };
            }

            if (response.elapsedTime * 1 >= item.threshold * 1) {
                return {metric: response.elapsedTime, error: 'DEGRADED_PERFORMANCE', status: response.statusCode};
            }

            return {metric: response.elapsedTime, error: null, status: response.statusCode};
        } catch (e) {
            if (e.response) {
                return {
                    metric: e.response.elapsedTime,
                    error : e.toString().substr(0, 20),
                    status: e.response.statusCode
                };
            } else {

                log.error("(MetricProcessor::HTTP) Failed for item %s due to %s", item.name);
                return {metric: null, error: e.toString().substr(0, 20), status: null};
            }
        }
    }
};