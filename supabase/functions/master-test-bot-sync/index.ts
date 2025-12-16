import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SandboxProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
}

interface SandboxCategory {
  id: string;
  name: string;
  description?: string;
}

function generateTestSystemPrompt(
  storeName: string, 
  storeDescription: string,
  products: SandboxProduct[], 
  categories: SandboxCategory[],
  whatsapp: string,
  address: string
): string {
  const productList = products
    .map(p => `- ${p.name}: R$ ${p.price.toFixed(2)} - ${p.description || 'Sem descrição'}`)
    .join('\n');

  const categoryList = categories.map(c => c.name).join(', ');

  return `Você é o assistente virtual da ${storeName}.

INFORMAÇÕES DA LOJA (TESTE):
- Nome: ${storeName}
- Descrição: ${storeDescription}
- WhatsApp: ${whatsapp}
- Endereço: ${address}

CATEGORIAS DISPONÍVEIS:
${categoryList || 'Pizzas, Bebidas'}

PRODUTOS DISPONÍVEIS:
${productList || 'Consulte o cardápio'}

INSTRUÇÕES:
1. Esta é uma LOJA DE TESTE - responda normalmente como um bot real
2. Seja cordial e prestativo
3. Apresente os produtos quando perguntado
4. Informe preços corretamente
5. Não invente produtos ou preços
6. Responda sempre em português brasileiro
7. Use emojis moderadamente

ENCERRAMENTO:
- Quando o cliente digitar #SAIR, agradeça e finalize`;
}

