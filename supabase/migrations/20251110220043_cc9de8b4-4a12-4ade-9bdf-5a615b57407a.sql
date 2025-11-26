-- =====================================================
-- CORREÇÃO CRÍTICA DE SEGURANÇA - VERSÃO CORRIGIDA
-- Fix trigger handle_new_user e limpeza de dados
-- =====================================================

-- 1. PRIMEIRO: Tornar user_type nullable
ALTER TABLE public.profiles ALTER COLUMN user_type DROP NOT NULL;

-- 2. Limpar user_type de delivery drivers existentes
UPDATE public.profiles
SET user_type = NULL
WHERE id IN (
  SELECT user_id 
  FROM user_roles 
  WHERE role = 'delivery_driver'
);

-- 3. Limpar user_type de customers existentes
UPDATE public.profiles
SET user_type = NULL
WHERE id IN (
  SELECT user_id 
  FROM user_roles 
  WHERE role = 'customer'
);

-- 4. Garantir que apenas master_admin e store_admin com roles mantenham user_type
UPDATE public.profiles
SET user_type = NULL
WHERE user_type IS NOT NULL
  AND id NOT IN (
    SELECT user_id 
    FROM user_roles 
    WHERE role IN ('master_admin', 'store_admin')
  );

-- 5. Corrigir função handle_new_user para não definir store_admin por padrão
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE email = NEW.email) THEN
    UPDATE public.profiles 
    SET id = NEW.id, 
        full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
        updated_at = now()
    WHERE email = NEW.email;
  ELSE
    INSERT INTO public.profiles (id, email, full_name, user_type)
    VALUES (
      NEW.id, 
      NEW.email,
      NEW.raw_user_meta_data->>'full_name',
      CASE 
        WHEN NEW.email = 'admin@mostralo.com' THEN 'master_admin'::user_type
        ELSE NULL
      END
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 6. Criar tabela de auditoria de segurança
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  user_role text,
  attempted_route text NOT NULL,
  allowed_roles text[],
  action text NOT NULL CHECK (action IN ('blocked', 'allowed', 'unauthorized')),
  user_agent text,
  ip_address inet,
  created_at timestamptz DEFAULT now()
);

-- 7. Habilitar RLS na tabela de auditoria
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- 8. Política: Apenas master admins podem ver logs de auditoria
CREATE POLICY security_audit_log_master_admin_view
ON public.security_audit_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'master_admin'));

-- 9. Política: Sistema pode inserir logs (qualquer usuário autenticado)
CREATE POLICY security_audit_log_insert
ON public.security_audit_log
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- 10. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON public.security_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_action ON public.security_audit_log(action);

COMMENT ON TABLE public.security_audit_log IS 'Logs de auditoria de tentativas de acesso a rotas protegidas';
COMMENT ON COLUMN public.security_audit_log.action IS 'Ação tomada: blocked (bloqueado), allowed (permitido), unauthorized (não autorizado)';