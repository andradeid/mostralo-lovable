// UaZapi Bot Sync - v12.0.0
// Cria/atualiza OpenAI Assistant com tools e salva openai_assistant_id
// O webhook gerencia o ciclo de vida completo (threads, runs, requires_action, tool_calls)
// NÃO cria agentes nativos na UaZapi — o webhook é o único handler
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
    professional: `Seja formal e objetivo. Use linguagem profissional e respeitosa. Vá direto ao ponto.`,
    friendly: `Seja acolhedor e simpático. Use linguagem amigável e calorosa.`,
    fun: `Seja descontraído e divertido. Use linguagem informal e leve.`,
    consultive: `Atue como consultor especialista. Faça perguntas para entender preferências.`
  };
  const emojiInstructions: Record<EmojiLevel, string> = {
    none: 'NÃO use emojis.',
    moderate: 'Use emojis com moderação (1-2 por mensagem).',
    abundant: 'Use bastante emojis! 🎉😊🔥✨'
  };
  const customGreetingNote = settings.customGreeting 
    ? `\nSaudação: "${settings.customGreeting}".`
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

function maskKey(key: string): string {
  if (!key || key.length < 8) return '****';
  return '****' + key.slice(-4);
}

// Helper para chamadas à UaZapi API
async function uazapiFetch(url: string, token: string, options: RequestInit = {}) {
  console.log(`[uazapi-bot-sync] 🌐 ${options.method || 'GET'} ${url}`);
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
  const safeLog = JSON.stringify(data).replace(/"apikey"\s*:\s*"[^"]+"/g, '"apikey":"****"');
  console.log(`[uazapi-bot-sync] 📡 ${response.status}:`, safeLog.substring(0, 500));
  return { ok: response.ok, status: response.status, data };
}

// ========================================
// GERAÇÃO DE PROMPT
// ========================================
function generatePrompt(
  botName: string, store: any, categories: any[],
  origin?: string, personalitySettings?: PersonalitySettings, deliveryZones?: any[],
  customInstructions?: string, includeProducts?: any[]
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

  let prompt = `Você é ${botName}, o assistente virtual inteligente da ${store.name || 'loja'}.

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

CATEGORIAS DISPONÍVEIS: ${categoryList || 'Não há categorias cadastradas'}

REGRAS IMPORTANTES:
- Sempre que o cliente citar um produto, você deve obrigatoriamente chamar a função 'search_products' ou 'check_stock' antes de dar qualquer resposta.
- NUNCA invente produtos ou diga que não tem algo sem antes consultar via search_products ou check_stock.
- Quando o produto tiver slug, monte o link: ${storeLink}/produto/{slug}
- SEMPRE inclua o link do produto quando disponível
- Se um produto não for encontrado, sugira alternativas usando get_recommendations
- Para cada produto mencionado, informe: nome, preço e link

RESTRIÇÕES:
- Responda SOMENTE sobre a loja, produtos, pedidos, entregas e pagamentos
- NUNCA mencione concorrentes
- Responda sempre em português brasileiro

FORMATAÇÃO (WhatsApp):
- Use *texto* para negrito
- NÃO use colchetes ou formato markdown de link`;

  // Modo simples: incluir catálogo no prompt
  if (includeProducts && includeProducts.length > 0) {
    prompt += `\n\nCATÁLOGO DE PRODUTOS:`;
    const categoryMap: Record<string, any[]> = {};
    for (const product of includeProducts.filter(p => p.is_available)) {
      const catName = categories.find(c => c.id === product.category_id)?.name || 'Outros';
      if (!categoryMap[catName]) categoryMap[catName] = [];
      categoryMap[catName].push(product);
    }
    let catalogText = '';
    for (const [catName, catProducts] of Object.entries(categoryMap)) {
      catalogText += `\n[${catName}]\n`;
      for (const p of catProducts) {
        let line = `• ${p.name} - R$${p.price?.toFixed(2)}`;
        if (p.description) {
          const desc = p.description.length > 40 ? p.description.substring(0, 37) + '...' : p.description;
          line += ` (${desc})`;
        }
        catalogText += line + '\n';
        if (catalogText.length > 200000) {
          catalogText += '\n[... catálogo truncado]\n';
          break;
        }
      }
      if (catalogText.length > 200000) break;
    }
    prompt += catalogText;
  }

  if (customInstructions) {
    prompt += `\n\nINSTRUÇÕES PERSONALIZADAS:\n${customInstructions}`;
  }

  const MAX_PROMPT_LENGTH = 250000;
  if (prompt.length > MAX_PROMPT_LENGTH) {
    prompt = prompt.substring(0, MAX_PROMPT_LENGTH) + '\n\n[... conteúdo truncado]';
  }

  return prompt;
}

