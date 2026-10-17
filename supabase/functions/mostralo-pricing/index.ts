import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';

const bodySchema = z.object({ action: z.enum(['catalog', 'founder-preview', 'founder-apply']).default('catalog'), storeId: z.string().uuid().optional() });
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
        admin.from('plans').select('id,name,price,description,billing_cycle,status,plan_modules(module_id,modules(name,key))').eq('status', 'active').neq('name', 'Essencial Anual'),
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