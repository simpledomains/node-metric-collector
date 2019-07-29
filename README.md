# Status Page

## Data stored in the database

All metrics are saved within the database.
The service will get every 30 seconds a metric.

This means its gathering `24 * 60 * 60 / 30 = 2880` times metrics **per** 
services and writes it to the database each day.

Every hour the service generates the % availability of the service.