-- Hora de cada etapa do pedido (para o acompanhamento do cliente mostrar quando entrou em preparo, saiu etc.)
alter table public.orders add column if not exists status_times jsonb not null default '{}'::jsonb;

create or replace function public.track_order_status_times()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.status_times := coalesce(new.status_times, '{}'::jsonb)
      || jsonb_build_object(new.status::text, to_jsonb(coalesce(new.created_at, now())));
  elsif new.status is distinct from old.status then
    new.status_times := coalesce(new.status_times, '{}'::jsonb)
      || jsonb_build_object(new.status::text, to_jsonb(now()));
  end if;
  return new;
end $$;

create trigger trg_track_order_status_times
  before insert or update of status on public.orders
  for each row execute function public.track_order_status_times();
