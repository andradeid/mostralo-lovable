-- Convite por link para o profissional criar a própria senha (no lugar do dono inventar).
create table if not exists public.professional_invites (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  email text not null,
  token text not null unique,
  created_by uuid,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  used_at timestamptz
);
create index if not exists professional_invites_professional_idx on public.professional_invites(professional_id);
-- Só o servidor (service role) lê/grava: o link é resolvido pela função professional-invite.
alter table public.professional_invites enable row level security;
