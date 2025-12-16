-- Add timezone column to stores table for bot greeting system
ALTER TABLE stores ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Sao_Paulo';

-- Add comment explaining the field
COMMENT ON COLUMN stores.timezone IS 'Timezone for the store used by the AI bot for time-based greetings (e.g., America/Sao_Paulo, America/Manaus)';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stores_timezone ON stores(timezone);