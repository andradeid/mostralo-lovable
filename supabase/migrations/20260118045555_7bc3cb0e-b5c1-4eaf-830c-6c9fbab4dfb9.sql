-- Adicionar coluna de forma de pagamento na proposta
ALTER TABLE public.commercial_proposals
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Adicionar colunas para segurança jurídica do aceite
ALTER TABLE public.commercial_proposals
ADD COLUMN IF NOT EXISTS accept_ip_address TEXT,
ADD COLUMN IF NOT EXISTS accept_user_agent TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.commercial_proposals.payment_method IS 'Forma de pagamento: pix, boleto, cartao_credito, cartao_debito, transferencia, permuta, etc';
COMMENT ON COLUMN public.commercial_proposals.accept_ip_address IS 'IP do cliente no momento do aceite para segurança jurídica';
COMMENT ON COLUMN public.commercial_proposals.accept_user_agent IS 'User Agent do navegador no momento do aceite para segurança jurídica';