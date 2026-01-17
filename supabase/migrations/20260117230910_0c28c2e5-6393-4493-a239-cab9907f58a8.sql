
-- Corrigir bookings existentes sem customer_id
-- Vincular bookings ao cliente correto baseado no telefone

-- 1. Atualizar bookings que têm telefone mas não têm customer_id
UPDATE bookings b
SET customer_id = c.id
FROM customers c
WHERE b.customer_id IS NULL
  AND b.customer_phone IS NOT NULL
  AND (
    c.phone = REPLACE(REPLACE(REPLACE(REPLACE(b.customer_phone, '(', ''), ')', ''), '-', ''), ' ', '')
    OR c.phone = b.customer_phone
  );

-- 2. Criar função para manter bookings vinculados automaticamente
CREATE OR REPLACE FUNCTION public.link_booking_to_customer()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_id UUID;
  v_normalized_phone TEXT;
  v_label_id UUID;
BEGIN
  -- Se já tem customer_id, não fazer nada
  IF NEW.customer_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Normalizar telefone
  v_normalized_phone := REGEXP_REPLACE(NEW.customer_phone, '[^0-9]', '', 'g');
  
  -- Buscar cliente existente
  SELECT id INTO v_customer_id
  FROM customers
  WHERE phone = v_normalized_phone
     OR phone = NEW.customer_phone
  LIMIT 1;
  
  -- Se encontrou, vincular
  IF v_customer_id IS NOT NULL THEN
    NEW.customer_id := v_customer_id;
    
    -- Garantir customer_stores
    INSERT INTO customer_stores (customer_id, store_id)
    VALUES (v_customer_id, NEW.store_id)
    ON CONFLICT (customer_id, store_id) DO NOTHING;
    
    -- Aplicar etiqueta "Agendamento Online" se existir
    SELECT id INTO v_label_id
    FROM customer_labels
    WHERE store_id = NEW.store_id
      AND name = 'Agendamento Online'
    LIMIT 1;
    
    IF v_label_id IS NOT NULL THEN
      INSERT INTO customer_label_assignments (customer_id, label_id, store_id)
      VALUES (v_customer_id, v_label_id, NEW.store_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar trigger para novos bookings
DROP TRIGGER IF EXISTS trg_link_booking_to_customer ON bookings;
CREATE TRIGGER trg_link_booking_to_customer
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.link_booking_to_customer();

-- 4. Aplicar etiqueta "Agendamento Online" para clientes que já fizeram agendamentos
INSERT INTO customer_label_assignments (customer_id, label_id, store_id)
SELECT DISTINCT 
  b.customer_id,
  cl.id as label_id,
  b.store_id
FROM bookings b
JOIN customer_labels cl ON cl.store_id = b.store_id AND cl.name = 'Agendamento Online'
WHERE b.customer_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM customer_label_assignments cla
    WHERE cla.customer_id = b.customer_id
      AND cla.label_id = cl.id
  );

-- 5. Garantir customer_stores para clientes com bookings
INSERT INTO customer_stores (customer_id, store_id)
SELECT DISTINCT b.customer_id, b.store_id
FROM bookings b
WHERE b.customer_id IS NOT NULL
ON CONFLICT (customer_id, store_id) DO NOTHING;
