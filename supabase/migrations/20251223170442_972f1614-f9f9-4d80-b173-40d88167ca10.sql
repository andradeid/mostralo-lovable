-- Adicionar coluna para armazenar charge_id do boleto (necessário para webhook)
ALTER TABLE public.external_invoices 
ADD COLUMN IF NOT EXISTS boleto_charge_id TEXT;

-- Criar índice para busca rápida por charge_id
CREATE INDEX IF NOT EXISTS idx_external_invoices_boleto_charge_id 
ON public.external_invoices(boleto_charge_id) 
WHERE boleto_charge_id IS NOT NULL;