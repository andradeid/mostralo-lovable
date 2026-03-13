
CREATE OR REPLACE FUNCTION public.create_customer_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id uuid;
  temp_email text;
  existing_user_id uuid;
  existing_role_id uuid;
BEGIN
  IF NEW.auth_user_id IS NULL THEN
    temp_email := 'cliente_' || NEW.phone || '@temp.mostralo.com';
    
    SELECT id INTO existing_user_id
    FROM auth.users
    WHERE email = temp_email
    LIMIT 1;
    
    IF existing_user_id IS NOT NULL THEN
      NEW.auth_user_id := existing_user_id;
    ELSE
      new_user_id := gen_random_uuid();
      
      INSERT INTO auth.users (
        id, instance_id, email, encrypted_password,
        email_confirmed_at, raw_user_meta_data, role, aud
      )
      VALUES (
        new_user_id,
        '00000000-0000-0000-0000-000000000000',
        temp_email,
        extensions.crypt('102030', extensions.gen_salt('bf')),
        now(),
        jsonb_build_object('full_name', NEW.name, 'phone', NEW.phone),
        'authenticated',
        'authenticated'
      );
      
      NEW.auth_user_id := new_user_id;
      
      -- Check if role already exists before inserting (avoid ON CONFLICT issues with NULLs)
      SELECT id INTO existing_role_id
      FROM public.user_roles
      WHERE user_id = new_user_id AND role = 'customer' AND store_id IS NULL
      LIMIT 1;
      
      IF existing_role_id IS NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (new_user_id, 'customer');
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;
