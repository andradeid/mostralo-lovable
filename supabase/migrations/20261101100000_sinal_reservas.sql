-- Sinal das reservas (agendamento), opcional, com 2 modos:
--  * 'store'    = Pix da própria loja (sem taxa): reserva fica "pending" + deposit_paid=false até o
--                 lojista clicar em "Confirmar sinal" no painel.
--  * 'mostralo' = Pix pelo Mostralo (EFI, confirmação automática, com a comissão da loja): o servidor
--                 gera o Pix do sinal; pago -> confirmada; não pago no prazo -> cancelada pelo cron.
-- "Aguardando sinal" = status 'pending' + deposit_mode preenchido + deposit_paid=false (sem status novo).
-- Reservas sem deposit_mode (antigas, do painel, loja com sinal desligado) continuam exatamente como hoje.
-- O valor do sinal é calculado só no servidor (create-public-booking, _shared/booking-deposit.ts).

-- 1. Configuração da loja (aba Pagamentos)
alter table public.booking_settings
  add column if not exists deposit_payment_mode text not null default 'store',
  add column if not exists deposit_payment_timeout_minutes integer not null default 15;

alter table public.booking_settings
  drop constraint if exists booking_settings_deposit_payment_mode_check,
  add constraint booking_settings_deposit_payment_mode_check
    check (deposit_payment_mode in ('store', 'mostralo')),
  drop constraint if exists booking_settings_deposit_payment_timeout_check,
  add constraint booking_settings_deposit_payment_timeout_check
    check (deposit_payment_timeout_minutes between 5 and 60);

comment on column public.booking_settings.deposit_payment_mode is
  'Como receber o sinal: store = Pix da própria loja (confirmação manual), mostralo = Pix pelo Mostralo (automático, com taxa)';
comment on column public.booking_settings.deposit_payment_timeout_minutes is
  'Prazo (min) para pagar o sinal no modo mostralo; depois a reserva é cancelada';

-- 2. Reserva
alter table public.bookings
  add column if not exists deposit_mode text,
  add column if not exists deposit_expires_at timestamptz,
  add column if not exists deposit_pix_txid text,
  add column if not exists deposit_payment_details jsonb;

alter table public.bookings
  drop constraint if exists bookings_deposit_mode_check,
  add constraint bookings_deposit_mode_check check (deposit_mode is null or deposit_mode in ('store', 'mostralo'));

comment on column public.bookings.deposit_mode is
  'Fluxo de sinal da reserva (null = sem sinal). Gravado só pelo servidor na criação pela página pública';

-- Uma cobrança Pix por reserva; o webhook acha a reserva pelo txid
create unique index if not exists bookings_deposit_pix_txid_key
  on public.bookings (deposit_pix_txid) where deposit_pix_txid is not null;

-- Busca do cron (só reservas segurando horário à espera do Pix do Mostralo)
create index if not exists bookings_deposit_waiting_idx
  on public.bookings (deposit_expires_at)
  where deposit_mode = 'mostralo' and deposit_paid = false and status = 'pending';

-- 3. Sinal pago (Pix do Mostralo conferido na EFI). Chamado pelo servidor (booking-deposit e
--    efi-pix-webhook) com service role. Devolve:
--    'confirmed'         = estava aguardando (ou tinha sido cancelada por prazo e o horário seguia livre) e foi confirmada;
--    'paid'              = pagamento registrado, sem mudar o status (ex.: lojista já confirmou ou o cliente cancelou);
--    'paid_after_cancel' = pagou depois do prazo e o horário já foi ocupado: fica cancelada, com aviso para devolver;
--    'already_paid' / 'not_found'.
create or replace function public.mark_booking_deposit_paid(p_booking_id uuid, p_details jsonb default null)
returns text
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  b record;
  v_details jsonb;
begin
  select id, status, deposit_paid, deposit_mode, cancellation_reason, deposit_payment_details
    into b
    from bookings
   where id = p_booking_id
   for update;

  if not found or b.deposit_mode is null then
    return 'not_found';
  end if;
  if coalesce(b.deposit_paid, false) then
    return 'already_paid';
  end if;

  v_details := coalesce(b.deposit_payment_details, '{}'::jsonb) || coalesce(p_details, '{}'::jsonb);

  if b.status = 'pending' then
    update bookings
       set deposit_paid = true, deposit_paid_at = now(), status = 'confirmed',
           deposit_payment_details = v_details, updated_at = now()
     where id = p_booking_id;
    return 'confirmed';
  end if;

  if b.status = 'cancelled' and b.cancellation_reason = 'Sinal não pago a tempo' then
    begin
      -- Volta a valer se o horário continua livre (o gatilho de conflito barra se não estiver)
      update bookings
         set deposit_paid = true, deposit_paid_at = now(), status = 'confirmed',
             cancelled_at = null, cancellation_reason = null,
             deposit_payment_details = v_details, updated_at = now()
       where id = p_booking_id;
      return 'confirmed';
    exception when others then
      update bookings
         set deposit_paid = true, deposit_paid_at = now(),
             cancellation_reason = 'Sinal pago depois do prazo e o horário já estava ocupado: devolver o sinal ao cliente',
             deposit_payment_details = v_details, updated_at = now()
       where id = p_booking_id;
      return 'paid_after_cancel';
    end;
  end if;

  update bookings
     set deposit_paid = true, deposit_paid_at = now(),
         deposit_payment_details = v_details, updated_at = now()
   where id = p_booking_id;
  return 'paid';
end;
$$;

revoke all on function public.mark_booking_deposit_paid(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.mark_booking_deposit_paid(uuid, jsonb) to service_role;

-- 4. Prazo vencido: cancela e libera o horário. Dois minutos de folga depois do vencimento do Pix
--    (a EFI não aceita pagamento de cobrança vencida; o webhook ainda trata pagamento atrasado).
create or replace function public.cancel_unpaid_booking_deposits()
returns integer
language sql
security definer
set search_path to 'public'
as $$
  with c as (
    update bookings
       set status = 'cancelled',
           cancelled_at = now(),
           cancellation_reason = 'Sinal não pago a tempo',
           updated_at = now()
     where deposit_mode = 'mostralo'
       and deposit_paid = false
       and status = 'pending'
       and deposit_expires_at is not null
       and deposit_expires_at < now() - interval '2 minutes'
    returning 1
  )
  select count(*)::int from c;
$$;

revoke all on function public.cancel_unpaid_booking_deposits() from public, anon, authenticated;
grant execute on function public.cancel_unpaid_booking_deposits() to service_role;

select cron.schedule('cancel-unpaid-booking-deposits', '* * * * *', $$select public.cancel_unpaid_booking_deposits()$$);
