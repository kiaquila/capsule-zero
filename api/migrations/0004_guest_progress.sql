-- Guest saves are snapshots, not canonical capsules (no immutable-palette claim).
CREATE TABLE guest_progress (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 transfer_id uuid NOT NULL UNIQUE,
 user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
 wardrobe text NOT NULL CHECK (wardrobe IN ('female', 'male', 'mixed')),
 algorithm_version text NOT NULL CHECK (algorithm_version = 'guest-v1'),
 picked text[] NOT NULL CHECK (cardinality(picked) BETWEEN 1 AND 32),
 items jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX guest_progress_owner ON guest_progress(user_id, created_at DESC);
CREATE TABLE guest_wardrobe_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
 preset_id text NOT NULL,
 preset jsonb NOT NULL,
 status text NOT NULL DEFAULT 'uncapsulated' CHECK (status IN ('active','uncapsulated','for_sale','for_repair')),
 favorite boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id, preset_id)
);
