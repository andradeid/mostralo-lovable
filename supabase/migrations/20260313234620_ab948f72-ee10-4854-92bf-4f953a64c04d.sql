-- 1) Tornar a policy de INSERT mais resiliente para equipe (inclui fallback por profiles.user_type)
DROP POLICY IF EXISTS "Team can create customers" ON public.customers;
CREATE POLICY "Team can create customers"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'store_admin')
  OR public.has_role(auth.uid(), 'attendant')
  OR public.has_role(auth.uid(), 'master_admin')
  OR EXISTS (
    SELECT 1
    FROM public.stores s
    WHERE s.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.user_type IN ('store_admin', 'master_admin')
  )
);

-- 2) Ajustar trigger: só auto-criar auth user para sessão da equipe;
-- para demais casos mantém auth_user_id nulo (compatível com policy pública existente)
CREATE OR REPLACE FUNCTION public.create_customer_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  new_user_id uuid;
  temp_email text;
  existing_user_id uuid;
  existing_role_id uuid;
  can_auto_create_auth boolean;
BEGIN
  IF NEW.auth_user_id IS NULL THEN
    can_auto_create_auth :=
      auth.uid() IS NOT NULL AND (
        public.has_role(auth.uid(), 'store_admin')
        OR public.has_role(auth.uid(), 'attendant')
        OR public.has_role(auth.uid(), 'master_admin')
        OR EXISTS (
          SELECT 1
          FROM public.stores s
          WHERE s.owner_id = auth.uid()
        )
      );

    -- Se não for usuário da equipe, mantém auth_user_id nulo
    IF NOT can_auto_create_auth THEN
      RETURN NEW;
    END IF;

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
        jsonb_build_object(
          'full_name', NEW.name,
          'phone', NEW.phone,
          'role_type', 'customer'
        ),
        'authenticated',
        'authenticated'
      );

      NEW.auth_user_id := new_user_id;

      SELECT id INTO existing_role_id
      FROM public.user_roles
      WHERE user_id = new_user_id
        AND role = 'customer'
        AND store_id IS NULL
      LIMIT 1;

      IF existing_role_id IS NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (new_user_id, 'customer');
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;