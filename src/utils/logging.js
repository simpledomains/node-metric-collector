// imports
const chalk = require('chalk');
const moment = require('moment');
const symbols = require('log-symbols');
const util = require("util");
const fs = require('fs');

moment.locale(process.env.LOCALE || 'de-at');

let debugEnabled = process.env.ENABLE_DEBUG || false;

// module
module.exports = {

    LEVEL: {
        INFO: {symbol: symbols.info, text: "INFO ", color: chalk.blue},
        SUCCESS: {symbol: symbols.success, text: "YEAH ", color: chalk.green},
        WARNING: {symbol: symbols.warning, text: "WARN ", color: chalk.keyword('orange')},
        ERROR: {symbol: symbols.error, text: "ERROR", color: chalk.red},
        DEBUG: {symbol: symbols.info, text: "DEBUG", color: chalk.yellowBright},
    },

    log(level, data) {
        let str = util.format.apply(util, data);

        console.log(moment().format(process.env.DATE_FORMAT || 'D.M.YYYY LTS'), level.symbol, level.color(level.text), str);

        fs.appendFileSync('app.log', moment().format(process.env.DATE_FORMAT || 'D.M.YYYY LTS') + " " + level.text + " " + str + "\n");
    },

    info(...data) {
        this.log(this.LEVEL.INFO, data);
    },

    warn(...data) {
        this.log(this.LEVEL.WARNING, data);
    },

    error(...data) {
        this.log(this.LEVEL.ERROR, data);
    },

    success(...data) {
        this.log(this.LEVEL.SUCCESS, data);
    },

    debug(...data) {
        if (debugEnabled)
            this.log(this.LEVEL.DEBUG, data);
    }
};