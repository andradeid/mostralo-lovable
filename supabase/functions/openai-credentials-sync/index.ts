import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { action, openaiApiKey, model, maxTokens } = await req.json();
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
      // Testar API Key da OpenAI
      const testResponse = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
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

    if (action === 'sync') {
      // Sincronizar com Evolution API - criar OpenAI Credentials
      const evolutionUrl = evolutionConfig.api_url.replace(/\/$/, '');
      
      // Criar credenciais na Evolution
      const credsPayload = {
        name: 'mostralo-openai-creds',
        apiKey: openaiApiKey,
      };

      let credsId = evolutionConfig.openai_creds_id;

      // Se já existe, atualizar
      if (credsId) {
        const updateResponse = await fetch(`${evolutionUrl}/openai/creds/${credsId}`, {
          method: 'PUT',
          headers: {
            'apikey': evolutionConfig.api_key,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credsPayload),
        });

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          console.error('Erro ao atualizar credentials:', errorText);
          // Se falhou, tentar criar novo
          credsId = null;
        }
      }

      // Se não existe, criar novo
      if (!credsId) {
        const createResponse = await fetch(`${evolutionUrl}/openai/creds`, {
          method: 'POST',
          headers: {
            'apikey': evolutionConfig.api_key,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credsPayload),
        });

        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          console.error('Erro ao criar credentials:', errorText);
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Falha ao criar credenciais na Evolution' 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const credsData = await createResponse.json();
        credsId = credsData.id || credsData.openaiCredsId;
      }

      // Salvar no banco
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
        console.error('Erro ao salvar config:', updateError);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Falha ao salvar configuração' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Credenciais sincronizadas com Evolution!',
        credsId 
      }), {
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
