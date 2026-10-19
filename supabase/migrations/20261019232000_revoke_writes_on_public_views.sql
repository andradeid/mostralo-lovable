-- Views públicas são só leitura. Antes, visitante anônimo conseguia alterar lojas, configurações
-- (inclusive scripts da loja), faturas avulsas e agendamentos através delas.
revoke insert, update, delete, truncate on
  public.booking_availability,
  public.password_call_config_public,
  public.public_external_invoices,
  public.public_payment_contact,
  public.public_store_config,
  public.public_stores,
  public.unified_users_view
from anon, authenticated;
