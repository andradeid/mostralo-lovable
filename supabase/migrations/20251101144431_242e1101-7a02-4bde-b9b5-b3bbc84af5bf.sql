-- Adicionar campos de bloqueio e exclusão na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blocked_by UUID REFERENCES auth.users(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blocked_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Criar tabela de auditoria de ações administrativas
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  target_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('block', 'unblock', 'delete', 'restore', 'edit', 'impersonate', 'role_change')),
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_target_user ON admin_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_admin ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON admin_audit_log(created_at DESC);

-- RLS para admin_audit_log
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master admins podem ver todos os logs"
ON admin_audit_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'master_admin'
  )
);

CREATE POLICY "Sistema pode inserir logs"
ON admin_audit_log FOR INSERT
WITH CHECK (true);

-- Função para registrar auditoria
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action TEXT,
  p_target_user_id UUID,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO admin_audit_log (admin_id, target_user_id, action, details)
  VALUES (auth.uid(), p_target_user_id, p_action, p_details);
END;
$$;

-- Função para revogar sessões de usuários bloqueados
CREATE OR REPLACE FUNCTION revoke_blocked_user_sessions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.is_blocked = true AND (OLD.is_blocked = false OR OLD.is_blocked IS NULL) THEN
    -- Registrar bloqueio no log
    PERFORM log_admin_action('block', NEW.id, jsonb_build_object('reason', NEW.blocked_reason));
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger para bloquear sessões
DROP TRIGGER IF EXISTS on_user_blocked ON profiles;
CREATE TRIGGER on_user_blocked
  AFTER UPDATE OF is_blocked ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION revoke_blocked_user_sessions();

-- RLS: Bloquear acesso de usuários bloqueados
DROP POLICY IF EXISTS "Blocked users cannot access" ON profiles;
CREATE POLICY "Blocked users cannot access"
ON profiles FOR ALL
USING (
  (NOT is_blocked AND NOT is_deleted) OR 
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.user_type = 'master_admin'
  )
);

-- View unificada de todos os usuários (apenas para master_admins)
CREATE OR REPLACE VIEW unified_users_view AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.user_type,
  p.avatar_url,
  p.created_at,
  p.updated_at,
  p.is_blocked,
  p.blocked_at,
  p.blocked_reason,
  p.is_deleted,
  p.deleted_at,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'role', ur.role,
        'store_id', ur.store_id,
        'store_name', s.name
      )
    ) FILTER (WHERE ur.role IS NOT NULL),
    '[]'::json
  ) as roles,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'customer_id', c.id,
        'phone', c.phone,
        'address', c.address
      )
    ) FILTER (WHERE c.id IS NOT NULL),
    '[]'::json
  ) as customer_data
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
LEFT JOIN stores s ON s.id = ur.store_id
LEFT JOIN customers c ON c.auth_user_id = p.id
GROUP BY p.id, p.email, p.full_name, p.user_type, p.avatar_url, 
         p.created_at, p.updated_at, p.is_blocked, p.blocked_at, 
         p.blocked_reason, p.is_deleted, p.deleted_at;