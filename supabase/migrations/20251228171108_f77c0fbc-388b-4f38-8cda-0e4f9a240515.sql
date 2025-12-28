-- Adicionar etiquetas "iFood" e "Balcão" para lojas existentes
INSERT INTO customer_labels (store_id, name, color, label_type, is_system)
SELECT s.id, 'iFood', '#EA1D2C', 'channel', true
FROM stores s
WHERE NOT EXISTS (
  SELECT 1 FROM customer_labels cl 
  WHERE cl.store_id = s.id AND cl.name = 'iFood'
);

INSERT INTO customer_labels (store_id, name, color, label_type, is_system)
SELECT s.id, 'Balcão', '#6B7280', 'channel', true
FROM stores s
WHERE NOT EXISTS (
  SELECT 1 FROM customer_labels cl 
  WHERE cl.store_id = s.id AND cl.name = 'Balcão'
);

-- Atualizar a função create_default_customer_labels para incluir iFood e Balcão
CREATE OR REPLACE FUNCTION public.create_default_customer_labels()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Etiquetas de origem
  INSERT INTO customer_labels (store_id, name, color, label_type, is_system)
  VALUES 
    (NEW.id, 'Agendamento Online', '#10B981', 'origin', true),
    (NEW.id, 'WhatsApp', '#25D366', 'origin', true),
    (NEW.id, 'Loja Física', '#6366F1', 'origin', true),
    (NEW.id, 'Indicação', '#F59E0B', 'origin', true),
    (NEW.id, 'Redes Sociais', '#EC4899', 'origin', true);
  
  -- Etiquetas de canal
  INSERT INTO customer_labels (store_id, name, color, label_type, is_system)
  VALUES 
    (NEW.id, 'Delivery', '#EF4444', 'channel', true),
    (NEW.id, 'Totem', '#8B5CF6', 'channel', true),
    (NEW.id, 'E-commerce', '#3B82F6', 'channel', true),
    (NEW.id, 'Balcão', '#6B7280', 'channel', true),
    (NEW.id, 'iFood', '#EA1D2C', 'channel', true);
  
  RETURN NEW;
END;
$$;