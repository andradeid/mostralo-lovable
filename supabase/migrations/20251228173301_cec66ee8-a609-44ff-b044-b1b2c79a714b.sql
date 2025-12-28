-- Inserir etiqueta "Cardápio na Mesa" para lojas existentes que ainda não têm
INSERT INTO customer_labels (store_id, name, color, label_type, is_system)
SELECT id, 'Cardápio na Mesa', '#8b5cf6', 'channel', true
FROM stores
WHERE NOT EXISTS (
  SELECT 1 FROM customer_labels 
  WHERE store_id = stores.id AND name = 'Cardápio na Mesa'
);

-- Atualizar função create_default_customer_labels() para incluir "Cardápio na Mesa"
CREATE OR REPLACE FUNCTION public.create_default_customer_labels()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO customer_labels (store_id, name, color, label_type, is_system) VALUES
    (NEW.id, 'E-commerce', '#3b82f6', 'channel', true),
    (NEW.id, 'Totem', '#f97316', 'channel', true),
    (NEW.id, 'Cardápio na Mesa', '#8b5cf6', 'channel', true),
    (NEW.id, 'iFood', '#ea1d2c', 'channel', true),
    (NEW.id, 'Balcão', '#10b981', 'channel', true),
    (NEW.id, 'Delivery', '#8b5cf6', 'channel', true),
    (NEW.id, 'Agendamento Online', '#22c55e', 'channel', true),
    (NEW.id, 'VIP', '#fbbf24', 'status', true),
    (NEW.id, 'Novo', '#06b6d4', 'status', true),
    (NEW.id, 'Frequente', '#ec4899', 'status', true);
  RETURN NEW;
END;
$$;