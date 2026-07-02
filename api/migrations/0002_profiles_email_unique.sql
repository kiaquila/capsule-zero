-- Capsule Zero — auth hardening (spec 034).
--
-- profiles.email mirrors the Kratos identifier, which Kratos already keeps
-- unique per identity; the database now enforces the same invariant so a
-- repository bug can never fork two profiles onto one address. Replaces the
-- plain lookup index — a unique index serves the same lookups.
--
-- Migrations from 0002 on must stay runnable by the non-superuser capsule_app
-- owner role (spec 034 least-privilege rollout): plain DDL on owned objects
-- only, no superuser-only statements.

DROP INDEX IF EXISTS profiles_email_idx;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_key ON profiles (email);
