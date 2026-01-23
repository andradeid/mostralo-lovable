-- Add source tracking fields for automatic imports
ALTER TABLE public.system_financial_transactions
ADD COLUMN IF NOT EXISTS is_auto boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS source_type text NULL,
ADD COLUMN IF NOT EXISTS source_id text NULL,
ADD COLUMN IF NOT EXISTS source_paid_at timestamptz NULL;

-- Prevent duplicate imports while allowing manual rows (NULL source fields)
CREATE UNIQUE INDEX IF NOT EXISTS system_financial_transactions_source_unique
ON public.system_financial_transactions (source_type, source_id)
WHERE source_type IS NOT NULL AND source_id IS NOT NULL;

-- Helpful index for queries/filtering
CREATE INDEX IF NOT EXISTS system_financial_transactions_is_auto_idx
ON public.system_financial_transactions (is_auto);

CREATE INDEX IF NOT EXISTS system_financial_transactions_source_paid_at_idx
ON public.system_financial_transactions (source_paid_at);
