-- Confirmar email do usuário mauromonarra@gmail.com para permitir login
UPDATE auth.users
SET 
  email_confirmed_at = now(),
  updated_at = now()
WHERE id = '3ece19d5-bd40-46d0-ad5f-b793409cc330';