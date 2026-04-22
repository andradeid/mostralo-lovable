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
  v_expires_at timestamp with time zone := now() + make_interval(secs => greatest(p_ttl_seconds, 30));
begin
  delete from public.job_execution_locks jel
  where jel.job_name = p_job_name
    and (jel.released_at is not null or jel.lock_expires_at <= now());

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
    v_expires_at,
    now(),
    null
  )
  on conflict (job_name) do nothing;

  if found then
    return query
    select true, v_owner_id, v_expires_at;
    return;
  end if;

  return query
  select false, null::uuid, jel.lock_expires_at
  from public.job_execution_locks jel
  where jel.job_name = p_job_name;
end;
$$;