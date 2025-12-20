-- Reverter auth user criado manualmente (gerou store_admin) e deixar o login recriar corretamente
BEGIN;

-- 1) Desvincular do customer
UPDATE public.customers
SET auth_user_id = NULL,
    updated_at = now()
WHERE phone = '61994009368'
  AND auth_user_id = 'f06650f2-a9aa-41a5-8f45-abc32d67fbac';

-- 2) Remover role criada indevidamente
DELETE FROM public.user_roles
WHERE user_id = 'f06650f2-a9aa-41a5-8f45-abc32d67fbac';

-- 3) Remover profile criado indevidamente
DELETE FROM public.profiles
WHERE id = 'f06650f2-a9aa-41a5-8f45-abc32d67fbac';

-- 4) Remover usuário inválido do auth
DELETE FROM auth.users
WHERE id = 'f06650f2-a9aa-41a5-8f45-abc32d67fbac';

COMMIT;