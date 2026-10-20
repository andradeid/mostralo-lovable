-- Solicitação de assinatura do clube pela página pública (/assinaturas/:slug).
-- Antes: a página gravava direto em client_subscriptions com status 'pending' (não existe no CHECK)
-- e o visitante não tinha permissão de inserir; toda solicitação dava erro.
create or replace function public.request_client_subscription(
  p_plan_id uuid,
  p_name text,
  p_phone text,
  p_email text default null,
  p_payment_method text default null,
  p_notes text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan record;
  v_phone text;
  v_customer_id uuid;
  v_existing uuid;
  v_end date;
  v_sub_id uuid;
begin
  select p.id, p.store_id, p.price, p.billing_cycle
    into v_plan
    from client_subscription_plans p
    join stores s on s.id = p.store_id
   where p.id = p_plan_id and p.is_active = true;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Plano indisponível');
  end if;

  if coalesce(btrim(p_name), '') = '' or length(btrim(p_name)) > 120 then
    return jsonb_build_object('success', false, 'error', 'Informe seu nome');
  end if;

  v_phone := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  if length(v_phone) in (12, 13) and left(v_phone, 2) = '55' then
    v_phone := substr(v_phone, 3);
  end if;
  if length(v_phone) not in (10, 11) then
    return jsonb_build_object('success', false, 'error', 'WhatsApp inválido');
  end if;

  if p_payment_method is not null and p_payment_method not in ('pix','credit_card','debit_card','cash','bank_transfer') then
    return jsonb_build_object('success', false, 'error', 'Forma de pagamento inválida');
  end if;

  select id into v_customer_id from customers where phone = v_phone order by created_at limit 1;
  if v_customer_id is null then
    insert into customers (name, phone, email)
    values (btrim(p_name), v_phone, nullif(btrim(coalesce(p_email, '')), ''))
    returning id into v_customer_id;
  end if;

  insert into customer_stores (customer_id, store_id)
  values (v_customer_id, v_plan.store_id)
  on conflict (customer_id, store_id) do nothing;

  -- Já tem solicitação pendente ou assinatura ativa neste plano: não duplica.
  select id into v_existing from client_subscriptions
   where customer_id = v_customer_id and plan_id = v_plan.id
     and status in ('pending_payment', 'active', 'paused')
   limit 1;
  if v_existing is not null then
    return jsonb_build_object('success', true, 'subscription_id', v_existing, 'already', true);
  end if;

  v_end := case v_plan.billing_cycle
    when 'weekly' then current_date + 7
    when 'biweekly' then current_date + 14
    when 'quarterly' then (current_date + interval '3 months')::date
    when 'biannual' then (current_date + interval '6 months')::date
    when 'annual' then (current_date + interval '1 year')::date
    else (current_date + interval '1 month')::date
  end;

  insert into client_subscriptions (
    store_id, customer_id, plan_id, status, payment_method, payment_amount,
    start_date, current_period_start, current_period_end, next_payment_date,
    notes, auto_renew, usages_this_period
  ) values (
    v_plan.store_id, v_customer_id, v_plan.id, 'pending_payment', p_payment_method, v_plan.price,
    current_date, current_date, v_end, current_date,
    nullif(left(btrim(coalesce(p_notes, '')), 500), ''), true, 0
  ) returning id into v_sub_id;

  return jsonb_build_object('success', true, 'subscription_id', v_sub_id, 'already', false);
end;
$$;

revoke all on function public.request_client_subscription(uuid, text, text, text, text, text) from public;
grant execute on function public.request_client_subscription(uuid, text, text, text, text, text) to anon, authenticated;
