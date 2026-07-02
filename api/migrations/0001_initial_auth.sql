-- Capsule Zero — auth slice schema (spec 024 Phase 2).
--
-- Only the auth/profile bounded context. Wardrobe, capsule, catalog, and
-- billing tables arrive in later stateful slices. Identity itself lives in
-- Kratos's own database; this table is the application profile keyed by an
-- internal UUID with a unique reference to the Kratos identity.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS profiles (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kratos_identity_id UUID NOT NULL UNIQUE,
    email              TEXT NOT NULL,
    display_name       TEXT,
    locale             TEXT NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'ru')),
    country            TEXT,
    city               TEXT,
    avatar_url         TEXT,
    coin_balance       INTEGER NOT NULL DEFAULT 0,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles (email);
