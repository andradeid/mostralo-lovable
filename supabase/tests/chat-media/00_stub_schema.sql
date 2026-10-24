-- Esquema mínimo (imita Supabase) para testar localmente as funções e políticas da mídia do chat.
-- Usado só no teste local (Postgres 16); não aplicar no projeto.
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth; create schema storage;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.role() returns text language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon') $$;
create table storage.buckets (id text primary key, name text, public boolean default false, file_size_limit bigint);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, metadata jsonb, created_at timestamptz default now());
create function storage.foldername(name text) returns text[] language plpgsql as $$
declare _parts text[]; begin select string_to_array(name, '/') into _parts; return _parts[1:array_length(_parts,1)-1]; end $$;
alter table storage.objects enable row level security;
grant usage on schema storage, auth, public to anon, authenticated, service_role;
grant select, insert, delete on storage.objects to anon, authenticated, service_role;

create table public.profiles (id uuid primary key, user_type text);
create table public.stores (id uuid primary key, name text, owner_id uuid, retain_whatsapp_history boolean default false);
create table public.user_roles (user_id uuid, store_id uuid, role text);
create table public.whatsapp_chat_messages (id uuid primary key default gen_random_uuid(), store_id uuid, media_url text, metadata jsonb);
create table public.master_whatsapp_chat_messages (id uuid primary key default gen_random_uuid(), media_url text, metadata jsonb, "timestamp" timestamptz default now());
create table public.whatsapp_cleanup_log (id uuid primary key default gen_random_uuid(), store_name text);
create function public.is_master_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from profiles where id = auth.uid() and user_type = 'master_admin') $$;
create function public.is_store_admin_of(_store_id uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from stores where id = _store_id and owner_id = auth.uid()) $$;
create function public.is_attendant_for_store(store_id_param uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from user_roles where user_id = auth.uid() and store_id = store_id_param and role = 'attendant') $$;

-- Política original (pública) para o bucket, como em produção hoje.
insert into storage.buckets (id, name, public) values ('whatsapp-chat-media', 'whatsapp-chat-media', true);
create policy "Authenticated users can upload whatsapp media" on storage.objects for insert with check (bucket_id = 'whatsapp-chat-media' and auth.role() = 'authenticated');
create policy "Public read whatsapp chat media" on storage.objects for select using (bucket_id = 'whatsapp-chat-media');
create policy "Authenticated users can delete whatsapp media" on storage.objects for delete using (bucket_id = 'whatsapp-chat-media' and auth.role() = 'authenticated');
