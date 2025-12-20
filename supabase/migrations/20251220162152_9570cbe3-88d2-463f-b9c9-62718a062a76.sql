-- Corrigir campos NULL no auth.users para o cliente Marcos Andrade
UPDATE auth.users
SET 
  confirmation_token = '',
  recovery_token = '',
  email_change_token_new = '',
  email_change_token_current = '',
  reauthentication_token = '',
  phone_change_token = '',
  updated_at = now()
WHERE id = 'f06650f2-a9aa-41a5-8f45-abc32d67fbac';