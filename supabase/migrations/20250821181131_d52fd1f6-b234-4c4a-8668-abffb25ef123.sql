-- Melhorar o trigger para conectar perfis existentes com usuários recém-criados

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $function$
BEGIN
  -- Verificar se já existe um perfil com esse email
  IF EXISTS (SELECT 1 FROM public.profiles WHERE email = NEW.email) THEN
    -- Atualizar o perfil existente com o novo ID do usuário
    UPDATE public.profiles 
    SET id = NEW.id, 
        full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
        updated_at = now()
    WHERE email = NEW.email;
  ELSE
    -- Criar novo perfil se não existir
    INSERT INTO public.profiles (id, email, full_name, user_type)
    VALUES (
      NEW.id, 
      NEW.email,
      NEW.raw_user_meta_data->>'full_name',
      CASE 
        WHEN NEW.email = 'admin@mostralo.com' THEN 'master_admin'::user_type
        ELSE 'store_admin'::user_type
      END
    );
  END IF;
  
  RETURN NEW;
END;
$function$;