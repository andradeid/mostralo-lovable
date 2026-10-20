-- Dias especiais (business_hours.special_days) também valem para encomendas (pedidos agendados):
-- fechado = sem horários; aberto = usa o horário do dia especial no lugar do da semana.
-- A validação do pedido (_validate_scheduled_order) usa get_scheduled_slots, então fica coberta.

create or replace function public._special_day(p_bh jsonb, p_date date)
returns jsonb
language sql
immutable
set search_path = public
as $$
  select x
    from jsonb_array_elements(case when jsonb_typeof(p_bh->'special_days') = 'array' then p_bh->'special_days' else '[]'::jsonb end) x
   where x->>'date' = to_char(p_date, 'YYYY-MM-DD')
   limit 1
$$;

create or replace function public.get_scheduled_slots(p_store_id uuid, p_date date, p_delivery_type text DEFAULT 'delivery'::text, p_exclude_order_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(slot_at timestamp with time zone, slot_time text, available boolean, remaining integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  s record; so jsonb; ts jsonb; tz text; dk text; d jsonb; per jsonb; periods jsonb; sp jsonb;
  v_int int; v_min interval; v_max interval; st public.store_order_schedule_settings;
  t_open time; t_close time; p_start timestamptz; p_end timestamptz; v_day_left int;
begin
  select id, timezone, business_hours, delivery_config into s from public.stores where id = p_store_id;
  if not found then return; end if;
  so := coalesce(s.delivery_config->'scheduled_orders', '{}'::jsonb);
  if coalesce(so->>'enabled','false') not in ('true','1') then return; end if;
  tz := coalesce(nullif(s.timezone,''), 'America/Sao_Paulo');
  select * into st from public.store_order_schedule_settings where store_id = p_store_id;
  ts := case when p_delivery_type = 'delivery' then so->'delivery_settings' else so->'pickup_settings' end;
  v_int := case when p_delivery_type = 'delivery'
    then coalesce(nullif(ts->>'time_interval','')::int, 15)
    else coalesce(st.pickup_interval_minutes, nullif(ts->>'time_interval','')::int, 30) end;
  v_min := public._sched_interval(ts->>'min_advance_value', ts->>'min_advance_unit', interval '60 minutes');
  v_max := public._sched_interval(ts->>'max_advance_value', ts->>'max_advance_unit', interval '7 days');
  dk := (array['monday','tuesday','wednesday','thursday','friday','saturday','sunday'])[extract(isodow from p_date)::int];
  d := s.business_hours->dk;
  -- Dia especial tem prioridade sobre o horário da semana
  sp := public._special_day(s.business_hours, p_date);
  if sp is not null then
    if coalesce(sp->>'closed','false') in ('true','1') then return; end if;
    d := jsonb_build_object('open', sp->>'open', 'close', sp->>'close', 'closed', false);
  end if;
  if d is null or coalesce(d->>'closed','false') in ('true','1') then return; end if;
  periods := case when jsonb_typeof(d->'periods') = 'array' and jsonb_array_length(d->'periods') > 0
    then d->'periods' else jsonb_build_array(jsonb_build_object('open', d->>'open', 'close', d->>'close')) end;
  if st.max_orders_per_day is not null then
    select st.max_orders_per_day - count(*) into v_day_left from public.orders o
     where o.store_id = p_store_id and o.scheduled_for is not null and o.status <> 'cancelado'
       and (o.scheduled_for at time zone tz)::date = p_date
       and (p_exclude_order_id is null or o.id <> p_exclude_order_id);
  end if;
  for per in select * from jsonb_array_elements(periods) loop
    continue when nullif(per->>'open','') is null or nullif(per->>'close','') is null;
    t_open := (per->>'open')::time; t_close := (per->>'close')::time;
    p_start := (p_date + t_open) at time zone tz;
    p_end := (p_date + t_close + case when t_close <= t_open then interval '1 day' else interval '0' end) at time zone tz;
    return query
      select g.g, to_char(g.g at time zone tz, 'HH24:MI'),
             (coalesce(v_day_left, 1) > 0 and (st.max_orders_per_slot is null or st.max_orders_per_slot - c.n > 0)),
             least(coalesce(v_day_left, 9999),
                   case when st.max_orders_per_slot is null then 9999 else st.max_orders_per_slot - c.n end)::int
        from generate_series(p_start, p_end - interval '1 second', make_interval(mins => v_int)) as g(g)
        cross join lateral (
          select count(*)::int n from public.orders o
           where o.store_id = p_store_id and o.scheduled_for = g.g and o.status <> 'cancelado'
             and (p_exclude_order_id is null or o.id <> p_exclude_order_id)) c
       where g.g >= now() + v_min and g.g <= now() + v_max
       order by g.g;
  end loop;
end $function$;

create or replace function public.get_scheduled_days(p_store_id uuid, p_from date, p_to date, p_delivery_type text DEFAULT 'delivery'::text)
 RETURNS TABLE(day date, is_open boolean, slots_available integer, orders_count integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_d date; tz text; bh jsonb; dk text; sp jsonb;
begin
  if p_to < p_from or p_to - p_from > 62 then raise exception 'Período inválido (máximo 62 dias)'; end if;
  select coalesce(nullif(s.timezone,''),'America/Sao_Paulo'), s.business_hours into tz, bh from public.stores s where s.id = p_store_id;
  if not found then return; end if;
  v_d := p_from;
  while v_d <= p_to loop
    dk := (array['monday','tuesday','wednesday','thursday','friday','saturday','sunday'])[extract(isodow from v_d)::int];
    day := v_d;
    sp := public._special_day(bh, v_d);
    if sp is not null then
      is_open := coalesce(sp->>'closed','false') not in ('true','1');
    else
      is_open := bh->dk is not null and coalesce(bh->dk->>'closed','false') not in ('true','1');
    end if;
    select count(*) filter (where x.available)::int into slots_available
      from public.get_scheduled_slots(p_store_id, v_d, p_delivery_type) x;
    select count(*)::int into orders_count from public.orders o
      where o.store_id = p_store_id and o.scheduled_for is not null and o.status <> 'cancelado'
        and (o.scheduled_for at time zone tz)::date = v_d;
    return next;
    v_d := v_d + 1;
  end loop;
end $function$;
