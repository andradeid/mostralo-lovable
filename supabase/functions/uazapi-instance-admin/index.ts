// Gestão de ciclo de vida das instâncias UaZapi das lojas:
// - delete_instance: apaga no servidor UaZapi e, só se der certo (ou já não existir lá), remove o registro da loja.
// - list_orphan_instances (master): instâncias criadas pelo Mostralo no servidor que não pertencem a nenhuma loja. Só leitura, sem tokens.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const MASTER_NAME = 'master-whatsapp-instance';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Não autorizado' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Sessão expirada. Faça login novamente.' }, 401);

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    const { data: roles } = await supabase.from('user_roles').select('role, store_id').eq('user_id', user.id);
    const isMaster = (roles || []).some((r: any) => r.role === 'master_admin');

    const { data: config } = await supabase.from('uazapi_config').select('api_url, admin_token').limit(1).single();
    if (!config?.api_url) return json({ error: 'Configuração do WhatsApp não encontrada.' }, 400);
    const apiUrl = String(config.api_url).replace(/\/+$/, '');

    if (action === 'delete_instance') {
      const storeId = body?.store_id;
      if (typeof storeId !== 'string' || !/^[0-9a-f-]{36}$/i.test(storeId)) return json({ error: 'Loja inválida' }, 400);

      let allowed = isMaster || (roles || []).some((r: any) => r.role === 'store_admin' && r.store_id === storeId);
      if (!allowed) {
        const { data: store } = await supabase.from('stores').select('owner_id').eq('id', storeId).single();
        allowed = store?.owner_id === user.id;
      }
      if (!allowed) return json({ error: 'Acesso negado. Você não tem permissão para esta loja.' }, 403);

      const { data: inst } = await supabase.from('whatsapp_instances')
        .select('id, api_token, instance_name')
        .eq('store_id', storeId).eq('provider', 'uazapi').limit(1).maybeSingle();
      if (!inst) return json({ error: 'Conexão não encontrada' }, 404);
      if (inst.instance_name === MASTER_NAME) return json({ error: 'A conexão master não pode ser removida por aqui.' }, 400);

      let removedRemotely = false;
      if (inst.api_token) {
        const res = await fetch(`${apiUrl}/instance`, {
          method: 'DELETE',
          headers: { 'Accept': 'application/json', 'token': inst.api_token },
          signal: AbortSignal.timeout(15_000),
        });
        await res.text(); // não repassar a resposta do provedor
        console.log('[uazapi-instance-admin] delete', inst.instance_name, res.status);
        // 401/404: token não existe mais no servidor = instância já apagada lá
        removedRemotely = res.ok || res.status === 404 || res.status === 401;
        if (!removedRemotely) {
          return json({ error: `Não foi possível apagar a conexão no servidor do WhatsApp (HTTP ${res.status}). Tente de novo em instantes.` }, 502);
        }
      }

      const { error: delErr } = await supabase.from('whatsapp_instances').delete().eq('id', inst.id);
      if (delErr) return json({ error: 'Conexão apagada no servidor, mas não foi possível remover o registro da loja.' }, 500);
      return json({ success: true, removed_remotely: removedRemotely });
    }

    if (action === 'list_orphan_instances') {
      if (!isMaster) return json({ error: 'Acesso negado' }, 403);
      if (!config.admin_token) return json({ error: 'Configuração do WhatsApp incompleta.' }, 400);
      const res = await fetch(`${apiUrl}/instance/all`, { headers: { 'Accept': 'application/json', 'AdminToken': config.admin_token } });
      const text = await res.text();
      if (!res.ok) return json({ error: `Não foi possível listar as instâncias do servidor (HTTP ${res.status}).` }, 502);
      let data: any; try { data = JSON.parse(text); } catch { data = []; }
      const remote: any[] = Array.isArray(data) ? data : data?.instances || [];

      const { data: known } = await supabase.from('whatsapp_instances').select('api_token, instance_name').eq('provider', 'uazapi');
      const knownTokens = new Set((known || []).map((k: any) => k.api_token).filter(Boolean));
      const knownNames = new Set((known || []).map((k: any) => k.instance_name).filter(Boolean));
      const fromMostralo = (i: any) => i?.systemName === 'mostralo' || String(i?.adminField02 || '').startsWith('created_by_mostralo');

      const orphans = remote
        .filter((i) => fromMostralo(i) && !knownTokens.has(i?.token) && !knownNames.has(i?.name) && i?.name !== MASTER_NAME)
        .map((i) => ({
          name: i?.name ?? null,
          status: i?.status ?? null,
          store_id_hint: i?.adminField01 || null,
          created: i?.created ?? i?.createdAt ?? i?.adminField02 ?? null,
          profile_name: i?.profileName ?? null,
        }));
      return json({ total_remote: remote.length, total_mostralo: remote.filter(fromMostralo).length, orphans });
    }

    return json({ error: 'Ação não reconhecida' }, 400);
  } catch (error) {
    console.error('[uazapi-instance-admin] erro', error);
    return json({ error: error instanceof Error ? error.message : 'Erro interno' }, 500);
  }
});
