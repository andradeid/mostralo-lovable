-- 1. Adicionar constraint UNIQUE se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_roles_user_id_role_key' 
    AND conrelid = 'public.user_roles'::regclass
  ) THEN
    ALTER TABLE public.user_roles 
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
  END IF;
END$$;

-- 2. Backfill: Popular user_roles com dados existentes de profiles
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'master_admin'::app_role
FROM public.profiles p
WHERE p.user_type = 'master_admin'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'store_admin'::app_role
FROM public.profiles p
WHERE p.user_type = 'store_admin'
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Função para sincronizar roles automaticamente quando user_type mudar
CREATE OR REPLACE FUNCTION public.sync_user_roles_from_profiles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_type = 'master_admin' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'master_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF NEW.user_type = 'store_admin' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'store_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Trigger para executar a sincronização
DROP TRIGGER IF EXISTS trg_sync_user_roles ON public.profiles;
CREATE TRIGGER trg_sync_user_roles
AFTER INSERT OR UPDATE OF user_type ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_user_roles_from_profiles();

-- 5. Habilitar RLS em user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 6. Política: master_admin pode ver todas as roles
DROP POLICY IF EXISTS master_admin_view_roles ON public.user_roles;
CREATE POLICY master_admin_view_roles
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'master_admin'));

-- 7. Política: usuários podem ver suas próprias roles
DROP POLICY IF EXISTS self_view_roles ON public.user_roles;
CREATE POLICY self_view_roles
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 8. Política: master_admin pode ver todas as stores
DROP POLICY IF EXISTS master_admin_view_stores ON public.stores;
CREATE POLICY master_admin_view_stores
ON public.stores
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'master_admin'));

-- 9. Política: master_admin pode gerenciar todas as stores
DROP POLICY IF EXISTS master_admin_manage_stores ON public.stores;
CREATE POLICY master_admin_manage_stores
ON public.stores
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'master_admin'));