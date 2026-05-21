-- ============================================================
-- User Isolation Migration
-- Run this in the Supabase SQL editor before deploying the code.
-- ============================================================

-- Single-row tables: add user_id with unique constraint
-- (existing rows keyed by id=1 become inaccessible after migration — data was shared anyway)

ALTER TABLE preferences ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE resume       ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE profile      ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE scan_cache   ADD COLUMN IF NOT EXISTS user_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS preferences_user_id_key ON preferences (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS resume_user_id_key       ON resume      (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS profile_user_id_key      ON profile     (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS scan_cache_user_id_key   ON scan_cache  (user_id);

-- Multi-row tables: add user_id column + index

ALTER TABLE jobs             ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT '';
ALTER TABLE stories          ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT '';
ALTER TABLE tailored_resumes ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_jobs_user_id             ON jobs             (user_id);
CREATE INDEX IF NOT EXISTS idx_stories_user_id          ON stories          (user_id);
CREATE INDEX IF NOT EXISTS idx_tailored_resumes_user_id ON tailored_resumes (user_id);

-- tailored_resumes: composite unique key so two users can have same name-slug
CREATE UNIQUE INDEX IF NOT EXISTS tailored_resumes_user_id_key ON tailored_resumes (user_id, id);

-- dismissed_urls: change PK from url alone to (user_id, url)
ALTER TABLE dismissed_urls ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT '';
ALTER TABLE dismissed_urls DROP CONSTRAINT IF EXISTS dismissed_urls_pkey;
ALTER TABLE dismissed_urls ADD PRIMARY KEY (user_id, url);

-- portals: change PK from company alone to (user_id, company)
ALTER TABLE portals ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT '';
ALTER TABLE portals DROP CONSTRAINT IF EXISTS portals_pkey;
ALTER TABLE portals ADD PRIMARY KEY (user_id, company);
