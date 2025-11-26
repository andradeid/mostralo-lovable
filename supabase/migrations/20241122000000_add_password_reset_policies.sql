-- Migration: Add Password Reset Policies
-- Descrição: Políticas RLS para permitir Master Admins resetarem senhas
-- Data: 2024-11-22

-- =====================================================
-- 1. GARANTIR QUE admin_audit_log EXISTE
-- =====================================================

-- Verificar se a tabela admin_audit_log existe
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_audit_log') THEN
    CREATE TABLE IF NOT EXISTS public.admin_audit_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      details JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Criar índices
    CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON public.admin_audit_log(admin_id);
    CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target_user_id ON public.admin_audit_log(target_user_id);
    CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON public.admin_audit_log(action);
  END IF;
END $$;

-- =====================================================
-- 2. RLS POLICIES PARA admin_audit_log
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- DROP políticas existentes se houver
DROP POLICY IF EXISTS "admin_audit_log_insert_policy" ON public.admin_audit_log;
DROP POLICY IF EXISTS "admin_audit_log_select_policy" ON public.admin_audit_log;
DROP POLICY IF EXISTS "admin_audit_log_select_master_admin" ON public.admin_audit_log;

-- Política: Master Admins podem inserir registros de auditoria
CREATE POLICY "admin_audit_log_insert_policy"
  ON public.admin_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'master_admin'
    )
  );

-- Política: Master Admins podem ver todos os logs
CREATE POLICY "admin_audit_log_select_master_admin"
  ON public.admin_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'master_admin'
    )
  );

-- Política: Store Admins podem ver apenas logs relacionados a eles
CREATE POLICY "admin_audit_log_select_store_admin"
  ON public.admin_audit_log
  FOR SELECT
  TO authenticated
  USING (
    admin_id = auth.uid() OR
    target_user_id = auth.uid()
  );

-- =====================================================
-- 3. GRANTS PARA admin_audit_log
-- =====================================================

-- Garantir que usuários autenticados podem usar a tabela
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT INSERT ON public.admin_audit_log TO authenticated;
GRANT UPDATE ON public.admin_audit_log TO authenticated;
GRANT DELETE ON public.admin_audit_log TO authenticated;

-- Service role tem acesso total (usado pela Edge Function)
GRANT ALL ON public.admin_audit_log TO service_role;

-- =====================================================
-- 4. POLÍTICAS ADICIONAIS PARA profiles
-- =====================================================

-- Garantir que Master Admins podem ver todos os perfis
DROP POLICY IF EXISTS "profiles_select_master_admin" ON public.profiles;

CREATE POLICY "profiles_select_master_admin"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles
      WHERE user_type = 'master_admin'
    )
  );

-- =====================================================
-- 5. FUNCTION HELPER PARA VERIFICAR MASTER ADMIN
-- =====================================================

-- Função para verificar se o usuário atual é master_admin
CREATE OR REPLACE FUNCTION public.is_master_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND user_type = 'master_admin'
  );
END;
$$;

-- Grant para função
GRANT EXECUTE ON FUNCTION public.is_master_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_master_admin() TO anon;

-- =====================================================
-- 6. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE public.admin_audit_log IS 'Log de auditoria de ações administrativas, incluindo reset de senhas';
COMMENT ON COLUMN public.admin_audit_log.admin_id IS 'ID do admin que executou a ação';
COMMENT ON COLUMN public.admin_audit_log.action IS 'Tipo de ação: password_reset, user_block, user_delete, etc';
COMMENT ON COLUMN public.admin_audit_log.target_user_id IS 'ID do usuário afetado pela ação';
COMMENT ON COLUMN public.admin_audit_log.details IS 'Detalhes da ação em formato JSON';

COMMENT ON FUNCTION public.is_master_admin() IS 'Verifica se o usuário autenticado é master_admin';

-- =====================================================
-- 7. VALIDAÇÃO E VERIFICAÇÃO
-- =====================================================

-- Verificar se as policies foram criadas
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'admin_audit_log';
  
  IF policy_count < 3 THEN
    RAISE WARNING 'Esperado pelo menos 3 políticas RLS para admin_audit_log, encontrado: %', policy_count;
  ELSE
    RAISE NOTICE 'Políticas RLS criadas com sucesso para admin_audit_log: % políticas', policy_count;
  END IF;
END $$;

-- =====================================================
-- 8. ÍNDICES ADICIONAIS PARA PERFORMANCE
-- =====================================================

-- Índice para buscar por tipo de ação
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action_created 
  ON public.admin_audit_log(action, created_at DESC);

-- Índice para buscar logs de um usuário específico
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target_created 
  ON public.admin_audit_log(target_user_id, created_at DESC);

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 20241122000000_add_password_reset_policies aplicada com sucesso!';
  RAISE NOTICE '✅ Políticas RLS criadas para admin_audit_log';
  RAISE NOTICE '✅ Função is_master_admin() criada';
  RAISE NOTICE '✅ Índices de performance criados';
END $$;

