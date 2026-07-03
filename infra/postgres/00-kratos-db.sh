#!/usr/bin/env bash
# Capsule Zero — Postgres init (spec 024 Phase 2, auth slice).
#
# Provisions the Kratos role and database alongside the application database so
# the data tier is complete before the Kratos container starts. Runs once, only
# on first initialisation of an empty volume — a populated volume keeps whatever
# it already has, so everything the data tier needs is provisioned in this pass.
#
# The application database is the image-managed POSTGRES_DB. When APP_DB_USER /
# APP_DB_PASSWORD are set, this script also provisions a dedicated non-superuser
# `capsule_app` role that owns the app database and its public schema (spec 034
# least-privilege hardening), so the API's DSN never needs the entrypoint
# superuser. Populated volumes skip initdb entirely — the production volume was
# provisioned by the one-time spec 034 operator rollout instead.
#
# Required env (passed by the postgres service in docker-compose.yml):
#   KRATOS_DB_USER, KRATOS_DB_PASSWORD, KRATOS_DB_NAME
# Optional env:
#   APP_DB_USER, APP_DB_PASSWORD
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
	--set=kratos_db="$KRATOS_DB_NAME" \
	--set=app_db_for_revoke="$POSTGRES_DB" <<-EOSQL
	SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'kratos_user', :'kratos_password')
	  WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'kratos_user')\gexec

	ALTER ROLE :"kratos_user" WITH LOGIN PASSWORD :'kratos_password';

	SELECT format('CREATE DATABASE %I OWNER %I', :'kratos_db', :'kratos_user')
	  WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'kratos_db')\gexec

	-- Postgres grants CONNECT on new databases to PUBLIC by default; each
	-- bounded role should reach only its own database (spec 034).
	REVOKE CONNECT ON DATABASE :"kratos_db" FROM PUBLIC;
	REVOKE CONNECT ON DATABASE :"app_db_for_revoke" FROM PUBLIC;
EOSQL

echo "postgres-init: kratos role '${KRATOS_DB_USER}' and database '${KRATOS_DB_NAME}' provisioned"

# Least-privilege application role (spec 034). Owns the app database and its
# public schema so boot migrations (plain DDL on owned objects; pgcrypto is a
# trusted extension in PG16) run without superuser. Skipped when the env is
# absent to keep the superuser-DSN mode working.
if [[ -n "${APP_DB_USER:-}" && -n "${APP_DB_PASSWORD:-}" ]]; then
	psql -v ON_ERROR_STOP=1 \
		--username "$POSTGRES_USER" \
		--dbname "$POSTGRES_DB" \
		--set=app_user="$APP_DB_USER" \
		--set=app_password="$APP_DB_PASSWORD" \
		--set=app_db="$POSTGRES_DB" <<-EOSQL
		SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'app_user', :'app_password')
		  WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'app_user')\gexec

		ALTER ROLE :"app_user" WITH LOGIN PASSWORD :'app_password';

		ALTER DATABASE :"app_db" OWNER TO :"app_user";
		ALTER SCHEMA public OWNER TO :"app_user";
	EOSQL
	echo "postgres-init: least-privilege app role '${APP_DB_USER}' owns database '${POSTGRES_DB}'"
else
	echo "postgres-init: APP_DB_USER/APP_DB_PASSWORD not set — app role skipped (superuser DSN mode)"
fi
