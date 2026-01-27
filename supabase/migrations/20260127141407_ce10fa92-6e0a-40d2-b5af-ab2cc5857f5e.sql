-- Add SerpAPI support to image_search_config
ALTER TABLE public.image_search_config
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'google' CHECK (provider IN ('google', 'serpapi')),
ADD COLUMN IF NOT EXISTS serpapi_key TEXT;