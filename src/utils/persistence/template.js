const log = require("../logging");
// TODO: require the driver here

module.exports = {
    client: null,

    connect() {
        // create the client here, set it to this.client
    },

    async getServices() {
        // TODO: implement query to select all services.
    },

    async getService(id) {
        // TODO: implement query to select service by id.
    },

    async updateServiceStatus(item, newStatus) {
        // TODO: implement query to update service by id.
    },

    async getMetricsFor(item, begin, end) {
        // TODO: implement query to get metrics for service in a range of 2 dates.
    },

    async persistMetric(item, responseTime, responseStatus, errorCode) {
        // TODO: insert a new collected metric
    },

    async getAvailabilityForAndFrom(item, date) {
        // TODO: retrieve the availability info for a service.
    },

    async getAvailabilityForAndFromIsHigherThan(item, date) {
        // TODO: retrieve the availability info for a service after a date.
    },

    async updateAvailability(identifier, value) {
        // TODO: query to update the availability from a service at a specific date.
    },

    async persistAvailability(item, value, date) {
        // TODO: query to insert a new  availability info for a service at a specific date.
    },
};