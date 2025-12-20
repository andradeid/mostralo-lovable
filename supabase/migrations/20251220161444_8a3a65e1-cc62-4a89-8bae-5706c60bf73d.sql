-- Corrigir função create_customer_auth_user para usar schema extensions
CREATE OR REPLACE FUNCTION public.create_customer_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_user_id uuid;
  temp_email text;
BEGIN
  -- Só criar se não tiver auth_user_id
  IF NEW.auth_user_id IS NULL THEN
    -- Gerar email temporário baseado no telefone
    temp_email := 'cliente_' || NEW.phone || '@temp.mostralo.com';
    
    -- Criar usuário no auth.users usando schema extensions para pgcrypto
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
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO new_user_id;
    
    -- Se usuário foi criado, atualizar customer
    IF new_user_id IS NOT NULL THEN
      NEW.auth_user_id := new_user_id;
      
      -- Criar role de customer (sem store_id específico, é global)
      INSERT INTO public.user_roles (user_id, role)
      VALUES (new_user_id, 'customer')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;