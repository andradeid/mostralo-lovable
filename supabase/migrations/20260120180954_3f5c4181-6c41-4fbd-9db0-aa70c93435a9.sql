-- =============================================
-- FASE 1: Adicionar colunas de estoque às tabelas
-- =============================================

-- Adicionar colunas de controle de estoque na tabela products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS track_stock BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS stock_alert_threshold INTEGER DEFAULT 5;

-- Adicionar colunas de controle de estoque na tabela product_variants
ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS track_stock BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.products.track_stock IS 'Se true, o estoque deste produto é controlado';
COMMENT ON COLUMN public.products.stock_quantity IS 'Quantidade atual em estoque (NULL = ilimitado)';
COMMENT ON COLUMN public.products.stock_alert_threshold IS 'Quantidade mínima para alertar estoque baixo';

-- =============================================
-- FASE 2: Criar função RPC para decrementar estoque
-- =============================================

CREATE OR REPLACE FUNCTION public.decrement_product_stock(
  p_product_id UUID,
  p_variant_id UUID DEFAULT NULL,
  p_quantity INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_stock INTEGER;
  v_track_stock BOOLEAN;
  v_new_stock INTEGER;
BEGIN
  -- Verificar se é variante ou produto principal
  IF p_variant_id IS NOT NULL THEN
    -- Buscar dados da variante
    SELECT stock_quantity, track_stock 
    INTO v_current_stock, v_track_stock
    FROM product_variants 
    WHERE id = p_variant_id;
    
    -- Se não controla estoque, retornar sucesso
    IF v_track_stock = false OR v_track_stock IS NULL OR v_current_stock IS NULL THEN
      RETURN jsonb_build_object('success', true, 'message', 'Estoque não controlado');
    END IF;
    
    -- Verificar se há estoque suficiente
    IF v_current_stock < p_quantity THEN
      RETURN jsonb_build_object(
        'success', false, 
        'message', 'Estoque insuficiente', 
        'available', v_current_stock,
        'requested', p_quantity
      );
    END IF;
    
    -- Calcular novo estoque
    v_new_stock := v_current_stock - p_quantity;
    
    -- Atualizar estoque da variante
    UPDATE product_variants 
    SET stock_quantity = v_new_stock,
        updated_at = NOW()
    WHERE id = p_variant_id;
    
    -- Desativar variante se estoque zerou
    IF v_new_stock <= 0 THEN
      UPDATE product_variants SET is_available = false WHERE id = p_variant_id;
    END IF;
    
  ELSE
    -- Buscar dados do produto
    SELECT stock_quantity, track_stock 
    INTO v_current_stock, v_track_stock
    FROM products 
    WHERE id = p_product_id;
    
    -- Se não controla estoque, retornar sucesso
    IF v_track_stock = false OR v_track_stock IS NULL OR v_current_stock IS NULL THEN
      RETURN jsonb_build_object('success', true, 'message', 'Estoque não controlado');
    END IF;
    
    -- Verificar se há estoque suficiente
    IF v_current_stock < p_quantity THEN
      RETURN jsonb_build_object(
        'success', false, 
        'message', 'Estoque insuficiente', 
        'available', v_current_stock,
        'requested', p_quantity
      );
    END IF;
    
    -- Calcular novo estoque
    v_new_stock := v_current_stock - p_quantity;
    
    -- Atualizar estoque do produto
    UPDATE products 
    SET stock_quantity = v_new_stock,
        updated_at = NOW()
    WHERE id = p_product_id;
    
    -- Desativar produto se estoque zerou
    IF v_new_stock <= 0 THEN
      UPDATE products SET is_available = false WHERE id = p_product_id;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'previous_stock', v_current_stock,
    'new_stock', v_new_stock,
    'decremented', p_quantity,
    'message', 'Estoque atualizado com sucesso'
  );
END;
$$;

-- Conceder permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION public.decrement_product_stock(UUID, UUID, INTEGER) TO authenticated;

-- =============================================
-- FASE 3: Criar função para incrementar estoque (ajustes manuais)
-- =============================================

CREATE OR REPLACE FUNCTION public.increment_product_stock(
  p_product_id UUID,
  p_variant_id UUID DEFAULT NULL,
  p_quantity INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_stock INTEGER;
  v_track_stock BOOLEAN;
  v_new_stock INTEGER;
BEGIN
  IF p_variant_id IS NOT NULL THEN
    SELECT stock_quantity, track_stock 
    INTO v_current_stock, v_track_stock
    FROM product_variants 
    WHERE id = p_variant_id;
    
    IF v_track_stock = false OR v_track_stock IS NULL THEN
      RETURN jsonb_build_object('success', false, 'message', 'Produto não controla estoque');
    END IF;
    
    v_current_stock := COALESCE(v_current_stock, 0);
    v_new_stock := v_current_stock + p_quantity;
    
    UPDATE product_variants 
    SET stock_quantity = v_new_stock,
        is_available = true,
        updated_at = NOW()
    WHERE id = p_variant_id;
  ELSE
    SELECT stock_quantity, track_stock 
    INTO v_current_stock, v_track_stock
    FROM products 
    WHERE id = p_product_id;
    
    IF v_track_stock = false OR v_track_stock IS NULL THEN
      RETURN jsonb_build_object('success', false, 'message', 'Produto não controla estoque');
    END IF;
    
    v_current_stock := COALESCE(v_current_stock, 0);
    v_new_stock := v_current_stock + p_quantity;
    
    UPDATE products 
    SET stock_quantity = v_new_stock,
        is_available = true,
        updated_at = NOW()
    WHERE id = p_product_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'previous_stock', v_current_stock,
    'new_stock', v_new_stock,
    'incremented', p_quantity,
    'message', 'Estoque atualizado com sucesso'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_product_stock(UUID, UUID, INTEGER) TO authenticated;