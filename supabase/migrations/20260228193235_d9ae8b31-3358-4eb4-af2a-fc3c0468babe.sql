-- Adicionar colunas de localização ao contexto de sessão WhatsApp
ALTER TABLE public.whatsapp_session_context
ADD COLUMN IF NOT EXISTS customer_latitude double precision,
ADD COLUMN IF NOT EXISTS customer_longitude double precision;