# Status Page

## Metric Collector

The metric collector (the core part of this project) is used to - who would guess this? - fetch the metrics.

The current collector supports the following metric "backends":

- `port` check if a port is reachable
- `http` checks if a website is reachable.

## Configuration

The configuration is done by environment variables (either through `.env`-file or real envvars).

| Key                | Value                                  | Default |
| ---                | -----                                  | ------- |
| `DATABASE_DRIVER`  | any of `mariadb, pgsql`                | `pgsql` |
| `DATABASE_HOST`    | Hostname or IP of the database server  | `empty` |
| `DATABASE_USER`    | User to access the database            | `empty` |
| `DATABASE_PASS`    | Password to access the database        | `empty` |
| `DATABASE_NAME`    | Database name                          | `empty` |
| `DATABASE_SCHEMA`  | Database schema (only with `pgsql`)    | `public` | 
| `REFRESH_INTERVAL` | int between `1` and `60`.              | `30`     |
| `ENABLE_DEBUG`     | `bool` if non empty, debug is enabled. | `false`  |
| `DATE_FORMAT`      | Date formatting (see moment.js doc)    | `D.M.YYYY LTS` |

## API

Endpoints:

- `/services` returns all services with availability check
- `/service/:id` returns a specific service
- `/service/:id/metrics` returns the metrics from today for the item