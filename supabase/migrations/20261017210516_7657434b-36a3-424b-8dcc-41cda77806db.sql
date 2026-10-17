ALTER TABLE public.booking_settings ADD COLUMN IF NOT EXISTS use_interactive_buttons boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS show_mostralo_footer boolean NOT NULL DEFAULT true, ADD COLUMN IF NOT EXISTS interactive_test_phones text NOT NULL DEFAULT '';
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS booking_white_label_enabled boolean NOT NULL DEFAULT false;
CREATE OR REPLACE FUNCTION public.can_hide_booking_footer(p_store_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT EXISTS (SELECT 1 FROM public.stores s JOIN public.plans p ON p.id=s.plan_id WHERE s.id=p_store_id AND (s.owner_id=auth.uid() OR public.has_role(auth.uid(),'master_admin') OR public.has_role_in_store(auth.uid(),'store_admin',s.id)) AND s.billing_enabled=true AND COALESCE(s.custom_monthly_price,p.price)>0 AND lower(p.name) NOT LIKE '%fundador%' AND p.booking_white_label_enabled=true);
$$;
REVOKE ALL ON FUNCTION public.can_hide_booking_footer(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_hide_booking_footer(uuid) TO authenticated, service_role;
CREATE OR REPLACE FUNCTION public.enforce_booking_footer_entitlement() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF NEW.show_mostralo_footer=false AND NOT EXISTS (SELECT 1 FROM public.stores s JOIN public.plans p ON p.id=s.plan_id WHERE s.id=NEW.store_id AND s.billing_enabled=true AND COALESCE(s.custom_monthly_price,p.price)>0 AND lower(p.name) NOT LIKE '%fundador%' AND p.booking_white_label_enabled=true) THEN NEW.show_mostralo_footer:=true; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER enforce_booking_footer_entitlement BEFORE INSERT OR UPDATE ON public.booking_settings FOR EACH ROW EXECUTE FUNCTION public.enforce_booking_footer_entitlement();
INSERT INTO public.booking_settings (store_id,interactive_test_phones) SELECT id,'5561994009368' FROM public.stores WHERE slug='barbearia-jeferson-dias' ON CONFLICT (store_id) DO UPDATE SET interactive_test_phones=EXCLUDED.interactive_test_phones;