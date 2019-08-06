// imports
const express     = require('express');
const log         = require('./utils/logging');
const cors        = require('cors');
const persistence = require('./utils/persistence');
const proc        = require("./processor");

// logic
const app  = express();
const port = process.env.SERVER_PORT || 8000;

app.use(cors());

app.use(function (req, res, next) {
    if (res.headersSent) {
        log.debug("%s %s %s", req.method, req.url, (req.statusCode || 200));
    } else {
        res.on('finish', function () {
            log.debug("%s %s %s", req.method, req.url, (req.statusCode || 200));
        })
    }
    next();
});

app.listen(port * 1);

log.info("Starting Express-Server on Port %s", port);


app.route('/services')
    .get((req, res) => {
        let result = [];
        persistence.getServices().then(async (data) => {
            result = data;

            for (const [key, item] of Object.entries(result)) {
                await persistence.getAvailabilityFor(item).then(r => {
                    result[key].availability = r;
                })
            }

            res.json(result);
        });
    });

app.route('/service/:id')
    .get((req, res) => {
        let result = {};

        persistence.getService(req.params.id).then(async (data) => {
            if (data != null) {
                result = data;

                await persistence.getAllAvailabilitiesFor(data).then(r => {
                    result.availabilities = r;
                });

                res.json(result);
            } else {
                res.status(404);
            }
        })
    });

app.route('/service/:id/metrics')
    .get((req, res) => {
        persistence.getService(req.params.id).then(async (data) => {
            if (data != null) {

                persistence.getMetricsFor(data).then(r => {

                    let enrichedData = r.map(i => {
                        i.error  = i.response_error;
                        i.metric = i.response_time;
                        i.status = proc.determineNewStatus(i);
                        i.error  = undefined;
                        i.metric = undefined;

                        return i;
                    });

                    res.json({
                        service: data,
                        metrics: enrichedData
                    })
                });
            } else {
                res.status(404);
            }
        })
    });

app.route('/service/:id/incidents')
    .get((req, res) => {
        persistence.getService(req.params.id).then(async (data) => {
            if (data != null) {

                persistence.getErroredMetricsFor(data).then(r => {

                    let enrichedData = r.map(i => {
                        i.error  = i.response_error;
                        i.metric = i.response_time;
                        i.status = proc.determineNewStatus(i);
                        i.error  = undefined;
                        i.metric = undefined;
                        return i;
                    });

                    res.json({
                        service  : data,
                        incidents: enrichedData
                    })
                }).catch(e => {
                    res.json({error: e, message: e.toString()});
                    res.status(500);
                });
            } else {
                res.status(404);
            }
        })
    });