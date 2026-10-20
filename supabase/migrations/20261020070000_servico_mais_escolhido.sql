-- Selo "Mais escolhido" na página de agendamento: só com dados reais (serviço mais agendado nos
-- últimos 90 dias, com pelo menos 5 agendamentos). Antes o selo ia sempre no primeiro serviço.
create or replace function public.get_most_booked_service(p_store_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select b.service_id
    from bookings b
   where b.store_id = p_store_id
     and b.status <> 'cancelled'
     and b.booking_date >= current_date - 90
     and b.service_id is not null
   group by b.service_id
  having count(*) >= 5
   order by count(*) desc
   limit 1
$$;
grant execute on function public.get_most_booked_service(uuid) to anon, authenticated;
