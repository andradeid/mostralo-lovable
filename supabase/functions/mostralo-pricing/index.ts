import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { selectedBillingCycle } from '../_shared/billing-selection.ts';

const bodySchema = z.object({ action: z.enum(['catalog', 'founder-preview', 'founder-apply', 'approve-selection']).default('catalog'), storeId: z.string().uuid().optional(), approvalId: z.string().uuid().optional() });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);
  try {
    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: 'Informe uma ação e loja válidas' }, 400);
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!url || !key || !anonKey) return json({ error: 'Serviço temporariamente indisponível' }, 503);
    const admin = createClient(url, key);
    const { action, storeId } = parsed.data;
    if (action === 'catalog') {
      // Explicit projection: no store rows or privileged configuration reach the public catalog.
      const [{ data: plans, error }, { data: availability, error: availabilityError }] = await Promise.all([
        admin.from('plans').select('id,name,price,annual_enabled,annual_discount_percent,description,billing_cycle,status,plan_modules(module_id,modules(name,key))').eq('status', 'active').neq('name', 'Essencial Anual'),
        admin.rpc('mostralo_founder_availability'),
      ]);
      if (error || availabilityError) throw new Error('Não foi possível carregar os planos');
      return json({ plans, availability });
    }
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) return json({ error: 'Faça login novamente' }, 401);
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
    const { data: claims, error: claimsError } = await userClient.auth.getClaims(authorization.slice(7));
    const actorId = claims?.claims?.sub;
    if (claimsError || !actorId) return json({ error: 'Sessão inválida' }, 401);
    const { data: roles, error: roleError } = await admin.from('user_roles').select('role').eq('user_id', actorId).eq('role', 'master_admin');
    if (roleError || !roles?.length) return json({ error: 'Somente o master pode aplicar sócio fundador' }, 403);
    if (action === 'approve-selection') {
      const approvalId = parsed.data.approvalId;
      if (!approvalId) return json({ error: 'Informe o pagamento' }, 400);
      const { data: approval, error: approvalError } = await admin.from('payment_approvals').select('store_id,plan_id,notes,status').eq('id', approvalId).single();
      if (approvalError || !approval || approval.status !== 'pending') return json({ error: 'Pagamento indisponível para aprovação' }, 409);
      const requestedCycle = selectedBillingCycle(approval.notes);
      if (!requestedCycle || !approval.store_id || !approval.plan_id) {
        // Proposals and historical untagged approvals keep the exact existing RPC flow.
        const { error } = await userClient.rpc('approve_payment', { approval_id: approvalId, admin_user_id: actorId });
        if (error) throw error;
        return json({ success: true });
      }
      const { data: store, error: storeError } = await admin.from('stores').select('custom_monthly_price,discount_reason,discount_applied_at,discount_applied_by,billing_cycle').eq('id', approval.store_id).single();
      if (storeError || !store) throw new Error('Loja indisponível');
      const cycle = store.discount_reason?.startsWith('Sócio fundador') ? 'monthly' : requestedCycle;
      const { data: plan, error: planError } = await admin.from('plans').select('annual_enabled').eq('id', approval.plan_id).single();
      if (planError || !plan) throw new Error('Plano indisponível');
      if (cycle === 'annual' && !plan.annual_enabled) return json({ error: 'Este plano não oferece pagamento anual' }, 409);
      const { error: approveError } = await userClient.rpc('approve_payment', { approval_id: approvalId, admin_user_id: actorId });
      if (approveError) throw approveError;
      // Preserve negotiated values even if the legacy approval RPC clears them on plan change.
      const { error: updateError } = await admin.from('stores').update({ custom_monthly_price: store.custom_monthly_price, discount_reason: store.discount_reason, discount_applied_at: store.discount_applied_at, discount_applied_by: store.discount_applied_by, ...(cycle ? { billing_cycle: cycle, subscription_expires_at: new Date(Date.now() + (cycle === 'annual' ? 365 : 30) * 86400000).toISOString() } : {}) }).eq('id', approval.store_id);
      if (updateError) throw updateError;
      return json({ success: true });
    }
    if (!storeId) return json({ error: 'Informe a loja' }, 400);
    if (action === 'founder-preview') {
      const { data, error } = await admin.rpc('mostralo_founder_availability');
      if (error) throw error;
      return json(data);
    }
    const { data, error } = await admin.rpc('apply_mostralo_founder_discount', { p_store_id: storeId, p_actor_id: actorId });
    if (error) return json({ error: error.message }, 409);
    return json(data);
  } catch {
    return json({ error: 'Não foi possível atualizar os planos. Tente novamente.' }, 500);
  }
});