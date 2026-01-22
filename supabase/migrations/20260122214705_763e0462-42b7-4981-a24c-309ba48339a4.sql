-- Atualiza approve_payment para também trocar plan_id (upgrade) e reiniciar ciclo a partir de agora
CREATE OR REPLACE FUNCTION public.approve_payment(approval_id uuid, admin_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  target_user_id UUID;
  target_store_id UUID;
  new_plan_id UUID;
  plan_billing_cycle TEXT;
  expiration_days INTEGER;
BEGIN
  -- Verificar se admin é master_admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = admin_user_id
    AND user_type = 'master_admin'
  ) THEN
    RAISE EXCEPTION 'Apenas master admins podem aprovar pagamentos';
  END IF;

  -- Buscar dados da aprovação (somente pendente)
  SELECT user_id, store_id, plan_id
    INTO target_user_id, target_store_id, new_plan_id
  FROM public.payment_approvals
  WHERE id = approval_id
    AND status = 'pending';

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Aprovação não encontrada ou já processada';
  END IF;

  -- Atualizar status da aprovação
  UPDATE public.payment_approvals
  SET 
    status = 'approved',
    approved_by = admin_user_id,
    approved_at = NOW()
  WHERE id = approval_id;

  -- Atualizar profile do usuário
  UPDATE public.profiles
  SET approval_status = 'approved'
  WHERE id = target_user_id;

  -- Atualizar loja com plano e data de expiração (reinicia ciclo)
  IF target_store_id IS NOT NULL THEN
    -- Buscar billing_cycle do novo plano
    SELECT billing_cycle
      INTO plan_billing_cycle
    FROM public.plans
    WHERE id = new_plan_id;

    expiration_days := CASE plan_billing_cycle
      WHEN 'monthly' THEN 30
      WHEN 'quarterly' THEN 90
      WHEN 'biannual' THEN 180
      WHEN 'annual' THEN 365
      ELSE 30
    END;

    -- Troca o plano e reinicia o ciclo a partir de agora.
    -- Se o plano mudou, remove desconto personalizado para não aplicar em outro plano.
    UPDATE public.stores s
    SET 
      status = 'active',
      plan_id = new_plan_id,
      subscription_expires_at = NOW() + INTERVAL '1 day' * expiration_days,
      custom_monthly_price = CASE WHEN s.plan_id IS DISTINCT FROM new_plan_id THEN NULL ELSE s.custom_monthly_price END,
      discount_reason = CASE WHEN s.plan_id IS DISTINCT FROM new_plan_id THEN NULL ELSE s.discount_reason END
    WHERE s.id = target_store_id;
  END IF;

  RETURN TRUE;
END;
$function$;