#!/usr/bin/env bash
# Capsule Zero — Postgres init (spec 024 Phase 2, auth slice).
#
# Provisions the Kratos role and database alongside the application database so
# the data tier is complete before the Kratos container starts. Runs once, only
# on first initialisation of an empty volume — a populated volume keeps whatever
# it already has, so everything the data tier needs is provisioned in this pass.
#
# The application role and database are the image-managed POSTGRES_USER /
# POSTGRES_DB (see deploy/compose.env.example). v0.1 keeps the app role as the
# entrypoint superuser; a dedicated non-superuser app role is a later hardening
# follow-up. This script only adds the separate `kratos` role + database.
#
# Required env (passed by the postgres service in docker-compose.yml):
#   KRATOS_DB_USER, KRATOS_DB_PASSWORD, KRATOS_DB_NAME
set -euo pipefail

: "${KRATOS_DB_USER:?KRATOS_DB_USER must be set for the postgres init}"
: "${KRATOS_DB_PASSWORD:?KRATOS_DB_PASSWORD must be set for the postgres init}"
: "${KRATOS_DB_NAME:?KRATOS_DB_NAME must be set for the postgres init}"

# Create the Kratos login role if it does not already exist, then (re)set its
# password. CREATE DATABASE cannot run inside a DO block, so it is issued
# separately and guarded by a \gexec lookup against pg_database.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
	DO \$\$
	BEGIN
	  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${KRATOS_DB_USER}') THEN
	    CREATE ROLE ${KRATOS_DB_USER} LOGIN PASSWORD '${KRATOS_DB_PASSWORD}';
	  ELSE
	    ALTER ROLE ${KRATOS_DB_USER} WITH LOGIN PASSWORD '${KRATOS_DB_PASSWORD}';
	  END IF;
	END
	\$\$;

	SELECT 'CREATE DATABASE ${KRATOS_DB_NAME} OWNER ${KRATOS_DB_USER}'
	  WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = '${KRATOS_DB_NAME}')\gexec
EOSQL

echo "postgres-init: kratos role '${KRATOS_DB_USER}' and database '${KRATOS_DB_NAME}' provisioned"
