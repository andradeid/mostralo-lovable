-- Relatório de segurança do Supabase (01/11): funções SECURITY DEFINER que qualquer visitante podia chamar.

-- 1. Funções de gatilho: só rodam pelos gatilhos (o Postgres não confere EXECUTE ao disparar).
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
      from pg_proc p
     where p.pronamespace = 'public'::regnamespace and p.prosecdef and p.prorettype = 'trigger'::regtype
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', r.sig);
  end loop;
end $$;

-- 2. Usadas só pelo servidor (chave de serviço), por rotinas agendadas ou por nenhuma tela.
revoke execute on function public.acquire_job_lock(text, integer) from public, anon, authenticated;
revoke execute on function public.release_job_lock(text, uuid) from public, anon, authenticated;
revoke execute on function public.check_subscription_coverage(uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.clone_store_data(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.count_orphan_whatsapp_data(uuid) from public, anon, authenticated;
revoke execute on function public.cleanup_orphan_whatsapp_data(uuid, integer) from public, anon, authenticated;
revoke execute on function public.find_or_create_customer_by_phone(text, text, text) from public, anon, authenticated;
revoke execute on function public.fuzzy_search_products(uuid, text, integer, double precision) from public, anon, authenticated;
revoke execute on function public.get_stores_without_chat_module() from public, anon, authenticated;
revoke execute on function public.get_system_health_connections() from public, anon, authenticated;
revoke execute on function public.get_system_health_db_stats() from public, anon, authenticated;
revoke execute on function public.get_system_health_modules() from public, anon, authenticated;
revoke execute on function public.get_system_health_realtime() from public, anon, authenticated;
revoke execute on function public.get_system_health_top_tables() from public, anon, authenticated;
revoke execute on function public.increment_promotion_usage(uuid) from public, anon, authenticated;
revoke execute on function public.clean_old_session_context() from public, anon, authenticated;
revoke execute on function public.cleanup_old_password_calls() from public, anon, authenticated;
revoke execute on function public.cleanup_old_rate_limits() from public, anon, authenticated;
revoke execute on function public.cleanup_recurring_invoice_logs(integer) from public, anon, authenticated;
revoke execute on function public.cleanup_old_webhook_logs() from public, anon, authenticated;
revoke execute on function public.get_comanda_items_for_store(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.get_order_full(uuid) from public, anon, authenticated;
revoke execute on function public.get_whatsapp_messages_for_store(uuid, text, integer, integer) from public, anon, authenticated;
revoke execute on function public.increment_campaign_counter(uuid, text) from public, anon, authenticated;
revoke execute on function public.increment_product_stock(uuid, uuid, integer) from public, anon, authenticated;
revoke execute on function public.purge_old_client_error_logs() from public, anon, authenticated;
revoke execute on function public.reset_affiliate_monthly_earnings() from public, anon, authenticated;

-- 3. Usadas pelo painel (pessoa logada), nunca por visitante.
revoke execute on function public.get_next_order_number(uuid) from public, anon;
revoke execute on function public.get_next_comanda_number(uuid, text) from public, anon;
revoke execute on function public.log_admin_action(text, uuid, jsonb) from public, anon;
revoke execute on function public.cleanup_old_webhook_logs(integer) from public, anon;
revoke execute on function public.approve_payment(uuid, uuid) from public, anon;
revoke execute on function public.reject_payment(uuid, uuid, text) from public, anon;
revoke execute on function public.decrement_product_stock(uuid, uuid, integer) from public, anon;

-- 4. Aprovar/rejeitar pagamento: quem chama precisa ser o próprio admin informado.
--    Baixar estoque: só a equipe da loja do produto. (Aplicado com pg_get_functiondef + replace;
--    o texto final está no banco.) search_path fixo nas funções apontadas pelo relatório.
