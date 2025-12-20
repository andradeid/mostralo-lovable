CREATE OR REPLACE FUNCTION public.notify_master_new_lead()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM net.http_post(
    url := 'https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/send-master-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'type', 'new_lead',
      'data', jsonb_build_object(
        'id', NEW.id,
        'name', NEW.name,
        'company_name', NEW.company_name,
        'city', NEW.city,
        'state', NEW.state,
        'phone', NEW.phone,
        'email', NEW.email,
        'source', NEW.source,
        'uses_ifood', NEW.uses_ifood
      )
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erro ao enviar notificação de novo lead: %', SQLERRM;
  RETURN NEW;
END;
$function$;