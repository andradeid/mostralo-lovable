-- Deletar bookings vinculados ao professional deste usuário
DELETE FROM public.bookings 
WHERE professional_id IN (
  SELECT id FROM public.professionals WHERE user_id = 'e03680f1-84c7-437b-b63b-742d0881ef15'
);

-- Deletar da tabela professionals
DELETE FROM public.professionals WHERE user_id = 'e03680f1-84c7-437b-b63b-742d0881ef15';

-- Deletar audit logs que referenciam este usuário
DELETE FROM public.admin_audit_log WHERE target_user_id = 'e03680f1-84c7-437b-b63b-742d0881ef15';
DELETE FROM public.admin_audit_log WHERE admin_id = 'e03680f1-84c7-437b-b63b-742d0881ef15';

-- Deletar roles do usuário
DELETE FROM public.user_roles WHERE user_id = 'e03680f1-84c7-437b-b63b-742d0881ef15';

-- Deletar profile do usuário
DELETE FROM public.profiles WHERE id = 'e03680f1-84c7-437b-b63b-742d0881ef15';

-- Deletar usuário do auth
DELETE FROM auth.users WHERE id = 'e03680f1-84c7-437b-b63b-742d0881ef15';