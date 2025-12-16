-- Restaurar openai_creds_id anterior (credencial já existente na Evolution) para evitar erro "API key already registered"
update public.evolution_config
set openai_creds_id = 'cmj8l6ubl03d5q64ja6d673sk',
    updated_at = now()
where is_active = true;