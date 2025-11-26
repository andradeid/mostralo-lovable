-- Fase 1: Corrigir dados do Peter - vincular à loja Ingá Beach

-- Atualizar user_role do Peter para vincular à loja
DO $$
BEGIN
  UPDATE user_roles
  SET store_id = '56922778-873a-4196-8b8c-dce112d55fae'
  WHERE user_id = '9c8c6ab6-2ff4-4731-9d35-54581a1ab036'
    AND role = 'delivery_driver';

  -- Criar configuração de ganhos com valores da contra-proposta (R$ 5 fixo)
  INSERT INTO driver_earnings_config (driver_id, store_id, payment_type, fixed_amount, is_active)
  VALUES ('9c8c6ab6-2ff4-4731-9d35-54581a1ab036', '56922778-873a-4196-8b8c-dce112d55fae', 'fixed', 5, true)
  ON CONFLICT (driver_id, store_id) 
  DO UPDATE SET 
    payment_type = EXCLUDED.payment_type,
    fixed_amount = EXCLUDED.fixed_amount,
    is_active = true,
    updated_at = now();
END $$;