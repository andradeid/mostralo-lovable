-- Adicionar coluna calendar_name na tabela google_calendar_tokens
ALTER TABLE public.google_calendar_tokens
ADD COLUMN IF NOT EXISTS calendar_name TEXT;