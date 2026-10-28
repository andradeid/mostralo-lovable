-- Comissão recorrente do parceiro (28/10/2026, decisão do Marcos):
--   * toda mensalidade paga gera comissão, não só o primeiro pagamento;
--   * a comissão é sobre o valor recebido (subscription_invoices.amount, conferido pelo webhook Pix);
--   * o que entrou no mês M é pago no dia 15 do mês M+1.
-- Fonte única do dinheiro recebido: subscription_invoices (o checkout e a aprovação manual também
-- gravam uma fatura paga). A aprovação sem fatura correspondente é coberta pela rotina diária.

-- 1. Colunas novas (aditivas)
ALTER TABLE public.salesperson_commissions
  ADD COLUMN IF NOT EXISTS subscription_invoice_id uuid REFERENCES public.subscription_invoices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payout_id uuid REFERENCES public.salesperson_payouts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cycle_month integer,
  ADD COLUMN IF NOT EXISTS cycle_year integer,
  ADD COLUMN IF NOT EXISTS received_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS salesperson_commissions_invoice_uidx
  ON public.salesperson_commissions (subscription_invoice_id) WHERE subscription_invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS salesperson_commissions_payout_idx ON public.salesperson_commissions (payout_id);

ALTER TABLE public.salesperson_payouts ADD COLUMN IF NOT EXISTS scheduled_payment_date date;
UPDATE public.salesperson_payouts
   SET scheduled_payment_date = (make_date(cycle_year, cycle_month, 15) + interval '1 month')::date
 WHERE scheduled_payment_date IS NULL;

-- 2. Data de pagamento do ciclo: dia 15 do mês seguinte
CREATE OR REPLACE FUNCTION public._partner_payout_date(p_month integer, p_year integer)
RETURNS date LANGUAGE sql IMMUTABLE AS $$
  SELECT (make_date(p_year, p_month, 15) + interval '1 month')::date;
$$;

