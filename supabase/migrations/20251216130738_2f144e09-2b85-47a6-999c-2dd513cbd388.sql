-- Limpar openai_creds_id antigo que pertencia a instância deletada
UPDATE evolution_config 
SET openai_creds_id = NULL, updated_at = NOW()
WHERE openai_creds_id = 'cmj8l6ubl03d5q64ja6d673sk';