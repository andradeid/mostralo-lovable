DROP FUNCTION public.apply_mostralo_founder_discount(uuid);
CREATE FUNCTION public.apply_mostralo_founder_discount(p_store_id uuid, p_actor_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_store public.stores%ROWTYPE; v_availability jsonb; v_n integer;
BEGIN
  IF p_actor_id IS NULL OR NOT public.has_role(p_actor_id, 'master_admin'::public.app_role) THEN
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
  UPDATE public.stores SET custom_monthly_price = 129, discount_reason = 'Sócio fundador ' || v_n || '/10', discount_applied_at = now(), discount_applied_by = p_actor_id, updated_at = now() WHERE id = p_store_id;
  RETURN jsonb_build_object('custom_monthly_price', 129, 'discount_reason', 'Sócio fundador ' || v_n || '/10', 'number', v_n);
END;
$$;
REVOKE ALL ON FUNCTION public.apply_mostralo_founder_discount(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_mostralo_founder_discount(uuid, uuid) TO service_role;