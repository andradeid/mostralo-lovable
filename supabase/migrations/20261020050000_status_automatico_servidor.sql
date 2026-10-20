-- Status automático dos agendamentos no servidor (antes só rodava com a agenda aberta no navegador).
-- Para lojas com booking_settings.auto_status_enabled:
--   confirmado → em atendimento quando chega o horário de início;
--   em atendimento → concluído depois do fim + auto_complete_minutes.
-- Só olha agendamentos de ontem em diante (no fuso da loja): os antigos parados ficam como estão.
create or replace function public.process_booking_auto_status()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_count int := 0; n int;
begin
  -- confirmado → em atendimento
  with alvo as (
    select b.id
      from bookings b
      join booking_settings bs on bs.store_id = b.store_id and bs.auto_status_enabled
      join stores s on s.id = b.store_id
     where b.status = 'confirmed'
       and b.booking_date >= ((now() at time zone coalesce(nullif(s.timezone,''),'America/Sao_Paulo'))::date - 1)
       and (b.booking_date + b.start_time) at time zone coalesce(nullif(s.timezone,''),'America/Sao_Paulo') <= now()
       and (b.booking_date + b.end_time) at time zone coalesce(nullif(s.timezone,''),'America/Sao_Paulo')
           + make_interval(mins => coalesce(bs.auto_complete_minutes, 15)) > now()
  )
  update bookings b set status = 'in_progress' from alvo where b.id = alvo.id;
  get diagnostics n = row_count; v_count := v_count + n;

  -- em atendimento → concluído
  with alvo as (
    select b.id
      from bookings b
      join booking_settings bs on bs.store_id = b.store_id and bs.auto_status_enabled
      join stores s on s.id = b.store_id
     where b.status = 'in_progress'
       and b.booking_date >= ((now() at time zone coalesce(nullif(s.timezone,''),'America/Sao_Paulo'))::date - 1)
       and (b.booking_date + b.end_time) at time zone coalesce(nullif(s.timezone,''),'America/Sao_Paulo')
           + make_interval(mins => coalesce(bs.auto_complete_minutes, 15)) <= now()
  )
  update bookings b set status = 'completed' from alvo where b.id = alvo.id;
  get diagnostics n = row_count; v_count := v_count + n;

  return v_count;
end $$;

revoke all on function public.process_booking_auto_status() from public, anon, authenticated;

select cron.schedule('booking-auto-status', '*/5 * * * *', 'select public.process_booking_auto_status()');
