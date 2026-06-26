#!/bin/sh
set -eu

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
create table if not exists public.capsule_zero_schema_migrations (
  version text primary key,
  applied_at timestamptz not null default now()
);
SQL

for migration in /migrations/*.sql; do
  version="$(basename "$migration")"
  applied="$(psql "$DATABASE_URL" -Atc "select 1 from public.capsule_zero_schema_migrations where version = '$version'")"

  if [ "$applied" = "1" ]; then
    echo "Skipping already applied Capsule Zero migration: $version"
    continue
  fi

  echo "Applying Capsule Zero migration: $version"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$migration"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "insert into public.capsule_zero_schema_migrations (version) values ('$version')"
done
