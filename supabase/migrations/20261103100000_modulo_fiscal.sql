-- Módulo fiscal (03/11/2026): NFC-e (cupom fiscal do PDV, modelo 65) e NF-e (nota de pedido, modelo 55)
-- emitidas pela API da Focus NFe. Quem fala com a Focus são só as edge functions
-- (fiscal-emit, fiscal-status, fiscal-cancel, fiscal-webhook) com a service_role.
--
-- Tabelas:
--   store_fiscal_settings  1 por loja. Dados do emitente, ambiente (homologacao/producao), o que está
--                          habilitado e padrões fiscais. Equipe lê (o PDV precisa saber se a NFC-e está
--                          ligada); só dono/admin grava. NADA secreto aqui.
--   store_fiscal_secrets   tokens da Focus (homologação/produção) e CSC da NFC-e. Sem leitura nenhuma
--                          pelo navegador (sem policy e sem grant para anon/authenticated). Grava pela
--                          função fiscal_save_secrets; a tela só vê "configurado ✓" por fiscal_secrets_status.
--   product_fiscal         NCM, CFOP, CEST, origem, CSOSN/CST, PIS/COFINS e unidade por produto.
--                          Fora de `products` porque products tem leitura pública da vitrine.
--   fiscal_documents       cada emissão (ref única da Focus), status, chave, links do DANFE/XML,
--                          payload enviado e resposta. Equipe lê; só o servidor grava.
--
-- Regras:
--   - Uma nota "viva" por venda, tipo e ambiente (índices únicos parciais). Rejeitada (erro) é
--     reenviada com a MESMA ref; cancelada/denegada libera emitir de novo com ref nova.
--   - Sem drop: tudo com if not exists / create or replace.

-- ── Configuração fiscal da loja ──
create table if not exists public.store_fiscal_settings (
  store_id uuid primary key references public.stores(id) on delete cascade,
  environment text not null default 'homologacao' check (environment in ('homologacao', 'producao')),
  nfce_enabled boolean not null default false,
  nfe_enabled boolean not null default false,
  cnpj text,
  inscricao_estadual text,
  -- 1 = Simples Nacional; 2 = Simples com excesso de sublimite; 3 = Regime Normal; 4 = MEI
  regime_tributario smallint not null default 1 check (regime_tributario between 1 and 4),
  razao_social text,
  nome_fantasia text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  municipio text,
  codigo_municipio text, -- IBGE (7 dígitos), opcional
  uf text check (uf is null or uf ~ '^[A-Z]{2}$'),
  cep text,
  telefone text,
  -- Série e próximo número: a Focus numera sozinha. Ficam aqui como referência do que foi
  -- cadastrado na Focus (ou para quem já emitia por outro sistema).
  nfce_serie integer check (nfce_serie is null or nfce_serie between 0 and 999),
  nfce_proximo_numero integer check (nfce_proximo_numero is null or nfce_proximo_numero > 0),
  nfe_serie integer check (nfe_serie is null or nfe_serie between 0 and 999),
  nfe_proximo_numero integer check (nfe_proximo_numero is null or nfe_proximo_numero > 0),
  nfce_natureza_operacao text not null default 'VENDA AO CONSUMIDOR',
  nfe_natureza_operacao text not null default 'Venda de mercadoria',
  -- Padrões usados quando o produto não tem dados fiscais próprios (conferir com o contador)
  default_ncm text,
  default_cfop text not null default '5102',
  default_icms_origem smallint not null default 0 check (default_icms_origem between 0 and 8),
  default_icms_situacao text not null default '102', -- CSOSN (Simples) ou CST (Normal)
  default_pis_cst text,
  default_cofins_cst text,
  default_unidade text not null default 'UN',
  -- PIX no cupom: 17 = PIX dinâmico (QR gerado por cobrança), 20 = PIX estático (chave/QR fixo)
  pix_payment_code text not null default '17' check (pix_payment_code in ('17', '20')),
  -- Taxa de serviço (10%) da comanda entra como "outras despesas" no cupom
  include_service_fee boolean not null default true,
  -- ID da empresa na Focus (API de Empresas), para quando o cadastro for automático
  focus_company_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid
);
comment on table public.store_fiscal_settings is
  'Configuração fiscal da loja (emitente, ambiente, NFC-e/NF-e habilitadas, padrões). Sem segredos.';

