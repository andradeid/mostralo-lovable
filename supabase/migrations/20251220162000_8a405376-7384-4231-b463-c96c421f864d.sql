-- Criar auth_user_id para cliente Marcos Andrade (61994009368) - SEM role
DO $$
DECLARE
  new_user_id uuid;
  customer_record RECORD;
  temp_email text;
BEGIN
  -- Buscar o cliente
  SELECT id, name, phone, email INTO customer_record
  FROM customers
  WHERE phone = '61994009368';
  
  IF customer_record.id IS NULL THEN
    RAISE EXCEPTION 'Cliente não encontrado';
  END IF;
  
  -- Gerar email temporário único
  temp_email := 'cliente_61994009368@temp.mostralo.com';
  
  -- Gerar novo UUID para o usuário
  new_user_id := gen_random_uuid();
  
  -- Criar novo usuário no auth.users com senha padrão 102030
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    role,
    aud,
    created_at,
    updated_at
  )
  VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    temp_email,
    extensions.crypt('102030', extensions.gen_salt('bf')),
    now(),
    jsonb_build_object('full_name', customer_record.name, 'phone', customer_record.phone),
    'authenticated',
    'authenticated',
    now(),
    now()
  );
  
  -- Atualizar o customer com o auth_user_id
  UPDATE customers
  SET auth_user_id = new_user_id, updated_at = now()
  WHERE phone = '61994009368';
  
  RAISE NOTICE 'Cliente Marcos Andrade atualizado! auth_user_id: %, senha: 102030', new_user_id;
END;
$$;