-- Adicionar colunas template_id e image_url na tabela sentinela_rules
ALTER TABLE public.sentinela_rules 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.sentinela_templates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.sentinela_rules.template_id IS 'ID do template SENTINELA a ser usado nesta regra';
COMMENT ON COLUMN public.sentinela_rules.image_url IS 'URL da imagem a ser enviada junto com a mensagem';