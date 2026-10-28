-- Programa de parceria: cupom com o nome do parceiro, página /parceiro/:cupom,
-- condição de sócio fundador para quem chega por indicação e números do parceiro.
-- Tudo aditivo: o fluxo atual de cadastro e de comissão continua igual.

-- 1. Cupom escolhido pelo parceiro (único, sem diferenciar maiúsculas)
ALTER TABLE public.salespeople ADD COLUMN IF NOT EXISTS coupon_code text;
DO $$ BEGIN
  ALTER TABLE public.salespeople ADD CONSTRAINT salespeople_coupon_code_format
    CHECK (coupon_code IS NULL OR coupon_code ~ '^[A-Z0-9]{4,15}$');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS salespeople_coupon_code_uidx ON public.salespeople (upper(coupon_code)) WHERE coupon_code IS NOT NULL;

-- 2. Checkout marcado com a oferta de sócio fundador (aplicada quando o Pix é pago)
ALTER TABLE public.payment_approvals ADD COLUMN IF NOT EXISTS founder_offer boolean NOT NULL DEFAULT false;

-- 3. Visitas da página do parceiro (contador por dia)
CREATE TABLE IF NOT EXISTS public.partner_page_views (
  salesperson_id uuid NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE,
  day date NOT NULL,
  views integer NOT NULL DEFAULT 0,
  PRIMARY KEY (salesperson_id, day)
);
ALTER TABLE public.partner_page_views ENABLE ROW LEVEL SECURITY;

