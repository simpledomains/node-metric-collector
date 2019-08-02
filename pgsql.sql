CREATE SCHEMA metricdb;
SET search_path TO metricdb;

CREATE TABLE availability (
    id SERIAL NOT NULL,
    service_id integer NOT NULL,
    date date NOT NULL DEFAULT '1970-01-01'::date,
    availability double precision NOT NULL
);

CREATE TABLE metrics (
    id SERIAL NOT NULL,
    service_id integer NOT NULL,
    date timestamp without time zone NOT NULL DEFAULT now(),
    response_time integer,
    response_code integer,
    response_error VARCHAR(30)
);

CREATE TABLE services (
    id SERIAL NOT NULL,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(255) DEFAULT NULL,
    threshold INT,
    resolver VARCHAR(10) DEFAULT 'http',
    status VARCHAR(20) DEFAULT 'OPERATIONAL',
    maintenance INT NOT NULL DEFAULT 0
);