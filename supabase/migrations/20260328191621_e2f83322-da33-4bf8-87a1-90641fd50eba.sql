
ALTER TABLE public.short_links 
  ALTER COLUMN lat DROP NOT NULL,
  ALTER COLUMN lng DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS target_url text DEFAULT null,
  ADD COLUMN IF NOT EXISTS link_type text DEFAULT 'location';
