-- Adicionar campos de qualificação na tabela leads
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS qualification_level TEXT DEFAULT 'evaluation',
ADD COLUMN IF NOT EXISTS qualification_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS diagnostic_answers JSONB;

-- Comentários para documentação
COMMENT ON COLUMN public.leads.qualification_level IS 'Nível de qualificação: elite, potential, disqualified, evaluation';
COMMENT ON COLUMN public.leads.qualification_score IS 'Pontuação do diagnóstico (0-12)';
COMMENT ON COLUMN public.leads.diagnostic_answers IS 'Respostas do diagnóstico em formato JSON';