serve(async (req) => {
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

    const { action, config } = await req.json();

    // Buscar Evolution config
    const { data: evolutionConfig } = await supabaseClient
      .from('evolution_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (!evolutionConfig) {
      return new Response(JSON.stringify({ error: 'Evolution API não configurada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // A credencial da OpenAI na Evolution (openai_creds_id) pode estar vazia ou ter sido
    // gerada localmente (UUID) no modo "salvar". Nesse caso, vamos criar/sincronizar
    // automaticamente a credencial na Evolution para evitar erro "Error setting default settings".
    const hasOpenAiCredsId = !!evolutionConfig.openai_creds_id;
    const hasOpenAiApiKey = !!evolutionConfig.openai_api_key;

    if (!hasOpenAiCredsId && !hasOpenAiApiKey) {
      return new Response(JSON.stringify({ error: 'Chave OpenAI não configurada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar config de teste
    let { data: testConfig } = await supabaseClient
      .from('master_admin_test_config')
      .select('*')
      .eq('admin_user_id', user.id)
      .single();

    // Se não existe config, criar uma para o usuário (permite salvar sandbox antes de criar instância)
    if (!testConfig) {
      const { data: newConfig, error: insertError } = await supabaseClient
        .from('master_admin_test_config')
        .insert({
          admin_user_id: user.id,
          sandbox_store_name: 'Pizzaria Teste',
          sandbox_store_description: 'Loja fictícia para testes',
          sandbox_whatsapp: '5561999999999',
          sandbox_address: 'Rua das Pizzas, 123',
        })
        .select()
        .single();

      if (insertError) {
        return new Response(JSON.stringify({ error: 'Erro ao criar configuração de teste' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      testConfig = newConfig;
    }

    const evolutionUrl = evolutionConfig.api_url.replace(/\/$/, '');
    const openaiApiKey = evolutionConfig.openai_api_key;

    // Ações que requerem instância de teste
    const actionsRequiringInstance = ['create', 'update', 'toggle', 'delete'];
    if (actionsRequiringInstance.includes(action) && !testConfig.test_instance_name) {
      return new Response(JSON.stringify({ error: 'Crie uma instância de teste primeiro' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const instanceName = testConfig.test_instance_name;

    const isUuidLike = (value: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

    const pickOpenAiCredsId = (payload: any): string | null => {
      if (!payload) return null;

      if (typeof payload === 'string') return payload;

      if (typeof payload?.openaiCredsId === 'string') return payload.openaiCredsId;
      if (typeof payload?.id === 'string') return payload.id;

      // Alguns endpoints retornam dados embrulhados
      if (payload?.data) return pickOpenAiCredsId(payload.data);
      if (payload?.openaiCreds) return pickOpenAiCredsId(payload.openaiCreds);

      if (Array.isArray(payload)) {
        const byName = payload.find((c) => c?.name === 'mostralo-openai');
        return pickOpenAiCredsId(byName ?? payload[0]);
      }

      return null;
    };

    // Helper: obter openaiCredsId
    // Na Evolution API, as credenciais OpenAI são registradas globalmente (não por instância)
    // Se já temos um openai_creds_id salvo, usamos diretamente
    async function ensureOpenAiCreds(): Promise<string | null> {
      // Se já temos um ID salvo no banco, usar diretamente
      // (a credencial já foi registrada anteriormente na Evolution)
      if (evolutionConfig.openai_creds_id) {
        console.log('Usando openai_creds_id existente:', evolutionConfig.openai_creds_id);
        return evolutionConfig.openai_creds_id;
      }

      // Se não temos ID mas temos a API key, precisamos criar credencial
      if (!openaiApiKey) {
        console.log('Sem openai_api_key configurada');
        return null;
      }

      // Criar nova credencial na Evolution (endpoint global, não por instância)
      console.log('Criando credencial OpenAI na Evolution...');
      const createResp = await fetch(`${evolutionUrl}/openai/creds`, {
        method: 'POST',
        headers: {
          'apikey': evolutionConfig.api_key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'mostralo-openai',
          apiKey: openaiApiKey,
        }),
      });

      const createText = await createResp.text();

      if (!createResp.ok) {
        console.error('Falha ao criar credenciais:', createResp.status, createText);
        return null;
      }

      let createdId: string | null = null;
      try {
        const data = JSON.parse(createText);
        createdId = data?.id || data?.openaiCredsId || null;
      } catch {
        createdId = null;
      }

      if (createdId) {
        // Salvar o ID para uso futuro
        await supabaseClient
          .from('evolution_config')
          .update({
            openai_creds_id: createdId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', evolutionConfig.id);

        console.log('Credencial OpenAI criada na Evolution (id):', createdId);
      }

      return createdId;
    }

    if (action === 'create' || action === 'update') {
      // Garantir que temos openaiCredsId
      const openaiCredsId = await ensureOpenAiCreds();
      if (!openaiCredsId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Não foi possível obter/criar credenciais OpenAI na Evolution',
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Usando openaiCredsId:', openaiCredsId);

      // Gerar prompt com dados da loja sandbox
      const products = (testConfig.sandbox_products || []) as SandboxProduct[];
      const categories = (testConfig.sandbox_categories || []) as SandboxCategory[];
      
      const systemPrompt = generateTestSystemPrompt(
        config?.storeName || testConfig.sandbox_store_name,
        config?.storeDescription || testConfig.sandbox_store_description,
        products,
        categories,
        testConfig.sandbox_whatsapp,
        testConfig.sandbox_address
      );

      // Validar modelo - usar fallback se modelo não for reconhecido
      const validModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4'];
      let model = evolutionConfig.openai_default_model || 'gpt-4o-mini';
      if (!validModels.includes(model)) {
        console.log(`Modelo ${model} não reconhecido, usando gpt-4o-mini como fallback`);
        model = 'gpt-4o-mini';
      }

      // Payload com openaiCredsId (obrigatório na Evolution API)
      const botPayload: any = {
        enabled: true,
        openaiCredsId: openaiCredsId,
        botType: 'chatCompletion',
        model: model,
        maxTokens: evolutionConfig.openai_max_tokens || 1000,
        systemMessages: [systemPrompt],
        assistantMessages: [],
        userMessages: [],
        triggerType: config?.triggerType || testConfig.bot_trigger_type || 'all',
        triggerOperator: 'contains',
        triggerValue: config?.triggerValue || testConfig.bot_trigger_value || '',
        expire: config?.expireMinutes || testConfig.bot_expire_minutes || 20,
        keywordFinish: config?.keywordFinish || testConfig.bot_keyword_finish || '#SAIR',
        delayMessage: config?.delayMessage || testConfig.bot_delay_message || 1500,
        unknownMessage: 'Desculpe, não entendi sua mensagem. Digite #SAIR para encerrar.',
        listeningFromMe: false,
        stopBotFromMe: config?.stopBotFromMe !== undefined ? config.stopBotFromMe : testConfig.bot_stop_from_me,
        keepOpen: false,
        debounceTime: 10,
        ignoreJids: [],
        splitMessages: false,
        timePerChar: 0,
      };

      console.log('Criando bot com payload:', JSON.stringify(botPayload, null, 2));
      console.log('Instance name:', testConfig.test_instance_name);

      let botId = testConfig.bot_evolution_id;
      let response;

      if (botId) {
        // Atualizar bot existente
        const updateUrl = `${evolutionUrl}/openai/update/${testConfig.test_instance_name}/${botId}`;
        console.log('Atualizando bot em:', updateUrl);
        response = await fetch(updateUrl, {
          method: 'PUT',
          headers: {
            'apikey': evolutionConfig.api_key,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(botPayload),
        });
      } else {
        // Criar novo bot
        const createUrl = `${evolutionUrl}/openai/create/${testConfig.test_instance_name}`;
        console.log('Criando bot em:', createUrl);
        response = await fetch(createUrl, {
          method: 'POST',
          headers: {
            'apikey': evolutionConfig.api_key,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(botPayload),
        });
      }

      const responseText = await response.text();
      console.log('Resposta Evolution:', response.status, responseText);

      if (!response.ok) {
        console.error('Erro Evolution:', responseText);
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Falha na Evolution: ${responseText}` 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const botData = JSON.parse(responseText);
      botId = botData.id || botData.openaiBot?.id || botId;

      // Atualizar config
      await supabaseClient
        .from('master_admin_test_config')
        .update({
          bot_enabled: true,
          bot_name: config?.botName || testConfig.bot_name,
          bot_system_prompt: systemPrompt,
          bot_delay_message: config?.delayMessage || testConfig.bot_delay_message,
          bot_stop_from_me: config?.stopBotFromMe !== undefined ? config.stopBotFromMe : testConfig.bot_stop_from_me,
          bot_expire_minutes: config?.expireMinutes || testConfig.bot_expire_minutes,
          bot_keyword_finish: config?.keywordFinish || testConfig.bot_keyword_finish,
          bot_trigger_type: config?.triggerType || testConfig.bot_trigger_type,
          bot_trigger_value: config?.triggerValue || testConfig.bot_trigger_value,
          bot_evolution_id: botId,
          sandbox_store_name: config?.storeName || testConfig.sandbox_store_name,
          sandbox_store_description: config?.storeDescription || testConfig.sandbox_store_description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', testConfig.id);

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Bot de teste sincronizado!',
        botId 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'toggle') {
      if (!testConfig.bot_evolution_id) {
        return new Response(JSON.stringify({ error: 'Bot não configurado' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const enabled = config?.enabled !== undefined ? config.enabled : !testConfig.bot_enabled;

      const response = await fetch(`${evolutionUrl}/openai/status/${testConfig.test_instance_name}/${testConfig.bot_evolution_id}`, {
        method: 'PUT',
        headers: {
          'apikey': evolutionConfig.api_key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Falha ao alterar status' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabaseClient
        .from('master_admin_test_config')
        .update({
          bot_enabled: enabled,
          updated_at: new Date().toISOString(),
        })
        .eq('id', testConfig.id);

      return new Response(JSON.stringify({ 
        success: true, 
        message: enabled ? 'Bot ativado!' : 'Bot pausado!',
        enabled 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      if (testConfig.bot_evolution_id) {
        await fetch(`${evolutionUrl}/openai/delete/${testConfig.test_instance_name}/${testConfig.bot_evolution_id}`, {
          method: 'DELETE',
          headers: {
            'apikey': evolutionConfig.api_key,
          },
        });
      }

      await supabaseClient
        .from('master_admin_test_config')
        .update({
          bot_enabled: false,
          bot_evolution_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', testConfig.id);

      return new Response(JSON.stringify({ success: true, message: 'Bot de teste removido!' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'save_sandbox') {
      // Salvar dados da loja sandbox
      await supabaseClient
        .from('master_admin_test_config')
        .update({
          sandbox_store_name: config.storeName,
          sandbox_store_description: config.storeDescription,
          sandbox_products: config.products,
          sandbox_categories: config.categories,
          sandbox_whatsapp: config.whatsapp,
          sandbox_address: config.address,
          updated_at: new Date().toISOString(),
        })
        .eq('id', testConfig.id);

      return new Response(JSON.stringify({ success: true, message: 'Loja sandbox salva!' }), {
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
