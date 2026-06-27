#!/bin/sh
set -eu

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
create schema if not exists capsule_zero_internal;
revoke all on schema capsule_zero_internal from public;
revoke all on schema capsule_zero_internal from anon;
revoke all on schema capsule_zero_internal from authenticated;

create table if not exists capsule_zero_internal.schema_migrations (
  version text primary key,
  applied_at timestamptz not null default now()
);

revoke all on capsule_zero_internal.schema_migrations from public;
revoke all on capsule_zero_internal.schema_migrations from anon;
revoke all on capsule_zero_internal.schema_migrations from authenticated;

do $$
begin
  if to_regclass('public.capsule_zero_schema_migrations') is not null then
    insert into capsule_zero_internal.schema_migrations (version, applied_at)
    select version, applied_at
    from public.capsule_zero_schema_migrations
    on conflict (version) do nothing;

    drop table public.capsule_zero_schema_migrations;
  end if;
end $$;
SQL

for migration in /migrations/*.sql; do
  version="$(basename "$migration")"
  escaped_version="$(printf "%s" "$version" | sed "s/'/''/g")"
  applied="$(
    psql "$DATABASE_URL" \
      -v ON_ERROR_STOP=1 \
      -Atc "select 1 from capsule_zero_internal.schema_migrations where version = '$escaped_version'"
  )"

  if [ "$applied" = "1" ]; then
    echo "Skipping already applied Capsule Zero migration: $version"
    continue
  fi

  echo "Applying Capsule Zero migration: $version"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$migration"
  psql "$DATABASE_URL" \
    -v ON_ERROR_STOP=1 \
    -c "insert into capsule_zero_internal.schema_migrations (version) values ('$escaped_version')"
done
