
-- Sincronizar agendamentos órfãos existentes (Luiza Garrido)
DO $$
DECLARE
  v_booking RECORD;
  v_customer_id UUID;
  v_normalized_phone TEXT;
  v_label_id UUID;
BEGIN
  FOR v_booking IN 
    SELECT id, customer_name, customer_phone, customer_email, store_id
    FROM bookings 
    WHERE customer_id IS NULL
  LOOP
    -- Normalizar telefone
    v_normalized_phone := REGEXP_REPLACE(v_booking.customer_phone, '[^0-9]', '', 'g');
    
    -- Buscar cliente existente
    SELECT id INTO v_customer_id
    FROM customers
    WHERE phone = v_normalized_phone
       OR phone = v_booking.customer_phone
    LIMIT 1;
    
    -- Se não encontrou, criar (desabilitando trigger de auth temporariamente)
    IF v_customer_id IS NULL THEN
      -- Desabilitar trigger de criação automática de auth
      ALTER TABLE customers DISABLE TRIGGER create_customer_auth_on_insert;
      
      INSERT INTO customers (name, phone, email)
      VALUES (v_booking.customer_name, v_normalized_phone, v_booking.customer_email)
      RETURNING id INTO v_customer_id;
      
      -- Reabilitar trigger
      ALTER TABLE customers ENABLE TRIGGER create_customer_auth_on_insert;
    END IF;
    
    -- Atualizar booking
    UPDATE bookings SET customer_id = v_customer_id WHERE id = v_booking.id;
    
    -- Garantir customer_stores
    INSERT INTO customer_stores (customer_id, store_id)
    VALUES (v_customer_id, v_booking.store_id)
    ON CONFLICT (customer_id, store_id) DO NOTHING;
    
    -- Aplicar etiqueta "Agendamento Online"
    SELECT id INTO v_label_id
    FROM customer_labels
    WHERE store_id = v_booking.store_id
      AND name = 'Agendamento Online'
    LIMIT 1;
    
    IF v_label_id IS NOT NULL THEN
      INSERT INTO customer_label_assignments (customer_id, label_id, store_id)
      VALUES (v_customer_id, v_label_id, v_booking.store_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;
