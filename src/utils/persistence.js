// includes
const mysql       = require('mysql-promise')('db');
const mysqlDriver = require('mysql');
const log         = require('./logging');
const moment      = require('moment');
const requireDir  = require('require-dir');
const drivers     = requireDir('./persistence');
const driver      = process.env.DATABASE_DRIVER || 'pgsql';

if (drivers[driver] === undefined) {
    log.error("Driver for database %s not found!", driver);
    process.exit(137);
}

// logic
module.exports = {

    service: null,

    init() {
        log.info("Using database driver '%s'.", driver);

        this.service = drivers[driver];

        this.service.connect();
    },

    async getServices() {
        return await this.service.getServices();
    },

    async getService(id) {
        return await this.service.getService(id);
    },

    async updateServiceStatus(item, newStatus) {
        if (item.status !== newStatus) {
            log.info("(ServiceStatus) Setting status of %s to %s", item.name, newStatus);
            await this.service.updateServiceStatus(item, newStatus);
        }
    },

    async persistMetric(item, responseTime, responseStatus, errorCode) {
        return await this.service.persistMetric(item, responseTime, responseStatus, errorCode);
    },

    async getMetricsFor(item, begin, end) {
        if (end === undefined) end = moment().format("YYYY-MM-DD LTS");
        if (begin === undefined) begin = moment().subtract('4', 'hours').format('YYYY-MM-DD LTS');

        return await this.service.getMetricsFor(item, begin, end);
    },

    async getAvailabilityFor(item, date) {
        if (date === undefined) date = moment().format("YYYY-MM-DD");

        return await this.service.getAvailabilityForAndFrom(item, date);
    },

    async getAllAvailabilitiesFor(item, date) {
        if (date === undefined) date = moment().subtract(90, 'days').format("YYYY-MM-DD");

        return await this.service.getAvailabilityForAndFromIsHigherThan(item, date);
    },

    async setAvailabilityFor(item, date, value) {
        let data = await this.getAvailabilityFor(item, date);

        if (data !== undefined) {
            this.service.updateAvailability(data.id, value).catch(err => {
                log.error("Update for availability failed due to %s", err);
            });
        } else {
            this.service.persistAvailability(item, value, date).catch(err => {
                log.error("Insertion for availability failed due to %s", err);
            });
        }
    },
};