ALTER TABLE public.booking_settings 
  ADD COLUMN IF NOT EXISTS send_location_in_confirmation boolean DEFAULT false;