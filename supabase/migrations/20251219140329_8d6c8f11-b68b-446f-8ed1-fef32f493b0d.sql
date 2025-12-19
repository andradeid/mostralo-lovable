-- Habilitar extensão pg_net para fazer HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ============================================
-- FUNÇÃO: Notificar novo lead
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_master_new_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
        'source', NEW.source
      )
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erro ao enviar notificação de novo lead: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Trigger para novos leads
DROP TRIGGER IF EXISTS trigger_notify_new_lead ON leads;
CREATE TRIGGER trigger_notify_new_lead
  AFTER INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION notify_master_new_lead();

-- ============================================
-- FUNÇÃO: Notificar novo vendedor
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_master_new_seller()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/send-master-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'type', 'new_seller',
      'data', jsonb_build_object(
        'id', NEW.id,
        'full_name', NEW.full_name,
        'email', NEW.email,
        'phone', NEW.phone,
        'salesperson_type', NEW.salesperson_type,
        'referral_code', NEW.referral_code
      )
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erro ao enviar notificação de novo vendedor: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Trigger para novos vendedores
DROP TRIGGER IF EXISTS trigger_notify_new_seller ON salespeople;
CREATE TRIGGER trigger_notify_new_seller
  AFTER INSERT ON salespeople
  FOR EACH ROW
  EXECUTE FUNCTION notify_master_new_seller();

-- ============================================
-- FUNÇÃO: Notificar nova loja ativada
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_master_new_store()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só notifica quando subscription_expires_at é definido pela primeira vez
  IF OLD.subscription_expires_at IS NULL AND NEW.subscription_expires_at IS NOT NULL THEN
    PERFORM net.http_post(
      url := 'https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/send-master-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'type', 'new_store',
        'data', jsonb_build_object(
          'id', NEW.id,
          'name', NEW.name,
          'slug', NEW.slug,
          'city', NEW.city,
          'state', NEW.state
        )
      )
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erro ao enviar notificação de nova loja: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Trigger para lojas ativadas
DROP TRIGGER IF EXISTS trigger_notify_new_store ON stores;
CREATE TRIGGER trigger_notify_new_store
  AFTER UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION notify_master_new_store();

-- ============================================
-- FUNÇÃO: Notificar pagamento aprovado
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_master_payment_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_name TEXT;
  v_plan_name TEXT;
BEGIN
  -- Só notifica quando status muda para 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Buscar nome da loja
    SELECT name INTO v_store_name FROM stores WHERE id = NEW.store_id;
    
    -- Buscar nome do plano
    SELECT name INTO v_plan_name FROM plans WHERE id = NEW.plan_id;
    
    PERFORM net.http_post(
      url := 'https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/send-master-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'type', 'payment_received',
        'data', jsonb_build_object(
          'id', NEW.id,
          'store_id', NEW.store_id,
          'store_name', v_store_name,
          'plan_name', v_plan_name,
          'payment_amount', NEW.payment_amount
        )
      )
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erro ao enviar notificação de pagamento: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Trigger para pagamentos aprovados
DROP TRIGGER IF EXISTS trigger_notify_payment_received ON payment_approvals;
CREATE TRIGGER trigger_notify_payment_received
  AFTER UPDATE ON payment_approvals
  FOR EACH ROW
  EXECUTE FUNCTION notify_master_payment_received();