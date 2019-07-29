// includes
const mysql       = require('mysql-promise')('db');
const mysqlDriver = require('mysql');
const log         = require('./logging');
const moment      = require('moment');


// logic
module.exports = {
    init() {
        mysql.configure({
            host    : process.env.DATABASE_HOST,
            user    : process.env.DATABASE_USER,
            password: process.env.DATABASE_PASS,
            database: process.env.DATABASE_NAME,
            timezone: 'UTC',
        });

        log.info("Using Database %s", process.env.DATABASE_HOST);
    },

    async getServices() {
        let data = await this.doQuery('SELECT * FROM services');

        return data[0];
    },

    async getService(id) {
        let data = await this.doQuery('SELECT * FROM services WHERE id = ?', [id]);

        return data[0].length === 1 ? data[0][0] : null;
    },

    async updateServiceStatus(item, newStatus) {
        if (item.status !== newStatus) {
            log.info("(ServiceStatus) Setting status of %s to %s", item.name, newStatus);
            await this.doQuery('UPDATE services SET status = ? WHERE id = ?', [newStatus, item.id]);
        }
    },

    async persistMetric(item, responseTime, responseStatus, errorCode) {
        return this.doQuery('INSERT INTO metrics (service_id, response_time, response_code, response_error) VALUES(?, ?, ?, ?)', [item.id, responseTime, responseStatus, errorCode]);
    },

    async getMetricsFor(item, begin, end) {
        let data = await this.doQuery('SELECT * FROM metrics WHERE service_id = ? AND date >= ? and date <= ?', [item.id, begin, end]);

        return data[0];
    },

    async getAvailabilityFor(item, date) {
        if (date === undefined) date = moment().format("YYYY-MM-DD");

        let data = await this.doQuery('SELECT * FROM availability WHERE service_id = ? AND date = ?', [
            item.id, date
        ]);

        return data[0].length === 1 ? data[0][0] : null;
    },

    async getAllAvailabilitiesFor(item, date) {
        if (date === undefined) date = moment().subtract(90, 'days').format("YYYY-MM-DD");

        let data = await this.doQuery('SELECT * FROM availability WHERE service_id = ? AND date > ? ORDER BY date DESC', [
            item.id, date
        ]);

        return data[0];
    },

    async setAvailabilityFor(item, date, value) {
        let data = await mysql.query('SELECT * FROM availability WHERE service_id = ? AND date = ?', [
            item.id, moment().format('YYYY-MM-DD')
        ]);

        if (data[0].length === 1) {
            this.doQuery('UPDATE availability SET availability = ? WHERE id = ?', [value, data[0][0].id]).catch(err => {
                log.error("Update for availability failed due to %s", err);
            })
        } else {
            this.doQuery('INSERT INTO availability (service_id, date, availability) VALUES(?, ?, ?)', [item.id, date, value]).catch(err => {
                log.error("Insertion for availability failed due to %s", err);
            })
        }
    },

    doQuery(sql, arr) {
        log.debug("DB >> QUERY >> %s", mysqlDriver.format(sql, arr));

        return mysql.query(sql, arr);
    },
};