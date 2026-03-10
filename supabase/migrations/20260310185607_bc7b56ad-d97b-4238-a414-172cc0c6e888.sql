
-- Add provider and api_token columns to whatsapp_instances
ALTER TABLE public.whatsapp_instances 
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'evolution',
  ADD COLUMN IF NOT EXISTS api_token text;

-- Add comment for clarity
COMMENT ON COLUMN public.whatsapp_instances.provider IS 'WhatsApp API provider: evolution or uazapi';
COMMENT ON COLUMN public.whatsapp_instances.api_token IS 'Instance authentication token for the provider API';
