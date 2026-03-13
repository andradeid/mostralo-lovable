-- 1. Fix trigger: explicitly generate UUID for auth.users.id
CREATE OR REPLACE FUNCTION public.create_customer_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
      NEW.auth_user_id := existing_user_id;
    ELSE
      new_user_id := gen_random_uuid();
      
      INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_user_meta_data,
        role,
        aud
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
      
      INSERT INTO public.user_roles (user_id, role)
      VALUES (new_user_id, 'customer')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. Add INSERT policy for attendants on customers
CREATE POLICY "Attendants can create customers for their stores"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'attendant'
  )
);

-- 3. Add UPDATE policy for attendants on customers
CREATE POLICY "Attendants can update customers for their stores"
ON public.customers
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.customer_stores cs
    JOIN public.user_roles ur ON ur.store_id = cs.store_id
    WHERE cs.customer_id = customers.id
      AND ur.user_id = auth.uid()
      AND ur.role = 'attendant'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.customer_stores cs
    JOIN public.user_roles ur ON ur.store_id = cs.store_id
    WHERE cs.customer_id = customers.id
      AND ur.user_id = auth.uid()
      AND ur.role = 'attendant'
  )
);
