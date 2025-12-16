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

    // ========================================
    // FUNÇÃO: Consultar e garantir credenciais OpenAI
    // ========================================
    async function ensureOpenAiCreds(instanceName: string): Promise<string | null> {
      steps.push({
        step: 'openai_creds_check',
        status: 'success',
        message: 'Consultando credenciais OpenAI na Evolution...',
        details: `Instância: ${instanceName}`,
      });

      // 1. Listar credenciais existentes
      console.log('Buscando credenciais OpenAI para instância:', instanceName);
      let existingCreds: any[] = [];
      
      try {
        const listResp = await fetch(`${evolutionUrl}/openai/creds/${instanceName}`, {
          method: 'GET',
          headers: { 'apikey': evolutionConfig.api_key },
        });

        if (listResp.ok) {
          const data = await listResp.json();
          existingCreds = Array.isArray(data) ? data : (data?.creds || data?.data || []);
          console.log('Credenciais encontradas:', existingCreds.length);
          
          steps.push({
            step: 'openai_creds_list',
            status: 'success',
            message: `${existingCreds.length} credencial(is) encontrada(s)`,
            details: existingCreds.map(c => `${c.name || 'sem-nome'} (${c.id?.slice(0, 8)}...)`).join(', ') || 'Nenhuma',
          });
        } else {
          console.log('Nenhuma credencial encontrada:', listResp.status);
          steps.push({
            step: 'openai_creds_list',
            status: 'warning',
            message: 'Nenhuma credencial encontrada',
            details: `Status: ${listResp.status}`,
          });
        }
      } catch (e) {
        console.log('Erro ao listar credenciais:', e);
        steps.push({
          step: 'openai_creds_list',
          status: 'warning',
          message: 'Erro ao consultar credenciais',
          details: String(e),
        });
      }

      // 2. Se temos ID salvo, verificar se ainda é válido
      if (evolutionConfig.openai_creds_id) {
        const found = existingCreds.find(c => c.id === evolutionConfig.openai_creds_id);
        if (found) {
          console.log('Credencial salva é válida:', evolutionConfig.openai_creds_id);
          steps.push({
            step: 'openai_creds_validate',
            status: 'success',
            message: 'Credencial salva ainda é válida',
            details: `ID: ${evolutionConfig.openai_creds_id.slice(0, 8)}...`,
          });
          return evolutionConfig.openai_creds_id;
        }
        
        // ID não existe mais - limpar
        console.log('ID salvo não é válido, limpando...');
        steps.push({
          step: 'openai_creds_invalid',
          status: 'warning',
          message: 'Credencial salva não existe mais',
          details: `ID antigo: ${evolutionConfig.openai_creds_id.slice(0, 8)}...`,
        });
        
        await supabaseClient
          .from('evolution_config')
          .update({ openai_creds_id: null, updated_at: new Date().toISOString() })
          .eq('id', evolutionConfig.id);
      }

      // 3. Buscar credencial existente "mostralo-openai"
      const mostraloCredential = existingCreds.find(c => c.name === 'mostralo-openai');
      if (mostraloCredential?.id) {
        console.log('Reutilizando credencial existente:', mostraloCredential.id);
        steps.push({
          step: 'openai_creds_reuse',
          status: 'success',
          message: 'Reutilizando credencial "mostralo-openai"',
          details: `ID: ${mostraloCredential.id.slice(0, 8)}...`,
        });
        
        await supabaseClient
          .from('evolution_config')
          .update({ openai_creds_id: mostraloCredential.id, updated_at: new Date().toISOString() })
          .eq('id', evolutionConfig.id);
        
        return mostraloCredential.id;
      }

      // 4. Criar nova credencial
      if (!openaiApiKey) {
        steps.push({
          step: 'openai_creds_create',
          status: 'error',
          message: 'Chave OpenAI necessária para criar credencial',
        });
        return null;
      }

      console.log('Criando nova credencial OpenAI...');
      steps.push({
        step: 'openai_creds_creating',
        status: 'success',
        message: 'Criando nova credencial OpenAI...',
      });

      try {
        const createResp = await fetch(`${evolutionUrl}/openai/creds/${instanceName}`, {
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
          steps.push({
            step: 'openai_creds_create',
            status: 'error',
            message: 'Falha ao criar credencial',
            details: `Status: ${createResp.status}`,
          });
          return null;
        }

        let createdId: string | null = null;
        try {
          const data = JSON.parse(createText);
          createdId = data?.id || data?.openaiCredsId || data?.creds?.id || null;
        } catch {
          createdId = null;
        }

        if (createdId) {
          await supabaseClient
            .from('evolution_config')
            .update({ openai_creds_id: createdId, updated_at: new Date().toISOString() })
            .eq('id', evolutionConfig.id);

          steps.push({
            step: 'openai_creds_created',
            status: 'success',
            message: 'Nova credencial criada!',
            details: `ID: ${createdId.slice(0, 8)}...`,
          });
          return createdId;
        }

        steps.push({
          step: 'openai_creds_create',
          status: 'error',
          message: 'ID não retornado pela Evolution',
          details: createText.slice(0, 100),
        });
        return null;
      } catch (e) {
        steps.push({
          step: 'openai_creds_create',
          status: 'error',
          message: 'Erro ao criar credencial',
          details: String(e),
        });
        return null;
      }
    }

    // ========================================
    // FUNÇÃO: Consultar bots existentes na Evolution
    // ========================================
    async function findExistingBots(instanceName: string): Promise<any[]> {
      console.log('Consultando bots existentes para instância:', instanceName);
      
      try {
        const findResp = await fetch(`${evolutionUrl}/openai/find/${instanceName}`, {
          method: 'GET',
          headers: { 'apikey': evolutionConfig.api_key },
        });

        if (findResp.ok) {
          const data = await findResp.json();
          const bots = Array.isArray(data) ? data : (data?.bots || data?.data || []);
          console.log('Bots encontrados:', bots.length);
          return bots;
        }
        
        console.log('Falha ao buscar bots:', findResp.status);
        return [];
      } catch (e) {
        console.log('Erro ao buscar bots:', e);
        return [];
      }
    }

    // ========================================
    // FUNÇÃO: Garantir bot com consulta prévia
    // ========================================
    async function ensureOpenAiBot(
      instanceName: string,
      openaiCredsId: string,
      botPayload: any,
      storeName: string
    ): Promise<{ success: boolean; botId: string | null; created: boolean }> {
      // Adicionar description ao payload (ajuda a identificar no painel da Evolution)
      botPayload.description = `Bot Mostralo - ${storeName}`;

      steps.push({
        step: 'bot_search',
        status: 'success',
        message: 'Consultando bots existentes na Evolution...',
      });

      const existingBots = await findExistingBots(instanceName);

      if (existingBots.length > 0) {
        steps.push({
          step: 'bot_list',
          status: 'success',
          message: `${existingBots.length} bot(s) encontrado(s)`,
          details: existingBots
            .map((b) => `${b.description || b.id?.slice(0, 8) || 'sem-id'}`)
            .join(', '),
        });
      } else {
        steps.push({
          step: 'bot_list',
          status: 'warning',
          message: 'Nenhum bot encontrado na instância',
        });
      }

      const pickCandidateBotId = (): string | null => {
        // 1) Prioridade: bot salvo no nosso banco
        if (testConfig.bot_evolution_id) {
          const found = existingBots.find((b) => b.id === testConfig.bot_evolution_id);
          if (found?.id) return found.id;
        }

        // 2) Bot identificado pela description
        const byDescription = existingBots.find((b) =>
          (b.description || '').includes('Bot Mostralo') ||
          (b.description || '').includes(storeName)
        );
        if (byDescription?.id) return byDescription.id;

        // 3) Se a Evolution só permite 1 bot por instância, usar o único existente
        if (existingBots.length === 1 && existingBots[0]?.id) return existingBots[0].id;

        return null;
      };

      const tryUpdateBot = async (botId: string) => {
        // Observação: a Evolution muda endpoints entre versões; tentamos 2 formas conhecidas.
        const candidates = [
          // V2 observada nos logs: o servidor interpreta o 2º parâmetro como instanceName
          { kind: 'update', url: `${evolutionUrl}/openai/update/${botId}/${instanceName}` },
          // Algumas instalações usam /openai/settings/{instance}/{botId}
          { kind: 'settings', url: `${evolutionUrl}/openai/settings/${instanceName}/${botId}` },
        ];

        let lastStatus = 0;
        let lastText = '';

        for (const c of candidates) {
          try {
            console.log('Tentando update bot:', c.kind, c.url);
            const resp = await fetch(c.url, {
              method: 'PUT',
              headers: {
                'apikey': evolutionConfig.api_key,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(botPayload),
            });

            const text = await resp.text();
            lastStatus = resp.status;
            lastText = text;

            steps.push({
              step: 'bot_update_try',
              status: resp.ok ? 'success' : 'warning',
              message: resp.ok
                ? `Update OK (${c.kind})`
                : `Update falhou (${c.kind})`,
              details: `Status: ${resp.status} - ${text.slice(0, 140)}`,
            });

            if (resp.ok) {
              return { ok: true as const };
            }
          } catch (e) {
            steps.push({
              step: 'bot_update_try',
              status: 'warning',
              message: `Erro no update (${c.kind})`,
              details: String(e).slice(0, 140),
            });
          }
        }

        return { ok: false as const, status: lastStatus, text: lastText };
      };

      // Se temos bot salvo e ele não existe mais na Evolution, limpamos (para evitar loop ruim)
      if (testConfig.bot_evolution_id) {
        const existsInEvolution = existingBots.some((b) => b.id === testConfig.bot_evolution_id);
        if (!existsInEvolution) {
          steps.push({
            step: 'bot_invalid',
            status: 'warning',
            message: 'Bot salvo não existe mais na Evolution (limpando ID local)',
            details: `ID antigo: ${testConfig.bot_evolution_id.slice(0, 8)}...`,
          });

          await supabaseClient
            .from('master_admin_test_config')
            .update({ bot_evolution_id: null, updated_at: new Date().toISOString() })
            .eq('id', testConfig.id);
        }
      }

      // 1) Se já existe bot na instância, NUNCA tenta criar (a Evolution pode bloquear com "already exists")
      if (existingBots.length > 0) {
        const candidateBotId = pickCandidateBotId();

        if (!candidateBotId) {
          steps.push({
            step: 'bot_target',
            status: 'error',
            message: 'Existe bot na instância, mas não consegui identificar qual atualizar',
          });
          return { success: false, botId: null, created: false };
        }

        steps.push({
          step: 'bot_target',
          status: 'success',
          message: 'Bot alvo definido para atualização',
          details: `Bot ID: ${candidateBotId.slice(0, 8)}...`,
        });

        const updateRes = await tryUpdateBot(candidateBotId);
        if (!updateRes.ok) {
          steps.push({
            step: 'bot_update',
            status: 'error',
            message: 'Não foi possível atualizar o bot existente',
            details: `Último status: ${updateRes.status} - ${String(updateRes.text || '').slice(0, 160)}`,
          });
          return { success: false, botId: null, created: false };
        }

        // Persistir botId no banco (se ainda não estiver)
        await supabaseClient
          .from('master_admin_test_config')
          .update({ bot_evolution_id: candidateBotId, updated_at: new Date().toISOString() })
          .eq('id', testConfig.id);

        steps.push({
          step: 'bot_update',
          status: 'success',
          message: 'Bot existente atualizado!',
          details: `ID: ${candidateBotId.slice(0, 8)}...`,
        });

        return { success: true, botId: candidateBotId, created: false };
      }

      // 2) Se não existe nenhum bot, criar
      steps.push({
        step: 'bot_creating',
        status: 'success',
        message: 'Criando novo bot na Evolution...',
      });

      try {
        const createUrl = `${evolutionUrl}/openai/create/${instanceName}`;
        const createResp = await fetch(createUrl, {
          method: 'POST',
          headers: {
            'apikey': evolutionConfig.api_key,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(botPayload),
        });

        const createText = await createResp.text();
        console.log('Resposta criação bot:', createResp.status, createText);

        if (!createResp.ok) {
          // Se a Evolution diz que já existe, refaz o find e tenta atualizar o primeiro
          const alreadyExists = createText.includes('already exists') || createText.includes('already');
          if (alreadyExists) {
            steps.push({
              step: 'bot_create',
              status: 'warning',
              message: 'A Evolution informou que o bot já existe; tentando recuperar e atualizar...',
              details: createText.slice(0, 140),
            });

            const botsAfter = await findExistingBots(instanceName);
            const fallbackId = (botsAfter[0] && botsAfter[0].id) ? botsAfter[0].id : null;
            if (fallbackId) {
              const updateRes = await tryUpdateBot(fallbackId);
              if (updateRes.ok) {
                await supabaseClient
                  .from('master_admin_test_config')
                  .update({ bot_evolution_id: fallbackId, updated_at: new Date().toISOString() })
                  .eq('id', testConfig.id);

                steps.push({
                  step: 'bot_update',
                  status: 'success',
                  message: 'Bot recuperado e atualizado!',
                  details: `ID: ${fallbackId.slice(0, 8)}...`,
                });

                return { success: true, botId: fallbackId, created: false };
              }
            }
          }

          steps.push({
            step: 'bot_create',
            status: 'error',
            message: 'Falha ao criar bot',
            details: `Status: ${createResp.status} - ${createText.slice(0, 160)}`,
          });
          return { success: false, botId: null, created: false };
        }

        let botData: any = {};
        try {
          botData = JSON.parse(createText);
        } catch {
          botData = {};
        }

        const botId = botData.id || botData.openaiBot?.id || null;

        if (!botId) {
          steps.push({
            step: 'bot_create',
            status: 'error',
            message: 'ID do bot não retornado',
            details: createText.slice(0, 160),
          });
          return { success: false, botId: null, created: false };
        }

        steps.push({
          step: 'bot_created',
          status: 'success',
          message: 'Novo bot criado com sucesso!',
          details: `ID: ${botId.slice(0, 8)}...`,
        });

        return { success: true, botId, created: true };
      } catch (e) {
        steps.push({
          step: 'bot_create',
          status: 'error',
          message: 'Erro ao criar bot',
          details: String(e),
        });
        return { success: false, botId: null, created: false };
      }
    }

    // ========================================
    // AÇÕES: create / update
    // ========================================
    if (action === 'create' || action === 'update') {
      steps.push({
        step: 'action_start',
        status: 'success',
        message: `Iniciando sincronização do bot...`,
      });

      // 1. Garantir credenciais OpenAI
      const openaiCredsId = await ensureOpenAiCreds(testConfig.test_instance_name);
      if (!openaiCredsId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Não foi possível obter/criar credenciais OpenAI',
          steps,
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Usando openaiCredsId:', openaiCredsId);

      // 2. Gerar prompt com dados da loja sandbox
      const products = (testConfig.sandbox_products || []) as SandboxProduct[];
      const categories = (testConfig.sandbox_categories || []) as SandboxCategory[];
      const storeName = config?.storeName || testConfig.sandbox_store_name;
      
      const systemPrompt = generateTestSystemPrompt(
        storeName,
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

      // 3. Validar modelo
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
          message: `Modelo: ${model}`,
        });
      }

      // 4. Montar payload do bot com novos campos avançados
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
        unknownMessage: config?.unknownMessage || testConfig.bot_unknown_message || 'Desculpe, não entendi sua mensagem. Digite #SAIR para encerrar.',
        listeningFromMe: config?.listeningFromMe !== undefined ? config.listeningFromMe : (testConfig.bot_listening_from_me ?? false),
        stopBotFromMe: config?.stopBotFromMe !== undefined ? config.stopBotFromMe : testConfig.bot_stop_from_me,
        keepOpen: config?.keepOpen !== undefined ? config.keepOpen : (testConfig.bot_keep_open ?? false),
        debounceTime: config?.debounceTime || testConfig.bot_debounce_time || 10,
        ignoreJids: [],
        splitMessages: config?.splitMessages !== undefined ? config.splitMessages : (testConfig.bot_split_messages ?? true),
        timePerChar: config?.timePerChar || testConfig.bot_time_per_char || 0,
      };

      console.log('Payload do bot:', JSON.stringify(botPayload, null, 2));

      // 5. Garantir bot com consulta prévia
      const botResult = await ensureOpenAiBot(instanceName, openaiCredsId, botPayload, storeName);

      if (!botResult.success || !botResult.botId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Não foi possível criar/atualizar o bot na Evolution',
          steps,
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 6. Salvar configuração no banco (incluindo novos campos)
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
          bot_evolution_id: botResult.botId,
          sandbox_store_name: config?.storeName || testConfig.sandbox_store_name,
          sandbox_store_description: config?.storeDescription || testConfig.sandbox_store_description,
          // Novos campos avançados
          bot_unknown_message: config?.unknownMessage || testConfig.bot_unknown_message,
          bot_listening_from_me: config?.listeningFromMe !== undefined ? config.listeningFromMe : testConfig.bot_listening_from_me,
          bot_keep_open: config?.keepOpen !== undefined ? config.keepOpen : testConfig.bot_keep_open,
          bot_debounce_time: config?.debounceTime || testConfig.bot_debounce_time,
          bot_split_messages: config?.splitMessages !== undefined ? config.splitMessages : testConfig.bot_split_messages,
          bot_time_per_char: config?.timePerChar || testConfig.bot_time_per_char,
          updated_at: new Date().toISOString(),
        })
        .eq('id', testConfig.id);

      steps.push({
        step: 'save_config',
        status: 'success',
        message: 'Configuração salva no banco',
        details: `Bot ID: ${botResult.botId.slice(0, 8)}...`,
      });

      return new Response(JSON.stringify({ 
        success: true, 
        message: botResult.created ? 'Bot criado com sucesso!' : 'Bot atualizado com sucesso!',
        botId: botResult.botId,
        created: botResult.created,
        steps,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========================================
    // AÇÃO: toggle
    // ========================================
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
          message: 'Falha ao alterar status',
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

    // ========================================
    // AÇÃO: delete
    // ========================================
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
        message: 'Bot removido!',
      });

      return new Response(JSON.stringify({ success: true, message: 'Bot removido!', steps }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========================================
    // AÇÃO: save_sandbox
    // ========================================
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

    // ========================================
    // AÇÃO: get_sessions - Buscar sessões ativas do bot
    // ========================================
    if (action === 'get_sessions') {
      steps.push({
        step: 'sessions_start',
        status: 'success',
        message: 'Consultando sessões ativas...',
      });

      if (!testConfig.test_instance_name) {
        steps.push({
          step: 'sessions_check',
          status: 'error',
          message: 'Nenhuma instância configurada',
        });
        return new Response(JSON.stringify({ error: 'Nenhuma instância configurada', steps }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verificar se o bot está ativado
      const botEvolutionId = testConfig.bot_evolution_id;
      if (!botEvolutionId) {
        steps.push({
          step: 'sessions_check',
          status: 'warning',
          message: 'Bot não está ativado',
          details: 'Ative o bot primeiro para ver sessões',
        });
        return new Response(JSON.stringify({ 
          success: true, 
          sessions: [], 
          steps,
          message: 'Bot não está ativado. Ative primeiro para ver sessões.',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        // Endpoint correto: /openai/fetchSessions/{instanceName}/{botId}
        console.log(`Buscando sessões: ${evolutionUrl}/openai/fetchSessions/${testConfig.test_instance_name}/${botEvolutionId}`);
        
        const sessionsResp = await fetch(
          `${evolutionUrl}/openai/fetchSessions/${testConfig.test_instance_name}/${botEvolutionId}`,
          {
            method: 'GET',
            headers: { 'apikey': evolutionConfig.api_key },
          }
        );

        if (!sessionsResp.ok) {
          const errorText = await sessionsResp.text();
          console.log('Resposta sessões:', sessionsResp.status, errorText);
          
          // Se 404, o endpoint pode não existir nesta versão da API
          if (sessionsResp.status === 404) {
            steps.push({
              step: 'sessions_fetch',
              status: 'warning',
              message: 'Endpoint de sessões não disponível',
              details: 'Esta versão da Evolution API pode não suportar listagem de sessões',
            });
            return new Response(JSON.stringify({ 
              success: true, 
              sessions: [],
              steps,
              message: 'Listagem de sessões não disponível nesta versão da API',
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          steps.push({
            step: 'sessions_fetch',
            status: 'error',
            message: 'Falha ao consultar sessões',
            details: `Status: ${sessionsResp.status}`,
          });
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Falha ao consultar sessões',
            sessions: [],
            steps,
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const sessionsData = await sessionsResp.json();
        const sessions = Array.isArray(sessionsData) 
          ? sessionsData 
          : (sessionsData?.sessions || sessionsData?.data || []);

        steps.push({
          step: 'sessions_complete',
          status: 'success',
          message: `${sessions.length} sessão(ões) encontrada(s)`,
        });

        return new Response(JSON.stringify({ 
          success: true, 
          sessions,
          steps,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (e) {
        console.error('Erro ao consultar sessões:', e);
        steps.push({
          step: 'sessions_error',
          status: 'error',
          message: 'Erro ao consultar sessões',
          details: String(e),
        });
        return new Response(JSON.stringify({ 
          success: false, 
          error: String(e),
          sessions: [],
          steps,
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
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
