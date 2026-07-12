-- Capsule Zero — private item-original direct-upload foundation (spec 040).
--
-- Assets are deliberately not attached to a wardrobe item yet: the wardrobe
-- schema lands in its own stateful slice. The owner and opaque object key are
-- nevertheless durable, unique, and ready for that later relationship.

CREATE TABLE IF NOT EXISTS upload_jobs (
    id                UUID PRIMARY KEY,
    asset_id          UUID NOT NULL UNIQUE,
    user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    object_key        TEXT NOT NULL UNIQUE CHECK (object_key <> ''),
    job_type          TEXT NOT NULL DEFAULT 'photo_upload' CHECK (job_type = 'photo_upload'),
    content_type      TEXT NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp')),
    size_bytes        BIGINT NOT NULL CHECK (size_bytes BETWEEN 1 AND 10485760),
    status            TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'completed')),
    completed_at      TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK ((status = 'queued' AND completed_at IS NULL) OR
           (status = 'completed' AND completed_at IS NOT NULL)),
    UNIQUE (asset_id, user_id)
);

CREATE INDEX IF NOT EXISTS upload_jobs_owner_idx ON upload_jobs (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS item_assets (
    id           UUID PRIMARY KEY,
    user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    object_key   TEXT NOT NULL UNIQUE CHECK (object_key <> ''),
    variant      TEXT NOT NULL DEFAULT 'original' CHECK (variant = 'original'),
    content_type TEXT NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp')),
    size_bytes   BIGINT NOT NULL CHECK (size_bytes BETWEEN 1 AND 10485760),
    etag         TEXT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (id, user_id),
    FOREIGN KEY (id, user_id) REFERENCES upload_jobs(asset_id, user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS item_assets_owner_idx ON item_assets (user_id, created_at DESC);
