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

    // Verificar usuário autenticado
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const { action } = body;

    // Ações que lojistas (store_admin) podem executar na própria loja
    const storeActions = ['create_instance', 'connect_instance', 'instance_status'];
    
    if (storeActions.includes(action)) {
      // Verificar se é master_admin OU store_admin da loja
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role, store_id')
        .eq('user_id', user.id);

      const isMasterAdmin = roles?.some((r: any) => r.role === 'master_admin');
      const targetStoreId = body.store_id;
      const isStoreAdmin = roles?.some((r: any) => 
        r.role === 'store_admin' && r.store_id === targetStoreId
      );

      // Também verificar se é owner da loja
      let isOwner = false;
      if (targetStoreId && !isMasterAdmin && !isStoreAdmin) {
        const { data: store } = await supabase
          .from('stores')
          .select('owner_id')
          .eq('id', targetStoreId)
          .single();
        isOwner = store?.owner_id === user.id;
      }

      if (!isMasterAdmin && !isStoreAdmin && !isOwner) {
        return new Response(JSON.stringify({ error: 'Acesso negado. Você não tem permissão para esta loja.' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else {
      // Ações administrativas requerem master_admin
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
    }

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

      // ==================== CRIAR INSTÂNCIA ====================
      case 'create_instance': {
        const config = await getConfig(supabase);
        if (!config?.api_url || !config?.admin_token) {
          return jsonResponse({ error: 'Configuração UaZapi não encontrada. Configure primeiro.' }, 400);
        }

        const { instance_name, store_id: targetStoreId } = body;
        if (!instance_name?.trim()) {
          return jsonResponse({ error: 'Nome da instância é obrigatório' }, 400);
        }

        const url = config.api_url.replace(/\/+$/, '');
        
        const initBody = {
          name: instance_name.trim(),
          systemName: 'mostralo',
          adminField01: targetStoreId || '',
          adminField02: `created_by_mostralo_${new Date().toISOString()}`,
        };

        console.log('[uazapi-manage] Criando instância:', JSON.stringify(initBody));

        const result = await uazapiFetch(`${url}/instance/init`, config.admin_token, {
          method: 'POST',
          body: JSON.stringify(initBody),
        });

        console.log('[uazapi-manage] Resultado criação:', JSON.stringify(result.data).substring(0, 500));

        if (!result.ok) {
          return jsonResponse({ error: 'Erro ao criar instância na UaZapi', details: result.data }, result.status);
        }

        // Salvar instância no banco se tiver store_id
        if (targetStoreId) {
          const instanceToken = result.data?.token || result.data?.instance?.token;
          const instanceId = result.data?.instance?.id || result.data?.name;
          
          await supabase
            .from('whatsapp_instances')
            .upsert({
              store_id: targetStoreId,
              instance_name: instance_name.trim(),
              instance_id: instanceId || instance_name.trim(),
              api_token: instanceToken || '',
              provider: 'uazapi',
              status: 'disconnected',
              updated_at: new Date().toISOString(),
            }, { onConflict: 'store_id' });
        }

        return jsonResponse({ 
          success: true, 
          instance: result.data?.instance || result.data,
          token: result.data?.token || result.data?.instance?.token,
          name: result.data?.name || instance_name,
          qrcode: result.data?.instance?.qrcode || null,
        });
      }

      // ==================== CONECTAR INSTÂNCIA ====================
      case 'connect_instance': {
        const config = await getConfig(supabase);
        if (!config?.api_url || !config?.admin_token) {
          return jsonResponse({ error: 'Configuração UaZapi não encontrada.' }, 400);
        }

        const { store_id: connectStoreId } = body;
        if (!connectStoreId) {
          return jsonResponse({ error: 'store_id é obrigatório' }, 400);
        }

        // Buscar instância UaZapi da loja
        const { data: instanceData } = await supabase
          .from('whatsapp_instances')
          .select('*')
          .eq('store_id', connectStoreId)
          .eq('provider', 'uazapi')
          .limit(1)
          .single();

        if (!instanceData) {
          return jsonResponse({ error: 'Nenhuma instância UaZapi encontrada para esta loja. Crie uma primeiro.' }, 404);
        }

        const instanceToken = instanceData.api_token;
        if (!instanceToken) {
          return jsonResponse({ error: 'Token da instância não encontrado. Recrie a instância.' }, 400);
        }

        const url = config.api_url.replace(/\/+$/, '');

        // Chamar POST /instance/connect com o token da instância
        const connectResult = await fetch(`${url}/instance/connect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'token': instanceToken,
          },
          body: JSON.stringify({}), // Sem phone = gera QR code
        });

        const connectText = await connectResult.text();
        let connectData;
        try { connectData = JSON.parse(connectText); } catch { connectData = { raw: connectText }; }

        console.log('[uazapi-manage] Resultado connect:', JSON.stringify(connectData).substring(0, 500));

        if (!connectResult.ok) {
          return jsonResponse({ error: 'Erro ao conectar instância', details: connectData }, connectResult.status);
        }

        // Extrair QR code da resposta
        const qrcode = connectData?.instance?.qrcode || connectData?.qrcode || null;
        const paircode = connectData?.instance?.paircode || connectData?.paircode || null;
        const status = connectData?.instance?.status || 'connecting';

        // Atualizar status no banco
        await supabase
          .from('whatsapp_instances')
          .update({ 
            status: status === 'connected' ? 'connected' : 'connecting',
            qr_code: qrcode,
            updated_at: new Date().toISOString(),
          })
          .eq('store_id', connectStoreId)
          .eq('provider', 'uazapi');

        return jsonResponse({
          success: true,
          qrcode,
          paircode,
          status,
          connected: connectData?.connected || false,
          instance: connectData?.instance || null,
        });
      }

      // ==================== STATUS INSTÂNCIA UAZAPI ====================
      case 'instance_status': {
        const config = await getConfig(supabase);
        if (!config?.api_url || !config?.admin_token) {
          return jsonResponse({ error: 'Configuração não encontrada.' }, 400);
        }

        const { store_id: statusStoreId } = body;
        if (!statusStoreId) {
          return jsonResponse({ error: 'store_id é obrigatório' }, 400);
        }

        const { data: statusInstance } = await supabase
          .from('whatsapp_instances')
          .select('*')
          .eq('store_id', statusStoreId)
          .eq('provider', 'uazapi')
          .limit(1)
          .single();

        if (!statusInstance?.api_token) {
          return jsonResponse({ error: 'Instância UaZapi não encontrada' }, 404);
        }

        const statusUrl = config.api_url.replace(/\/+$/, '');
        const statusResult = await fetch(`${statusUrl}/instance/status`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'token': statusInstance.api_token,
          },
        });

        const statusText = await statusResult.text();
        let statusData;
        try { statusData = JSON.parse(statusText); } catch { statusData = { raw: statusText }; }

        const instanceStatus = statusData?.instance?.status || statusData?.status || 'disconnected';
        const profileName = statusData?.instance?.profileName || null;
        const profilePic = statusData?.instance?.profilePicUrl || null;
        const phoneNumber = statusData?.instance?.owner?.split('@')?.[0] || null;

        // Atualizar banco com dados mais recentes
        const updateData: any = {
          status: instanceStatus === 'connected' ? 'connected' : instanceStatus === 'connecting' ? 'connecting' : 'disconnected',
          updated_at: new Date().toISOString(),
        };
        if (profileName) updateData.profile_name = profileName;
        if (profilePic) updateData.profile_picture_url = profilePic;
        if (phoneNumber) updateData.phone_number = phoneNumber;
        if (instanceStatus === 'connected') updateData.last_connected_at = new Date().toISOString();

        await supabase
          .from('whatsapp_instances')
          .update(updateData)
          .eq('store_id', statusStoreId)
          .eq('provider', 'uazapi');

        return jsonResponse({
          status: instanceStatus,
          instance: statusData?.instance || statusData,
          profile_name: profileName,
          phone_number: phoneNumber,
        });
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
