const request = require('request-promise-native');

module.exports = {
    metric(item) {
        return request({uri: item.url, time: true, resolveWithFullResponse: true, timeout: 1000});
    }
};