
-- PARTE 1: Atualizar trigger para incluir 'professional'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_type public.user_type;
  v_approval_status text;
  v_role_type text;
BEGIN
  v_role_type := NEW.raw_user_meta_data->>'role_type';
  
  -- Incluir 'professional' na lista de roles especiais
  IF v_role_type IN ('delivery_driver', 'customer', 'attendant', 'salesperson', 'professional') THEN
    INSERT INTO public.profiles (id, email, full_name, user_type, approval_status)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NULL,
      'approved'
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name;
    
    RETURN NEW;
  END IF;

  IF NEW.email = 'admin@mostralo.com' THEN
    v_user_type := 'master_admin';
    v_approval_status := 'approved';
  ELSE
    v_user_type := 'store_admin';
    v_approval_status := 'pending';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, user_type, approval_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    v_user_type,
    v_approval_status
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    user_type = EXCLUDED.user_type,
    approval_status = EXCLUDED.approval_status;
  
  RETURN NEW;
END;
$$;

-- PARTE 2: Criar o profissional Hulk
DO $$
DECLARE
  v_user_id UUID;
  v_store_id UUID := '79fedd36-6e19-42d6-b331-79f9ad777180';
BEGIN
  v_user_id := gen_random_uuid();
  
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data, role, aud, 
    created_at, updated_at, is_sso_user, is_anonymous
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'hulkpro@email.com',
    crypt('102030', gen_salt('bf')),
    now(),
    '{"full_name": "Hulk", "role_type": "professional"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    'authenticated', 'authenticated', now(), now(), false, false
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    v_user_id, v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', 'hulkpro@email.com'),
    'email', v_user_id::text, now(), now(), now()
  );

  INSERT INTO user_roles (user_id, role, store_id)
  VALUES (v_user_id, 'professional', v_store_id);

  INSERT INTO professionals (
    store_id, user_id, name, specialty, 
    commission_type, commission_value, is_active
  ) VALUES (
    v_store_id, v_user_id, 'Hulk', 'Barbeiro', 
    'percentage', 50, true
  );

  RAISE NOTICE 'Profissional Hulk criado! User ID: %', v_user_id;
END $$;
