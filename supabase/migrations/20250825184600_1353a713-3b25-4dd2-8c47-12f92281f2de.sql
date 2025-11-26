-- Adicionar campos de regras de obrigatoriedade na tabela addon_categories
ALTER TABLE public.addon_categories 
ADD COLUMN min_selections INTEGER DEFAULT 0,
ADD COLUMN max_selections INTEGER DEFAULT NULL,
ADD COLUMN is_required BOOLEAN DEFAULT false;

-- Comentários para documentar os campos
COMMENT ON COLUMN public.addon_categories.min_selections IS 'Número mínimo de adicionais que devem ser selecionados desta categoria';
COMMENT ON COLUMN public.addon_categories.max_selections IS 'Número máximo de adicionais que podem ser selecionados desta categoria (NULL = ilimitado)';
COMMENT ON COLUMN public.addon_categories.is_required IS 'Se true, o cliente deve selecionar pelo menos min_selections itens desta categoria';