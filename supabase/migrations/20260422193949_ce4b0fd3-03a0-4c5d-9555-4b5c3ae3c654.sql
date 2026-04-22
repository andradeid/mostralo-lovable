create table if not exists public.job_execution_locks (
  job_name text primary key,
  locked_at timestamp with time zone not null default now(),
  lock_expires_at timestamp with time zone not null,
  owner_id uuid default gen_random_uuid(),
  last_heartbeat_at timestamp with time zone not null default now(),
  released_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.job_execution_locks enable row level security;

create policy "job_execution_locks service role only read"
on public.job_execution_locks
for select
to service_role
using (true);

create policy "job_execution_locks service role only insert"
on public.job_execution_locks
for insert
to service_role
with check (true);

create policy "job_execution_locks service role only update"
on public.job_execution_locks
for update
to service_role
using (true)
with check (true);

create policy "job_execution_locks service role only delete"
on public.job_execution_locks
for delete
to service_role
using (true);

create index if not exists idx_job_execution_locks_expires_at
on public.job_execution_locks (lock_expires_at);

create or replace function public.set_job_execution_locks_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_job_execution_locks_updated_at
before update on public.job_execution_locks
for each row
execute function public.set_job_execution_locks_updated_at();

create or replace function public.acquire_job_lock(
  p_job_name text,
  p_ttl_seconds integer default 300
)
returns table(acquired boolean, owner_id uuid, lock_expires_at timestamp with time zone)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid := gen_random_uuid();
begin
  delete from public.job_execution_locks
  where job_name = p_job_name
    and (released_at is not null or lock_expires_at <= now());

  insert into public.job_execution_locks (
    job_name,
    owner_id,
    locked_at,
    lock_expires_at,
    last_heartbeat_at,
    released_at
  )
  values (
    p_job_name,
    v_owner_id,
    now(),
    now() + make_interval(secs => greatest(p_ttl_seconds, 30)),
    now(),
    null
  )
  on conflict (job_name) do nothing;

  if found then
    return query
    select true, v_owner_id, now() + make_interval(secs => greatest(p_ttl_seconds, 30));
    return;
  end if;

  return query
  select false, null::uuid, l.lock_expires_at
  from public.job_execution_locks l
  where l.job_name = p_job_name;
end;
$$;

create or replace function public.release_job_lock(
  p_job_name text,
  p_owner_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_released boolean;
begin
  update public.job_execution_locks
  set released_at = now(),
      last_heartbeat_at = now(),
      lock_expires_at = now()
  where job_name = p_job_name
    and owner_id = p_owner_id
    and released_at is null;

  v_released := found;
  return v_released;
end;
$$;