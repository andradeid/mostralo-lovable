-- Adicionar campos de domínio personalizado na tabela stores
ALTER TABLE public.stores 
ADD COLUMN custom_domain text,
ADD COLUMN custom_domain_verified boolean DEFAULT false,
ADD COLUMN custom_domain_requested_at timestamp with time zone;

-- Comentários para documentação
COMMENT ON COLUMN public.stores.custom_domain IS 'Domínio personalizado do cliente (ex: www.minhapizzaria.com.br)';
COMMENT ON COLUMN public.stores.custom_domain_verified IS 'Se o domínio foi verificado e está apontando corretamente';
COMMENT ON COLUMN public.stores.custom_domain_requested_at IS 'Data da última solicitação de verificação';

-- Índice para melhor performance em consultas por domínio
CREATE INDEX idx_stores_custom_domain ON public.stores(custom_domain) WHERE custom_domain IS NOT NULL;