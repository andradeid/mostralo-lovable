-- Fecha leituras/escritas públicas (chave anon do site) que expunham dados de clientes e lojas.
-- Achado em 31/10/2026: regras feitas para o "sistema" (service_role) estavam valendo para todos,
-- e a tabela de clientes era lida inteira por qualquer visitante.
-- service_role ignora RLS; funções do banco que gravam nessas tabelas são SECURITY DEFINER;
-- as funções do servidor usam a service_role. Por isso as regras abaixo só tiram o acesso público.

-- 1) Clientes: totem e cadastro da loja passam a usar esta função (só devolve o id).
--    A leitura pública da tabela é retirada na migração seguinte, depois que o site novo estiver no ar.

create or replace function public.find_or_create_customer_by_phone(
  p_phone text,
  p_name text default null,
  p_email text default null
) returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_id uuid;
begin
  if length(v_phone) < 10 or length(v_phone) > 13 then
    raise exception 'Telefone inválido' using errcode = '22023';
  end if;
  select id into v_id from customers where phone = v_phone order by created_at limit 1;
  if v_id is null then
    insert into customers (name, phone, email)
    values (coalesce(nullif(trim(p_name), ''), 'Cliente'), v_phone, nullif(trim(coalesce(p_email, '')), ''))
    returning id into v_id;
  end if;
  return v_id;
end;
$$;
revoke all on function public.find_or_create_customer_by_phone(text, text, text) from public;
grant execute on function public.find_or_create_customer_by_phone(text, text, text) to anon, authenticated;

-- 2) WhatsApp e IA: regras "do sistema" passam a valer só para a service_role
alter policy "System can manage whatsapp messages" on public.whatsapp_messages to service_role;
alter policy "System can manage message queue" on public.whatsapp_message_queue to service_role;
alter policy "Service role full access to session context" on public.whatsapp_session_context to service_role;
alter policy "Service role full access on openai_usage_logs" on public.openai_usage_logs to service_role;
alter policy "Service role can manage analyses" on public.whatsapp_conversation_analysis to service_role;
alter policy "system_manage_paused_contacts" on public.whatsapp_paused_contacts to service_role;

-- Equipe da loja (administrador e atendente) continua lendo as mensagens e a fila da sua loja
create policy "Store team can read whatsapp messages"
  on public.whatsapp_messages for select to authenticated
  using (store_id in (select ur.store_id from user_roles ur
                       where ur.user_id = (select auth.uid()) and ur.role in ('store_admin'::app_role, 'attendant'::app_role)));
create policy "Store team can read message queue"
  on public.whatsapp_message_queue for select to authenticated
  using (store_id in (select ur.store_id from user_roles ur
                       where ur.user_id = (select auth.uid()) and ur.role in ('store_admin'::app_role, 'attendant'::app_role)));

-- Equipe da loja continua podendo desconsiderar análises (painel de KPIs)
create policy "Store team can update analyses"
  on public.whatsapp_conversation_analysis for update to authenticated
  using (is_store_owner_direct(store_id, (select auth.uid())) or has_role((select auth.uid()), 'master_admin'::app_role)
         or store_id in (select get_user_store_ids_direct((select auth.uid()))))
  with check (is_store_owner_direct(store_id, (select auth.uid())) or has_role((select auth.uid()), 'master_admin'::app_role)
         or store_id in (select get_user_store_ids_direct((select auth.uid()))));

-- Equipe da loja (além do dono) pode ver e reativar contatos pausados
create policy "Store team can manage paused contacts"
  on public.whatsapp_paused_contacts for all to authenticated
  using (store_id in (select get_user_store_ids_direct((select auth.uid()))))
  with check (store_id in (select get_user_store_ids_direct((select auth.uid()))));

-- 3) Links de agendamento: só o servidor lê (as telas usam as funções do servidor)
alter policy "Anyone can read booking tokens by token value" on public.booking_tokens to service_role;

-- 4) Faturas: a página pública usa a visão public_subscription_invoices
alter policy "Acesso público para pagamento de faturas" on public.subscription_invoices to service_role;
alter policy "Public can read invoices by token" on public.subscription_invoices to service_role;

-- 5) Visão com e-mail e papel de todos os usuários: não usada pelo site
revoke select on public.unified_users_view from anon, authenticated;
