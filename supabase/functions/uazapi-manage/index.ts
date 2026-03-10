import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { action, api_url, admin_token, is_active } = await req.json();

    switch (action) {
      case 'save_config': {
        // Salvar ou atualizar configuração
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

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_config': {
        const { data: config } = await supabase
          .from('uazapi_config')
          .select('*')
          .limit(1)
          .single();

        return new Response(JSON.stringify({ config: config || null }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'test_connection': {
        // Buscar config do banco
        const { data: config } = await supabase
          .from('uazapi_config')
          .select('api_url, admin_token')
          .limit(1)
          .single();

        if (!config?.api_url || !config?.admin_token) {
          return new Response(JSON.stringify({ error: 'Configuração não encontrada. Salve primeiro.' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const url = config.api_url.replace(/\/+$/, '');
        
        // Testar conexão buscando status do servidor
        const response = await fetch(`${url}/status`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'token': config.admin_token },
        });

        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } catch { data = { raw: text }; }

        if (response.ok) {
          // Atualizar status no banco
          await supabase
            .from('uazapi_config')
            .update({ connection_status: 'connected' })
            .not('id', 'is', null);

          return new Response(JSON.stringify({ status: 'connected', data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          await supabase
            .from('uazapi_config')
            .update({ connection_status: 'error' })
            .not('id', 'is', null);

          return new Response(JSON.stringify({ status: 'error', statusCode: response.status, data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      case 'list_instances': {
        // Buscar config
        const { data: config } = await supabase
          .from('uazapi_config')
          .select('api_url, admin_token')
          .limit(1)
          .single();

        if (!config?.api_url || !config?.admin_token) {
          return new Response(JSON.stringify({ error: 'Configuração não encontrada' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const url = config.api_url.replace(/\/+$/, '');

        // Buscar instâncias da UaZapi
        const instancesResponse = await fetch(`${url}/listInstances`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'token': config.admin_token },
        });

        const instText = await instancesResponse.text();
        let instances;
        try { instances = JSON.parse(instText); } catch { instances = []; }

        // Também buscar status/info geral
        let serverStatus = null;
        try {
          const statusResp = await fetch(`${url}/status`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'token': config.admin_token },
          });
          const statusText = await statusResp.text();
          try { serverStatus = JSON.parse(statusText); } catch { serverStatus = null; }
        } catch { /* ignore */ }

        return new Response(JSON.stringify({ 
          instances: Array.isArray(instances) ? instances : instances?.instances || [],
          serverStatus,
          apiUrl: config.api_url
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Ação não reconhecida' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('[uazapi-manage] Erro:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro interno' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
