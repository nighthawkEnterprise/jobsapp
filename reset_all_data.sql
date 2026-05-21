-- Full data reset — run in Supabase SQL editor.
-- Clears all user-scoped data across every table.

DELETE FROM dismissed_urls;
DELETE FROM portals;
DELETE FROM tailored_resumes;
DELETE FROM stories;
DELETE FROM jobs;
DELETE FROM scan_cache;
DELETE FROM profile;
DELETE FROM resume;
DELETE FROM preferences;