-- 3. Quem indicou a loja: o parceiro gravado no checkout/aprovação (o primeiro que trouxe a loja)
CREATE OR REPLACE FUNCTION public._store_referrer(p_store uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT a.referred_by_salesperson_id FROM public.payment_approvals a
  WHERE a.store_id = p_store AND a.referred_by_salesperson_id IS NOT NULL
  ORDER BY (a.status = 'approved') DESC, a.created_at ASC
  LIMIT 1;
$$;

-- 4. Registra uma comissão (idempotente por fatura e por aprovação). Devolve o id ou null.
CREATE OR REPLACE FUNCTION public._partner_register_commission(
  p_salesperson uuid, p_store uuid, p_plan uuid, p_amount numeric, p_received_at timestamptz,
  p_approval uuid DEFAULT NULL, p_invoice uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_sp public.salespeople;
  v_cfg record;
  v_seq integer;
  v_value numeric;
  v_type text;
  v_applies text;
  v_commission numeric;
  v_local timestamp := coalesce(p_received_at, now()) AT TIME ZONE 'America/Sao_Paulo';
  v_now date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_cycle date;
  v_payout public.salesperson_payouts;
  v_id uuid;
  i integer := 0;
BEGIN
  IF p_salesperson IS NULL OR p_store IS NULL OR coalesce(p_amount, 0) <= 0 THEN RETURN NULL; END IF;
  IF p_invoice IS NOT NULL AND EXISTS (SELECT 1 FROM salesperson_commissions WHERE subscription_invoice_id = p_invoice) THEN RETURN NULL; END IF;
  IF p_approval IS NOT NULL AND EXISTS (SELECT 1 FROM salesperson_commissions WHERE payment_approval_id = p_approval AND salesperson_id = p_salesperson) THEN RETURN NULL; END IF;

  SELECT * INTO v_sp FROM salespeople WHERE id = p_salesperson;
  IF v_sp.id IS NULL OR coalesce(v_sp.is_blocked, false) THEN RETURN NULL; END IF;

  SELECT commission_type, commission_value, applies_to, min_plan_value, max_commission INTO v_cfg
  FROM salesperson_commission_configs
  WHERE salesperson_id = p_salesperson AND coalesce(is_active, true)
  ORDER BY updated_at DESC NULLS LAST LIMIT 1;

  v_type := coalesce(v_cfg.commission_type, 'percentage');
  v_value := coalesce(v_cfg.commission_value, 10);
  v_applies := coalesce(v_cfg.applies_to, 'all');

  SELECT count(*) + 1 INTO v_seq FROM salesperson_commissions
  WHERE salesperson_id = p_salesperson AND store_id = p_store AND status <> 'cancelled';

  IF v_applies = 'first_payment' AND v_seq > 1 THEN RETURN NULL; END IF;
  IF v_cfg.min_plan_value IS NOT NULL AND p_amount < v_cfg.min_plan_value THEN RETURN NULL; END IF;

  v_commission := CASE WHEN v_type = 'fixed' THEN v_value ELSE round(p_amount * v_value / 100, 2) END;
  IF v_cfg.max_commission IS NOT NULL THEN v_commission := least(v_commission, v_cfg.max_commission); END IF;
  IF v_commission <= 0 THEN RETURN NULL; END IF;

  -- Ciclo = mês em que o dinheiro entrou (horário de Brasília). Se esse ciclo já foi
  -- solicitado/pago, a comissão entra no ciclo aberto seguinte.
  v_cycle := date_trunc('month', v_local)::date;
  LOOP
    SELECT * INTO v_payout FROM salesperson_payouts
    WHERE salesperson_id = p_salesperson AND cycle_month = extract(month FROM v_cycle) AND cycle_year = extract(year FROM v_cycle);
    EXIT WHEN v_payout.id IS NULL OR v_payout.status IN ('open', 'pending');
    v_cycle := greatest((v_cycle + interval '1 month')::date, date_trunc('month', v_now)::date);
    i := i + 1;
    IF i > 24 THEN RAISE EXCEPTION 'Sem ciclo aberto para o parceiro %', p_salesperson; END IF;
  END LOOP;

  IF v_payout.id IS NULL THEN
    INSERT INTO salesperson_payouts (salesperson_id, cycle_month, cycle_year, total_sales, commission_total, bonus_total,
                                     grand_total, status, pix_key, pix_key_type, scheduled_payment_date)
    VALUES (p_salesperson, extract(month FROM v_cycle), extract(year FROM v_cycle), 0, 0, 0, 0,
            CASE WHEN v_cycle < date_trunc('month', v_now)::date THEN 'pending' ELSE 'open' END,
            v_sp.pix_key, v_sp.pix_key_type,
            public._partner_payout_date(extract(month FROM v_cycle)::int, extract(year FROM v_cycle)::int))
    ON CONFLICT (salesperson_id, cycle_month, cycle_year) DO NOTHING
    RETURNING * INTO v_payout;
    IF v_payout.id IS NULL THEN
      SELECT * INTO v_payout FROM salesperson_payouts
      WHERE salesperson_id = p_salesperson AND cycle_month = extract(month FROM v_cycle) AND cycle_year = extract(year FROM v_cycle);
    END IF;
  END IF;

  INSERT INTO salesperson_commissions (
    salesperson_id, payment_approval_id, subscription_invoice_id, store_id, payment_amount, plan_name, store_name,
    commission_type, commission_percentage, commission_fixed_amount, commission_amount, status,
    payment_sequence, applies_to, payout_id, cycle_month, cycle_year, received_at)
  VALUES (
    p_salesperson, p_approval, p_invoice, p_store, p_amount,
    (SELECT name FROM plans WHERE id = p_plan), (SELECT name FROM stores WHERE id = p_store),
    v_type, CASE WHEN v_type = 'percentage' THEN v_value END, CASE WHEN v_type = 'fixed' THEN v_value END,
    v_commission, 'pending', v_seq, v_applies, v_payout.id, v_payout.cycle_month, v_payout.cycle_year, coalesce(p_received_at, now()))
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN RETURN NULL; END IF;

  UPDATE salesperson_payouts SET
    total_sales = total_sales + 1,
    commission_total = commission_total + v_commission,
    grand_total = grand_total + v_commission,
    scheduled_payment_date = coalesce(scheduled_payment_date, public._partner_payout_date(cycle_month, cycle_year)),
    updated_at = now()
  WHERE id = v_payout.id;

  IF v_payout.cycle_month = extract(month FROM v_now) AND v_payout.cycle_year = extract(year FROM v_now) THEN
    UPDATE salespeople SET current_month_earnings = coalesce(current_month_earnings, 0) + v_commission,
                           last_sale_at = greatest(coalesce(last_sale_at, p_received_at), p_received_at)
    WHERE id = p_salesperson;
  END IF;

  RETURN v_id;
END $$;

-- 5. Comissão de uma fatura paga
CREATE OR REPLACE FUNCTION public._partner_commission_for_invoice(p_invoice uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v record;
BEGIN
  SELECT id, store_id, plan_id, amount, coalesce(paid_at, approved_at, updated_at) AS received_at, payment_status
    INTO v FROM subscription_invoices WHERE id = p_invoice;
  IF v.id IS NULL OR v.payment_status <> 'paid' THEN RETURN NULL; END IF;
  RETURN public._partner_register_commission(public._store_referrer(v.store_id), v.store_id, v.plan_id, v.amount, v.received_at, NULL, v.id);
END $$;

-- 6. Gatilho na fatura: pagou → comissão; deixou de ser paga (estorno/cancelamento) → cancela a comissão não paga
CREATE OR REPLACE FUNCTION public._trg_partner_commission_invoice()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE c record;
BEGIN
  BEGIN
    IF NEW.payment_status = 'paid' AND (TG_OP = 'INSERT' OR coalesce(OLD.payment_status, '') <> 'paid') THEN
      PERFORM public._partner_commission_for_invoice(NEW.id);
    ELSIF TG_OP = 'UPDATE' AND OLD.payment_status = 'paid' AND NEW.payment_status <> 'paid' THEN
      FOR c IN UPDATE salesperson_commissions SET status = 'cancelled', updated_at = now()
               WHERE subscription_invoice_id = NEW.id AND status = 'pending'
               RETURNING payout_id, commission_amount LOOP
        UPDATE salesperson_payouts SET total_sales = greatest(total_sales - 1, 0),
          commission_total = commission_total - c.commission_amount, grand_total = grand_total - c.commission_amount, updated_at = now()
        WHERE id = c.payout_id AND status IN ('open', 'pending');
      END LOOP;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Nunca bloquear o pagamento; a rotina diária refaz o que faltar.
    RAISE WARNING 'Comissão do parceiro (fatura %): %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_partner_commission_invoice ON public.subscription_invoices;
CREATE TRIGGER trg_partner_commission_invoice
  AFTER INSERT OR UPDATE OF payment_status ON public.subscription_invoices
  FOR EACH ROW EXECUTE FUNCTION public._trg_partner_commission_invoice();

-- 7. A comissão deixa de nascer na aprovação (evita contar o mesmo pagamento duas vezes,
--    porque toda aprovação grava também uma fatura paga). A rotina diária cobre aprovação sem fatura.
DROP TRIGGER IF EXISTS trg_calculate_salesperson_commission ON public.payment_approvals;

-- 8. Pagou o ciclo → comissões do ciclo pagas; desfez → voltam a pendentes
CREATE OR REPLACE FUNCTION public._trg_partner_payout_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'paid' AND coalesce(OLD.status, '') <> 'paid' THEN
    UPDATE salesperson_commissions SET status = 'paid', paid_at = coalesce(NEW.paid_at, now()), paid_by = NEW.reviewed_by,
           payment_reference = coalesce(NEW.payment_reference, payment_reference), updated_at = now()
    WHERE payout_id = NEW.id AND status = 'pending';
  ELSIF OLD.status = 'paid' AND NEW.status <> 'paid' THEN
    UPDATE salesperson_commissions SET status = 'pending', paid_at = NULL, updated_at = now()
    WHERE payout_id = NEW.id AND status = 'paid';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_partner_payout_sync ON public.salesperson_payouts;
CREATE TRIGGER trg_partner_payout_sync
  AFTER UPDATE OF status ON public.salesperson_payouts
  FOR EACH ROW EXECUTE FUNCTION public._trg_partner_payout_sync();

-- 9. Rotina diária: fecha os ciclos do mês que acabou (ficam prontos para pagar no dia 15)
--    e refaz comissões que faltarem (fatura paga sem comissão; aprovação paga sem fatura).
CREATE OR REPLACE FUNCTION public.partner_commissions_daily()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_month date := date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_closed integer; v_inv integer := 0; v_appr integer := 0; r record;
BEGIN
  UPDATE salesperson_payouts SET status = 'pending', updated_at = now()
  WHERE status = 'open' AND make_date(cycle_year, cycle_month, 1) < v_month;
  GET DIAGNOSTICS v_closed = ROW_COUNT;

  FOR r IN SELECT i.id FROM subscription_invoices i
           WHERE i.payment_status = 'paid' AND coalesce(i.paid_at, i.updated_at) > now() - interval '60 days'
             AND NOT EXISTS (SELECT 1 FROM salesperson_commissions c WHERE c.subscription_invoice_id = i.id)
             AND public._store_referrer(i.store_id) IS NOT NULL LOOP
    IF public._partner_commission_for_invoice(r.id) IS NOT NULL THEN v_inv := v_inv + 1; END IF;
  END LOOP;

  -- Aprovação paga há mais de 1 hora sem fatura paga da mesma loja perto do horário (±1 dia)
  FOR r IN SELECT a.* FROM payment_approvals a
           WHERE a.status = 'approved' AND a.store_id IS NOT NULL
             AND coalesce(a.approved_at, a.updated_at) BETWEEN now() - interval '60 days' AND now() - interval '1 hour'
             AND coalesce(a.referred_by_salesperson_id, public._store_referrer(a.store_id)) IS NOT NULL
             AND NOT EXISTS (SELECT 1 FROM salesperson_commissions c WHERE c.payment_approval_id = a.id)
             AND NOT EXISTS (SELECT 1 FROM subscription_invoices i
                             WHERE i.store_id = a.store_id AND i.payment_status = 'paid'
                               AND abs(extract(epoch FROM coalesce(i.paid_at, i.created_at) - coalesce(a.approved_at, a.updated_at))) < 86400) LOOP
    IF public._partner_register_commission(coalesce(r.referred_by_salesperson_id, public._store_referrer(r.store_id)), r.store_id, r.plan_id,
                                           r.payment_amount, coalesce(r.approved_at, r.updated_at), r.id, NULL) IS NOT NULL THEN
      v_appr := v_appr + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('cycles_closed', v_closed, 'invoice_commissions', v_inv, 'approval_commissions', v_appr);
END $$;

-- 10. Painel do parceiro: próximo pagamento e total recebido
CREATE OR REPLACE FUNCTION public.my_partner_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v public.salespeople; v_cfg record; v_next record;
BEGIN
  SELECT * INTO v FROM public.salespeople WHERE user_id = auth.uid();
  IF v.id IS NULL THEN RAISE EXCEPTION 'Parceiro não encontrado' USING ERRCODE = '42501'; END IF;
  SELECT commission_type, commission_value, applies_to INTO v_cfg
  FROM public.salesperson_commission_configs WHERE salesperson_id = v.id AND coalesce(is_active, true)
  ORDER BY updated_at DESC NULLS LAST LIMIT 1;
  SELECT scheduled_payment_date, grand_total, status INTO v_next FROM public.salesperson_payouts
  WHERE salesperson_id = v.id AND status IN ('open', 'pending', 'requested', 'approved') AND grand_total > 0
  ORDER BY scheduled_payment_date ASC NULLS LAST LIMIT 1;
  RETURN jsonb_build_object(
    'coupon_code', v.coupon_code,
    'referral_code', v.referral_code,
    'views_total', (SELECT coalesce(sum(views), 0) FROM public.partner_page_views WHERE salesperson_id = v.id),
    'views_30d', (SELECT coalesce(sum(views), 0) FROM public.partner_page_views WHERE salesperson_id = v.id AND day > current_date - 30),
    'started', (SELECT count(DISTINCT store_id) FROM public.payment_approvals WHERE referred_by_salesperson_id = v.id),
    'paid', (SELECT count(DISTINCT store_id) FROM public.payment_approvals WHERE referred_by_salesperson_id = v.id AND status = 'approved'),
    'commission', CASE WHEN v_cfg IS NULL THEN jsonb_build_object('type', 'percentage', 'value', 10, 'applies_to', 'all')
                       ELSE jsonb_build_object('type', v_cfg.commission_type, 'value', v_cfg.commission_value, 'applies_to', v_cfg.applies_to) END,
    'next_payout', CASE WHEN v_next IS NULL THEN NULL ELSE jsonb_build_object('date', v_next.scheduled_payment_date, 'amount', v_next.grand_total, 'status', v_next.status) END,
    'received_total', (SELECT coalesce(sum(grand_total), 0) FROM public.salesperson_payouts WHERE salesperson_id = v.id AND status = 'paid'),
    'founder', public.mostralo_founder_availability()
  );
END $$;

-- Permissões: funções internas só para o servidor
REVOKE ALL ON FUNCTION public._partner_payout_date(integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public._partner_payout_date(integer, integer) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public._store_referrer(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._partner_register_commission(uuid, uuid, uuid, numeric, timestamptz, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._partner_commission_for_invoice(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.partner_commissions_daily() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._store_referrer(uuid), public._partner_register_commission(uuid, uuid, uuid, numeric, timestamptz, uuid, uuid),
  public._partner_commission_for_invoice(uuid), public.partner_commissions_daily() TO service_role;
REVOKE ALL ON FUNCTION public.my_partner_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_partner_stats() TO authenticated;

-- 11. Rotina diária às 00:10 de Brasília (03:10 UTC)
DO $$ BEGIN PERFORM cron.unschedule('partner-commissions-daily'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule('partner-commissions-daily', '10 3 * * *', 'select public.partner_commissions_daily()');
