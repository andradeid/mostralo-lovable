-- Aprovação automática de vendedores (04/11/2026)
-- Todo cadastro pelo site já entra aprovado (pending_contract): falta só o vendedor aceitar o contrato no painel.
-- Também cria a comissão padrão (afiliado 7% recorrente; parceiro PJ 10%) e confirma o e-mail do login.

CREATE OR REPLACE FUNCTION public._salesperson_auto_approve()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'pending_approval' THEN
    NEW.status := 'pending_contract';
    NEW.approved_at := coalesce(NEW.approved_at, now());
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public._salesperson_after_auto_approve()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'auth' AS $$
BEGIN
  IF NEW.status = 'pending_contract' AND NOT EXISTS (
       SELECT 1 FROM salesperson_commission_configs WHERE salesperson_id = NEW.id) THEN
    INSERT INTO salesperson_commission_configs (salesperson_id, commission_type, commission_value, applies_to, is_active)
    VALUES (NEW.id, 'percentage',
            CASE WHEN NEW.salesperson_type = 'affiliate' THEN 7 ELSE 10 END,
            CASE WHEN NEW.salesperson_type = 'affiliate' THEN 'recurring' ELSE 'all' END,
            true);
  END IF;
  IF NEW.status = 'pending_contract' AND NEW.user_id IS NOT NULL THEN
    UPDATE auth.users SET email_confirmed_at = coalesce(email_confirmed_at, now()) WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_salesperson_auto_approve ON public.salespeople;
CREATE TRIGGER trg_salesperson_auto_approve BEFORE INSERT ON public.salespeople
  FOR EACH ROW EXECUTE FUNCTION public._salesperson_auto_approve();

DROP TRIGGER IF EXISTS trg_salesperson_after_auto_approve ON public.salespeople;
CREATE TRIGGER trg_salesperson_after_auto_approve AFTER INSERT ON public.salespeople
  FOR EACH ROW EXECUTE FUNCTION public._salesperson_after_auto_approve();

-- Sem comissão para a própria loja do vendedor (evita autoindicação agora que o cadastro é livre).
DO $do$
DECLARE d text := pg_get_functiondef('public._partner_register_commission(uuid,uuid,uuid,numeric,timestamptz,uuid,uuid)'::regprocedure);
BEGIN
  IF position('_autoindicacao_' in d) = 0 THEN
    d := replace(d,
      'IF v_sp.id IS NULL OR coalesce(v_sp.is_blocked, false) THEN RETURN NULL; END IF;',
      'IF v_sp.id IS NULL OR coalesce(v_sp.is_blocked, false) THEN RETURN NULL; END IF;
  -- _autoindicacao_: loja do próprio vendedor não gera comissão
  IF EXISTS (SELECT 1 FROM stores WHERE id = p_store AND owner_id = v_sp.user_id) THEN RETURN NULL; END IF;');
    EXECUTE d;
  END IF;
END $do$;

-- /parceiro/<código>: código de indicação sem diferenciar maiúsculas (o site gera o link em minúsculas)
CREATE OR REPLACE FUNCTION public._partner_by_code(p_code text)
 RETURNS salespeople LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT s.* FROM public.salespeople s
  WHERE s.status = 'active' AND NOT coalesce(s.is_blocked, false)
    AND nullif(trim(p_code), '') IS NOT NULL
    AND (upper(s.coupon_code) = upper(trim(p_code)) OR upper(s.referral_code) = upper(trim(p_code)))
  ORDER BY (upper(s.coupon_code) = upper(trim(p_code))) DESC NULLS LAST
  LIMIT 1;
$function$;
