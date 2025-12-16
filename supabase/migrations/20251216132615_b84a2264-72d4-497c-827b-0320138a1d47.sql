-- Limpar ID inválido de credencial OpenAI que não existe mais na Evolution
UPDATE public.evolution_config 
SET openai_creds_id = NULL 
WHERE is_active = true;