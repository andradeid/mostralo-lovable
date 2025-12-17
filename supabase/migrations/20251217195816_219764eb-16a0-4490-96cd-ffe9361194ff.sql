-- =============================================
-- TRIGGER PARA CONTAGEM DE USOS DE CUPONS
-- =============================================

-- Função para incrementar uso do cupom quando pagamento é aprovado
CREATE OR REPLACE FUNCTION increment_coupon_usage_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Só executa quando status muda para 'approved' E tem cupom
  IF NEW.status = 'approved' 
     AND NEW.coupon_id IS NOT NULL 
     AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Incrementa used_count na tabela coupons
    UPDATE coupons 
    SET used_count = COALESCE(used_count, 0) + 1,
        updated_at = NOW()
    WHERE id = NEW.coupon_id;
    
    -- Registra uso na tabela coupon_usages
    INSERT INTO coupon_usages (
      coupon_id,
      user_id,
      customer_id,
      discount_applied,
      original_price,
      final_price,
      user_agent
    ) VALUES (
      NEW.coupon_id,
      NEW.user_id,
      NULL,
      COALESCE(NEW.coupon_discount, 0),
      NEW.payment_amount + COALESCE(NEW.coupon_discount, 0),
      NEW.payment_amount,
      'Sistema - Aprovação de Pagamento'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS on_payment_approval_increment_coupon ON payment_approvals;

-- Criar trigger
CREATE TRIGGER on_payment_approval_increment_coupon
  AFTER UPDATE ON payment_approvals
  FOR EACH ROW
  EXECUTE FUNCTION increment_coupon_usage_on_approval();

-- =============================================
-- ATUALIZAR DADOS HISTÓRICOS
-- =============================================

-- Atualizar used_count baseado em aprovações existentes
UPDATE coupons c
SET used_count = (
  SELECT COUNT(*) 
  FROM payment_approvals pa 
  WHERE pa.coupon_id = c.id 
  AND pa.status = 'approved'
),
updated_at = NOW();

-- Inserir registros históricos em coupon_usages para aprovações que já existem
INSERT INTO coupon_usages (
  coupon_id,
  user_id,
  customer_id,
  discount_applied,
  original_price,
  final_price,
  user_agent,
  used_at
)
SELECT 
  pa.coupon_id,
  pa.user_id,
  NULL,
  COALESCE(pa.coupon_discount, 0),
  pa.payment_amount + COALESCE(pa.coupon_discount, 0),
  pa.payment_amount,
  'Sistema - Registro Histórico',
  pa.approved_at
FROM payment_approvals pa
WHERE pa.coupon_id IS NOT NULL
AND pa.status = 'approved'
AND NOT EXISTS (
  SELECT 1 FROM coupon_usages cu 
  WHERE cu.coupon_id = pa.coupon_id 
  AND cu.user_id = pa.user_id
);