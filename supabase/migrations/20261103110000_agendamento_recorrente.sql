-- Agendamento recorrente (repetir toda semana) — 03/11/2026
--
-- O que muda:
--   * bookings.recurrence_group_id (uuid, opcional): identifica as reservas da mesma série.
--   * create_recurring_bookings(...): cria numa transação só as datas livres da série
--     (acesso por _can_operate_store, trava por profissional, confere expediente, intervalo,
--     bloqueios e reservas com status <> 'cancelled'). Datas ocupadas são puladas e devolvidas.
--   * cancel_recurring_bookings(...): cancela a reserva escolhida e as próximas da mesma série.
--
-- WhatsApp: nenhum gatilho de bookings envia mensagem ao inserir. A reserva única criada pelo
-- painel também não envia confirmação (só pelo botão "Confirmação" no detalhe); a série segue
-- igual. O lembrete (booking-reminder, a cada 10 min) continua saindo para cada reserva perto
-- do horário, como para qualquer reserva.
--
-- =====================================================================================
-- TESTE (rodar no SQL Editor DEPOIS de aplicar a migration; termina com erro de propósito
-- para desfazer tudo — o resultado aparece na mensagem do erro):
--
-- do $$
-- declare
--   v_store uuid := 'd1b9f8cc-8827-45e1-9a32-b39f5eecbe5a';        -- Barbearia Corte Fino
--   v_prof  uuid := '71ab144f-e39e-4ef8-b32c-db4806c605a0';        -- Rafael Moura
--   v_serv  uuid := '92e6a691-7726-4811-a4c9-050d94e868e2';        -- Corte de Cabelo (30 min)
--   v_first date := ((now() at time zone 'America/Sao_Paulo')::date + 14);
--   v_dates date[] := array[v_first, v_first + 7, v_first + 14, v_first + 21];
--   v_res jsonb; v_cancel jsonb; v_third uuid;
-- begin
--   perform set_config('request.jwt.claim.sub', 'c9e7e489-a297-4b67-8aaa-a9b16efffd6d', true);
--   perform set_config('request.jwt.claims', '{"sub":"c9e7e489-a297-4b67-8aaa-a9b16efffd6d","role":"authenticated"}', true);
--
--   -- ocupa a 2ª data no mesmo horário (se já estiver ocupada, segue)
--   begin
--     insert into public.bookings (store_id, professional_id, service_id, customer_name, customer_phone,
--       booking_date, start_time, end_time, price, status)
--     values (v_store, v_prof, v_serv, 'Teste Ocupado', '61900000001', v_first + 7, '15:00', '15:30', 0, 'confirmed');
--   exception when raise_exception then null;
--   end;
--
--   v_res := public.create_recurring_bookings(v_store, v_prof, v_serv, 'Teste Mensalista', '61900000002',
--     null, 'teste série', '15:00', v_dates);
--
--   select (c->>'booking_id')::uuid into v_third
--     from jsonb_array_elements(v_res->'created') c where (c->>'date')::date = v_first + 14;
--   if v_third is not null then
--     v_cancel := public.cancel_recurring_bookings(v_third, 'teste');
--   end if;
--
--   raise exception 'TESTE (desfeito) — criadas: %, puladas: % | detalhe: % | cancelar da 3ª em diante: %',
--     jsonb_array_length(v_res->'created'), jsonb_array_length(v_res->'skipped'), v_res, v_cancel;
-- end $$;
--
-- Esperado: criadas 3, puladas 1 (a 2ª data, reason "busy"); o cancelamento a partir da 3ª
-- cancela 2 (3ª e 4ª).
-- =====================================================================================

alter table public.bookings add column if not exists recurrence_group_id uuid;

comment on column public.bookings.recurrence_group_id is
  'Série de agendamento recorrente (repetir toda semana). Mesmo valor nas reservas da série; null = reserva avulsa.';

create index if not exists idx_bookings_recurrence_group
  on public.bookings (recurrence_group_id, booking_date)
  where recurrence_group_id is not null;

