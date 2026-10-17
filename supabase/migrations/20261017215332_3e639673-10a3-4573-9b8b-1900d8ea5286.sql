CREATE OR REPLACE FUNCTION public.mostralo_founder_availability()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH founders AS (SELECT discount_reason FROM public.stores WHERE starts_with(discount_reason, 'Sócio fundador')),
  used AS (SELECT substring(discount_reason FROM '^Sócio fundador ([0-9]+)/10')::integer AS n FROM founders)
  SELECT jsonb_build_object('count', (SELECT count(*) FROM founders), 'remaining', greatest(0, 10 - (SELECT count(*) FROM founders)), 'nextNumber', CASE WHEN (SELECT count(*) FROM founders) >= 10 THEN NULL ELSE (SELECT min(n) FROM generate_series(1,10) AS s(n) WHERE n NOT IN (SELECT used.n FROM used WHERE used.n IS NOT NULL)) END);
$$;
REVOKE ALL ON FUNCTION public.mostralo_founder_availability() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mostralo_founder_availability() TO service_role;

CREATE OR REPLACE FUNCTION public.apply_mostralo_founder_discount(p_store_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_store public.stores%ROWTYPE; v_availability jsonb; v_n integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'master_admin'::public.app_role) THEN
    RAISE EXCEPTION 'Apenas o master pode aplicar sócio fundador' USING ERRCODE = '42501';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('mostralo-founder-program'));
  SELECT * INTO v_store FROM public.stores WHERE id = p_store_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Loja não encontrada'; END IF;
  IF starts_with(v_store.discount_reason, 'Sócio fundador') THEN
    RETURN jsonb_build_object('custom_monthly_price', v_store.custom_monthly_price, 'discount_reason', v_store.discount_reason, 'alreadyApplied', true);
  END IF;
  v_availability := public.mostralo_founder_availability();
  IF (v_availability->>'remaining')::integer <= 0 THEN RAISE EXCEPTION 'As dez vagas de sócio fundador já foram preenchidas'; END IF;
  v_n := (v_availability->>'nextNumber')::integer;
  IF v_n IS NULL THEN RAISE EXCEPTION 'Nenhuma vaga disponível'; END IF;
  UPDATE public.stores SET custom_monthly_price = 129, discount_reason = 'Sócio fundador ' || v_n || '/10', discount_applied_at = now(), discount_applied_by = auth.uid(), updated_at = now() WHERE id = p_store_id;
  RETURN jsonb_build_object('custom_monthly_price', 129, 'discount_reason', 'Sócio fundador ' || v_n || '/10', 'number', v_n);
END;
$$;
REVOKE ALL ON FUNCTION public.apply_mostralo_founder_discount(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_mostralo_founder_discount(uuid) TO authenticated;