-- 4. Parceiro ativo por cupom ou pelo código antigo (?ref=)
CREATE OR REPLACE FUNCTION public._partner_by_code(p_code text)
RETURNS public.salespeople
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT s.* FROM public.salespeople s
  WHERE s.status = 'active' AND NOT coalesce(s.is_blocked, false)
    AND nullif(trim(p_code), '') IS NOT NULL
    AND (upper(s.coupon_code) = upper(trim(p_code)) OR s.referral_code = trim(p_code))
  ORDER BY (upper(s.coupon_code) = upper(trim(p_code))) DESC NULLS LAST
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public._partner_by_code(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._partner_by_code(text) TO service_role;

-- 5. Dados públicos da página (sem CPF, e-mail, telefone ou Pix)
CREATE OR REPLACE FUNCTION public.partner_public_info(p_code text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v public.salespeople; v_plan record;
BEGIN
  v := public._partner_by_code(p_code);
  IF v.id IS NULL THEN RETURN jsonb_build_object('found', false); END IF;
  SELECT id, price INTO v_plan FROM public.plans WHERE name = 'Agenda' AND status = 'active' LIMIT 1;
  RETURN jsonb_build_object(
    'found', true,
    'name', v.full_name,
    'first_name', split_part(v.full_name, ' ', 1),
    'photo_url', v.profile_photo_url,
    'code', coalesce(v.coupon_code, v.referral_code),
    'founder', public.mostralo_founder_availability() || jsonb_build_object('price', 129),
    'agenda_plan', CASE WHEN v_plan.id IS NULL THEN NULL ELSE jsonb_build_object('id', v_plan.id, 'price', v_plan.price) END
  );
END $$;
REVOKE ALL ON FUNCTION public.partner_public_info(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.partner_public_info(text) TO anon, authenticated, service_role;

-- 6. Conta uma visita (só incrementa o contador do dia)
CREATE OR REPLACE FUNCTION public.track_partner_page_view(p_code text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v public.salespeople;
BEGIN
  v := public._partner_by_code(p_code);
  IF v.id IS NULL THEN RETURN; END IF;
  INSERT INTO public.partner_page_views (salesperson_id, day, views)
  VALUES (v.id, (now() AT TIME ZONE 'America/Sao_Paulo')::date, 1)
  ON CONFLICT (salesperson_id, day) DO UPDATE SET views = partner_page_views.views + 1;
END $$;
REVOKE ALL ON FUNCTION public.track_partner_page_view(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_partner_page_view(text) TO anon, authenticated;

-- 7. O parceiro escolhe o próprio cupom
CREATE OR REPLACE FUNCTION public.set_my_partner_coupon(p_code text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_id uuid; v_code text := upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'));
BEGIN
  SELECT id INTO v_id FROM public.salespeople WHERE user_id = auth.uid() AND status = 'active' AND NOT coalesce(is_blocked, false);
  IF v_id IS NULL THEN RAISE EXCEPTION 'Só parceiros ativos podem escolher cupom' USING ERRCODE = '42501'; END IF;
  IF v_code !~ '^[A-Z0-9]{4,15}$' THEN RAISE EXCEPTION 'Use de 4 a 15 letras ou números, sem espaço nem acento' USING ERRCODE = '22023'; END IF;
  IF EXISTS (SELECT 1 FROM public.salespeople WHERE id <> v_id AND (upper(coupon_code) = v_code OR upper(referral_code) = v_code)) THEN
    RAISE EXCEPTION 'Esse cupom já é de outro parceiro' USING ERRCODE = '23505';
  END IF;
  UPDATE public.salespeople SET coupon_code = v_code, updated_at = now() WHERE id = v_id;
  RETURN jsonb_build_object('coupon_code', v_code);
END $$;
REVOKE ALL ON FUNCTION public.set_my_partner_coupon(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_my_partner_coupon(text) TO authenticated;

-- 8. Números do parceiro logado
CREATE OR REPLACE FUNCTION public.my_partner_stats()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v public.salespeople; v_cfg record;
BEGIN
  SELECT * INTO v FROM public.salespeople WHERE user_id = auth.uid();
  IF v.id IS NULL THEN RAISE EXCEPTION 'Parceiro não encontrado' USING ERRCODE = '42501'; END IF;
  SELECT commission_type, commission_value, applies_to INTO v_cfg
  FROM public.salesperson_commission_configs WHERE salesperson_id = v.id AND coalesce(is_active, true) LIMIT 1;
  RETURN jsonb_build_object(
    'coupon_code', v.coupon_code,
    'referral_code', v.referral_code,
    'views_total', (SELECT coalesce(sum(views), 0) FROM public.partner_page_views WHERE salesperson_id = v.id),
    'views_30d', (SELECT coalesce(sum(views), 0) FROM public.partner_page_views WHERE salesperson_id = v.id AND day > current_date - 30),
    'started', (SELECT count(DISTINCT store_id) FROM public.payment_approvals WHERE referred_by_salesperson_id = v.id),
    'paid', (SELECT count(DISTINCT store_id) FROM public.payment_approvals WHERE referred_by_salesperson_id = v.id AND status = 'approved'),
    'commission', CASE WHEN v_cfg IS NULL THEN jsonb_build_object('type', 'percentage', 'value', 10, 'applies_to', 'all')
                       ELSE jsonb_build_object('type', v_cfg.commission_type, 'value', v_cfg.commission_value, 'applies_to', v_cfg.applies_to) END,
    'founder', public.mostralo_founder_availability()
  );
END $$;
REVOKE ALL ON FUNCTION public.my_partner_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_partner_stats() TO authenticated;

-- 9. Visão pública mínima usada pelo cadastro antigo e pelos formulários de lead
--    (ela sumia do banco: o vínculo do vendedor nunca era gravado)
CREATE OR REPLACE VIEW public.public_salespeople_referral AS
  SELECT id, full_name, referral_code, coupon_code
  FROM public.salespeople
  WHERE status = 'active' AND NOT coalesce(is_blocked, false);
GRANT SELECT ON public.public_salespeople_referral TO anon, authenticated, service_role;

-- A política antiga deixava qualquer visitante ler a linha inteira do vendedor (CPF, Pix, e-mail)
DROP POLICY IF EXISTS public_validate_referral_code ON public.salespeople;

-- 10. Sócio fundador aplicado quando o Pix da indicação é pago
CREATE OR REPLACE FUNCTION public._apply_founder_from_checkout(p_store_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_store public.stores%ROWTYPE; v_av jsonb; v_n integer; v_reason text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('mostralo-founder-program'));
  SELECT * INTO v_store FROM public.stores WHERE id = p_store_id FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF starts_with(v_store.discount_reason, 'Sócio fundador') THEN
    RETURN jsonb_build_object('discount_reason', v_store.discount_reason, 'alreadyApplied', true);
  END IF;
  v_av := public.mostralo_founder_availability();
  v_n := (v_av->>'nextNumber')::integer;
  -- Vaga esgotada entre o Pix gerado e o pago: o preço pago é honrado, fora da numeração
  v_reason := CASE WHEN v_n IS NULL THEN 'Sócio fundador extra (indicação)' ELSE 'Sócio fundador ' || v_n || '/10' END;
  UPDATE public.stores
  SET custom_monthly_price = 129, discount_reason = v_reason, discount_applied_at = now(),
      billing_cycle = 'monthly', updated_at = now()
  WHERE id = p_store_id;
  RETURN jsonb_build_object('discount_reason', v_reason, 'number', v_n);
END $$;
REVOKE ALL ON FUNCTION public._apply_founder_from_checkout(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public._founder_on_checkout_approved()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'approved' AND coalesce(OLD.status, '') <> 'approved' AND NEW.founder_offer AND NEW.store_id IS NOT NULL THEN
    PERFORM public._apply_founder_from_checkout(NEW.store_id);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_founder_on_checkout_approved ON public.payment_approvals;
CREATE TRIGGER trg_founder_on_checkout_approved
  AFTER UPDATE OF status ON public.payment_approvals
  FOR EACH ROW EXECUTE FUNCTION public._founder_on_checkout_approved();
REVOKE ALL ON FUNCTION public._founder_on_checkout_approved() FROM PUBLIC, anon, authenticated;