-- -------------------------------------------------------------------------------------
-- Cria a série: só as datas livres, todas com o mesmo recurrence_group_id.
-- Retorno: { recurrence_group_id, created: [{date, booking_id}], skipped: [{date, reason}] }
--   reason: 'busy' | 'off_hours' | 'blocked' | 'past'
-- -------------------------------------------------------------------------------------
create or replace function public.create_recurring_bookings(
  p_store_id uuid,
  p_professional_id uuid,
  p_service_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_notes text,
  p_start_time time,
  p_dates date[]
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_tz text;
  v_now_local timestamp;
  v_duration int;
  v_buffer int;
  v_price numeric;
  v_start int;
  v_end int;
  v_busy_end int;
  v_end_time time;
  v_group uuid := gen_random_uuid();
  v_date date;
  v_sched record;
  v_reason text;
  v_id uuid;
  v_created jsonb := '[]'::jsonb;
  v_skipped jsonb := '[]'::jsonb;
  v_name text := trim(coalesce(p_customer_name, ''));
  v_phone text := trim(coalesce(p_customer_phone, ''));
begin
  if v_uid is null then
    raise exception 'Sessão expirada. Entre novamente.' using errcode = '42501';
  end if;
  if p_store_id is null or not public._can_operate_store(p_store_id) then
    raise exception 'Sem permissão para agendar nesta loja.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.professionals where id = p_professional_id and store_id = p_store_id) then
    raise exception 'Profissional não encontrado nesta loja.' using errcode = '22023';
  end if;

  select s.duration_minutes, coalesce(s.buffer_minutes, 0), s.price
    into v_duration, v_buffer, v_price
    from public.booking_services s
   where s.id = p_service_id and s.store_id = p_store_id;
  if not found then
    raise exception 'Serviço não encontrado nesta loja.' using errcode = '22023';
  end if;

  if length(v_name) < 2 or length(v_name) > 100 then
    raise exception 'Nome do cliente inválido.' using errcode = '22023';
  end if;
  if length(regexp_replace(v_phone, '\D', '', 'g')) < 10 or length(v_phone) > 20 then
    raise exception 'Telefone do cliente inválido.' using errcode = '22023';
  end if;
  if p_start_time is null then
    raise exception 'Informe o horário.' using errcode = '22023';
  end if;
  if p_dates is null or cardinality(p_dates) < 1 or cardinality(p_dates) > 12 then
    raise exception 'Informe de 1 a 12 datas.' using errcode = '22023';
  end if;

  v_duration := greatest(coalesce(v_duration, 30), 1);
  v_start := (extract(epoch from p_start_time) / 60)::int;
  v_end := v_start + v_duration;
  v_busy_end := v_end + greatest(v_buffer, 0);
  if v_end >= 1440 then
    raise exception 'O atendimento passaria da meia-noite.' using errcode = '22023';
  end if;
  v_end_time := p_start_time + make_interval(mins => v_duration);

  select coalesce(nullif(trim(st.timezone), ''), 'America/Sao_Paulo') into v_tz
    from public.stores st where st.id = p_store_id;
  begin
    v_now_local := now() at time zone v_tz;
  exception when others then
    v_now_local := now() at time zone 'America/Sao_Paulo';
  end;

  -- Uma série por profissional por vez (evita duas séries disputando as mesmas datas).
  perform pg_advisory_xact_lock(hashtextextended('booking-professional:' || p_professional_id::text, 0));

  for v_date in select distinct d from unnest(p_dates) as d where d is not null order by d loop
    v_reason := null;

    if (v_date + p_start_time) <= v_now_local then
      v_reason := 'past';
    else
      select ps.start_time, ps.end_time, ps.break_start, ps.break_end, ps.is_available
        into v_sched
        from public.professional_schedules ps
       where ps.professional_id = p_professional_id
         and ps.day_of_week = extract(dow from v_date)::int
       limit 1;

      if not found or v_sched.is_available is not true then
        v_reason := 'off_hours';
      elsif v_start < (extract(epoch from v_sched.start_time) / 60)::int
         or v_end > (extract(epoch from v_sched.end_time) / 60)::int then
        v_reason := 'off_hours';
      elsif v_sched.break_start is not null and v_sched.break_end is not null
        and v_start < (extract(epoch from v_sched.break_end) / 60)::int
        and v_busy_end > (extract(epoch from v_sched.break_start) / 60)::int then
        v_reason := 'off_hours';
      elsif exists (
        select 1 from public.professional_blocks b
         where b.professional_id = p_professional_id
           and b.block_date = v_date
           and (coalesce(b.is_all_day, false)
             or (b.start_time is not null and b.end_time is not null
                 and v_start < (extract(epoch from b.end_time) / 60)::int
                 and v_busy_end > (extract(epoch from b.start_time) / 60)::int))
      ) then
        v_reason := 'blocked';
      elsif exists (
        select 1 from public.bookings bk
         where bk.professional_id = p_professional_id
           and bk.booking_date = v_date
           and bk.status <> 'cancelled'
           and v_start < (extract(epoch from bk.end_time) / 60)::int
           and v_busy_end > (extract(epoch from bk.start_time) / 60)::int
      ) then
        v_reason := 'busy';
      end if;
    end if;

    if v_reason is null then
      begin
        insert into public.bookings (
          store_id, professional_id, service_id, customer_name, customer_phone, customer_email,
          booking_date, start_time, end_time, price, notes, status, recurrence_group_id
        ) values (
          p_store_id, p_professional_id, p_service_id, v_name, v_phone, nullif(trim(coalesce(p_customer_email, '')), ''),
          v_date, p_start_time, v_end_time, v_price, nullif(left(trim(coalesce(p_notes, '')), 500), ''), 'confirmed', v_group
        ) returning id into v_id;
        v_created := v_created || jsonb_build_object('date', v_date, 'booking_id', v_id);
      exception when raise_exception then
        -- check_booking_conflict (reserva gravada por outro caminho no mesmo instante)
        if sqlerrm like 'Conflito de horário%' then
          v_reason := 'busy';
        else
          raise;
        end if;
      end;
    end if;

    if v_reason is not null then
      v_skipped := v_skipped || jsonb_build_object('date', v_date, 'reason', v_reason);
    end if;
  end loop;

  return jsonb_build_object(
    'recurrence_group_id', case when jsonb_array_length(v_created) > 0 then v_group end,
    'created', v_created,
    'skipped', v_skipped
  );
end;
$$;

revoke all on function public.create_recurring_bookings(uuid, uuid, uuid, text, text, text, text, time, date[]) from public, anon;
grant execute on function public.create_recurring_bookings(uuid, uuid, uuid, text, text, text, text, time, date[]) to authenticated;

-- -------------------------------------------------------------------------------------
-- Cancela a reserva escolhida e as próximas da mesma série.
-- A escolhida pode estar pendente/confirmada/em atendimento (igual ao botão Cancelar);
-- as próximas só se estiverem pendentes ou confirmadas.
-- Retorno: { cancelled, booking_ids: [...], dates: [...] }
-- -------------------------------------------------------------------------------------
create or replace function public.cancel_recurring_bookings(
  p_booking_id uuid,
  p_reason text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_b record;
  v_ids uuid[];
  v_dates date[];
begin
  if v_uid is null then
    raise exception 'Sessão expirada. Entre novamente.' using errcode = '42501';
  end if;

  select id, store_id, recurrence_group_id, booking_date
    into v_b
    from public.bookings
   where id = p_booking_id;
  if not found or not public._can_operate_store(v_b.store_id) then
    raise exception 'Agendamento não encontrado.' using errcode = '42501';
  end if;
  if v_b.recurrence_group_id is null then
    raise exception 'Este agendamento não faz parte de uma série.' using errcode = '22023';
  end if;

  with upd as (
    update public.bookings bk
       set status = 'cancelled',
           cancelled_at = now(),
           cancelled_by = v_uid,
           cancellation_reason = nullif(left(trim(coalesce(p_reason, '')), 500), '')
     where bk.recurrence_group_id = v_b.recurrence_group_id
       and bk.store_id = v_b.store_id
       and bk.booking_date >= v_b.booking_date
       and (
         (bk.id = v_b.id and bk.status in ('pending', 'confirmed', 'in_progress'))
         or (bk.id <> v_b.id and bk.status in ('pending', 'confirmed'))
       )
    returning bk.id, bk.booking_date
  )
  select coalesce(array_agg(id order by booking_date), '{}'::uuid[]),
         coalesce(array_agg(booking_date order by booking_date), '{}'::date[])
    into v_ids, v_dates
    from upd;

  return jsonb_build_object('cancelled', cardinality(v_ids), 'booking_ids', to_jsonb(v_ids), 'dates', to_jsonb(v_dates));
end;
$$;

revoke all on function public.cancel_recurring_bookings(uuid, text) from public, anon;
grant execute on function public.cancel_recurring_bookings(uuid, text) to authenticated;
