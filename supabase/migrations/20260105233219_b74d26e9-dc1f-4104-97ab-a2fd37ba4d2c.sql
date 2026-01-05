-- PARTE 1: Corrigir política RLS para permitir UPDATE público por token
DROP POLICY IF EXISTS "Allow public update by token" ON booking_reviews;

CREATE POLICY "Allow public update by token" ON booking_reviews
  FOR UPDATE
  TO public
  USING (
    token IS NOT NULL 
    AND reviewed_at IS NULL
  )
  WITH CHECK (
    rating IS NOT NULL 
    AND rating >= 1 
    AND rating <= 5
  );

-- PARTE 2: Habilitar extensão pg_net para chamadas HTTP assíncronas
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- PARTE 3: Função que será chamada pelo trigger
CREATE OR REPLACE FUNCTION public.trigger_booking_review_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Somente quando status muda para 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Chamar Edge Function via pg_net
    PERFORM net.http_post(
      url := 'https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/booking-review-request',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
      ),
      body := jsonb_build_object('booking_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- PARTE 4: Criar o trigger
DROP TRIGGER IF EXISTS booking_completed_trigger ON bookings;
CREATE TRIGGER booking_completed_trigger
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_booking_review_request();