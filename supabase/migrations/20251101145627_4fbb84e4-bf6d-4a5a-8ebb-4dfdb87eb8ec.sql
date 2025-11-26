-- 1) Garantir que perfis sejam criados automaticamente em novos logins
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2) Backfill de perfis para usuários existentes que ainda não possuem perfil
INSERT INTO public.profiles (id, email, full_name, user_type)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name','') AS full_name,
  CASE 
    WHEN u.email = 'admin@mostralo.com' THEN 'master_admin'::user_type 
    ELSE 'store_admin'::user_type 
  END AS user_type
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;