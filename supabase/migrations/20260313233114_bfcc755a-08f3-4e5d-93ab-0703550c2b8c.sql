CREATE OR REPLACE FUNCTION public.sync_user_roles_from_profiles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.user_type = 'master_admin' THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = NEW.id
        AND role = 'master_admin'
        AND store_id IS NULL
    ) THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'master_admin');
    END IF;
  ELSIF NEW.user_type = 'store_admin' THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = NEW.id
        AND role = 'store_admin'
        AND store_id IS NULL
    ) THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'store_admin');
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;