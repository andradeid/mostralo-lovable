-- E-mails da plataforma para o lojista (boas-vindas, avisos de fatura, pagamento confirmado).
-- Cada aviso vai uma vez só por destinatário: chave única (kind, ref, recipient).
create table if not exists public.platform_email_notifications (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade,
  kind text not null,
  ref text not null,
  recipient text not null,
  status text not null default 'sending',
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (kind, ref, recipient)
);
create index if not exists idx_platform_email_notifications_store on public.platform_email_notifications (store_id, created_at desc);

alter table public.platform_email_notifications enable row level security;
-- Só o servidor grava; o master consulta no painel.
create policy "Master admin can read platform emails"
  on public.platform_email_notifications for select to authenticated
  using (public.is_master_admin());
