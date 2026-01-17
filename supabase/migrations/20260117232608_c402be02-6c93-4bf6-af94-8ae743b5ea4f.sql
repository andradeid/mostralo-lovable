
-- Primeiro, corrigir a função create_customer_auth_user para lidar corretamente com conflitos
CREATE OR REPLACE FUNCTION public.create_customer_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_user_id uuid;
  temp_email text;
  existing_user_id uuid;
BEGIN
  -- Só criar se não tiver auth_user_id
  IF NEW.auth_user_id IS NULL THEN
    -- Gerar email temporário baseado no telefone
    temp_email := 'cliente_' || NEW.phone || '@temp.mostralo.com';
    
    -- Verificar se já existe usuário com esse email
    SELECT id INTO existing_user_id
    FROM auth.users
    WHERE email = temp_email
    LIMIT 1;
    
    IF existing_user_id IS NOT NULL THEN
      -- Já existe, apenas vincular
      NEW.auth_user_id := existing_user_id;
    ELSE
      -- Criar novo usuário
      INSERT INTO auth.users (
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_user_meta_data,
        role,
        aud
      )
      VALUES (
        '00000000-0000-0000-0000-000000000000',
        temp_email,
        extensions.crypt('102030', extensions.gen_salt('bf')),
        now(),
        jsonb_build_object('full_name', NEW.name, 'phone', NEW.phone),
        'authenticated',
        'authenticated'
      )
      RETURNING id INTO new_user_id;
      
      -- Se usuário foi criado, atualizar customer
      IF new_user_id IS NOT NULL THEN
        NEW.auth_user_id := new_user_id;
        
        -- Criar role de customer
        INSERT INTO public.user_roles (user_id, role)
        VALUES (new_user_id, 'customer')
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Melhorar trigger para CRIAR cliente se não existir (não apenas vincular)
CREATE OR REPLACE FUNCTION public.link_booking_to_customer()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_id UUID;
  v_normalized_phone TEXT;
  v_label_id UUID;
BEGIN
  -- Se já tem customer_id, apenas garantir etiqueta e retornar
  IF NEW.customer_id IS NOT NULL THEN
    -- Garantir customer_stores
    INSERT INTO customer_stores (customer_id, store_id)
    VALUES (NEW.customer_id, NEW.store_id)
    ON CONFLICT (customer_id, store_id) DO NOTHING;
    
    -- Aplicar etiqueta "Agendamento Online"
    SELECT id INTO v_label_id
    FROM customer_labels
    WHERE store_id = NEW.store_id
      AND name = 'Agendamento Online'
    LIMIT 1;
    
    IF v_label_id IS NOT NULL THEN
      INSERT INTO customer_label_assignments (customer_id, label_id, store_id)
      VALUES (NEW.customer_id, v_label_id, NEW.store_id)
      ON CONFLICT DO NOTHING;
    END IF;
    
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
  
  -- Se NÃO encontrou, CRIAR o cliente (sem auth_user_id por enquanto)
  IF v_customer_id IS NULL THEN
    -- Desabilitar temporariamente o trigger de auth para evitar criação automática de login
    -- Clientes de agendamento podem criar login depois se quiserem
    INSERT INTO customers (name, phone, email, auth_user_id)
    VALUES (
      NEW.customer_name,
      v_normalized_phone,
      NEW.customer_email,
      NULL -- Explicitamente NULL para não disparar trigger de auth
    )
    RETURNING id INTO v_customer_id;
  END IF;
  
  -- Vincular booking ao cliente
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar trigger
DROP TRIGGER IF EXISTS trigger_link_booking_to_customer ON bookings;
CREATE TRIGGER trigger_link_booking_to_customer
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION link_booking_to_customer();
