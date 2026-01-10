import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log('[openai-credentials-sync] Requisição recebida:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar se é master_admin
    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'master_admin')
      .single();

    if (!userRoles) {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, openaiApiKey, model, maxTokens, useSavedKey } = await req.json();
    console.log('[openai-credentials-sync] Action:', action);

    // Buscar config da Evolution
    const { data: evolutionConfig, error: configError } = await supabaseClient
      .from('evolution_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !evolutionConfig) {
      return new Response(JSON.stringify({ error: 'Evolution API não configurada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'test') {
      // Determinar qual chave testar
      let keyToTest = openaiApiKey;
      
      // Se não recebeu chave mas pediu para usar a salva
      if (!keyToTest && useSavedKey) {
        keyToTest = evolutionConfig?.openai_api_key;
      }
      
      if (!keyToTest) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Nenhuma chave para testar' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Testar API Key da OpenAI
      const testResponse = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${keyToTest}`,
        },
      });

      if (!testResponse.ok) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'API Key inválida ou sem permissão' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, message: 'API Key válida!' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'save') {
      // Gerar um ID local se ainda não existir (para visual de "Conectado")
      const credsId = evolutionConfig.openai_creds_id || crypto.randomUUID();
      
      const { error: updateError } = await supabaseClient
        .from('evolution_config')
        .update({
          openai_api_key: openaiApiKey,
          openai_creds_id: credsId,
          openai_default_model: model || 'gpt-4-turbo',
          openai_max_tokens: maxTokens || 1000,
          updated_at: new Date().toISOString(),
        })
        .eq('id', evolutionConfig.id);

      if (updateError) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Falha ao salvar configuração' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, message: 'Configuração salva!', credsId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'sync_creds_id') {
      // Buscar o openai_creds_id real na Evolution API e salvar no evolution_config
      const evolutionUrl = String(evolutionConfig.api_url || '').replace(/\/$/, '');
      const apiKey = String(evolutionConfig.api_key || '');

      if (!evolutionUrl || !apiKey) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Evolution API não configurada (api_url/api_key)'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('[openai-credentials-sync] sync_creds_id: buscando credenciais na Evolution:', evolutionUrl);

      const tryFetch = async (path: string) => {
        const resp = await fetch(`${evolutionUrl}${path}`, {
          method: 'GET',
          headers: {
            apikey: apiKey,
            'Content-Type': 'application/json',
          },
        });
        return resp;
      };

      let credsResp = await tryFetch('/openai/creds');
      let credsData: unknown = null;

      if (!credsResp.ok) {
        const t = await credsResp.text();
        console.error('[openai-credentials-sync] /openai/creds falhou:', credsResp.status, t.slice(0, 300));
        const alt = await tryFetch('/openai/find');
        if (!alt.ok) {
          const t2 = await alt.text();
          console.error('[openai-credentials-sync] /openai/find falhou:', alt.status, t2.slice(0, 300));
          return new Response(JSON.stringify({
            success: false,
            error: 'Falha ao buscar credenciais na Evolution API',
            details: `status ${credsResp.status}/${alt.status}`
          }), {
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        credsData = await alt.json();
      } else {
        credsData = await credsResp.json();
      }

      const extractId = (data: any): string | null => {
        if (!data) return null;
        if (Array.isArray(data)) {
          const first = data.find((c: any) => c?.id || c?._id);
          return first?.id || first?._id || null;
        }
        if (typeof data === 'object') {
          if (data.id || data._id) return data.id || data._id;
          if (data.data) return extractId(data.data);
        }
        return null;
      };

      const openaiCredsId = extractId(credsData);
      if (!openaiCredsId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Nenhuma credencial OpenAI encontrada na Evolution API',
          hint: 'Cadastre uma credencial OpenAI na Evolution API e tente novamente.'
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: updateError } = await supabaseClient
        .from('evolution_config')
        .update({
          openai_creds_id: String(openaiCredsId),
          updated_at: new Date().toISOString(),
        })
        .eq('id', evolutionConfig.id);

      if (updateError) {
        console.error('[openai-credentials-sync] Falha ao atualizar evolution_config:', updateError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Falha ao atualizar evolution_config',
          details: updateError.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'openai_creds_id sincronizado com sucesso',
        openai_creds_id: openaiCredsId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
