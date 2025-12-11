-- Confirmar email do João da Silva para permitir login
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE id = '1ae5806f-bd66-45c3-a269-77775c76f8bb' 
AND email_confirmed_at IS NULL;