-- Corrigir o problema de NULL em confirmation_token que causa erro no Admin API
-- Este é um bug conhecido do Supabase quando usuários são criados de certas formas
UPDATE auth.users 
SET confirmation_token = COALESCE(confirmation_token, '')
WHERE confirmation_token IS NULL;