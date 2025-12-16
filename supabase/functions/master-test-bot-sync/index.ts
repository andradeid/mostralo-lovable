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

interface OperationStep {
  step: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string;
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

  // Array para armazenar os passos da operação
  const steps: OperationStep[] = [];

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado', steps }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido', steps }), {
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
      return new Response(JSON.stringify({ error: 'Acesso negado', steps }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    steps.push({
      step: 'auth_check',
      status: 'success',
      message: 'Autenticação verificada',
      details: `Usuário: ${user.email}`,
    });

    const { action, config } = await req.json();

    // Buscar Evolution config
    const { data: evolutionConfig } = await supabaseClient
      .from('evolution_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (!evolutionConfig) {
      steps.push({
        step: 'evolution_config',
        status: 'error',
        message: 'Evolution API não configurada',
      });
      return new Response(JSON.stringify({ error: 'Evolution API não configurada', steps }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    steps.push({
      step: 'evolution_config',
      status: 'success',
      message: 'Evolution API configurada',
      details: evolutionConfig.api_url,
    });

    const hasOpenAiApiKey = !!evolutionConfig.openai_api_key;

    if (!hasOpenAiApiKey) {
      steps.push({
        step: 'openai_key_check',
        status: 'error',
        message: 'Chave OpenAI não configurada',
      });
      return new Response(JSON.stringify({ error: 'Chave OpenAI não configurada', steps }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    steps.push({
      step: 'openai_key_check',
      status: 'success',
      message: 'Chave OpenAI configurada',
      details: '****' + evolutionConfig.openai_api_key.slice(-4),
    });

    // Buscar config de teste
    let { data: testConfig } = await supabaseClient
      .from('master_admin_test_config')
      .select('*')
      .eq('admin_user_id', user.id)
      .single();

    // Se não existe config, criar uma para o usuário
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
        steps.push({
          step: 'test_config',
          status: 'error',
          message: 'Erro ao criar configuração de teste',
        });
        return new Response(JSON.stringify({ error: 'Erro ao criar configuração de teste', steps }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      testConfig = newConfig;
      steps.push({
        step: 'test_config',
        status: 'success',
        message: 'Configuração de teste criada',
      });
    } else {
      steps.push({
        step: 'test_config',
        status: 'success',
        message: 'Configuração de teste carregada',
      });
    }

    const evolutionUrl = evolutionConfig.api_url.replace(/\/$/, '');
    const openaiApiKey = evolutionConfig.openai_api_key;

    // Ações que requerem instância de teste
    const actionsRequiringInstance = ['create', 'update', 'toggle', 'delete'];
    if (actionsRequiringInstance.includes(action) && !testConfig.test_instance_name) {
      steps.push({
        step: 'instance_check',
        status: 'error',
        message: 'Crie uma instância de teste primeiro',
      });
      return new Response(JSON.stringify({ error: 'Crie uma instância de teste primeiro', steps }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const instanceName = testConfig.test_instance_name;

    // Helper: obter openaiCredsId com validação robusta
    async function ensureOpenAiCreds(): Promise<string | null> {
      steps.push({
        step: 'openai_creds_check',
        status: 'success',
        message: 'Verificando credenciais OpenAI na Evolution...',
      });

      // 1. Listar credenciais existentes na Evolution
      console.log('Buscando credenciais OpenAI na Evolution...');
      let existingCreds: any[] = [];
      
      try {
        const listResp = await fetch(`${evolutionUrl}/openai/creds`, {
          method: 'GET',
          headers: {
            'apikey': evolutionConfig.api_key,
          },
        });

        if (listResp.ok) {
          const data = await listResp.json();
          existingCreds = Array.isArray(data) ? data : (data?.creds || data?.data || []);
          console.log('Credenciais encontradas:', existingCreds.length);
          
          steps.push({
            step: 'openai_creds_list',
            status: 'success',
            message: `${existingCreds.length} credencial(is) encontrada(s) na Evolution`,
            details: existingCreds.map(c => c.name || c.id).join(', ') || 'Nenhuma',
          });
        } else {
          console.log('Falha ao listar credenciais:', listResp.status);
          steps.push({
            step: 'openai_creds_list',
            status: 'warning',
            message: 'Não foi possível listar credenciais',
            details: `Status: ${listResp.status}`,
          });
        }
      } catch (e) {
        console.log('Erro ao listar credenciais:', e);
        steps.push({
          step: 'openai_creds_list',
          status: 'warning',
          message: 'Erro ao listar credenciais',
          details: String(e),
        });
      }

      // 2. Se temos ID salvo, verificar se ainda é válido
      if (evolutionConfig.openai_creds_id) {
        const found = existingCreds.find(c => c.id === evolutionConfig.openai_creds_id);
        if (found) {
          console.log('ID salvo é válido:', evolutionConfig.openai_creds_id);
          steps.push({
            step: 'openai_creds_validate',
            status: 'success',
            message: 'Credencial salva ainda é válida',
            details: `ID: ${evolutionConfig.openai_creds_id.slice(0, 8)}...`,
          });
          return evolutionConfig.openai_creds_id;
        }
        
        // ID não existe mais - limpar do banco
        console.log('ID salvo não é mais válido, limpando...');
        steps.push({
          step: 'openai_creds_invalid',
          status: 'warning',
          message: 'Credencial salva não existe mais na Evolution',
          details: `ID antigo: ${evolutionConfig.openai_creds_id.slice(0, 8)}...`,
        });
        
        await supabaseClient
          .from('evolution_config')
          .update({ openai_creds_id: null, updated_at: new Date().toISOString() })
          .eq('id', evolutionConfig.id);
      }

      // 3. Buscar credencial existente chamada "mostralo-openai"
      const mostraloCredential = existingCreds.find(c => c.name === 'mostralo-openai');
      if (mostraloCredential?.id) {
        console.log('Usando credencial existente:', mostraloCredential.id);
        steps.push({
          step: 'openai_creds_reuse',
          status: 'success',
          message: 'Reutilizando credencial "mostralo-openai" existente',
          details: `ID: ${mostraloCredential.id.slice(0, 8)}...`,
        });
        
        // Salvar no banco para uso futuro
        await supabaseClient
          .from('evolution_config')
          .update({ openai_creds_id: mostraloCredential.id, updated_at: new Date().toISOString() })
          .eq('id', evolutionConfig.id);
        
        return mostraloCredential.id;
      }

      // 4. Criar nova credencial
      if (!openaiApiKey) {
        console.log('Sem openai_api_key configurada');
        steps.push({
          step: 'openai_creds_create',
          status: 'error',
          message: 'Chave OpenAI não configurada para criar credencial',
        });
        return null;
      }

      console.log('Criando nova credencial OpenAI na Evolution...');
      steps.push({
        step: 'openai_creds_creating',
        status: 'success',
        message: 'Criando nova credencial OpenAI...',
      });

      try {
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
        console.log('Resposta criação credencial:', createResp.status, createText);

        if (!createResp.ok) {
          console.error('Falha ao criar credenciais:', createResp.status, createText);
          steps.push({
            step: 'openai_creds_create',
            status: 'error',
            message: 'Falha ao criar credencial na Evolution',
            details: `Status: ${createResp.status}`,
          });
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

          console.log('Credencial OpenAI criada:', createdId);
          steps.push({
            step: 'openai_creds_created',
            status: 'success',
            message: 'Nova credencial criada com sucesso!',
            details: `ID: ${createdId.slice(0, 8)}...`,
          });
          return createdId;
        }

        steps.push({
          step: 'openai_creds_create',
          status: 'error',
          message: 'ID da credencial não retornado pela Evolution',
        });
        return null;
      } catch (e) {
        console.error('Erro ao criar credencial:', e);
        steps.push({
          step: 'openai_creds_create',
          status: 'error',
          message: 'Erro ao criar credencial',
          details: String(e),
        });
        return null;
      }
    }

    if (action === 'create' || action === 'update') {
      steps.push({
        step: 'action_start',
        status: 'success',
        message: `Iniciando ${action === 'create' ? 'criação' : 'atualização'} do bot...`,
      });

      // Garantir que temos openaiCredsId
      const openaiCredsId = await ensureOpenAiCreds();
      if (!openaiCredsId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Não foi possível obter/criar credenciais OpenAI na Evolution',
          steps,
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

      steps.push({
        step: 'prompt_generate',
        status: 'success',
        message: 'Prompt gerado com dados da loja',
        details: `${products.length} produto(s), ${categories.length} categoria(s)`,
      });

      // Validar modelo
      const validModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4'];
      let model = evolutionConfig.openai_default_model || 'gpt-4o-mini';
      if (!validModels.includes(model)) {
        steps.push({
          step: 'model_validate',
          status: 'warning',
          message: `Modelo "${model}" não reconhecido, usando gpt-4o-mini`,
        });
        model = 'gpt-4o-mini';
      } else {
        steps.push({
          step: 'model_validate',
          status: 'success',
          message: `Modelo selecionado: ${model}`,
        });
      }

      // Payload com openaiCredsId
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

      console.log('Payload do bot:', JSON.stringify(botPayload, null, 2));

      let botId = testConfig.bot_evolution_id;
      let response;

      if (botId) {
        steps.push({
          step: 'evolution_sync',
          status: 'success',
          message: 'Atualizando bot existente na Evolution...',
          details: `Bot ID: ${botId.slice(0, 8)}...`,
        });

        const updateUrl = `${evolutionUrl}/openai/update/${testConfig.test_instance_name}/${botId}`;
        response = await fetch(updateUrl, {
          method: 'PUT',
          headers: {
            'apikey': evolutionConfig.api_key,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(botPayload),
        });
      } else {
        steps.push({
          step: 'evolution_sync',
          status: 'success',
          message: 'Criando novo bot na Evolution...',
        });

        const createUrl = `${evolutionUrl}/openai/create/${testConfig.test_instance_name}`;
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
        steps.push({
          step: 'evolution_response',
          status: 'error',
          message: 'Falha na Evolution API',
          details: responseText.slice(0, 100),
        });
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Falha na Evolution: ${responseText}`,
          steps,
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const botData = JSON.parse(responseText);
      botId = botData.id || botData.openaiBot?.id || botId;

      steps.push({
        step: 'evolution_response',
        status: 'success',
        message: 'Bot sincronizado com Evolution!',
        details: `Bot ID: ${botId?.slice(0, 8)}...`,
      });

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

      steps.push({
        step: 'save_config',
        status: 'success',
        message: 'Configuração salva no banco de dados',
      });

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Bot de teste sincronizado!',
        botId,
        steps,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'toggle') {
      if (!testConfig.bot_evolution_id) {
        steps.push({
          step: 'toggle_check',
          status: 'error',
          message: 'Bot não configurado',
        });
        return new Response(JSON.stringify({ error: 'Bot não configurado', steps }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const enabled = config?.enabled !== undefined ? config.enabled : !testConfig.bot_enabled;

      steps.push({
        step: 'toggle_action',
        status: 'success',
        message: `${enabled ? 'Ativando' : 'Pausando'} bot...`,
      });

      const response = await fetch(`${evolutionUrl}/openai/status/${testConfig.test_instance_name}/${testConfig.bot_evolution_id}`, {
        method: 'PUT',
        headers: {
          'apikey': evolutionConfig.api_key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        steps.push({
          step: 'toggle_response',
          status: 'error',
          message: 'Falha ao alterar status na Evolution',
        });
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Falha ao alterar status',
          steps,
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

      steps.push({
        step: 'toggle_complete',
        status: 'success',
        message: enabled ? 'Bot ativado!' : 'Bot pausado!',
      });

      return new Response(JSON.stringify({ 
        success: true, 
        message: enabled ? 'Bot ativado!' : 'Bot pausado!',
        enabled,
        steps,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      steps.push({
        step: 'delete_start',
        status: 'success',
        message: 'Removendo bot...',
      });

      if (testConfig.bot_evolution_id) {
        await fetch(`${evolutionUrl}/openai/delete/${testConfig.test_instance_name}/${testConfig.bot_evolution_id}`, {
          method: 'DELETE',
          headers: {
            'apikey': evolutionConfig.api_key,
          },
        });
        steps.push({
          step: 'delete_evolution',
          status: 'success',
          message: 'Bot removido da Evolution',
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

      steps.push({
        step: 'delete_complete',
        status: 'success',
        message: 'Bot de teste removido!',
      });

      return new Response(JSON.stringify({ success: true, message: 'Bot de teste removido!', steps }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'save_sandbox') {
      steps.push({
        step: 'save_sandbox',
        status: 'success',
        message: 'Salvando dados da loja sandbox...',
      });

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

      steps.push({
        step: 'save_complete',
        status: 'success',
        message: 'Loja sandbox salva!',
      });

      return new Response(JSON.stringify({ success: true, message: 'Loja sandbox salva!', steps }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Ação inválida', steps }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    steps.push({
      step: 'error',
      status: 'error',
      message: 'Erro inesperado',
      details: errorMessage,
    });
    return new Response(JSON.stringify({ error: errorMessage, steps }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
