-- Adicionar campos de validação WhatsApp na tabela customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS whatsapp_valid BOOLEAN DEFAULT NULL;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS whatsapp_validated_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS whatsapp_jid TEXT DEFAULT NULL;

-- Comentários explicativos
COMMENT ON COLUMN public.customers.whatsapp_valid IS 'Status da validação WhatsApp: true=válido, false=inválido, null=não verificado';
COMMENT ON COLUMN public.customers.whatsapp_validated_at IS 'Data/hora da última validação do número WhatsApp';
COMMENT ON COLUMN public.customers.whatsapp_jid IS 'JID do WhatsApp retornado pela Evolution API';

-- Índice para consultas de validação pendente
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp_validation 
ON public.customers (whatsapp_valid, whatsapp_validated_at) 
WHERE whatsapp_valid IS NULL OR whatsapp_validated_at IS NULL;