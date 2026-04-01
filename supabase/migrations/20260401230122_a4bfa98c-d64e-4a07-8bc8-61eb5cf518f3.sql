ALTER TABLE public.stores 
  ADD COLUMN IF NOT EXISTS billing_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS billing_contact_email TEXT,
  ADD COLUMN IF NOT EXISTS billing_contact_phone TEXT;