ALTER TABLE public.booking_settings
  ADD COLUMN IF NOT EXISTS theme_primary_color text NOT NULL DEFAULT '#f97316',
  ADD COLUMN IF NOT EXISTS theme_background_color text NOT NULL DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS theme_text_color text NOT NULL DEFAULT '#0f172a',
  ADD COLUMN IF NOT EXISTS theme_mode text NOT NULL DEFAULT 'light',
  ADD COLUMN IF NOT EXISTS theme_font_family text NOT NULL DEFAULT 'inter',
  ADD COLUMN IF NOT EXISTS theme_radius text NOT NULL DEFAULT '0.5rem',
  ADD COLUMN IF NOT EXISTS theme_logo_url text,
  ADD COLUMN IF NOT EXISTS embed_hide_header boolean NOT NULL DEFAULT true;