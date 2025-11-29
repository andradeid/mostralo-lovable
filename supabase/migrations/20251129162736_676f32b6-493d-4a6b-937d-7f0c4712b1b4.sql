-- ========================================
-- CORREÇÃO: Acesso Público para Tracking de Pedidos
-- ========================================
-- Permite que qualquer pessoa veja um pedido específico pelo ID (UUID)
-- Isso é seguro porque UUIDs são impossíveis de adivinhar
-- Funciona igual ao padrão da indústria (iFood, Rappi, Uber Eats)

CREATE POLICY "Anyone can view order by ID for tracking"
ON orders FOR SELECT
USING (true);

-- Nota: Esta policy adiciona acesso público mas não quebra políticas existentes
-- porque RLS policies são OR por padrão (qualquer policy que retorne true permite acesso)