const mariadb = require('mariadb');
const log     = require('../logging');

let s = (sql) => {
    log.debug("DB::MARIADB => %s", sql);
    return sql;
};

module.exports = {
    client: null,

    connect() {
        mariadb.createConnection({
            user    : process.env.DATABASE_USER,
            host    : process.env.DATABASE_HOST,
            database: process.env.DATABASE_NAME,
            password: process.env.DATABASE_PASSWORD || process.env.DATABASE_PASS,
            port    : process.env.DATABASE_PORT || 3306,
        }).then(connection => {
            this.client = connection;
        }).catch(err => {
            log.error("Failed to connect to database, error %s", err);
            process.exit(137);
        });
    },

    async getServices() {
        await this.waitForConnection();

        return await this.client.query(s('SELECT * FROM services'));
    },

    async getService(id) {
        await this.waitForConnection();

        let result = await this.client.query(s('SELECT * FROM services WHERE id = ?'), [id]);
        return result[0];
    },

    async updateServiceStatus(item, newStatus) {
        await this.waitForConnection();

        return await this.client.query(s('UPDATE services SET status = ? WHERE id = ?'), [newStatus, item.id]);
    },

    async getMetricsFor(item, begin, end) {
        await this.waitForConnection();

        return await this.client.query(s('SELECT * FROM metrics WHERE service_id = ? AND date >= ? AND date <= ?'), [
            item.id, begin, end
        ]);
    },

    async persistMetric(item, responseTime, responseStatus, errorCode) {
        await this.waitForConnection();

        return await this.client.query(s('INSERT INTO metrics (service_id, response_time, response_code, response_error) VALUES(?, ?, ?, ?)'), [
            item.id, responseTime, responseStatus, errorCode
        ]);
    },

    async getAvailabilityForAndFrom(item, date) {
        await this.waitForConnection();

        if (item.id === undefined) return null;

        let result = await this.client.query(s('SELECT * FROM availability WHERE service_id = ? AND date = ?'), [
            item.id, date
        ]);

        return result[0];
    },

    async getAvailabilityForAndFromIsHigherThan(item, date) {
        await this.waitForConnection();

        return await this.client.query(s('SELECT * FROM availability WHERE service_id = ? AND date >= ? ORDER BY date DESC'), [
            item.id, date
        ]);
    },

    async updateAvailability(identifier, value) {
        await this.waitForConnection();

        return await this.client.query(s('UPDATE availability SET availability = ? WHERE id = ?'), [
            value, identifier
        ]);
    },

    async persistAvailability(item, value, date) {
        await this.waitForConnection();

        return await this.client.query(s('INSERT INTO availability (service_id, availability, date) VALUES(?, ?, ?))'), [
            item.id, value, date
        ]);
    },

    async waitForConnection() {
        while (this.client === undefined || this.client === null) {
            await new Promise(resolve => {
                setTimeout(resolve, 1000);
            });
        }
    }
};