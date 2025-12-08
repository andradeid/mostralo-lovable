-- =====================================================
-- CORREÇÃO DE SEGURANÇA: Política RLS Perigosa
-- =====================================================

-- 1. Remover a política perigosa que permite qualquer pessoa ver todos os pedidos
DROP POLICY IF EXISTS "Anyone can view order by ID for tracking" ON orders;

-- =====================================================
-- CORREÇÃO: store_id NULL na user_roles para store_admins
-- =====================================================

-- 2. Atualizar store_id para store_admins que têm loja mas store_id está NULL
UPDATE user_roles ur
SET store_id = (
  SELECT s.id FROM stores s WHERE s.owner_id = ur.user_id LIMIT 1
)
WHERE ur.role = 'store_admin'
AND ur.store_id IS NULL
AND EXISTS (SELECT 1 FROM stores s WHERE s.owner_id = ur.user_id);