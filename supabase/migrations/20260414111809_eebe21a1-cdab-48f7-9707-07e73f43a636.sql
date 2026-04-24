
-- Add structured hackathon schema fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS languages jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS experience jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS education jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS certifications jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS projects jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS availability jsonb DEFAULT '{"status": "Available", "type": "Full-time"}'::jsonb;

-- Migrate existing full_name data into first_name/last_name
UPDATE public.profiles
SET
  first_name = COALESCE(split_part(full_name, ' ', 1), ''),
  last_name = COALESCE(NULLIF(substring(full_name from position(' ' in full_name) + 1), full_name), '')
WHERE full_name IS NOT NULL AND first_name IS NULL;
