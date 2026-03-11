// UaZapi Bot Sync - v2.0.0
// Cria/atualiza Agentes de IA via API da UaZapi (/agent/edit, /function/edit, /trigger/edit)
// Seguindo o manual oficial da UaZapi (Páginas 23, 33, 36)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type BotModeType = 'chat_completion' | 'assistant' | 'conversational';
type PersonalityType = 'professional' | 'friendly' | 'fun' | 'consultive';
type EmojiLevel = 'none' | 'moderate' | 'abundant';

interface PersonalitySettings {
  personality: PersonalityType;
  emojiLevel: EmojiLevel;
  customGreeting: string;
}

interface OperationStep {
  step: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

// ========================================
// UTILITÁRIOS
// ========================================

const TIMEZONE_MAP: Record<string, { label: string; offset: string }> = {
  'America/Sao_Paulo': { label: 'Brasília', offset: 'UTC-3' },
  'America/Manaus': { label: 'Manaus', offset: 'UTC-4' },
  'America/Cuiaba': { label: 'Cuiabá', offset: 'UTC-4' },
  'America/Rio_Branco': { label: 'Rio Branco', offset: 'UTC-5' },
  'America/Noronha': { label: 'Fernando de Noronha', offset: 'UTC-2' },
};

function getTimezoneDescription(timezone: string | null): string {
  const tz = TIMEZONE_MAP[timezone || 'America/Sao_Paulo'] || TIMEZONE_MAP['America/Sao_Paulo'];
  return `${tz.label} ${tz.offset}`;
}

function generatePersonalityInstructions(settings: PersonalitySettings): string {
  const personalities: Record<PersonalityType, string> = {
    professional: `Seja formal e objetivo. Use linguagem profissional e respeitosa. Vá direto ao ponto. Trate por "senhor(a)" ou "você".`,
    friendly: `Seja acolhedor e simpático. Use linguagem amigável e calorosa. Demonstre interesse genuíno pelo cliente.`,
    fun: `Seja descontraído e divertido. Use linguagem informal e leve. Faça brincadeiras quando apropriado. Transmita energia positiva.`,
    consultive: `Atue como consultor especialista. Faça perguntas para entender preferências. Sugira produtos baseado no perfil do cliente.`
  };
  const emojiInstructions: Record<EmojiLevel, string> = {
    none: 'NÃO use emojis nas respostas.',
    moderate: 'Use emojis com moderação (1-2 por mensagem).',
    abundant: 'Use bastante emojis para deixar a conversa animada! 🎉😊🔥✨'
  };
  const customGreetingNote = settings.customGreeting 
    ? `\nSaudação personalizada: "${settings.customGreeting}".`
    : '';
  return `${personalities[settings.personality]}\n${emojiInstructions[settings.emojiLevel]}${customGreetingNote}`;
}

function formatBusinessHours(hours: any): string {
  if (!hours) return 'Não informado';
  try {
    if (typeof hours === 'string') return hours;
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
  } catch { return 'Não informado'; }
}

function formatPaymentMethods(store: any): string {
  const methods: string[] = [];
  if (store.accepts_pix !== false) methods.push('PIX');
  if (store.accepts_card !== false) methods.push('Cartão');
  if (store.accepts_cash !== false) methods.push('Dinheiro');
  return methods.length === 0 ? 'Consulte a loja' : methods.join(', ');
}

function formatDeliveryZones(zones: any[]): string {
  if (!zones || zones.length === 0) return '';
  const activeZones = zones.filter((z: any) => z.isActive !== false);
  if (activeZones.length === 0) return '';
  return activeZones.map((zone: any) => {
    let line = `- ${zone.name}: R$ ${Number(zone.deliveryFee).toFixed(2)}`;
    if (zone.timeFees && zone.timeFees.length > 0) {
      const timeParts = zone.timeFees.map((tf: any) => 
        `  → ${tf.label || 'Horário especial'} (${tf.startTime}-${tf.endTime}): R$ ${Number(tf.fee).toFixed(2)}`
      );
      line += '\n' + timeParts.join('\n');
    }
    return line;
  }).join('\n');
}

function getStoreBaseUrl(store: any, origin?: string): string {
  if (store.custom_domain && store.custom_domain_verified) return `https://${store.custom_domain}`;
  if (origin) {
    const devDomains = ['localhost', 'lovable.app', 'lovable.dev', 'gptengineer.run', 'webcontainer.io', 'stackblitz.io', 'codesandbox.io'];
    if (!devDomains.some(d => origin.includes(d))) return origin.replace(/\/$/, '');
  }
  return 'https://mostralo.com.br';
}

// Helper para chamadas à UaZapi API
async function uazapiFetch(url: string, token: string, options: RequestInit = {}) {
  console.log(`[uazapi-bot-sync] 🌐 Fetch: ${options.method || 'GET'} ${url}`);
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'token': token,
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  console.log(`[uazapi-bot-sync] 📡 Resposta (${response.status}):`, JSON.stringify(data).substring(0, 500));
  return { ok: response.ok, status: response.status, data };
}

// ========================================
// GERAÇÃO DE PROMPT BASE (para o agente UaZapi)
// ========================================
function generateBasePrompt(
  botName: string, store: any, products: any[], categories: any[],
  origin?: string, personalitySettings?: PersonalitySettings, deliveryZones?: any[],
  botMode?: BotModeType, customInstructions?: string
): string {
  const baseUrl = getStoreBaseUrl(store, origin);
  const storeLink = `${baseUrl}/loja/${store.slug}`;
  const defaultPersonality: PersonalitySettings = { personality: 'friendly', emojiLevel: 'moderate', customGreeting: '' };
  const personality = personalitySettings || defaultPersonality;
  const personalityInstructions = generatePersonalityInstructions(personality);
  const categoryList = categories.filter(c => c.is_active).map(c => c.name).join(', ');
  const paymentSection = formatPaymentMethods(store);
  const zonesText = formatDeliveryZones(deliveryZones || []);
  const hoursSection = formatBusinessHours(store.business_hours);

  // Para modo simples (chat_completion), incluir produtos no prompt
  let productSection = '';
  if (botMode === 'chat_completion') {
    const productList = products.filter(p => p.is_available).map(p => {
      const productLink = p.slug ? `${storeLink}/produto/${p.slug}` : storeLink;
      return `- ${p.name}: R$ ${p.price?.toFixed(2)} | ${p.description || 'Sem descrição'} | Link: ${productLink}`;
    }).join('\n');
    productSection = `\nPRODUTOS DISPONÍVEIS:\n${productList || 'Nenhum produto cadastrado'}`;
  } else {
    // Assistente/Conversacional usa function calling
    productSection = `\nPRODUTOS: Use a função "search_products" para buscar produtos. NUNCA invente produtos ou preços.`;
  }

  let prompt = `Você é ${botName}, o assistente virtual da ${store.name || 'loja'}.

Quando o cliente perguntar seu nome, responda: "Meu nome é ${botName}!"

PERSONALIZAÇÃO COM NOME DO CLIENTE:
- Use o nome do cliente quando disponível
- Se NÃO estiver disponível, trate por "você"
- NUNCA escreva literalmente "[Nome]"

SAUDAÇÃO BASEADA NO HORÁRIO (Fuso: ${getTimezoneDescription(store.timezone)}):
- 05:00 às 11:59 → "Bom dia! ☀️"
- 12:00 às 17:59 → "Boa tarde! 🌤️"
- 18:00 às 23:59 → "Boa noite! 🌙"

${personalityInstructions}

INFORMAÇÕES DA LOJA:
- Nome: ${store.name || 'Loja'}
- Descrição: ${store.description || 'Delivery de qualidade'}
- Endereço: ${store.address || 'Não informado'}
- WhatsApp: ${store.whatsapp || 'Não informado'}
- Link da loja: ${storeLink}
- Formas de pagamento: ${paymentSection}
- Horário: ${hoursSection}
${zonesText ? `- Áreas de entrega:\n${zonesText}` : `- Taxa de entrega: ${store.delivery_fee ? `R$ ${store.delivery_fee.toFixed(2)}` : 'Consulte na loja'}`}
- Pedido mínimo: ${store.min_order_value ? `R$ ${store.min_order_value.toFixed(2)}` : 'Sem valor mínimo'}

CATEGORIAS: ${categoryList || 'Não há categorias cadastradas'}
${productSection}

RESTRIÇÕES:
- Responda SOMENTE sobre a loja, produtos, pedidos, entregas e pagamentos
- NUNCA mencione concorrentes
- Responda sempre em português brasileiro
- SEMPRE inclua o link do produto quando disponível: ${storeLink}

FORMATAÇÃO (WhatsApp):
- Use *texto* para negrito
- NÃO use colchetes ou formato markdown de link`;

  if (customInstructions) {
    prompt += `\n\nINSTRUÇÕES PERSONALIZADAS:\n${customInstructions}`;
  }

  return prompt;
}

// ========================================
// FUNÇÕES PARA REGISTRAR NA UAZAPI (Function Calling)
// ========================================
function buildUazapiFunctions(storeId: string, supabaseUrl: string): any[] {
  const searchEndpoint = `${supabaseUrl}/functions/v1/product-search-agent`;
  
  return [
    {
      name: 'search_products',
      description: 'Busca produtos no catálogo por nome ou termo. Use sempre que o cliente perguntar sobre um produto.',
      active: true,
      method: 'POST',
      endpoint: searchEndpoint,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') || ''}`,
      },
      body: {
        storeId: storeId,
        query: '{{query}}',
        limit: '{{limit}}',
      },
      parameters: [
        {
          name: 'query',
          type: 'string',
          description: 'Termo de busca do produto',
          required: true,
        },
        {
          name: 'limit',
          type: 'number',
          description: 'Quantidade máxima de resultados (padrão: 3)',
          required: false,
        },
      ],
    },
  ];
}