-- ── Segredos (tokens da Focus e CSC): só o servidor lê ──
create table if not exists public.store_fiscal_secrets (
  store_id uuid primary key references public.stores(id) on delete cascade,
  focus_token_homologacao text,
  focus_token_producao text,
  csc_id_homologacao text,
  csc_homologacao text,
  csc_id_producao text,
  csc_producao text,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
comment on table public.store_fiscal_secrets is
  'Tokens da Focus NFe e CSC da NFC-e por loja. Só service_role lê; navegador grava por fiscal_save_secrets.';

-- ── Dados fiscais do produto ──
create table if not exists public.product_fiscal (
  product_id uuid primary key references public.products(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  ncm text check (ncm is null or ncm ~ '^[0-9]{8}$'),
  cfop text check (cfop is null or cfop ~ '^[0-9]{4}$'),
  cest text check (cest is null or cest ~ '^[0-9]{7}$'),
  icms_origem smallint check (icms_origem is null or icms_origem between 0 and 8),
  icms_situacao text check (icms_situacao is null or icms_situacao ~ '^[0-9]{2,3}$'),
  pis_cst text check (pis_cst is null or pis_cst ~ '^[0-9]{2}$'),
  cofins_cst text check (cofins_cst is null or cofins_cst ~ '^[0-9]{2}$'),
  unidade text check (unidade is null or char_length(unidade) between 1 and 6),
  updated_at timestamptz not null default now(),
  updated_by uuid
);
create index if not exists product_fiscal_store_idx on public.product_fiscal (store_id);

-- ── Documentos fiscais emitidos ──
create table if not exists public.fiscal_documents (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  doc_type text not null check (doc_type in ('nfce', 'nfe')),
  environment text not null check (environment in ('homologacao', 'producao')),
  comanda_id uuid references public.comandas(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  ref text not null unique, -- a "ref" da Focus (só letras e números)
  attempt integer not null default 1,
  status text not null default 'processando'
    check (status in ('processando', 'autorizado', 'erro', 'cancelado', 'denegado')),
  focus_status text,      -- status como veio da Focus (autorizado, erro_autorizacao, ...)
  status_sefaz text,
  mensagem_sefaz text,
  numero text,
  serie text,
  chave text,
  protocolo text,
  danfe_url text,
  xml_url text,
  qrcode_url text,
  contingencia boolean not null default false,
  error_message text,
  total numeric(12,2),
  recipient_document text, -- CPF/CNPJ do destinatário (só dígitos)
  recipient_name text,
  request_payload jsonb,
  response_payload jsonb,
  cancel_justificativa text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  authorized_at timestamptz,
  cancelled_at timestamptz,
  cancelled_by uuid,
  constraint fiscal_documents_source_check check (comanda_id is not null or order_id is not null)
);
create index if not exists fiscal_documents_store_created_idx on public.fiscal_documents (store_id, created_at desc);
create index if not exists fiscal_documents_comanda_idx on public.fiscal_documents (comanda_id) where comanda_id is not null;
create index if not exists fiscal_documents_order_idx on public.fiscal_documents (order_id) where order_id is not null;
-- Uma nota viva por venda/tipo/ambiente (idempotência: dois cliques não emitem duas notas)
create unique index if not exists fiscal_documents_one_live_per_comanda
  on public.fiscal_documents (comanda_id, doc_type, environment)
  where comanda_id is not null and status not in ('cancelado', 'denegado');
create unique index if not exists fiscal_documents_one_live_per_order
  on public.fiscal_documents (order_id, doc_type, environment)
  where order_id is not null and status not in ('cancelado', 'denegado');

-- ── RLS ──
alter table public.store_fiscal_settings enable row level security;
alter table public.store_fiscal_secrets enable row level security;
alter table public.product_fiscal enable row level security;
alter table public.fiscal_documents enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'store_fiscal_settings' and policyname = 'Store team can read fiscal settings') then
    create policy "Store team can read fiscal settings" on public.store_fiscal_settings
      for select to authenticated using (public._can_operate_store(store_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'store_fiscal_settings' and policyname = 'Store admins can insert fiscal settings') then
    create policy "Store admins can insert fiscal settings" on public.store_fiscal_settings
      for insert to authenticated with check (public.is_store_admin_of(store_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'store_fiscal_settings' and policyname = 'Store admins can update fiscal settings') then
    create policy "Store admins can update fiscal settings" on public.store_fiscal_settings
      for update to authenticated using (public.is_store_admin_of(store_id)) with check (public.is_store_admin_of(store_id));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'product_fiscal' and policyname = 'Store team can read product fiscal') then
    create policy "Store team can read product fiscal" on public.product_fiscal
      for select to authenticated using (public._can_operate_store(store_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'product_fiscal' and policyname = 'Store admins can insert product fiscal') then
    create policy "Store admins can insert product fiscal" on public.product_fiscal
      for insert to authenticated with check (public.is_store_admin_of(store_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'product_fiscal' and policyname = 'Store admins can update product fiscal') then
    create policy "Store admins can update product fiscal" on public.product_fiscal
      for update to authenticated using (public.is_store_admin_of(store_id)) with check (public.is_store_admin_of(store_id));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'fiscal_documents' and policyname = 'Store team can read fiscal documents') then
    create policy "Store team can read fiscal documents" on public.fiscal_documents
      for select to authenticated using (public._can_operate_store(store_id));
  end if;
end $$;
-- store_fiscal_secrets: sem policy de propósito (RLS ligada = ninguém além da service_role)

revoke all on public.store_fiscal_settings, public.store_fiscal_secrets, public.product_fiscal, public.fiscal_documents from anon;
revoke all on public.store_fiscal_secrets from authenticated;
revoke delete on public.store_fiscal_settings, public.product_fiscal from authenticated;
revoke insert, update, delete on public.fiscal_documents from authenticated;

-- ── Gatilhos: loja do produto e carimbo de quem alterou ──
create or replace function public._product_fiscal_store_guard()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  select store_id into new.store_id from products where id = new.product_id;
  if new.store_id is null then raise exception 'Produto não encontrado'; end if;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end; $$;
revoke all on function public._product_fiscal_store_guard() from public, anon, authenticated;
create or replace trigger trg_product_fiscal_store_guard
  before insert or update on public.product_fiscal
  for each row execute function public._product_fiscal_store_guard();

create or replace function public._fiscal_touch()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  new.updated_at := now();
  if tg_table_name in ('store_fiscal_settings', 'store_fiscal_secrets') then
    new.updated_by := coalesce(auth.uid(), new.updated_by);
  end if;
  return new;
end; $$;
revoke all on function public._fiscal_touch() from public, anon, authenticated;
create or replace trigger trg_store_fiscal_settings_touch
  before insert or update on public.store_fiscal_settings
  for each row execute function public._fiscal_touch();
create or replace trigger trg_store_fiscal_secrets_touch
  before insert or update on public.store_fiscal_secrets
  for each row execute function public._fiscal_touch();
create or replace trigger trg_fiscal_documents_touch
  before update on public.fiscal_documents
  for each row execute function public._fiscal_touch();

-- ── Segredos: gravar (só dono/admin) e ver só se estão configurados ──
-- Valor null ou vazio = mantém o que já estava. p_clear = apaga tudo (trocar de conta Focus).
create or replace function public.fiscal_save_secrets(
  p_store_id uuid,
  p_focus_token_homologacao text default null,
  p_focus_token_producao text default null,
  p_csc_id_homologacao text default null,
  p_csc_homologacao text default null,
  p_csc_id_producao text default null,
  p_csc_producao text default null,
  p_clear boolean default false)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.is_store_admin_of(p_store_id) then
    raise exception 'Só o dono ou administrador da loja pode alterar as chaves fiscais';
  end if;
  if p_clear then
    delete from store_fiscal_secrets where store_id = p_store_id;
  else
    insert into store_fiscal_secrets as s (store_id, focus_token_homologacao, focus_token_producao,
      csc_id_homologacao, csc_homologacao, csc_id_producao, csc_producao)
    values (p_store_id,
      nullif(trim(coalesce(p_focus_token_homologacao, '')), ''),
      nullif(trim(coalesce(p_focus_token_producao, '')), ''),
      nullif(trim(coalesce(p_csc_id_homologacao, '')), ''),
      nullif(trim(coalesce(p_csc_homologacao, '')), ''),
      nullif(trim(coalesce(p_csc_id_producao, '')), ''),
      nullif(trim(coalesce(p_csc_producao, '')), ''))
    on conflict (store_id) do update set
      focus_token_homologacao = coalesce(excluded.focus_token_homologacao, s.focus_token_homologacao),
      focus_token_producao = coalesce(excluded.focus_token_producao, s.focus_token_producao),
      csc_id_homologacao = coalesce(excluded.csc_id_homologacao, s.csc_id_homologacao),
      csc_homologacao = coalesce(excluded.csc_homologacao, s.csc_homologacao),
      csc_id_producao = coalesce(excluded.csc_id_producao, s.csc_id_producao),
      csc_producao = coalesce(excluded.csc_producao, s.csc_producao);
  end if;
  return public.fiscal_secrets_status(p_store_id);
end;
$$;
revoke all on function public.fiscal_save_secrets(uuid, text, text, text, text, text, text, boolean) from public, anon;
grant execute on function public.fiscal_save_secrets(uuid, text, text, text, text, text, text, boolean) to authenticated;

create or replace function public.fiscal_secrets_status(p_store_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  s store_fiscal_secrets;
begin
  if not public._can_operate_store(p_store_id) then
    raise exception 'Sem permissão para esta loja';
  end if;
  select * into s from store_fiscal_secrets where store_id = p_store_id;
  return jsonb_build_object(
    'token_homologacao', s.focus_token_homologacao is not null,
    'token_producao', s.focus_token_producao is not null,
    'csc_homologacao', s.csc_homologacao is not null and s.csc_id_homologacao is not null,
    'csc_producao', s.csc_producao is not null and s.csc_id_producao is not null,
    'updated_at', s.updated_at
  );
end;
$$;
revoke all on function public.fiscal_secrets_status(uuid) from public, anon;
grant execute on function public.fiscal_secrets_status(uuid) to authenticated;
