-- Adicionar campos estruturados para suporte a boletos EFI na tabela external_clients
ALTER TABLE public.external_clients
ADD COLUMN IF NOT EXISTS person_type text DEFAULT 'PF' CHECK (person_type IN ('PF', 'PJ')),
ADD COLUMN IF NOT EXISTS address_street text,
ADD COLUMN IF NOT EXISTS address_number text,
ADD COLUMN IF NOT EXISTS address_complement text,
ADD COLUMN IF NOT EXISTS address_neighborhood text,
ADD COLUMN IF NOT EXISTS address_city text,
ADD COLUMN IF NOT EXISTS address_state text CHECK (address_state IS NULL OR length(address_state) = 2),
ADD COLUMN IF NOT EXISTS address_zipcode text;

-- Comentários para documentação
COMMENT ON COLUMN public.external_clients.person_type IS 'Tipo de pessoa: PF (Física) ou PJ (Jurídica)';
COMMENT ON COLUMN public.external_clients.address_street IS 'Logradouro (rua, avenida, etc)';
COMMENT ON COLUMN public.external_clients.address_number IS 'Número do endereço';
COMMENT ON COLUMN public.external_clients.address_complement IS 'Complemento (apto, sala, etc)';
COMMENT ON COLUMN public.external_clients.address_neighborhood IS 'Bairro';
COMMENT ON COLUMN public.external_clients.address_city IS 'Cidade';
COMMENT ON COLUMN public.external_clients.address_state IS 'Estado (UF - 2 caracteres)';
COMMENT ON COLUMN public.external_clients.address_zipcode IS 'CEP (apenas números)';