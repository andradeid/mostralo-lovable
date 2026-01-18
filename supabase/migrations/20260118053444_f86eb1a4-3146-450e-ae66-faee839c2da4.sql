-- Add store_count column to commercial_proposals
ALTER TABLE commercial_proposals 
ADD COLUMN IF NOT EXISTS store_count INTEGER DEFAULT 1;