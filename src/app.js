// processing .env files
require('dotenv').config({path: '.env.' + (process.env.PROFILE || 'production')});
require('dotenv').config({path: '.env.local'});
require('dotenv').config({path: '.env'});

// includes
const log       = require('./utils/logging');
const processor = require('./processor');

log.info("Starting Application ...");
processor.initialize();

// shutdown notices
process.stdin.resume();
process.on('SIGINT', (d) => {
    log.error("Stopping application");
    process.exit(2);
});

require('./rest-server');

log.info("Startup successful");