// ========================================
// DEFINIÇÃO DE TOOLS PARA OPENAI ASSISTANT
// ========================================
function getAssistantTools() {
  return [
    {
      type: 'function',
      function: {
        name: 'search_products',
        description: 'Busca produtos no catálogo por nome ou termo. Use o nome completo do produto que o cliente mencionou. Se não encontrar resultados, tente com menos palavras ou termos alternativos. Limite padrão: 5 produtos.',
        strict: false,
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
        name: 'check_stock',
        description: 'Verifica se um produto específico está disponível em estoque e sua quantidade. Use quando perguntarem "tem?", "está disponível?", ou qualquer variação.',
        strict: false,
        parameters: {
          type: 'object',
          properties: {
            product_name: { type: 'string', description: 'Nome do produto para verificar' },
          },
          required: ['product_name'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_product_details',
        description: 'Obtém detalhes de um produto pelo slug.',
        strict: false,
        parameters: {
          type: 'object',
          properties: {
            slug: { type: 'string', description: 'Slug do produto' },
          },
          required: ['slug'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'list_categories',
        description: 'Lista todas as categorias de produtos disponíveis na loja. Use quando o cliente quiser saber o que a loja oferece ou pedir o cardápio.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_promotions',
        description: 'Lista produtos que estão em promoção com preço promocional.',
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
        name: 'get_recommendations',
        description: 'Recomenda produtos populares da loja baseado nos mais vendidos.',
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
        description: 'Obtém informações da loja como endereço, horário de funcionamento, taxa de entrega e pedido mínimo.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'check_store_status',
        description: 'Verifica se a loja está aberta ou fechada no momento.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_last_delivery_info',
        description: 'Busca o endereço e a taxa de entrega do último pedido do cliente pelo telefone.',
        strict: false,
        parameters: {
          type: 'object',
          properties: {
            customer_phone: { type: 'string', description: 'Telefone do cliente' },
          },
          required: ['customer_phone'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'calculate_delivery_fee',
        description: 'Calcula a taxa de entrega.',
        parameters: { type: 'object', properties: {} },
      },
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
    console.log('[uazapi-bot-sync] 🔄 v12.0.0 - OpenAI Assistant gerenciado pelo webhook');
    
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

    if (!storeId) {
      return new Response(JSON.stringify({ error: 'storeId é obrigatório', steps }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar dados em paralelo
    const [storeRes, instanceRes, botConfigRes, uazapiConfigRes, storeConfigRes] = await Promise.all([
      supabaseClient.from('stores').select('*, openai_api_key, niche_id').eq('id', storeId).single(),
      supabaseClient.from('whatsapp_instances').select('*').eq('store_id', storeId).eq('provider', 'uazapi').maybeSingle(),
      supabaseClient.from('store_bot_config').select('*').eq('store_id', storeId).maybeSingle(),
      supabaseClient.from('uazapi_config').select('api_url, admin_token').limit(1).maybeSingle(),
      supabaseClient.from('store_configurations').select('delivery_zones').eq('store_id', storeId).maybeSingle(),
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

    if (!instance || !instance.api_token) {
      steps.push({ step: 'instance_check', status: 'error', message: 'Instância UaZapi não encontrada ou sem token' });
      return new Response(JSON.stringify({ error: 'Instância UaZapi não configurada', steps }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    steps.push({ step: 'instance_check', status: 'success', message: 'Instância UaZapi OK', details: instance.instance_name });

    if (!uazapiConfig) {
      steps.push({ step: 'uazapi_config', status: 'error', message: 'Servidor UaZapi não configurado' });
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
      return new Response(JSON.stringify({ error: 'API Key OpenAI não configurada', steps }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    steps.push({ step: 'openai_key_check', status: 'success', message: `Chave OpenAI OK (${maskKey(openaiApiKey)})` });

    const instanceApiUrl = uazapiConfig.api_url.replace(/\/+$/, '');
    const instanceToken = instance.api_token;

    // ========================================
    // PASSO 0: LIMPAR AGENTES NATIVOS DA UAZAPI (para evitar conflitos)
    // ========================================
    console.log('[uazapi-bot-sync] 🧹 Limpando agentes nativos da UaZapi...');
    try {
      // Remover agentes nativos que podem interceptar mensagens
      const agentListRes = await uazapiFetch(`${instanceApiUrl}/agent/list`, instanceToken);
      if (agentListRes.ok && Array.isArray(agentListRes.data)) {
        for (const agent of agentListRes.data) {
          console.log(`[uazapi-bot-sync] 🗑️ Removendo agente nativo: ${agent.name || agent.id}`);
          await uazapiFetch(`${instanceApiUrl}/agent/edit`, instanceToken, {
            method: 'POST',
            body: JSON.stringify({ id: agent.id, delete: true }),
          });
        }
      }

      // Desabilitar chatbot nativo
      for (const method of ['PUT', 'POST']) {
        try {
          await uazapiFetch(`${instanceApiUrl}/chatbot/settings`, instanceToken, {
            method,
            body: JSON.stringify({ enabled: false }),
          });
        } catch {}
      }

      steps.push({ step: 'cleanup', status: 'success', message: 'Agentes nativos removidos' });
    } catch (cleanupErr) {
      console.log('[uazapi-bot-sync] ⚠️ Erro na limpeza (não fatal):', cleanupErr);
      steps.push({ step: 'cleanup', status: 'warning', message: 'Erro na limpeza (não fatal)' });
    }

    // ========================================
    // AÇÃO: DELETE
    // ========================================
    if (action === 'delete') {
      // Deletar OpenAI Assistant se existir
      if (existingBotConfig?.openai_assistant_id) {
        try {
          await fetch(`https://api.openai.com/v1/assistants/${existingBotConfig.openai_assistant_id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'OpenAI-Beta': 'assistants=v2',
            },
          });
          console.log(`[uazapi-bot-sync] 🗑️ OpenAI Assistant deletado: ${existingBotConfig.openai_assistant_id}`);
        } catch (e) {
          console.warn(`[uazapi-bot-sync] ⚠️ Erro ao deletar assistant:`, e);
        }
      }

      steps.push({ step: 'action_start', status: 'success', message: 'Bot removido' });
      await supabaseClient.from('store_bot_config').update({
        enabled: false,
        evolution_bot_status: 'paused',
        uazapi_assistant_id: null,
        openai_assistant_id: null,
        whatsapp_provider: 'uazapi',
        custom_prompt_instructions: null,
        updated_at: new Date().toISOString(),
      }).eq('store_id', storeId);

      return new Response(JSON.stringify({ success: true, message: 'Bot UaZapi removido!', steps }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========================================
    // AÇÃO: CREATE / UPDATE
    // ========================================
    steps.push({ step: 'action_start', status: 'success', message: 'Iniciando sincronização...' });

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
    const customInstructions = requestBody.config?.customInstructions || '';
    
    const personalitySettings: PersonalitySettings = {
      personality: (existingBotConfig?.personality || 'friendly') as PersonalityType,
      emojiLevel: (existingBotConfig?.emoji_level || 'moderate') as EmojiLevel,
      customGreeting: existingBotConfig?.custom_greeting || ''
    };

    const isV2 = botMode === 'assistant';

    // Gerar prompt (V2: sem catálogo, usa tools; simples: com catálogo)
    const fullPrompt = generatePrompt(
      botName, store, categories, origin,
      personalitySettings, deliveryZones, customInstructions,
      isV2 ? undefined : products
    );
    
    console.log(`[uazapi-bot-sync] 📝 Prompt gerado (${isV2 ? 'V2 com tools' : 'simples com catálogo'}): ${fullPrompt.length} chars`);
    steps.push({ step: 'prompt_generate', status: 'success', message: `Prompt gerado (${isV2 ? 'V2' : 'simples'})`, details: `${fullPrompt.length} chars` });

    // ========================================
    // CRIAR/ATUALIZAR OPENAI ASSISTANT (modo V2)
    // ========================================
    let openaiAssistantId: string | null = existingBotConfig?.openai_assistant_id || null;

    if (isV2) {
      console.log('[uazapi-bot-sync] 🤖 Criando/atualizando OpenAI Assistant...');
      
      const assistantTools = getAssistantTools();
      const assistantPayload = {
        name: `${botName} - ${store.name}`,
        instructions: fullPrompt,
        tools: assistantTools,
        model: 'gpt-4o-mini',
      };

      if (openaiAssistantId) {
        // Atualizar Assistant existente
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
          steps.push({ step: 'openai_assistant', status: 'success', message: 'OpenAI Assistant atualizado', details: `ID: ${openaiAssistantId?.slice(0, 16)}...` });
          console.log(`[uazapi-bot-sync] ✅ OpenAI Assistant atualizado: ${openaiAssistantId}`);
        } else {
          const errText = await updateResp.text();
          console.log(`[uazapi-bot-sync] ⚠️ Update falhou (${updateResp.status}), criando novo... Erro: ${errText.substring(0, 200)}`);
          openaiAssistantId = null;
        }
      }

      if (!openaiAssistantId) {
        // Criar novo Assistant
        const createResp = await fetch('https://api.openai.com/v1/assistants', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2',
          },
          body: JSON.stringify(assistantPayload),
        });

        if (createResp.ok) {
          const assistant = await createResp.json();
          openaiAssistantId = assistant.id;
          steps.push({ step: 'openai_assistant', status: 'success', message: 'OpenAI Assistant criado', details: `ID: ${openaiAssistantId?.slice(0, 16)}...` });
          console.log(`[uazapi-bot-sync] ✅ OpenAI Assistant criado: ${openaiAssistantId}`);
        } else {
          const errText = await createResp.text();
          console.error(`[uazapi-bot-sync] ❌ Erro ao criar assistant: ${errText.substring(0, 300)}`);
          steps.push({ step: 'openai_assistant', status: 'error', message: 'Erro ao criar OpenAI Assistant', details: errText.substring(0, 100) });
        }
      }

      // Limpar threads existentes para forçar novas conversas com novo prompt
      await supabaseClient
        .from('whatsapp_conversations')
        .update({ metadata: null })
        .eq('store_id', storeId);
      console.log(`[uazapi-bot-sync] 🧹 Threads limpas para forçar novo contexto`);
    }

    // ========================================
    // SALVAR CONFIG NO BANCO
    // ========================================
    const keywordFinish = requestBody.config?.keywordFinish ?? existingBotConfig?.keyword_finish ?? '#sair';

    const botConfigData: Record<string, any> = {
      store_id: storeId,
      enabled: true,
      evolution_bot_status: 'active',
      bot_name: botName,
      stop_bot_from_me: requestBody.config?.stopBotFromMe ?? existingBotConfig?.stop_bot_from_me ?? true,
      listening_from_me: requestBody.config?.listeningFromMe ?? existingBotConfig?.listening_from_me ?? false,
      delay_message: requestBody.config?.delayMessage ?? existingBotConfig?.delay_message ?? 1500,
      expire_minutes: requestBody.config?.expireMinutes ?? existingBotConfig?.expire_minutes ?? 20,
      keyword_finish: keywordFinish,
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
      openai_assistant_id: openaiAssistantId, // OpenAI Assistant ID para o webhook usar
      uazapi_assistant_id: null, // NÃO usar agente nativo
      whatsapp_provider: 'uazapi',
      custom_prompt_instructions: fullPrompt,
      needs_sync: false,
      last_synced_at: new Date().toISOString(),
      last_sync_error: null,
    };

    if (existingBotConfig) {
      const { error: updateErr } = await supabaseClient.from('store_bot_config').update(botConfigData).eq('id', existingBotConfig.id);
      if (updateErr) {
        steps.push({ step: 'save_config', status: 'error', message: 'Erro ao salvar config', details: updateErr.message });
      } else {
        steps.push({ step: 'save_config', status: 'success', message: 'Config salva no banco' });
      }
    } else {
      const { error: insertErr } = await supabaseClient.from('store_bot_config').insert(botConfigData);
      if (insertErr) {
        steps.push({ step: 'save_config', status: 'error', message: 'Erro ao inserir config', details: insertErr.message });
      } else {
        steps.push({ step: 'save_config', status: 'success', message: 'Config criada no banco' });
      }
    }

    console.log('[uazapi-bot-sync] 🎉 Sincronização concluída!');

    return new Response(JSON.stringify({
      success: true,
      message: `Bot "${botName}" sincronizado! OpenAI Assistant ${openaiAssistantId ? 'configurado' : 'modo simples'}.`,
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
