const log      = require("../logging");
const {Client} = require("pg");

let s = (sql) => {
    sql = sql.replaceAll('SCHEMA', process.env.DATABASE_SCHEMA || 'public');
    log.debug('DB::PGSQL => %s', sql);
    return sql;
};

module.exports = {
    client: null,

    connect() {
        this.client = new Client({
            user    : process.env.DATABASE_USER,
            host    : process.env.DATABASE_HOST,
            database: process.env.DATABASE_NAME,
            password: process.env.DATABASE_PASSWORD || process.env.DATABASE_PASS,
            port    : process.env.DATABASE_PORT || 5432,
        });

        this.client.connect();
    },

    async getServices() {
        let result = await this.client.query(s('SELECT * FROM SCHEMA.services'));

        return result.rows;
    },

    async getService(id) {
        let result = await this.client.query(s('SELECT * FROM SCHEMA.services WHERE id = $1'), [id])

        return result.rows[0];
    },

    async updateServiceStatus(item, newStatus) {
        return await this.client.query(s('UPDATE SCHEMA.services SET status = $1 WHERE id = $2'), [newStatus, item.id]);
    },

    async getMetricsFor(item, begin, end) {
        let result = await this.client.query(s('SELECT * FROM SCHEMA.metrics WHERE service_id = $1 AND date >= $2 AND date <= $3'), [
            item.id, begin, end
        ]);

        return result.rows;
    },

    async persistMetric(item, responseTime, responseStatus, errorCode) {
        return await this.client.query(s('INSERT INTO SCHEMA.metrics (service_id, response_time, response_code, response_error) VALUES($1, $2, $3, $4)'), [
            item.id, responseTime, responseStatus, errorCode
        ]);
    },

    async getAvailabilityForAndFrom(item, date) {
        let result = await this.client.query(s('SELECT * FROM SCHEMA.availability WHERE service_id = $1 AND date = $2'), [
            item.id, date
        ]);

        return result.rows[0];
    },

    async getAvailabilityForAndFromIsHigherThan(item, date) {
        let result = await this.client.query(s('SELECT * FROM SCHEMA.availability WHERE service_id = $1 AND date >= $2 ORDER BY date DESC'), [
            item.id, date
        ]);

        return result.rows;
    },

    async updateAvailability(identifier, value) {
        return await this.client.query(s('UPDATE SCHEMA.availability SET availability = $2 WHERE id = $1'), [
            identifier, value
        ]);
    },

    async persistAvailability(item, value, date) {
        return await this.client.query(s('INSERT INTO SCHEMA.availability (service_id, availability, date) VALUES($1, $2, $3)'), [
            item.id, value, date
        ]);
    },
};