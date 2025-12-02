-- Recriar função calculate_driver_earnings com suporte a minimum_guaranteed
CREATE OR REPLACE FUNCTION public.calculate_driver_earnings()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order RECORD;
  v_config RECORD;
  v_earnings NUMERIC;
BEGIN
  -- Apenas processar quando status mudar para 'delivered'
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    -- Buscar informações do pedido
    SELECT id, delivery_fee, store_id 
    INTO v_order
    FROM orders 
    WHERE id = NEW.order_id;
    
    -- Buscar configuração do entregador
    SELECT * INTO v_config
    FROM driver_earnings_config
    WHERE driver_id = NEW.delivery_driver_id 
    AND store_id = NEW.store_id
    AND is_active = true;
    
    -- Calcular ganho baseado no tipo de pagamento
    IF v_config IS NULL THEN
      -- Sem config: paga taxa integral
      v_earnings := v_order.delivery_fee;
    ELSIF v_config.payment_type = 'fixed' THEN
      -- FIXED: paga valor fixo configurado
      v_earnings := COALESCE(v_config.fixed_amount, v_order.delivery_fee);
    ELSIF v_config.payment_type = 'minimum_guaranteed' THEN
      -- MINIMUM_GUARANTEED: paga o MAIOR entre taxa e mínimo
      v_earnings := GREATEST(v_order.delivery_fee, COALESCE(v_config.minimum_amount, 0));
    ELSIF v_config.payment_type = 'commission' THEN
      -- COMMISSION: paga percentual da taxa
      v_earnings := v_order.delivery_fee * (COALESCE(v_config.commission_percentage, 100) / 100);
    ELSE
      -- Fallback: paga taxa integral
      v_earnings := v_order.delivery_fee;
    END IF;
    
    -- Registrar ganho
    INSERT INTO driver_earnings (
      driver_id,
      store_id,
      order_id,
      delivery_assignment_id,
      delivery_fee,
      earnings_amount,
      payment_type,
      commission_percentage,
      minimum_amount,
      delivered_at
    ) VALUES (
      NEW.delivery_driver_id,
      NEW.store_id,
      NEW.order_id,
      NEW.id,
      v_order.delivery_fee,
      v_earnings,
      COALESCE(v_config.payment_type, 'fixed'::payment_type),
      v_config.commission_percentage,
      v_config.minimum_amount,
      COALESCE(NEW.delivered_at, now())
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Corrigir pedido #0030: atualizar earnings_amount para R$ 20,00 (mínimo garantido)
UPDATE driver_earnings 
SET 
  earnings_amount = 20.00,
  minimum_amount = 20.00
WHERE order_id = '1d1da6f8-40e7-4e23-a5fa-4d6f4fd8ed93';