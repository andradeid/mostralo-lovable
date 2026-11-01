-- Remarcação com sinal: o horário antigo só é liberado quando o sinal do novo horário é pago.
-- booking-magic-link (cancel_for_reschedule) grava deposit_payment_details.reschedule_of = id antigo
-- na reserva nova quando ela ainda espera o sinal. Este gatilho cancela o antigo quando o sinal
-- é pago (Pix pelo Mostralo via mark_booking_deposit_paid, ou lojista confirmando à mão).
-- Se o sinal não for pago, a reserva nova cai e o cliente continua com o horário antigo.

create or replace function public._booking_reschedule_after_deposit()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_old uuid;
begin
  if not coalesce(new.deposit_paid, false) or coalesce(old.deposit_paid, false) then
    return new;
  end if;
  if new.status = 'cancelled' then
    return new;
  end if;
  begin
    v_old := nullif(new.deposit_payment_details ->> 'reschedule_of', '')::uuid;
  exception when others then
    return new;
  end;
  if v_old is null or v_old = new.id then
    return new;
  end if;

  update bookings
     set status = 'cancelled',
         cancelled_at = now(),
         cancellation_reason = 'Reagendado pelo cliente para '
           || to_char(new.booking_date, 'DD/MM/YYYY') || ' às ' || left(new.start_time::text, 5),
         updated_at = now()
   where id = v_old
     and store_id = new.store_id
     and status <> 'cancelled';
  return new;
end;
$$;

revoke all on function public._booking_reschedule_after_deposit() from public, anon, authenticated;

create or replace trigger trg_booking_reschedule_after_deposit
  after update of deposit_paid on public.bookings
  for each row
  when (new.deposit_paid is true and old.deposit_paid is distinct from true)
  execute function public._booking_reschedule_after_deposit();
