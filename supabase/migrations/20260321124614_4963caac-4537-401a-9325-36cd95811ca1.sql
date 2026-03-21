-- Add automation settings columns to booking_settings
ALTER TABLE public.booking_settings 
  ADD COLUMN IF NOT EXISTS auto_status_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_complete_minutes integer DEFAULT 15;