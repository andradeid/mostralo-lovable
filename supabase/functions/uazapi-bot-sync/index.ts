// UaZapi Bot Sync - v4.0.0
// Usa o sistema de Agentes nativo da UaZapi (provider: openai)
// NÃO cria OpenAI Assistants separados - a UaZapi gerencia a IA internamente
// Catálogo de produtos é enviado via /knowledge/edit para não estourar o prompt
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

// Helper para chamadas à UaZapi API com safe JSON parse
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
  console.log(`[uazapi-bot-sync] 📡 ${response.status}:`, JSON.stringify(data).substring(0, 500));
  return { ok: response.ok, status: response.status, data };
}

// ========================================
// GERAÇÃO DE PROMPT BASE (SEM catálogo - vai via /knowledge/edit)
// ========================================
function generateBasePrompt(
  botName: string, store: any, categories: any[],
  origin?: string, personalitySettings?: PersonalitySettings, deliveryZones?: any[],
  customInstructions?: string
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

IMPORTANTE: Você tem acesso à base de conhecimento com o catálogo completo de produtos da loja. Use essa base para responder sobre produtos, preços e disponibilidade.

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
// GERAR CONTEÚDO DO CATÁLOGO PARA KNOWLEDGE
// ========================================
function generateCatalogContent(
  store: any, products: any[], categories: any[], origin?: string
): string {
  const baseUrl = getStoreBaseUrl(store, origin);
  const storeLink = `${baseUrl}/loja/${store.slug}`;

  const categoryMap: Record<string, any[]> = {};
  for (const product of products.filter(p => p.is_available)) {
    const catName = categories.find(c => c.id === product.category_id)?.name || 'Outros';
    if (!categoryMap[catName]) categoryMap[catName] = [];
    categoryMap[catName].push(product);
  }

  let content = `CATÁLOGO DE PRODUTOS - ${store.name}\n\n`;

  for (const [catName, catProducts] of Object.entries(categoryMap)) {
    content += `== ${catName} ==\n`;
    for (const p of catProducts) {
      const productLink = p.slug ? `${storeLink}/produto/${p.slug}` : storeLink;
      content += `- ${p.name}: R$ ${p.price?.toFixed(2)}`;
      if (p.description) content += ` | ${p.description}`;
      content += ` | Link: ${productLink}\n`;
    }
    content += '\n';
  }

  return content;
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
    console.log('[uazapi-bot-sync] 🔄 v4.0.0 - Requisição recebida');
    
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
    steps.push({ step: 'openai_key_check', status: 'success', message: 'Chave OpenAI OK' });

    const instanceApiUrl = uazapiConfig.api_url.replace(/\/+$/, '');
    const instanceToken = instance.api_token;

    // ========================================
    // PASSO 0: LIMPAR agentes antigos (evitar duplicatas)
    // ========================================
    console.log('[uazapi-bot-sync] 🧹 Limpando agentes antigos...');
    try {
      const agentListRes = await uazapiFetch(`${instanceApiUrl}/agent/list`, instanceToken);
      if (agentListRes.ok && Array.isArray(agentListRes.data)) {
        for (const agent of agentListRes.data) {
          console.log(`[uazapi-bot-sync] 🗑️ Removendo agente: ${agent.name} (${agent.id})`);
          // Usar /agent/edit com delete: true para remover
          await uazapiFetch(`${instanceApiUrl}/agent/edit`, instanceToken, {
            method: 'POST',
            body: JSON.stringify({ id: agent.id, delete: true }),
          });
        }
        if (agentListRes.data.length > 0) {
          steps.push({ step: 'cleanup_agents', status: 'success', message: `${agentListRes.data.length} agente(s) removido(s)` });
        }
      }
      steps.push({ step: 'cleanup', status: 'success', message: 'Limpeza concluída' });
    } catch (cleanupErr) {
      console.log('[uazapi-bot-sync] ⚠️ Erro na limpeza (não fatal):', cleanupErr);
      steps.push({ step: 'cleanup', status: 'warning', message: 'Erro na limpeza (não fatal)' });
    }

    // ========================================
    // AÇÃO: DELETE
    // ========================================
    if (action === 'delete') {
      steps.push({ step: 'action_start', status: 'success', message: 'Bot removido' });
      await supabaseClient.from('store_bot_config').update({
        enabled: false,
        evolution_bot_status: 'paused',
        uazapi_assistant_id: null,
        whatsapp_provider: 'uazapi',
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
    const customInstructions = requestBody.config?.customPromptInstructions || existingBotConfig?.custom_prompt_instructions || '';
    
    const personalitySettings: PersonalitySettings = {
      personality: (existingBotConfig?.personality || 'friendly') as PersonalityType,
      emojiLevel: (existingBotConfig?.emoji_level || 'moderate') as EmojiLevel,
      customGreeting: existingBotConfig?.custom_greeting || ''
    };

    // Gerar prompt BASE (sem catálogo - vai via knowledge)
    const basePrompt = generateBasePrompt(
      botName, store, categories, origin,
      personalitySettings, deliveryZones, customInstructions
    );
    console.log(`[uazapi-bot-sync] 📝 Prompt gerado: ${basePrompt.length} chars`);
    steps.push({ step: 'prompt_generate', status: 'success', message: 'Prompt gerado', details: `${basePrompt.length} caracteres` });

    const model = 'gpt-4o-mini';

    // ========================================
    // PASSO 1: Criar Agente na UaZapi via /agent/edit
    // A UaZapi gerencia a conexão com OpenAI internamente
    // ========================================
    console.log('[uazapi-bot-sync] 🤖 Criando agente na UaZapi...');

    const agentPayload = {
      id: "",
      delete: false,
      agent: {
        name: botName,
        provider: 'openai',
        apikey: openaiApiKey,
        basePrompt: basePrompt,
        model: model,
        maxTokens: 2000,
        temperature: 50,
        diversityLevel: 50,
        frequencyPenalty: 30,
        presencePenalty: 30,
        signMessages: false,
        readMessages: true,
        maxMessageLength: 500,
        typingDelay_seconds: 3,
        contextTimeWindow_hours: 24,
        contextMaxMessages: 50,
        contextMinMessages: 3,
      },
    };

    console.log('[uazapi-bot-sync] 📤 Agent payload (sem apikey):', JSON.stringify({
      ...agentPayload,
      agent: { ...agentPayload.agent, apikey: '****' + openaiApiKey.slice(-4), basePrompt: `[${basePrompt.length} chars]` },
    }));

    const agentRes = await uazapiFetch(`${instanceApiUrl}/agent/edit`, instanceToken, {
      method: 'POST',
      body: JSON.stringify(agentPayload),
    });

    let uazapiAgentId: string | null = null;

    if (agentRes.ok && agentRes.data?.id) {
      uazapiAgentId = agentRes.data.id;
      console.log('[uazapi-bot-sync] ✅ Agente criado:', uazapiAgentId);
      steps.push({ step: 'uazapi_agent', status: 'success', message: '✅ Agente UaZapi criado!', details: `ID: ${uazapiAgentId}` });
    } else {
      console.error('[uazapi-bot-sync] ❌ Falha ao criar agente:', JSON.stringify(agentRes.data));
      steps.push({ step: 'uazapi_agent', status: 'error', message: 'Falha ao criar agente', details: JSON.stringify(agentRes.data).slice(0, 200) });
      return new Response(JSON.stringify({ success: false, error: 'Falha ao criar agente UaZapi', details: agentRes.data, steps }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========================================
    // PASSO 2: Enviar catálogo via /knowledge/edit
    // ========================================
    console.log('[uazapi-bot-sync] 📚 Enviando catálogo via /knowledge/edit...');
    
    try {
      // Primeiro, listar knowledge existente para limpar
      const knowledgeListRes = await uazapiFetch(`${instanceApiUrl}/knowledge/list`, instanceToken);
      if (knowledgeListRes.ok && Array.isArray(knowledgeListRes.data)) {
        for (const kb of knowledgeListRes.data) {
          if (kb.tittle?.includes('Catálogo') || kb.tittle?.includes('Catalogo')) {
            console.log(`[uazapi-bot-sync] 🗑️ Removendo knowledge antigo: ${kb.id}`);
            await uazapiFetch(`${instanceApiUrl}/knowledge/edit`, instanceToken, {
              method: 'POST',
              body: JSON.stringify({ id: kb.id, delete: true }),
            });
          }
        }
      }

      // Criar novo knowledge com o catálogo
      const catalogContent = generateCatalogContent(store, products, categories, origin);
      console.log(`[uazapi-bot-sync] 📚 Catálogo: ${catalogContent.length} chars, ${products.length} produtos`);

      const knowledgePayload = {
        id: "",
        delete: false,
        knowledge: {
          active: true,
          tittle: `Catálogo ${store.name}`,
          content: catalogContent,
        },
      };

      const knowledgeRes = await uazapiFetch(`${instanceApiUrl}/knowledge/edit`, instanceToken, {
        method: 'POST',
        body: JSON.stringify(knowledgePayload),
      });

      if (knowledgeRes.ok) {
        console.log('[uazapi-bot-sync] ✅ Catálogo enviado como knowledge');
        steps.push({ step: 'knowledge_catalog', status: 'success', message: '✅ Catálogo enviado!', details: `${products.length} produtos, ${catalogContent.length} chars` });
      } else {
        console.log('[uazapi-bot-sync] ⚠️ Falha ao enviar catálogo:', JSON.stringify(knowledgeRes.data));
        steps.push({ step: 'knowledge_catalog', status: 'warning', message: 'Falha ao enviar catálogo como knowledge', details: JSON.stringify(knowledgeRes.data).slice(0, 200) });
      }
    } catch (knowledgeErr) {
      console.log('[uazapi-bot-sync] ⚠️ Erro no knowledge (não fatal):', knowledgeErr);
      steps.push({ step: 'knowledge_catalog', status: 'warning', message: 'Erro ao enviar catálogo (não fatal)' });
    }

    // ========================================
    // PASSO 3: Ativar chatbot na instância
    // Tentar múltiplos endpoints para compatibilidade
    // ========================================
    console.log('[uazapi-bot-sync] 🔗 Ativando chatbot na instância...');

    const keywordFinish = requestBody.config?.keywordFinish ?? existingBotConfig?.keyword_finish ?? '#sair';
    const pauseKeywords = typeof keywordFinish === 'string' 
      ? keywordFinish.split(',').map((k: string) => k.trim()).filter(Boolean)
      : ['#sair'];

    const chatbotPayload = {
      enabled: true,
      agent_id: uazapiAgentId,
      readchat: true,
      readmessages: true,
      typing: true,
      delay: requestBody.config?.delayMessage ?? existingBotConfig?.delay_message ?? 3000,
      splitMessages: true,
      pauseOnKeyword: pauseKeywords,
      cooldown: 60,
    };

    // Tentar diferentes endpoints para ativar o chatbot
    const chatbotEndpoints = [
      '/chatbot/edit',
      '/chatbot/settings',
      '/instance/chatbot',
    ];

    let chatbotActivated = false;
    for (const endpoint of chatbotEndpoints) {
      console.log(`[uazapi-bot-sync] 🔗 Tentando ${endpoint}...`);
      const chatbotRes = await uazapiFetch(`${instanceApiUrl}${endpoint}`, instanceToken, {
        method: 'POST',
        body: JSON.stringify(chatbotPayload),
      });

      if (chatbotRes.ok || (chatbotRes.status >= 200 && chatbotRes.status < 300)) {
        console.log(`[uazapi-bot-sync] ✅ Chatbot ativado via ${endpoint}!`);
        steps.push({ step: 'chatbot_activate', status: 'success', message: `✅ Chatbot ativado via ${endpoint}`, details: `agent_id: ${uazapiAgentId}` });
        chatbotActivated = true;
        break;
      } else {
        console.log(`[uazapi-bot-sync] ⚠️ ${endpoint} → ${chatbotRes.status}: ${JSON.stringify(chatbotRes.data).slice(0, 100)}`);
      }
    }

    if (!chatbotActivated) {
      // Se nenhum endpoint funcionou, o agente já pode estar ativo (readMessages: true no agent config)
      console.log('[uazapi-bot-sync] ⚠️ Nenhum endpoint de chatbot funcionou. Agente criado com readMessages:true, pode já estar ativo.');
      steps.push({ step: 'chatbot_activate', status: 'warning', message: 'Agente criado com readMessages:true (auto-ativação)', details: 'Nenhum endpoint /chatbot/* respondeu' });
    }

    // ========================================
    // PASSO 4: Salvar configuração no banco
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
      uazapi_assistant_id: uazapiAgentId || null,
      openai_assistant_id: existingBotConfig?.openai_assistant_id || null,
      whatsapp_provider: 'uazapi',
      custom_prompt_instructions: customInstructions || null,
      needs_sync: false,
      last_synced_at: new Date().toISOString(),
      last_sync_error: null,
    };

    if (existingBotConfig) {
      const { error: updateErr } = await supabaseClient.from('store_bot_config').update(botConfigData).eq('id', existingBotConfig.id);
      if (updateErr) {
        steps.push({ step: 'save_config', status: 'error', message: 'Erro ao salvar config', details: updateErr.message });
      } else {
        steps.push({ step: 'save_config', status: 'success', message: 'Configuração atualizada no banco' });
      }
    } else {
      const { error: insertErr } = await supabaseClient.from('store_bot_config').insert(botConfigData);
      if (insertErr) {
        steps.push({ step: 'save_config', status: 'error', message: 'Erro ao inserir config', details: insertErr.message });
      } else {
        steps.push({ step: 'save_config', status: 'success', message: 'Configuração criada no banco' });
      }
    }

    console.log('[uazapi-bot-sync] 🎉 Sincronização concluída!');

    return new Response(JSON.stringify({
      success: true,
      message: 'Bot sincronizado! Agente UaZapi criado com sucesso.',
      uazapiAgentId,
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
