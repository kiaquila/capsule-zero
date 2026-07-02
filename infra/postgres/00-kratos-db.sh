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
# password. psql's identifier/literal quoting protects generated names and
# passwords before \gexec runs dynamic CREATE statements.
psql -v ON_ERROR_STOP=1 \
	--username "$POSTGRES_USER" \
	--dbname "$POSTGRES_DB" \
	--set=kratos_user="$KRATOS_DB_USER" \
	--set=kratos_password="$KRATOS_DB_PASSWORD" \
	--set=kratos_db="$KRATOS_DB_NAME" <<-EOSQL
	SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'kratos_user', :'kratos_password')
	  WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'kratos_user')\gexec

	ALTER ROLE :"kratos_user" WITH LOGIN PASSWORD :'kratos_password';

	SELECT format('CREATE DATABASE %I OWNER %I', :'kratos_db', :'kratos_user')
	  WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'kratos_db')\gexec
EOSQL

echo "postgres-init: kratos role '${KRATOS_DB_USER}' and database '${KRATOS_DB_NAME}' provisioned"
