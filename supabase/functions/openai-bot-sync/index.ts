import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BotConfig {
  storeId: string;
  instanceName: string;
  botName: string;
  stopBotFromMe: boolean;
  listeningFromMe: boolean;
  delayMessage: number;
  expireMinutes: number;
  keywordFinish: string;
  unknownMessage: string;
  keepOpen: boolean;
  debounceTime: number;
  triggerType: string;
  triggerOperator: string;
  triggerValue: string;
  ignoreJids: string[];
  splitMessages?: boolean;
  timePerChar?: number;
}

interface OperationStep {
  step: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

function formatBusinessHours(hours: any): string {
  if (!hours) return 'Não informado';
  
  try {
    if (typeof hours === 'string') {
      return hours;
    }
    
    if (typeof hours === 'object') {
      const formatted: string[] = [];
      
      for (const [key, value] of Object.entries(hours)) {
        if (value && typeof value === 'object') {
          const dayValue = value as any;
          if (dayValue.open && dayValue.close) {
            formatted.push(`${key}: ${dayValue.open} - ${dayValue.close}`);
          } else if (dayValue.closed) {
            formatted.push(`${key}: Fechado`);
          }
        }
      }
      
      return formatted.length > 0 ? formatted.join('\n') : 'Não informado';
    }
    
    return 'Não informado';
  } catch {
    return 'Não informado';
  }
}

function formatPaymentMethods(store: any): string {
  const methods: string[] = [];
  
  if (store.accepts_pix !== false) methods.push('✅ PIX');
  if (store.accepts_card !== false) methods.push('✅ Cartão');
  if (store.accepts_cash !== false) methods.push('✅ Dinheiro');
  
  if (methods.length === 0) {
    return '- Consulte a loja sobre formas de pagamento';
  }
  
  return methods.join('\n');
}

function generateSystemPrompt(botName: string, store: any, products: any[], categories: any[]): string {
  const productList = products
    .filter(p => p.is_available)
    .map(p => `- ${p.name}: R$ ${p.price?.toFixed(2)} - ${p.description || 'Sem descrição'}`)
    .join('\n');

  const categoryList = categories
    .filter(c => c.is_active)
    .map(c => c.name)
    .join(', ');

  const storeLink = `https://mostralo.com.br/loja/${store.slug}`;
  
  // Seção de localização
  const locationSection = store.google_maps_link 
    ? `\nLOCALIZAÇÃO:
- Endereço: ${store.address || 'Não informado'}
- Cidade/Estado: ${store.city || ''}${store.city && store.state ? '/' : ''}${store.state || ''}
- 📍 Link do Google Maps: ${store.google_maps_link}
- Quando cliente pedir localização, SEMPRE envie o link acima`
    : '';

  // Seção de pagamento
  const paymentSection = `\nFORMAS DE PAGAMENTO:
${formatPaymentMethods(store)}`;

  // Seção de delivery
  const deliverySection = `\nDELIVERY:
- Taxa de entrega: ${store.delivery_fee ? `R$ ${store.delivery_fee.toFixed(2)}` : 'Consulte na loja'}
- Pedido mínimo: ${store.min_order_value ? `R$ ${store.min_order_value.toFixed(2)}` : 'Sem valor mínimo'}`;

  // Seção de horários
  const hoursSection = `\nHORÁRIO DE FUNCIONAMENTO:
${formatBusinessHours(store.business_hours)}`;

  return `Você é ${botName}, o assistente virtual da ${store.name || 'loja'}.

Quando o cliente perguntar seu nome, responda: "Meu nome é ${botName}! 😊"

INFORMAÇÕES DA LOJA:
- Nome: ${store.name || 'Loja'}
- Descrição: ${store.description || 'Delivery de qualidade'}
- Endereço: ${store.address || 'Não informado'}
- WhatsApp: ${store.whatsapp || 'Não informado'}
- Link do cardápio: ${storeLink}
${locationSection}
${paymentSection}
${deliverySection}
${hoursSection}

CATEGORIAS DISPONÍVEIS:
${categoryList || 'Não há categorias cadastradas'}

PRODUTOS DISPONÍVEIS:
${productList || 'Não há produtos cadastrados'}

INSTRUÇÕES:
1. Seja cordial e prestativo
2. Apresente os produtos quando perguntado
3. Informe preços corretamente
4. Direcione o cliente para o cardápio online: ${storeLink}
5. Para finalizar pedido, peça para acessar o link do cardápio
6. Não invente produtos ou preços
7. Se não souber algo, direcione ao link do cardápio
8. Responda sempre em português brasileiro
9. Use emojis moderadamente para deixar a conversa mais amigável
10. Mencione promoções se houver
11. Quando pedirem localização, envie o link do Google Maps se disponível
12. Informe horário de funcionamento quando perguntado
13. Informe formas de pagamento aceitas quando perguntado

ENCERRAMENTO:
- Quando o cliente digitar a palavra de encerramento, agradeça e finalize
- Sempre deseje uma boa experiência ao cliente`;
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

    const { action, config } = await req.json() as { action: string; config: BotConfig };

    // Buscar loja do usuário com todos os campos necessários
    const { data: store, error: storeError } = await supabaseClient
      .from('stores')
      .select(`
        *, 
        google_maps_link, business_hours, delivery_fee, min_order_value,
        accepts_cash, accepts_card, accepts_pix, city, state
      `)
      .eq('id', config.storeId)
      .single();

    if (storeError || !store) {
      steps.push({ step: 'store_check', status: 'error', message: 'Loja não encontrada' });
      return new Response(JSON.stringify({ error: 'Loja não encontrada', steps }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    steps.push({ step: 'store_check', status: 'success', message: 'Loja encontrada', details: store.name });

    // Verificar se é dono da loja ou master_admin
    const isMasterAdmin = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'master_admin')
      .single();

    if (!isMasterAdmin.data && store.owner_id !== user.id) {
      steps.push({ step: 'auth_check', status: 'error', message: 'Acesso negado' });
      return new Response(JSON.stringify({ error: 'Acesso negado', steps }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    steps.push({ step: 'auth_check', status: 'success', message: 'Autorização verificada' });

    // Buscar Evolution config
    const { data: evolutionConfig, error: configError } = await supabaseClient
      .from('evolution_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !evolutionConfig) {
      steps.push({ step: 'evolution_config', status: 'error', message: 'Evolution API não configurada' });
      return new Response(JSON.stringify({ error: 'Evolution API não configurada', steps }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    steps.push({ step: 'evolution_config', status: 'success', message: 'Evolution API configurada', details: evolutionConfig.api_url });

    if (!evolutionConfig.openai_api_key) {
      steps.push({ step: 'openai_key_check', status: 'error', message: 'Chave OpenAI não configurada' });
      return new Response(JSON.stringify({ error: 'Chave OpenAI não configurada', steps }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    steps.push({ step: 'openai_key_check', status: 'success', message: 'Chave OpenAI configurada', details: '****' + evolutionConfig.openai_api_key.slice(-4) });

    const evolutionUrl = evolutionConfig.api_url.replace(/\/$/, '');
    const openaiApiKey = evolutionConfig.openai_api_key;

    // Buscar produtos e categorias
    const { data: products } = await supabaseClient
      .from('products')
      .select('*')
      .eq('store_id', config.storeId)
      .eq('is_available', true);

    const { data: categories } = await supabaseClient
      .from('categories')
      .select('*')
      .eq('store_id', config.storeId)
      .eq('is_active', true);

    steps.push({ step: 'data_fetch', status: 'success', message: 'Dados carregados', details: `${products?.length || 0} produtos, ${categories?.length || 0} categorias` });

    // Buscar config existente do bot
    const { data: existingBotConfig } = await supabaseClient
      .from('store_bot_config')
      .select('*')
      .eq('store_id', config.storeId)
      .single();

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
    // FUNÇÃO: Deletar bot existente na Evolution
    // ========================================
    async function deleteExistingBot(instanceName: string, botId: string): Promise<boolean> {
      try {
        console.log('Deletando bot:', botId, 'da instância:', instanceName);
        const deleteResp = await fetch(`${evolutionUrl}/openai/delete/${botId}/${instanceName}`, {
          method: 'DELETE',
          headers: { 'apikey': evolutionConfig.api_key },
        });
        
        const deleteText = await deleteResp.text();
        console.log('Resposta delete bot:', deleteResp.status, deleteText);
        
        return deleteResp.ok || deleteResp.status === 404;
      } catch (e) {
        console.log('Erro ao deletar bot:', e);
        return false;
      }
    }

    // ========================================
    // FUNÇÃO: Garantir bot com estratégia DELETE + CREATE
    // ========================================
    async function ensureOpenAiBot(
      instanceName: string,
      openaiCredsId: string,
      botPayload: any,
      storeName: string
    ): Promise<{ success: boolean; botId: string | null; created: boolean }> {
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
          details: existingBots.map((b) => `${b.description || b.id?.slice(0, 8) || 'sem-id'}`).join(', '),
        });

        for (const bot of existingBots) {
          if (bot.id) {
            steps.push({
              step: 'bot_delete',
              status: 'success',
              message: 'Removendo bot existente para recriar com configurações atualizadas...',
              details: `Bot ID: ${bot.id.slice(0, 8)}...`,
            });

            const deleted = await deleteExistingBot(instanceName, bot.id);
            
            if (deleted) {
              steps.push({
                step: 'bot_deleted',
                status: 'success',
                message: 'Bot removido com sucesso',
                details: `ID: ${bot.id.slice(0, 8)}...`,
              });
            } else {
              steps.push({
                step: 'bot_delete',
                status: 'warning',
                message: 'Falha ao remover bot (tentando continuar)',
                details: `ID: ${bot.id.slice(0, 8)}...`,
              });
            }
          }
        }
      } else {
        steps.push({
          step: 'bot_list',
          status: 'warning',
          message: 'Nenhum bot encontrado na instância',
        });
      }

      // Criar novo bot
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
          const alreadyExists = createText.includes('already exists') || createText.includes('already');
          if (alreadyExists) {
            steps.push({
              step: 'bot_create',
              status: 'warning',
              message: 'A Evolution informou que o bot já existe; deletando e recriando...',
              details: createText.slice(0, 140),
            });

            const botsAfter = await findExistingBots(instanceName);
            
            for (const bot of botsAfter) {
              if (bot.id) {
                await deleteExistingBot(instanceName, bot.id);
              }
            }

            const retryResp = await fetch(createUrl, {
              method: 'POST',
              headers: {
                'apikey': evolutionConfig.api_key,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(botPayload),
            });

            const retryText = await retryResp.text();
            console.log('Resposta retry criação bot:', retryResp.status, retryText);

            if (retryResp.ok) {
              let retryData: any = {};
              try {
                retryData = JSON.parse(retryText);
              } catch {
                retryData = {};
              }

              const retryBotId = retryData.id || retryData.openaiBot?.id || null;
              if (retryBotId) {
                steps.push({
                  step: 'bot_created',
                  status: 'success',
                  message: 'Bot recriado com sucesso!',
                  details: `ID: ${retryBotId.slice(0, 8)}...`,
                });
                return { success: true, botId: retryBotId, created: true };
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
      const openaiCredsId = await ensureOpenAiCreds(config.instanceName);
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

      // 2. Gerar prompt com dados da loja (agora com todos os campos)
      const botName = config.botName || 'Assistente';
      const systemPrompt = generateSystemPrompt(botName, store, products || [], categories || []);

      steps.push({
        step: 'prompt_generate',
        status: 'success',
        message: 'Prompt gerado com dados da loja',
        details: `${products?.length || 0} produto(s), ${categories?.length || 0} categoria(s), localização: ${store.google_maps_link ? 'sim' : 'não'}`,
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

      // 4. Montar payload do bot
      const botPayload: any = {
        enabled: true,
        openaiCredsId: openaiCredsId,
        botType: 'chatCompletion',
        model: model,
        maxTokens: evolutionConfig.openai_max_tokens || 1000,
        systemMessages: [systemPrompt],
        assistantMessages: [],
        userMessages: [],
        triggerType: config.triggerType || 'all',
        triggerOperator: config.triggerOperator || 'contains',
        triggerValue: config.triggerValue || '',
        expire: config.expireMinutes || 20,
        keywordFinish: config.keywordFinish || '#SAIR',
        delayMessage: config.delayMessage || 1500,
        unknownMessage: config.unknownMessage || 'Desculpe, não entendi. Digite #SAIR para encerrar ou acesse nosso cardápio online.',
        listeningFromMe: config.listeningFromMe || false,
        stopBotFromMe: config.stopBotFromMe !== undefined ? config.stopBotFromMe : true,
        keepOpen: config.keepOpen || false,
        debounceTime: config.debounceTime || 10,
        ignoreJids: config.ignoreJids || [],
        splitMessages: config.splitMessages !== undefined ? config.splitMessages : true,
        timePerChar: config.timePerChar || 0,
      };

      console.log('Payload do bot:', JSON.stringify(botPayload, null, 2));

      // 5. Garantir bot com consulta prévia
      const botResult = await ensureOpenAiBot(config.instanceName, openaiCredsId, botPayload, store.name);

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

      // 6. Salvar configuração no banco
      const botConfigData = {
        store_id: config.storeId,
        whatsapp_instance_id: null,
        enabled: true,
        bot_name: config.botName,
        stop_bot_from_me: config.stopBotFromMe,
        listening_from_me: config.listeningFromMe,
        delay_message: config.delayMessage,
        expire_minutes: config.expireMinutes,
        keyword_finish: config.keywordFinish,
        unknown_message: config.unknownMessage,
        keep_open: config.keepOpen,
        debounce_time: config.debounceTime,
        trigger_type: config.triggerType,
        trigger_operator: config.triggerOperator,
        trigger_value: config.triggerValue,
        ignore_jids: config.ignoreJids,
        bot_split_messages: config.splitMessages !== undefined ? config.splitMessages : true,
        bot_time_per_char: config.timePerChar || 0,
        evolution_bot_id: botResult.botId,
        evolution_bot_status: 'active',
        updated_at: new Date().toISOString(),
      };

      if (existingBotConfig) {
        await supabaseClient
          .from('store_bot_config')
          .update(botConfigData)
          .eq('id', existingBotConfig.id);
      } else {
        await supabaseClient
          .from('store_bot_config')
          .insert(botConfigData);
      }

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
    // AÇÃO: delete
    // ========================================
    if (action === 'delete') {
      steps.push({ step: 'action_start', status: 'success', message: 'Removendo bot...' });

      if (existingBotConfig?.evolution_bot_id) {
        const deleted = await deleteExistingBot(config.instanceName, existingBotConfig.evolution_bot_id);
        steps.push({
          step: 'bot_delete',
          status: deleted ? 'success' : 'warning',
          message: deleted ? 'Bot removido da Evolution' : 'Falha ao remover da Evolution',
        });
      }

      // Atualizar banco
      await supabaseClient
        .from('store_bot_config')
        .update({
          enabled: false,
          evolution_bot_id: null,
          evolution_bot_status: 'deleted',
          updated_at: new Date().toISOString(),
        })
        .eq('store_id', config.storeId);

      steps.push({ step: 'save_config', status: 'success', message: 'Configuração atualizada' });

      return new Response(JSON.stringify({ success: true, message: 'Bot removido!', steps }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Ação inválida', steps }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    steps.push({ step: 'error', status: 'error', message: message });
    return new Response(JSON.stringify({ error: message, steps }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
