REVOKE ALL ON FUNCTION public.enforce_booking_footer_entitlement() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.can_hide_booking_footer(uuid) SECURITY INVOKER;