// ========================================
// HANDLER PRINCIPAL
// ========================================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const steps: OperationStep[] = [];

  try {
    console.log('[uazapi-bot-sync] 🔄 Requisição recebida:', req.method);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    // Autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado', steps }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido', steps }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;
    const requestBody = await req.json();
    console.log('[uazapi-bot-sync] 📦 Body:', JSON.stringify(requestBody).substring(0, 500));

    let action = requestBody.action || 'update';
    const storeId = requestBody.storeId || requestBody.config?.storeId;
    const origin = requestBody.origin;
    const forceSync = requestBody.forceSync;

    if (!storeId) {
      return new Response(JSON.stringify({ error: 'storeId é obrigatório', steps }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[uazapi-bot-sync] 🏪 storeId:', storeId, 'action:', action);

    // Buscar loja, instância UaZapi, config do bot e config UaZapi em paralelo
    const [storeRes, instanceRes, botConfigRes, uazapiConfigRes, storeConfigRes] = await Promise.all([
      supabaseClient.from('stores')
        .select('*, openai_api_key, niche_id')
        .eq('id', storeId).single(),
      supabaseClient.from('whatsapp_instances')
        .select('*')
        .eq('store_id', storeId).eq('provider', 'uazapi').maybeSingle(),
      supabaseClient.from('store_bot_config')
        .select('*').eq('store_id', storeId).maybeSingle(),
      supabaseClient.from('uazapi_config')
        .select('api_url, admin_token').limit(1).maybeSingle(),
      supabaseClient.from('store_configurations')
        .select('delivery_zones').eq('store_id', storeId).maybeSingle(),
    ]);

    const store = storeRes.data;
    const instance = instanceRes.data;
    const existingBotConfig = botConfigRes.data;
    const uazapiConfig = uazapiConfigRes.data;
    const deliveryZones = (storeConfigRes.data?.delivery_zones as any[]) || [];

    if (storeRes.error || !store) {
      steps.push({ step: 'store_check', status: 'error', message: 'Loja não encontrada' });
      return new Response(JSON.stringify({ error: 'Loja não encontrada', steps }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    steps.push({ step: 'store_check', status: 'success', message: 'Loja encontrada', details: store.name });

    if (!instance) {
      steps.push({ step: 'instance_check', status: 'error', message: 'Instância UaZapi não encontrada para esta loja' });
      return new Response(JSON.stringify({ error: 'Instância UaZapi não encontrada', steps }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!instance.api_token) {
      steps.push({ step: 'instance_check', status: 'error', message: 'Token da instância UaZapi não configurado' });
      return new Response(JSON.stringify({ error: 'Token da instância UaZapi não configurado', steps }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    steps.push({ step: 'instance_check', status: 'success', message: 'Instância UaZapi encontrada', details: instance.instance_name });

    if (!uazapiConfig) {
      steps.push({ step: 'uazapi_config', status: 'error', message: 'Configuração do servidor UaZapi não encontrada' });
      return new Response(JSON.stringify({ error: 'Servidor UaZapi não configurado', steps }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    steps.push({ step: 'uazapi_config', status: 'success', message: 'Config UaZapi carregada' });

    // Verificar permissão
    const isMasterAdmin = await supabaseClient.from('user_roles').select('role').eq('user_id', userId).eq('role', 'master_admin').single();
    if (!isMasterAdmin.data && store.owner_id !== userId) {
      return new Response(JSON.stringify({ error: 'Acesso negado', steps }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    steps.push({ step: 'auth_check', status: 'success', message: 'Autorização verificada' });

    // API Key OpenAI
    const openaiApiKey = store.openai_api_key;
    if (!openaiApiKey) {
      steps.push({ step: 'openai_key_check', status: 'error', message: 'Chave OpenAI não configurada na loja' });
      return new Response(JSON.stringify({ error: 'API Key OpenAI não configurada para esta loja.', steps }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    steps.push({ step: 'openai_key_check', status: 'success', message: 'Chave OpenAI OK', details: '****' + openaiApiKey.slice(-4) });

    const instanceApiUrl = `${uazapiConfig.api_url.replace(/\/+$/, '')}`;
    const instanceToken = instance.api_token;

    // ========================================
    // AÇÃO: DELETE
    // ========================================
    if (action === 'delete') {
      steps.push({ step: 'action_start', status: 'success', message: 'Removendo bot UaZapi...' });

      // Listar agentes existentes e deletar
      try {
        const agentListRes = await uazapiFetch(`${instanceApiUrl}/agent/list`, instanceToken);
        if (agentListRes.ok && Array.isArray(agentListRes.data)) {
          for (const agent of agentListRes.data) {
            if (agent.name && agent.name.includes('Mostralo')) {
              const delRes = await uazapiFetch(`${instanceApiUrl}/agent/delete/${agent.id}`, instanceToken, {
                method: 'DELETE',
              });
              if (!delRes.ok && delRes.status === 405) {
                await uazapiFetch(`${instanceApiUrl}/agent/${agent.id}`, instanceToken, { method: 'DELETE' });
              }
              steps.push({ step: 'agent_delete', status: 'success', message: `Agente "${agent.name}" removido` });
            }
          }
        }

        // Listar e remover triggers
        const triggerListRes = await uazapiFetch(`${instanceApiUrl}/trigger/list`, instanceToken);
        if (triggerListRes.ok && Array.isArray(triggerListRes.data)) {
          for (const trigger of triggerListRes.data) {
            if (trigger.type === 'agent') {
              const trigDelRes = await uazapiFetch(`${instanceApiUrl}/trigger/delete/${trigger.id}`, instanceToken, {
                method: 'DELETE',
              });
              if (!trigDelRes.ok && trigDelRes.status === 405) {
                await uazapiFetch(`${instanceApiUrl}/trigger/${trigger.id}`, instanceToken, { method: 'DELETE' });
              }
              steps.push({ step: 'trigger_delete', status: 'success', message: 'Trigger removido' });
            }
          }
        }
      } catch (e) {
        steps.push({ step: 'cleanup', status: 'warning', message: 'Erro ao limpar agentes', details: String(e).slice(0, 100) });
      }

      await supabaseClient.from('store_bot_config').update({
        enabled: false,
        evolution_bot_status: 'paused',
        uazapi_assistant_id: null,
        whatsapp_provider: 'uazapi',
        updated_at: new Date().toISOString(),
      }).eq('store_id', storeId);

      steps.push({ step: 'save_config', status: 'success', message: 'Bot desativado' });
      return new Response(JSON.stringify({ success: true, message: 'Bot UaZapi removido!', steps }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========================================
    // AÇÃO: CREATE / UPDATE
    // ========================================
    steps.push({ step: 'action_start', status: 'success', message: 'Iniciando sincronização UaZapi...' });

    // Buscar dados para prompt
    const [productsRes, categoriesRes] = await Promise.all([
      supabaseClient.from('products').select('*, slug').eq('store_id', storeId).eq('is_available', true),
      supabaseClient.from('categories').select('*').eq('store_id', storeId).eq('is_active', true),
    ]);
    const products = productsRes.data || [];
    const categories = categoriesRes.data || [];
    steps.push({ step: 'data_fetch', status: 'success', message: 'Dados carregados', details: `${products.length} produtos, ${categories.length} categorias` });

    const botMode: BotModeType = (existingBotConfig?.bot_mode as BotModeType) || requestBody.config?.botMode || 'chat_completion';
    const botName = requestBody.config?.botName || existingBotConfig?.bot_name || 'Assistente';
    const customInstructions = requestBody.config?.customPromptInstructions || existingBotConfig?.custom_prompt_instructions || '';
    
    const personalitySettings: PersonalitySettings = {
      personality: (existingBotConfig?.personality || 'friendly') as PersonalityType,
      emojiLevel: (existingBotConfig?.emoji_level || 'moderate') as EmojiLevel,
      customGreeting: existingBotConfig?.custom_greeting || ''
    };

    steps.push({
      step: 'bot_mode',
      status: 'success',
      message: `Modo: ${botMode === 'conversational' ? 'Conversacional' : botMode === 'assistant' ? 'Assistente v2' : 'Simples'}`,
    });

    // Gerar prompt
    const basePrompt = generateBasePrompt(
      botName, store, products, categories, origin,
      personalitySettings, deliveryZones, botMode, customInstructions
    );
    steps.push({ step: 'prompt_generate', status: 'success', message: 'Prompt gerado', details: `${basePrompt.length} caracteres` });

    // Modelo
    const model = 'gpt-4o-mini';

    // ========================================
    // PASSO 1: Criar/Atualizar OpenAI Assistant
    // ========================================
    console.log('[uazapi-bot-sync] 🤖 Criando OpenAI Assistant...');
    
    let openaiAssistantId = existingBotConfig?.openai_assistant_id || null;

    // Tools para o Assistant (mesmas do openai-bot-sync)
    const assistantTools = [
      {
        type: 'function',
        function: {
          name: 'search_products',
          description: 'Busca produtos no catálogo da loja por nome, categoria ou descrição. SEMPRE use esta função quando o cliente perguntar sobre produtos, preços ou disponibilidade.',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Termo de busca' },
              limit: { type: 'number', description: 'Quantidade máxima de resultados (padrão: 5)' },
            },
            required: ['query'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_recommendations',
          description: 'Retorna produtos recomendados.',
          parameters: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Quantidade máxima' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_store_info',
          description: 'Obtém informações da loja.',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'check_store_status',
          description: 'Verifica se a loja está aberta ou fechada no momento atual.',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_current_greeting',
          description: 'Retorna a saudação correta baseada no horário atual.',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_last_delivery_info',
          description: 'Busca o endereço e a taxa de entrega do último pedido do cliente pelo telefone.',
          parameters: {
            type: 'object',
            properties: {
              customer_phone: { type: 'string', description: 'Telefone do cliente (apenas números)' },
            },
            required: ['customer_phone'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'calculate_delivery_fee',
          description: 'Calcula a taxa de entrega baseada na localização GPS do cliente.',
          parameters: {
            type: 'object',
            properties: {
              latitude: { type: 'number', description: 'Latitude' },
              longitude: { type: 'number', description: 'Longitude' },
            },
            required: ['latitude', 'longitude'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'analyze_image',
          description: 'Analisa uma imagem enviada pelo cliente para identificar produtos.',
          parameters: {
            type: 'object',
            properties: {
              image_data: {
                type: 'object',
                description: 'Dados da imagem (base64 ou url)',
                properties: {
                  base64: { type: 'string', description: 'Imagem em base64' },
                  url: { type: 'string', description: 'URL da imagem' },
                  mimetype: { type: 'string', description: 'Tipo MIME' },
                },
              },
              image_context: { type: 'string', description: 'Contexto adicional' },
            },
            required: ['image_data'],
          },
        },
      },
    ];

    // Usar todas as tools para modos assistant/conversational, apenas search para simples
    const toolsForAssistant = botMode === 'chat_completion' 
      ? [] // Modo simples não usa assistant
      : assistantTools;

    const assistantPayload = {
      name: `[uazapi] ${botName} - ${store.name}`,
      instructions: basePrompt,
      tools: toolsForAssistant.length > 0 ? toolsForAssistant : undefined,
      model: model,
    };

    try {
      if (openaiAssistantId) {
        // Atualizar Assistant existente
        console.log('[uazapi-bot-sync] 📝 Atualizando Assistant existente:', openaiAssistantId);
        const updateResp = await fetch(
          `https://api.openai.com/v1/assistants/${openaiAssistantId}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json',
              'OpenAI-Beta': 'assistants=v2',
            },
            body: JSON.stringify(assistantPayload),
          }
        );

        if (updateResp.ok) {
          const assistant = await updateResp.json();
          openaiAssistantId = assistant.id;
          console.log('[uazapi-bot-sync] ✅ Assistant atualizado:', openaiAssistantId);
          steps.push({ step: 'openai_assistant', status: 'success', message: 'OpenAI Assistant atualizado', details: `ID: ${openaiAssistantId?.slice(0, 15)}...` });
        } else {
          const errText = await updateResp.text();
          console.log('[uazapi-bot-sync] ⚠️ Update falhou, criando novo...', errText.slice(0, 200));
          openaiAssistantId = null;
        }
      }

      if (!openaiAssistantId) {
        // Criar novo Assistant
        console.log('[uazapi-bot-sync] 🆕 Criando novo OpenAI Assistant...');
        const createResp = await fetch('https://api.openai.com/v1/assistants', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2',
          },
          body: JSON.stringify(assistantPayload),
        });

        if (!createResp.ok) {
          const errorText = await createResp.text();
          console.error('[uazapi-bot-sync] ❌ Erro ao criar Assistant:', errorText);
          steps.push({ step: 'openai_assistant', status: 'error', message: 'Falha ao criar OpenAI Assistant', details: errorText.slice(0, 200) });
          return new Response(JSON.stringify({ success: false, error: 'Falha ao criar OpenAI Assistant', details: errorText.slice(0, 200), steps }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const assistant = await createResp.json();
        openaiAssistantId = assistant.id;
        console.log('[uazapi-bot-sync] ✅ Assistant criado:', openaiAssistantId);
        steps.push({ step: 'openai_assistant', status: 'success', message: '✅ OpenAI Assistant criado!', details: `ID: ${openaiAssistantId?.slice(0, 15)}...` });
      }
    } catch (assistantError) {
      console.error('[uazapi-bot-sync] ❌ Erro ao gerenciar Assistant:', assistantError);
      steps.push({ step: 'openai_assistant', status: 'error', message: 'Erro ao gerenciar OpenAI Assistant', details: String(assistantError).slice(0, 200) });
      return new Response(JSON.stringify({ success: false, error: 'Erro ao criar OpenAI Assistant', steps }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========================================
    // PASSO 2: Limpar agentes e triggers UaZapi existentes
    // ========================================
    console.log('[uazapi-bot-sync] 🧹 Limpando agentes existentes...');
    try {
      const agentListRes = await uazapiFetch(`${instanceApiUrl}/agent/list`, instanceToken);
      if (agentListRes.ok && Array.isArray(agentListRes.data)) {
        for (const agent of agentListRes.data) {
          if (agent.name && agent.name.includes('Mostralo')) {
            console.log(`[uazapi-bot-sync] 🗑️ Removendo agente: ${agent.name} (${agent.id})`);
            // Tentar DELETE method primeiro, fallback para POST
            const delRes = await uazapiFetch(`${instanceApiUrl}/agent/delete/${agent.id}`, instanceToken, {
              method: 'DELETE',
            });
            if (!delRes.ok && delRes.status === 405) {
              await uazapiFetch(`${instanceApiUrl}/agent/${agent.id}`, instanceToken, {
                method: 'DELETE',
              });
            }
          }
        }
      }

      const triggerListRes = await uazapiFetch(`${instanceApiUrl}/trigger/list`, instanceToken);
      if (triggerListRes.ok && Array.isArray(triggerListRes.data)) {
        for (const trigger of triggerListRes.data) {
          if (trigger.type === 'agent') {
            console.log(`[uazapi-bot-sync] 🗑️ Removendo trigger: ${trigger.id}`);
            const trigDelRes = await uazapiFetch(`${instanceApiUrl}/trigger/delete/${trigger.id}`, instanceToken, {
              method: 'DELETE',
            });
            if (!trigDelRes.ok && trigDelRes.status === 405) {
              await uazapiFetch(`${instanceApiUrl}/trigger/${trigger.id}`, instanceToken, {
                method: 'DELETE',
              });
            }
          }
        }
      }
      steps.push({ step: 'cleanup', status: 'success', message: 'Agentes/triggers anteriores removidos' });
    } catch (cleanupErr) {
      console.log('[uazapi-bot-sync] ⚠️ Erro na limpeza (não fatal):', cleanupErr);
      steps.push({ step: 'cleanup', status: 'warning', message: 'Erro na limpeza (não fatal)', details: String(cleanupErr).slice(0, 100) });
    }

    // ========================================
    // PASSO 3: Criar Agente na UaZapi (POST /agent/edit)
    // ========================================
    console.log('[uazapi-bot-sync] 🤖 Criando agente na UaZapi...');
    
    const agentPayload = {
      agent: {
        name: `Mostralo - ${botName} - ${store.name}`,
        provider: 'openai',
        model: model,
        apikey: openaiApiKey,
        basePrompt: basePrompt,
      },
    };

    console.log('[uazapi-bot-sync] 📤 Payload do agente:', JSON.stringify({
      name: agentPayload.agent.name,
      provider: agentPayload.agent.provider,
      model: agentPayload.agent.model,
      apikey: '****' + openaiApiKey.slice(-4),
      promptLength: basePrompt.length,
    }));

    const agentRes = await uazapiFetch(`${instanceApiUrl}/agent/edit`, instanceToken, {
      method: 'POST',
      body: JSON.stringify(agentPayload),
    });

    if (!agentRes.ok) {
      console.error('[uazapi-bot-sync] ❌ Erro ao criar agente:', JSON.stringify(agentRes.data));
      steps.push({ step: 'agent_create', status: 'error', message: 'Falha ao criar agente na UaZapi', details: JSON.stringify(agentRes.data).slice(0, 200) });
      return new Response(JSON.stringify({ success: false, error: 'Falha ao criar agente na UaZapi', steps }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const agentId = agentRes.data?.id || agentRes.data?.agent?.id || agentRes.data?.agent_id;
    console.log('[uazapi-bot-sync] ✅ Agente UaZapi criado! ID:', agentId);
    steps.push({ step: 'agent_create', status: 'success', message: '✅ Agente criado na UaZapi!', details: `ID: ${agentId}` });

    // ========================================
    // PASSO 4: Criar Funções UaZapi (Function Calling) - apenas para modos assistant/conversational
    // ========================================
    if (botMode === 'assistant' || botMode === 'conversational') {
      console.log('[uazapi-bot-sync] 🔧 Criando funções (function calling)...');
      
      const functions = buildUazapiFunctions(storeId, supabaseUrl);
      
      for (const func of functions) {
        const funcPayload = { function: func };
        console.log('[uazapi-bot-sync] 📤 Criando função:', func.name);
        
        const funcRes = await uazapiFetch(`${instanceApiUrl}/function/edit`, instanceToken, {
          method: 'POST',
          body: JSON.stringify(funcPayload),
        });

        if (funcRes.ok) {
          steps.push({ step: 'function_create', status: 'success', message: `Função "${func.name}" criada`, details: `ID: ${funcRes.data?.id || 'OK'}` });
        } else {
          steps.push({ step: 'function_create', status: 'warning', message: `Falha na função "${func.name}"`, details: JSON.stringify(funcRes.data).slice(0, 100) });
        }
      }
    }

    // ========================================
    // PASSO 4: Criar Trigger (POST /trigger/edit)
    // ========================================
    console.log('[uazapi-bot-sync] ⚡ Criando trigger...');

    const triggerPayload = {
      trigger: {
        active: true,
        type: 'agent',
        agent_id: agentId,
        wordsToStart: '',  // vazio = responder a qualquer mensagem
        priority: 1,
      },
    };

    const triggerRes = await uazapiFetch(`${instanceApiUrl}/trigger/edit`, instanceToken, {
      method: 'POST',
      body: JSON.stringify(triggerPayload),
    });

    if (triggerRes.ok) {
      const triggerId = triggerRes.data?.id || triggerRes.data?.trigger?.id || triggerRes.data?.trigger_id;
      steps.push({ step: 'trigger_create', status: 'success', message: '✅ Trigger ativado!', details: `ID: ${triggerId}` });
    } else {
      console.log('[uazapi-bot-sync] ⚠️ Falha no trigger:', JSON.stringify(triggerRes.data));
      steps.push({ step: 'trigger_create', status: 'warning', message: 'Trigger pode não ter sido criado', details: JSON.stringify(triggerRes.data).slice(0, 200) });
    }

    // ========================================
    // PASSO 5: Salvar configuração no banco
    // ========================================
    const botConfigData: Record<string, any> = {
      store_id: storeId,
      enabled: true,
      evolution_bot_status: 'active',
      bot_name: botName,
      stop_bot_from_me: requestBody.config?.stopBotFromMe ?? existingBotConfig?.stop_bot_from_me ?? true,
      listening_from_me: requestBody.config?.listeningFromMe ?? existingBotConfig?.listening_from_me ?? false,
      delay_message: requestBody.config?.delayMessage ?? existingBotConfig?.delay_message ?? 1000,
      expire_minutes: requestBody.config?.expireMinutes ?? existingBotConfig?.expire_minutes ?? 20,
      keyword_finish: requestBody.config?.keywordFinish ?? existingBotConfig?.keyword_finish ?? '#sair',
      unknown_message: requestBody.config?.unknownMessage ?? existingBotConfig?.unknown_message ?? '',
      keep_open: requestBody.config?.keepOpen ?? existingBotConfig?.keep_open ?? false,
      debounce_time: requestBody.config?.debounceTime ?? existingBotConfig?.debounce_time ?? 10,
      trigger_type: requestBody.config?.triggerType ?? existingBotConfig?.trigger_type ?? 'all',
      trigger_operator: requestBody.config?.triggerOperator ?? existingBotConfig?.trigger_operator ?? 'equals',
      trigger_value: requestBody.config?.triggerValue ?? existingBotConfig?.trigger_value ?? '',
      ignore_jids: requestBody.config?.ignoreJids ?? existingBotConfig?.ignore_jids ?? [],
      bot_split_messages: requestBody.config?.splitMessages ?? existingBotConfig?.bot_split_messages ?? true,
      bot_time_per_char: requestBody.config?.timePerChar ?? existingBotConfig?.bot_time_per_char ?? 50,
      updated_at: new Date().toISOString(),
      bot_mode: botMode,
      uazapi_assistant_id: agentId || null,
      openai_assistant_id: openaiAssistantId || null,
      whatsapp_provider: 'uazapi',
      custom_prompt_instructions: customInstructions || null,
      needs_sync: false,
      last_synced_at: new Date().toISOString(),
      last_sync_error: null,
    };

    if (existingBotConfig) {
      const { error: updateErr } = await supabaseClient.from('store_bot_config').update(botConfigData).eq('id', existingBotConfig.id);
      if (updateErr) {
        console.error('[uazapi-bot-sync] ❌ Erro ao salvar config:', updateErr);
        steps.push({ step: 'save_config', status: 'error', message: 'Erro ao salvar config', details: updateErr.message });
      } else {
        steps.push({ step: 'save_config', status: 'success', message: 'Configuração atualizada no banco' });
      }
    } else {
      const { error: insertErr } = await supabaseClient.from('store_bot_config').insert(botConfigData);
      if (insertErr) {
        console.error('[uazapi-bot-sync] ❌ Erro ao inserir config:', insertErr);
        steps.push({ step: 'save_config', status: 'error', message: 'Erro ao inserir config', details: insertErr.message });
      } else {
        steps.push({ step: 'save_config', status: 'success', message: 'Configuração criada no banco' });
      }
    }

    console.log('[uazapi-bot-sync] 🎉 Sincronização concluída com sucesso!');

    return new Response(JSON.stringify({
      success: true,
      message: 'Bot UaZapi sincronizado com sucesso!',
      agentId,
      steps,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[uazapi-bot-sync] ❌ Erro fatal:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    steps.push({ step: 'error', status: 'error', message });
    return new Response(JSON.stringify({ error: message, steps }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
