-- Atualizar a função handle_new_user() para detectar role_type e evitar criar store_admin automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_type public.user_type;
  v_approval_status text;
  v_role_type text;
BEGIN
  -- Verificar role_type nos metadados
  v_role_type := NEW.raw_user_meta_data->>'role_type';
  
  -- Se for delivery_driver, customer ou attendant, criar profile SEM user_type
  -- Isso evita que o trigger trg_sync_user_roles crie uma role store_admin
  IF v_role_type IN ('delivery_driver', 'customer', 'attendant') THEN
    INSERT INTO public.profiles (id, email, full_name, user_type, approval_status)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NULL,  -- SEM user_type para essas roles
      'approved'
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name;
    
    RETURN NEW;
  END IF;

  -- Lógica original para admins
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
$function$;