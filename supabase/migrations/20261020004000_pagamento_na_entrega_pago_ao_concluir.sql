-- Pagamento na entrega/retirada vira "pago" quando o pedido é concluído.
-- Pix online (payment_details.pix_txid) e Mercado Pago (store_payment_transactions) continuam pelo webhook.
create index if not exists idx_store_payment_transactions_external_ref on public.store_payment_transactions (external_reference);
create or replace function public.mark_on_delivery_payment_paid()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if NEW.status = 'concluido' and OLD.status is distinct from 'concluido'
     and NEW.payment_status = 'pending'
     and coalesce(NEW.payment_details->>'pix_txid', '') = ''
     and not exists (select 1 from store_payment_transactions t where t.external_reference = 'order_' || NEW.id::text)
  then
    NEW.payment_status := 'paid';
  end if;
  return NEW;
end $$;
create trigger trg_mark_on_delivery_payment_paid before update of status on public.orders
  for each row execute function public.mark_on_delivery_payment_paid();
