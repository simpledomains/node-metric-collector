// processor

const requireDir  = require('require-dir');
const persistence = require('./utils/persistence');
const log         = require('./utils/logging');
const moment      = require('moment');
const CronJob     = require('cron').CronJob;

// modification to string prototype
String.prototype.replaceAll = function (search, replacement) {
    let target = this;
    return target.split(search).join(replacement);
};

class Processor {

    initialize() {
        persistence.init();

        this.resolvers = requireDir('./metric');

        log.info("Running with a interval of %d", this.metricInterval());

        for (const item of Object.keys(this.resolvers)) {
            log.info("Found metric resolver '%s'.", item);
        }

        if (!(process.env.DISABLE_METRIC_COLLECTOR === 'true')) {
            this.processor = new CronJob('*/' + this.metricInterval() + ' * * * * *', () => {
                this.processMetric(this.getResolvers()).catch(e => {
                    log.error("Something went wrong while processing main loop due to: %s", e.toString());
                });
            }, null, true, 'UTC', null, false);
        } else {
            log.warn("Metric Collector is disabled, read only metrics.")
        }

        this.availabilityCron = new CronJob('*/10 * * * *', () => {
            this.availabilityCheck().catch(e => {
                log.error("Something went wrong while processing availability loop due to: %s", e.toString());
            });
        }, null, true, 'UTC', null, true);
    }

    metricInterval() {
        let int = (process.env.REFRESH_INTERVAL || 30) * 1;
        if (int > 60) int = 60;
        if (int < 1) int = 1;

        return int;
    }

    async retrieveMetric(resolvers, item, cTry) {
        if (cTry === undefined) cTry = 1;

        if (item.maintenance === 1) {
            return {metric: null, status: null, error: 'MAINTENANCE'}
        }

        let metric = {};

        if (resolvers[item.resolver.toLowerCase()]) {
            metric = await resolvers[item.resolver.toLowerCase()].process(item);
        } else {
            log.error("(MetricCollector) Resolver '%s' not found.", item.resolver);
            metric = {metric: null, status: null, error: 'CONFIGURATION'}
        }

        if (this.determineNewStatus(metric) !== 'OPERATIONAL' && cTry < 3) {
            metric = await this.retrieveMetric(resolvers, item, cTry + 1);
        }

        return metric;
    }

    determineNewStatus(metric) {
        if (metric.error === 'MAINTENANCE' || metric.error === 'DEGRADED_PERFORMANCE') {
            return metric.error;
        }

        if (metric.error !== null && metric.metric === null)
            return 'MAJOR_OUTAGE';

        if (metric.error !== null && metric.metric !== null)
            return 'PARTIAL_OUTAGE';

        return 'OPERATIONAL';
    }

    async processMetric(resolvers) {
        try {
            let serviceList = await persistence.getServices();

            for (const item of serviceList) {

                let metric = await this.retrieveMetric(resolvers, item, 1);

                await persistence.updateServiceStatus(item, this.determineNewStatus(metric));

                await persistence.persistMetric(item, metric.metric, metric.status, metric.error);
            }

        } catch (e) {
            log.error("A error occurred while processing metrics ... %s", e);
        }
    }

    getResolvers() {
        return this.resolvers;
    }

    async availabilityCheck() {
        log.info("Calculating availability ...");

        let services = await persistence.getServices();

        services.forEach((item) => {

            persistence.getMetricsFor(item, moment().format('YYYY-MM-DD 00:00:00'), moment().format('YYYY-MM-DD 23:59:59')).then(data => {

                let error = 0;

                data.forEach(metric => {
                    // noinspection JSUnresolvedVariable
                    if (metric.response_error !== null && metric.response_error !== 'MAINTENANCE') {
                        error = error + 1;
                    }
                });

                let daySeconds = ((60 * 60 * 24) / this.metricInterval());
                let success    = daySeconds - error;

                let availability = success / daySeconds * 100;

                if (availability >= 99) {
                    log.success("(Availability) Service %s is most of the time (%d%) available!", item.name, availability.toFixed(2));
                } else if (availability >= 50) {
                    log.warn("(Availability) Service %s is not as much reachable as it should be! (%d%)", item.name, availability.toFixed(2));
                } else {
                    log.error("(Availability) Service %s is nearly not reachable as it should be! (%d%)", item.name, availability.toFixed(2));
                }

                persistence.setAvailabilityFor(item, moment().format('YYYY-MM-DD'), availability);
            });
        });

        log.info("(Availability) Check runs next at %s", this.availabilityCron.nextDate().format(process.env.DATE_FORMAT));
    }
}

module.exports = new Processor();