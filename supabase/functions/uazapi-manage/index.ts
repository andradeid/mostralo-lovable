import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper para buscar config do banco
async function getConfig(supabase: any) {
  const { data } = await supabase
    .from('uazapi_config')
    .select('api_url, admin_token')
    .limit(1)
    .single();
  return data;
}

// Helper para chamadas seguras à UaZapi API
async function uazapiFetch(url: string, adminToken: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'AdminToken': adminToken,
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { ok: response.ok, status: response.status, data };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se é master_admin
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'master_admin')
      .limit(1)
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const { action } = body;

    const jsonResponse = (data: any, status = 200) =>
      new Response(JSON.stringify(data), {
        status, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    switch (action) {
      // ==================== CONFIG ====================
      case 'save_config': {
        const { api_url, admin_token, is_active } = body;
        const { data: existing } = await supabase
          .from('uazapi_config')
          .select('id')
          .limit(1)
          .single();

        if (existing) {
          const { error } = await supabase
            .from('uazapi_config')
            .update({ api_url, admin_token, is_active })
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('uazapi_config')
            .insert({ api_url, admin_token, is_active });
          if (error) throw error;
        }
        return jsonResponse({ success: true });
      }

      case 'get_config': {
        const { data: config } = await supabase
          .from('uazapi_config')
          .select('*')
          .limit(1)
          .single();
        return jsonResponse({ config: config || null });
      }

      // ==================== CONEXÃO ====================
      case 'test_connection': {
        const config = await getConfig(supabase);
        if (!config?.api_url || !config?.admin_token) {
          return jsonResponse({ error: 'Configuração não encontrada. Salve primeiro.' }, 400);
        }

        const url = config.api_url.replace(/\/+$/, '');
        const result = await uazapiFetch(`${url}/status`, config.admin_token);

        await supabase
          .from('uazapi_config')
          .update({ connection_status: result.ok ? 'connected' : 'error' })
          .not('id', 'is', null);

        return jsonResponse({
          status: result.ok ? 'connected' : 'error',
          statusCode: result.status,
          data: result.data
        });
      }

      // ==================== INSTÂNCIAS ====================
      case 'list_instances': {
        const config = await getConfig(supabase);
        if (!config?.api_url || !config?.admin_token) {
          return jsonResponse({ error: 'Configuração não encontrada' }, 400);
        }

        const url = config.api_url.replace(/\/+$/, '');
        console.log('[uazapi-manage] Buscando instâncias em:', `${url}/instance/all`);
        
        const result = await uazapiFetch(`${url}/instance/all`, config.admin_token);
        console.log('[uazapi-manage] Resposta instâncias:', JSON.stringify(result.data).substring(0, 500));

        let serverStatus = null;
        try {
          const statusResult = await uazapiFetch(`${url}/status`, config.admin_token);
          if (statusResult.ok) serverStatus = statusResult.data;
        } catch { /* ignore */ }

        const instances = Array.isArray(result.data) ? result.data : result.data?.instances || [];

        return jsonResponse({ instances, serverStatus, apiUrl: config.api_url });
      }

      // ==================== WEBHOOK GLOBAL ====================
      case 'get_webhook': {
        const config = await getConfig(supabase);
        if (!config?.api_url || !config?.admin_token) {
          return jsonResponse({ error: 'Configuração não encontrada' }, 400);
        }

        const url = config.api_url.replace(/\/+$/, '');
        console.log('[uazapi-manage] Buscando webhook global');
        const result = await uazapiFetch(`${url}/globalwebhook`, config.admin_token);
        
        return jsonResponse({ webhook: result.ok ? result.data : null, status: result.status });
      }

      case 'set_webhook': {
        const config = await getConfig(supabase);
        if (!config?.api_url || !config?.admin_token) {
          return jsonResponse({ error: 'Configuração não encontrada' }, 400);
        }

        const url = config.api_url.replace(/\/+$/, '');
        
        // URL do webhook do Supabase
        const webhookUrl = `${supabaseUrl}/functions/v1/uazapi-webhook`;
        
        // Configuração recomendada para o Mostralo
        const webhookConfig = {
          url: webhookUrl,
          enabled: true,
          events: [
            'messages',
            'messages_update', 
            'connection',
          ],
          excludeMessages: ['wasSentByApi'],
          addUrlEvents: false,
          addUrlTypesMessages: false,
        };

        console.log('[uazapi-manage] Configurando webhook global:', JSON.stringify(webhookConfig));
        
        const result = await uazapiFetch(`${url}/globalwebhook`, config.admin_token, {
          method: 'POST',
          body: JSON.stringify(webhookConfig),
        });

        console.log('[uazapi-manage] Resultado webhook:', JSON.stringify(result.data));

        if (result.ok) {
          return jsonResponse({ success: true, webhook: result.data });
        } else {
          return jsonResponse({ error: 'Erro ao configurar webhook', details: result.data }, result.status);
        }
      }

      default:
        return jsonResponse({ error: 'Ação não reconhecida' }, 400);
    }
  } catch (error) {
    console.error('[uazapi-manage] Erro:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro interno' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
