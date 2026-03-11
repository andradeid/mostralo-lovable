// UaZapi Bot Sync - v1.0.0
// Cria/atualiza OpenAI Assistants para lojas que usam UaZapi como provedor WhatsApp
// Espelho do openai-bot-sync mas SEM dependência da Evolution API
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type BotModeType = 'chat_completion' | 'assistant' | 'conversational';

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
  botMode?: BotModeType;
  customPromptInstructions?: string;
}

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
// UTILITÁRIOS (espelhados do openai-bot-sync)
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
    professional: `ESTILO DE COMUNICAÇÃO - PROFISSIONAL:
- Seja formal e objetivo
- Use linguagem profissional e respeitosa
- Vá direto ao ponto nas respostas
- Mantenha tom corporativo
- Trate o cliente sempre por "senhor(a)" ou "você"
- Evite gírias ou expressões informais`,
    friendly: `ESTILO DE COMUNICAÇÃO - AMIGÁVEL:
- Seja acolhedor e simpático
- Use linguagem amigável e calorosa
- Demonstre interesse genuíno pelo cliente
- Faça o cliente se sentir especial
- Use expressões como "que bom ter você aqui!"
- Seja prestativo e atencioso`,
    fun: `ESTILO DE COMUNICAÇÃO - DIVERTIDO:
- Seja descontraído e divertido
- Use linguagem informal e leve
- Faça brincadeiras quando apropriado
- Use expressões populares e gírias brasileiras
- Transmita energia positiva e animação
- Seja criativo e espontâneo nas respostas`,
    consultive: `ESTILO DE COMUNICAÇÃO - CONSULTIVO:
- Atue como um consultor especialista
- Faça perguntas para entender as preferências
- Sugira produtos baseado no perfil do cliente
- Explique benefícios e diferenciais
- Guie o cliente na melhor escolha
- Demonstre conhecimento profundo dos produtos`
  };

  const emojiInstructions: Record<EmojiLevel, string> = {
    none: 'USO DE EMOJIS: NÃO use emojis nas respostas. Mantenha texto limpo e profissional.',
    moderate: 'USO DE EMOJIS: Use emojis com moderação (1-2 por mensagem para dar tom amigável).',
    abundant: 'USO DE EMOJIS: Use bastante emojis para deixar a conversa animada e expressiva! 🎉😊🍕🔥✨'
  };

  const customGreetingNote = settings.customGreeting 
    ? `\nSAUDAÇÃO PERSONALIZADA: Use "${settings.customGreeting}" como saudação inicial quando o cliente mandar a primeira mensagem.`
    : '';

  return `${personalities[settings.personality]}

${emojiInstructions[settings.emojiLevel]}${customGreetingNote}`;
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
  if (store.accepts_pix !== false) methods.push('✅ PIX');
  if (store.accepts_card !== false) methods.push('✅ Cartão');
  if (store.accepts_cash !== false) methods.push('✅ Dinheiro');
  return methods.length === 0 ? '- Consulte a loja sobre formas de pagamento' : methods.join('\n');
}

function formatDeliveryZones(zones: any[]): string {
  if (!zones || zones.length === 0) return '';
  const activeZones = zones.filter((z: any) => z.isActive !== false);
  if (activeZones.length === 0) return '';
  const lines = activeZones.map((zone: any) => {
    let line = `- ${zone.name}: R$ ${Number(zone.deliveryFee).toFixed(2)}`;
    if (zone.timeFees && zone.timeFees.length > 0) {
      const timeParts = zone.timeFees.map((tf: any) => 
        `  → ${tf.label || 'Horário especial'} (${tf.startTime}-${tf.endTime}): R$ ${Number(tf.fee).toFixed(2)}`
      );
      line += '\n' + timeParts.join('\n');
    }
    return line;
  });
  return lines.join('\n');
}

function getStoreBaseUrl(store: any, origin?: string): string {
  if (store.custom_domain && store.custom_domain_verified) {
    return `https://${store.custom_domain}`;
  }
  if (origin) {
    const devDomains = ['localhost', 'lovable.app', 'lovable.dev', 'gptengineer.run', 'webcontainer.io', 'stackblitz.io', 'codesandbox.io'];
    if (!devDomains.some(d => origin.includes(d))) {
      return origin.replace(/\/$/, '');
    }
  }
  return 'https://mostralo.com.br';
}

function buildNicheRulesText(nicheConfig: any, nicheRules: any[]): string {
  if (!nicheConfig && nicheRules.length === 0) return '';
  const sections: string[] = [];
  if (nicheConfig?.max_products_per_response) {
    sections.push(`LIMITE DE PRODUTOS POR RESPOSTA: Ao mostrar produtos, exiba no MÁXIMO ${nicheConfig.max_products_per_response} opções por mensagem.`);
  }
  if (nicheConfig?.prompt_base) {
    const promptBase = nicheConfig.prompt_base
      .replace(/\{\{store_name\}\}/g, '{{STORE_NAME}}')
      .replace(/\{\{bot_name\}\}/g, '{{BOT_NAME}}');
    sections.push(`INSTRUÇÕES ESPECÍFICAS DO NICHO:\n${promptBase}`);
  }
  if (nicheConfig?.restrictions) {
    sections.push(`RESTRIÇÕES DO NICHO:\n${nicheConfig.restrictions}`);
  }
  if (nicheRules.length > 0) {
    const rulesText = nicheRules.map((rule, i) => {
      return `${i + 1}. *${rule.name}* (${rule.rule_type})\n   Gatilho: ${rule.trigger_condition}\n   ${rule.action_prompt}`;
    }).join('\n\n');
    sections.push(`REGRAS DE COMPORTAMENTO DO NICHO:\n${rulesText}`);
  }
  return sections.length > 0 ? `\n\n${'='.repeat(40)}\nCONFIGURAÇÕES INTELIGENTES DO NICHO\n${'='.repeat(40)}\n${sections.join('\n\n')}` : '';
}

// ========================================
// GERADORES DE PROMPT (espelhados)
// ========================================

function generateSystemPrompt(
  botName: string, store: any, products: any[], categories: any[], 
  origin?: string, personalitySettings?: PersonalitySettings, deliveryZones?: any[]
): string {
  const baseUrl = getStoreBaseUrl(store, origin);
  const storeLink = `${baseUrl}/loja/${store.slug}`;
  const productList = products.filter(p => p.is_available).map(p => {
    const productLink = p.slug ? `${storeLink}/produto/${p.slug}` : storeLink;
    return `- ${p.name}: R$ ${p.price?.toFixed(2)}\n    Descrição: ${p.description || 'Sem descrição'}\n    📎 Ver produto: ${productLink}`;
  }).join('\n\n');
  const categoryList = categories.filter(c => c.is_active).map(c => c.name).join(', ');
  const locationSection = store.google_maps_link 
    ? `\nLOCALIZAÇÃO:\n- Endereço: ${store.address || 'Não informado'}\n- 📍 Link do Google Maps: ${store.google_maps_link}` : '';
  const paymentSection = `\nFORMAS DE PAGAMENTO:\n${formatPaymentMethods(store)}`;
  const zonesText = formatDeliveryZones(deliveryZones || []);
  const deliverySection = `\nDELIVERY:${zonesText 
    ? `\nÁREAS DE ENTREGA:\n${zonesText}` 
    : `\n- Taxa de entrega: ${store.delivery_fee ? `R$ ${store.delivery_fee.toFixed(2)}` : 'Consulte na loja'}`}
- Pedido mínimo: ${store.min_order_value ? `R$ ${store.min_order_value.toFixed(2)}` : 'Sem valor mínimo'}`;
  const hoursSection = `\nHORÁRIO DE FUNCIONAMENTO:\n${formatBusinessHours(store.business_hours)}`;
  const defaultPersonality: PersonalitySettings = { personality: 'friendly', emojiLevel: 'moderate', customGreeting: '' };
  const personalityInstructions = generatePersonalityInstructions(personalitySettings || defaultPersonality);

  return `Você é ${botName}, o assistente virtual da ${store.name || 'loja'} (via UaZapi).

Quando o cliente perguntar seu nome, responda: "Meu nome é ${botName}!"

PERSONALIZAÇÃO COM NOME DO CLIENTE:
- Use o pushName quando disponível e for um nome real
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
${locationSection}
${paymentSection}
${deliverySection}
${hoursSection}

CATEGORIAS: ${categoryList || 'Não há categorias cadastradas'}

PRODUTOS:
${productList || 'Não há produtos cadastrados'}

RESTRIÇÕES:
- Responda SOMENTE sobre a loja, produtos, pedidos, entregas e pagamentos
- NUNCA mencione concorrentes
- Responda sempre em português brasileiro

INSTRUÇÕES:
1. Apresente produtos quando perguntado
2. Informe preços corretamente
3. SEMPRE inclua o link do produto
4. Direcione para a loja: ${storeLink}
5. Não invente produtos ou preços`;
}

function generateAssistantModePrompt(
  botName: string, store: any, storeLink: string, navigationLink: string,
  personalitySettings: PersonalitySettings, customInstructions?: string, deliveryZones?: any[]
): string {
  const personalityInstructions = generatePersonalityInstructions(personalitySettings);
  const locationSection = navigationLink 
    ? `\nLOCALIZAÇÃO:\n- Endereço: ${store.address || 'Não informado'}\n- 📍 Link: ${navigationLink}` 
    : (store.google_maps_link ? `\nLOCALIZAÇÃO:\n- 📍 ${store.google_maps_link}` : '');
  const paymentSection = `\nFORMAS DE PAGAMENTO:\n${formatPaymentMethods(store)}`;
  const zonesText = formatDeliveryZones(deliveryZones || []);
  const deliverySection = `\nDELIVERY:${zonesText 
    ? `\nÁREAS DE ENTREGA:\n${zonesText}` 
    : `\n- Taxa: ${store.delivery_fee ? `R$ ${store.delivery_fee.toFixed(2)}` : 'Consulte na loja'}`}
- Pedido mínimo: ${store.min_order_value ? `R$ ${store.min_order_value.toFixed(2)}` : 'Sem valor mínimo'}`;
  const hoursSection = `\nHORÁRIO:\n${formatBusinessHours(store.business_hours)}`;

  return `Você é ${botName}, assistente virtual da ${store.name || 'loja'} (via UaZapi).

Quando o cliente perguntar seu nome, responda: "Meu nome é ${botName}!"

PERSONALIZAÇÃO COM NOME DO CLIENTE:
- Use o pushName quando disponível e for um nome real
- Se NÃO estiver disponível, trate por "você"
- NUNCA escreva literalmente "[Nome]"

SAUDAÇÃO NA PRIMEIRA MENSAGEM:
- Use "Oi! 😊" ou "Olá! 👋" (adicione o nome APENAS se souber)

${personalityInstructions}

CAPACIDADES (use as funções disponíveis):
- Buscar produtos: search_products("termo")
- Verificar estoque: check_stock("nome produto")
- Ver detalhes: get_product_details("slug")
- Listar categorias: list_categories()
- Mostrar promoções: get_promotions()
- Recomendar produtos: get_recommendations()
- Verificar se está aberto: check_store_status()

REGRAS CRÍTICAS:
1. SEMPRE use search_products antes de falar sobre produtos
2. NÃO invente produtos - só use dados retornados pelas funções
3. SEMPRE inclua o LINK do produto nas respostas

FORMATAÇÃO (WhatsApp):
- Use asterisco simples *texto* para negrito
- NÃO use colchetes ou formato markdown de link
- Emoji 👉 antes do link

${customInstructions ? `INSTRUÇÕES PERSONALIZADAS:\n${customInstructions}\n` : ''}
INFORMAÇÕES DA LOJA:
- Nome: ${store.name || 'Loja'}
- Link: ${storeLink}
${locationSection}
${paymentSection}
${deliverySection}
${hoursSection}

RESTRIÇÕES:
- Responda SOMENTE sobre a loja
- NUNCA mencione concorrentes
- Português brasileiro sempre`;
}

function generateConversationalModePrompt(
  botName: string, store: any, personalitySettings: PersonalitySettings,
  deliveryZones: any[], conversationalSettings: any, orderQuestions: any[],
  nicheRuleTypes?: string[], enabledTools?: string[]
): string {
  const hasDeliveryCalc = !enabledTools || enabledTools.includes('calculate_delivery_fee');
  const nicheCoversGenerics = nicheRuleTypes?.some(t => t === 'generic_suggestion' || t === 'behavior') || false;
  const nicheCoversPreSearch = nicheRuleTypes?.some(t => t === 'pre_search' || t === 'behavior') || false;
  const personalityInstructions = generatePersonalityInstructions(personalitySettings);
  const paymentSection = `\nFORMAS DE PAGAMENTO:\n${formatPaymentMethods(store)}`;
  const zonesText = formatDeliveryZones(deliveryZones || []);
  const deliverySection = `\nDELIVERY:${zonesText 
    ? `\nÁREAS DE ENTREGA:\n${zonesText}` 
    : `\n- Taxa: ${store.delivery_fee ? `R$ ${store.delivery_fee.toFixed(2)}` : 'Consulte na loja'}`}
- Pedido mínimo: ${store.min_order_value ? `R$ ${store.min_order_value.toFixed(2)}` : 'Sem valor mínimo'}`;
  const hoursSection = `\nHORÁRIO:\n${formatBusinessHours(store.business_hours)}`;

  const enabledQuestions = (orderQuestions || []).filter((q: any) => q.enabled).sort((a: any, b: any) => a.sort_order - b.sort_order);
  const questionsText = enabledQuestions.length > 0
    ? enabledQuestions.map((q: any, i: number) => {
        const required = q.is_required ? '(OBRIGATÓRIA)' : '(opcional)';
        let typeHint = '';
        if (q.question_type === 'location') typeHint = ' → Peça localização pelo WhatsApp';
        else if (q.question_type === 'payment') typeHint = ' → Ofereça opções de pagamento';
        else if (q.question_type === 'address' || q.question_text?.toLowerCase().includes('endereço'))
          typeHint = ' → ⚠️ ANTES chame get_last_delivery_info(customer_phone)';
        return `${i + 1}. "${q.question_text}" ${required}${typeHint}`;
      }).join('\n')
    : `1. "Confirmar nome do cliente" (OBRIGATÓRIA)
2. "Qual o seu endereço de entrega?" (OBRIGATÓRIA)
3. "Me envie sua localização 📍" (OBRIGATÓRIA)
4. "Deseja mais alguma coisa?" (opcional)
5. "Qual forma de pagamento?" (OBRIGATÓRIA)
6. "Vai precisar de troco?" (opcional)`;

  const recommendGenerics = conversationalSettings?.recommend_generics !== false;
  const neverSendLinks = conversationalSettings?.never_send_links !== false;
  const sendPhotos = conversationalSettings?.send_product_photos !== false;
  const informalTone = conversationalSettings?.informal_tone !== false;
  const closingMessage = conversationalSettings?.closing_message || 'Obrigada! Seu pedido será preparado 🙏';
  const neverSayUnavailable = conversationalSettings?.never_say_unavailable !== false;

  return `Você é ${botName}, assistente virtual da ${store.name || 'loja'} (via UaZapi).

Quando o cliente perguntar seu nome, responda: "Meu nome é ${botName}!"

PERSONALIZAÇÃO COM NOME DO CLIENTE:
- Use o pushName quando disponível e for um nome real
- Se NÃO estiver disponível, trate por "você"
- NUNCA escreva literalmente "[Nome]"

SAUDAÇÃO BASEADA NO HORÁRIO (Fuso: ${getTimezoneDescription(store.timezone)}):
- 05:00 às 11:59 → "Bom dia! ☀️"
- 12:00 às 17:59 → "Boa tarde! 🌤️"
- 18:00 às 23:59 → "Boa noite! 🌙"

${personalityInstructions}

${informalTone ? `TOM: Seja informal, acolhedor e próximo do cliente.` : ''}

⚠️ PROIBIÇÕES:
${neverSendLinks ? '- NUNCA envie links de produtos ou URLs' : '- Envie links apenas quando solicitado'}
- NUNCA mencione concorrentes
- NUNCA invente produtos ou preços

${sendPhotos ? `FOTOS: São enviadas AUTOMATICAMENTE ao usar search_products. NÃO mencione que vai enviar foto.` : ''}

${(recommendGenerics && !nicheCoversGenerics) ? `GENÉRICOS: Sempre sugira versão genérica quando disponível.` : ''}

${neverSayUnavailable ? `PRODUTO NÃO ENCONTRADO: NUNCA diga "não temos". Use frases como "Vou verificar no estoque, um momento!" ou "Posso encomendar pra você!"` : ''}

CAPACIDADES:
- search_products("termo"), check_stock("nome"), get_product_details("slug")
- list_categories(), get_promotions(), get_recommendations(), check_store_status()
${hasDeliveryCalc ? '- calculate_delivery_fee(latitude, longitude)' : '- ⚠️ NÃO calcule taxa de entrega — colete dados e passe para atendente'}

COMPORTAMENTO PROATIVO:
- Quando cliente perguntar "tem X?", confirme com entusiasmo e já descreva com preço
- Pergunte: "Posso adicionar no seu pedido?"

${!nicheCoversPreSearch ? `CATEGORIA GENÉRICA: Se cliente pedir algo amplo, pergunte especificação antes de buscar.` : ''}

FLUXO DE ATENDIMENTO:
1. Saudação personalizada
2. Perguntar o que precisa
3. Buscar produtos e informar preço
4. SEMPRE pergunte "Deseja mais alguma coisa?"
5. Quando não quer mais → inicie FECHAMENTO

PERGUNTAS DE FECHAMENTO (UMA POR VEZ):
${questionsText}

⚠️ REGRA: Faça APENAS UMA pergunta por vez! Aguarde resposta.

CONTROLE DE CARRINHO:
- Registre mentalmente cada produto: nome, quantidade, preço
- Só feche quando cliente confirmar que não quer mais

RESUMO FINAL (após coletar TODAS as informações):
*📋 Resumo do seu pedido:*
1. Produto x1 — R$ XX,XX
*Subtotal:* R$ XX,XX
${hasDeliveryCalc ? '*Taxa de entrega:* R$ XX,XX\n*Total:* R$ XX,XX' : '⚠️ _Taxa de entrega será calculada pelo atendente_'}
*Entrega para:* [endereço]
*Pagamento:* [forma informada]

MENSAGEM DE FECHAMENTO: "${closingMessage}"

INFORMAÇÕES DA LOJA:
- Nome: ${store.name || 'Loja'}
- WhatsApp: ${store.whatsapp || 'Não informado'}
${paymentSection}
${deliverySection}
${hoursSection}

FORMATAÇÃO (WhatsApp):
- *texto* para negrito
- NÃO use colchetes ou markdown de link`;
}

// ========================================
// DEFINIÇÃO DE TOOLS DO ASSISTANT
// ========================================
function buildAssistantTools(nicheConfig: any): any[] {
  const tools = [
    {
      type: 'function',
      function: {
        name: 'search_products',
        description: `Busca produtos no catálogo por nome ou termo.${nicheConfig?.max_products_per_response ? ` Limite: ${nicheConfig.max_products_per_response}.` : ''}`,
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Termo de busca' },
            limit: { type: 'number', description: 'Máximo de resultados (padrão: 3)' },
          },
          required: ['query'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'check_stock',
        description: 'Verifica disponibilidade de um produto.',
        parameters: {
          type: 'object',
          properties: { product_name: { type: 'string', description: 'Nome do produto' } },
          required: ['product_name'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_product_details',
        description: 'Obtém detalhes de um produto pelo slug.',
        parameters: {
          type: 'object',
          properties: { slug: { type: 'string', description: 'Slug do produto' } },
          required: ['slug'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'list_categories',
        description: 'Lista categorias disponíveis.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_promotions',
        description: 'Retorna produtos em promoção.',
        parameters: {
          type: 'object',
          properties: { limit: { type: 'number', description: 'Quantidade máxima' } },
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
          properties: { limit: { type: 'number', description: 'Quantidade máxima' } },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_store_info',
        description: 'Retorna informações da loja.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'check_store_status',
        description: 'Verifica se a loja está aberta.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_current_greeting',
        description: 'Retorna saudação baseada no horário atual.',
        parameters: {
          type: 'object',
          properties: { customer_name: { type: 'string', description: 'Nome do cliente (opcional)' } },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'calculate_delivery_fee',
        description: 'Calcula taxa de entrega baseada na localização GPS do cliente.',
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
        name: 'get_last_delivery_info',
        description: 'Busca endereço e taxa do último pedido do cliente pelo telefone.',
        parameters: {
          type: 'object',
          properties: {
            customer_phone: { type: 'string', description: 'Telefone do cliente (apenas números)' },
          },
          required: ['customer_phone'],
        },
      },
    },
  ];

  return tools;
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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
    const requestBody = await req.json() as { 
      action?: string; config?: BotConfig; origin?: string; storeId?: string; forceSync?: boolean 
    };

    let action = requestBody.action;
    let config = requestBody.config;
    const origin = requestBody.origin;

    // Se recebeu apenas storeId, buscar config do banco
    if (requestBody.storeId && !config) {
      const { data: existingConfig } = await supabaseClient
        .from('store_bot_config')
        .select('*')
        .eq('store_id', requestBody.storeId)
        .maybeSingle();

      // Buscar instância UaZapi
      const { data: uazapiInstance } = await supabaseClient
        .from('uazapi_config')
        .select('instance_name')
        .limit(1)
        .maybeSingle();

      config = {
        storeId: requestBody.storeId,
        instanceName: uazapiInstance?.instance_name || existingConfig?.trigger_value || '',
        botName: existingConfig?.bot_name || 'Assistente',
        stopBotFromMe: existingConfig?.stop_bot_from_me ?? true,
        listeningFromMe: existingConfig?.listening_from_me ?? false,
        delayMessage: existingConfig?.delay_message ?? 1000,
        expireMinutes: existingConfig?.expire_minutes ?? 20,
        keywordFinish: existingConfig?.keyword_finish || '#sair',
        unknownMessage: existingConfig?.unknown_message || '',
        keepOpen: existingConfig?.keep_open ?? false,
        debounceTime: existingConfig?.debounce_time ?? 10,
        triggerType: existingConfig?.trigger_type || 'all',
        triggerOperator: existingConfig?.trigger_operator || 'equals',
        triggerValue: existingConfig?.trigger_value || '',
        ignoreJids: existingConfig?.ignore_jids || [],
        splitMessages: existingConfig?.bot_split_messages ?? true,
        timePerChar: existingConfig?.bot_time_per_char ?? 50,
        botMode: (existingConfig?.bot_mode as BotModeType) || 'assistant',
        customPromptInstructions: existingConfig?.custom_prompt_instructions || '',
      };
      action = 'update';
      steps.push({ step: 'fetch_config', status: 'success', message: 'Configuração carregada do banco' });
    }

    if (!config || !config.storeId) {
      return new Response(JSON.stringify({ error: 'storeId é obrigatório', steps }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar loja e configurações
    const [storeRes, configRes] = await Promise.all([
      supabaseClient
        .from('stores')
        .select('*, google_maps_link, business_hours, delivery_fee, min_order_value, accepts_cash, accepts_card, accepts_pix, city, state, custom_domain, custom_domain_verified, openai_api_key, niche_id')
        .eq('id', config.storeId)
        .single(),
      supabaseClient
        .from('store_configurations')
        .select('delivery_zones')
        .eq('store_id', config.storeId)
        .maybeSingle(),
    ]);

    const store = storeRes.data;
    const deliveryZones = (configRes.data?.delivery_zones as any[]) || [];

    if (storeRes.error || !store) {
      steps.push({ step: 'store_check', status: 'error', message: 'Loja não encontrada' });
      return new Response(JSON.stringify({ error: 'Loja não encontrada', steps }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    steps.push({ step: 'store_check', status: 'success', message: 'Loja encontrada', details: store.name });

    // Buscar config de nicho
    let nicheConfig: any = null;
    let nicheRules: any[] = [];

    if (store.niche_id) {
      const currentBotMode: BotModeType = config.botMode || 'chat_completion';
      const nicheConfigRes = await supabaseClient
        .from('niche_ai_configs')
        .select('*')
        .eq('niche_id', store.niche_id)
        .eq('bot_mode', currentBotMode)
        .limit(1);
      nicheConfig = nicheConfigRes.data?.[0] || null;
      
      if (!nicheConfig) {
        const fallbackRes = await supabaseClient.from('niche_ai_configs').select('*').eq('niche_id', store.niche_id).limit(1);
        nicheConfig = fallbackRes.data?.[0] || null;
      }

      if (nicheConfig) {
        const nicheRulesRes = await supabaseClient
          .from('niche_ai_rules').select('*').eq('niche_ai_config_id', nicheConfig.id).eq('is_enabled', true).order('sort_order');
        nicheRules = nicheRulesRes.data || [];
        steps.push({ step: 'niche_config', status: 'success', message: 'Config de nicho carregada', details: `${nicheRules.length} regra(s)` });
      }
    }

    // Verificar permissão
    const isMasterAdmin = await supabaseClient.from('user_roles').select('role').eq('user_id', userId).eq('role', 'master_admin').single();
    if (!isMasterAdmin.data && store.owner_id !== userId) {
      return new Response(JSON.stringify({ error: 'Acesso negado', steps }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    steps.push({ step: 'auth_check', status: 'success', message: 'Autorização verificada' });

    // Verificar API Key OpenAI da loja
    const openaiApiKey = store.openai_api_key;
    if (!openaiApiKey) {
      steps.push({ step: 'openai_key_check', status: 'error', message: 'Chave OpenAI não configurada' });
      return new Response(JSON.stringify({ error: 'API Key OpenAI não configurada para esta loja.', steps }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    steps.push({ step: 'openai_key_check', status: 'success', message: 'Chave OpenAI configurada', details: '****' + openaiApiKey.slice(-4) });

    // Buscar produtos e categorias
    const [productsRes, categoriesRes] = await Promise.all([
      supabaseClient.from('products').select('*, slug').eq('store_id', config.storeId).eq('is_available', true),
      supabaseClient.from('categories').select('*').eq('store_id', config.storeId).eq('is_active', true),
    ]);
    const products = productsRes.data || [];
    const categories = categoriesRes.data || [];
    steps.push({ step: 'data_fetch', status: 'success', message: 'Dados carregados', details: `${products.length} produtos, ${categories.length} categorias` });

    // Config existente do bot
    const { data: existingBotConfig } = await supabaseClient.from('store_bot_config').select('*').eq('store_id', config.storeId).single();

    // ========================================
    // AÇÕES: create / update
    // ========================================
    if (action === 'create' || action === 'update') {
      steps.push({ step: 'action_start', status: 'success', message: 'Iniciando sincronização UaZapi...' });

      const botMode: BotModeType = (existingBotConfig?.bot_mode as BotModeType) || config.botMode || 'chat_completion';
      const isAssistantMode = botMode === 'assistant' || botMode === 'conversational';
      const isConversationalMode = botMode === 'conversational';

      steps.push({
        step: 'bot_mode',
        status: 'success',
        message: `Modo: ${isConversationalMode ? 'Conversacional' : isAssistantMode ? 'Assistente v2' : 'Simples'}`,
      });

      // Gerar prompt
      const botName = config.botName || 'Assistente';
      const personalitySettings: PersonalitySettings = {
        personality: (existingBotConfig?.personality || 'friendly') as PersonalityType,
        emojiLevel: (existingBotConfig?.emoji_level || 'moderate') as EmojiLevel,
        customGreeting: existingBotConfig?.custom_greeting || ''
      };

      const baseUrl = getStoreBaseUrl(store, origin);
      const storeLink = `${baseUrl}/loja/${store.slug}`;

      let systemPrompt: string;

      if (isConversationalMode) {
        const [convSettingsRes, orderQuestionsRes] = await Promise.all([
          supabaseClient.from('store_bot_conversational_settings').select('*').eq('store_id', config.storeId).maybeSingle(),
          supabaseClient.from('store_bot_order_questions').select('*').eq('store_id', config.storeId).order('sort_order'),
        ]);
        const convSettings = convSettingsRes.data as any;
        if (convSettings?.upsell_enabled && convSettings?.upsell_product_id) {
          const { data: upsellProduct } = await supabaseClient.from('products').select('name, price, slug').eq('id', convSettings.upsell_product_id).single();
          if (upsellProduct) {
            convSettings._upsell_product_name = upsellProduct.name;
            convSettings._upsell_product_price = upsellProduct.price;
          }
        }
        const nicheRuleTypes = nicheRules.map(r => r.rule_type);
        systemPrompt = generateConversationalModePrompt(botName, store, personalitySettings, deliveryZones, convSettings || null, orderQuestionsRes.data || [], nicheRuleTypes.length > 0 ? nicheRuleTypes : undefined, (nicheConfig?.enabled_tools as string[]) || undefined);
        steps.push({ step: 'prompt_generate', status: 'success', message: 'Prompt conversacional gerado' });
      } else if (isAssistantMode) {
        const customInstructions = existingBotConfig?.custom_prompt_instructions || config.customPromptInstructions || '';
        const navigationLink = store.latitude && store.longitude && store.slug ? `${baseUrl}/navegar?lat=${store.latitude}&lng=${store.longitude}&store=${store.slug}` : store.google_maps_link || '';
        systemPrompt = generateAssistantModePrompt(botName, store, storeLink, navigationLink, personalitySettings, customInstructions, deliveryZones);
        steps.push({ step: 'prompt_generate', status: 'success', message: 'Prompt v2 gerado' });
      } else {
        systemPrompt = generateSystemPrompt(botName, store, products, categories, origin, personalitySettings, deliveryZones);
        steps.push({ step: 'prompt_generate', status: 'success', message: 'Prompt v1 gerado' });
      }

      // Injetar regras de nicho
      const nicheRulesText = buildNicheRulesText(nicheConfig, nicheRules);
      if (nicheRulesText) {
        systemPrompt += nicheRulesText.replace(/\{\{STORE_NAME\}\}/g, store.name || 'Loja').replace(/\{\{BOT_NAME\}\}/g, botName);
        steps.push({ step: 'niche_rules_injected', status: 'success', message: `${nicheRules.length} regra(s) injetada(s)` });
      }

      // Modelo
      const validModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4'];
      let model = 'gpt-4o-mini'; // Default para UaZapi
      
      // Tentar pegar modelo da configuração da UaZapi ou usar default
      const { data: uazapiConfig } = await supabaseClient.from('uazapi_config').select('*').limit(1).maybeSingle();
      if (uazapiConfig && (uazapiConfig as any).default_model && validModels.includes((uazapiConfig as any).default_model)) {
        model = (uazapiConfig as any).default_model;
      }
      steps.push({ step: 'model_validate', status: 'success', message: `Modelo: ${model}` });

      // ========================================
      // CRIAR/ATUALIZAR OPENAI ASSISTANT (DIRETO)
      // ========================================
      let uazapiAssistantId: string | null = (existingBotConfig as any)?.uazapi_assistant_id || null;

      if (isAssistantMode) {
        steps.push({
          step: 'openai_assistant_check',
          status: 'success',
          message: 'Verificando OpenAI Assistant (UaZapi)...',
          details: uazapiAssistantId ? `ID existente: ${uazapiAssistantId.slice(0, 12)}...` : 'Criando novo...',
        });

        try {
          const allTools = buildAssistantTools(nicheConfig);
          
          // Filtrar tools pelo nicho
          const enabledToolKeys = nicheConfig?.enabled_tools as string[] | null;
          const filteredTools = enabledToolKeys && enabledToolKeys.length > 0
            ? allTools.filter(t => {
                const toolName = (t as any).function?.name;
                if (toolName === 'search_products' || toolName === 'get_current_greeting') return true;
                return enabledToolKeys.includes(toolName);
              })
            : allTools;

          steps.push({
            step: 'tools_filter',
            status: 'success',
            message: `${filteredTools.length}/${allTools.length} tools ativas`,
          });

          // Nome do assistant com identificador "uazapi"
          const assistantName = `[uazapi] ${config.botName || 'Assistente'} - ${store.name}`;

          const assistantPayload = {
            name: assistantName,
            instructions: systemPrompt,
            tools: filteredTools,
            model: model,
          };

          if (uazapiAssistantId) {
            // Tentar atualizar existente
            const updateResp = await fetch(`https://api.openai.com/v1/assistants/${uazapiAssistantId}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2',
              },
              body: JSON.stringify(assistantPayload),
            });

            if (updateResp.ok) {
              const assistant = await updateResp.json();
              uazapiAssistantId = assistant.id;
              steps.push({
                step: 'openai_assistant_updated',
                status: 'success',
                message: '✅ OpenAI Assistant (UaZapi) atualizado',
                details: `ID: ${uazapiAssistantId?.slice(0, 12)}...`,
              });
            } else {
              console.log('Update falhou, criando novo...');
              uazapiAssistantId = null;
            }
          }

          if (!uazapiAssistantId) {
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

            if (!createResp.ok) {
              const errorText = await createResp.text();
              console.error('Erro ao criar Assistant UaZapi:', errorText);
              steps.push({ step: 'openai_assistant_create', status: 'error', message: 'Falha ao criar OpenAI Assistant', details: errorText.slice(0, 100) });
              return new Response(JSON.stringify({ success: false, error: 'Falha ao criar OpenAI Assistant', steps }), {
                status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }

            const assistant = await createResp.json();
            uazapiAssistantId = assistant.id;
            steps.push({
              step: 'openai_assistant_created',
              status: 'success',
              message: '✅ OpenAI Assistant (UaZapi) criado!',
              details: `ID: ${uazapiAssistantId?.slice(0, 12)}... | Nome: ${assistantName}`,
            });
          }
        } catch (assistantError) {
          console.error('Erro ao gerenciar OpenAI Assistant:', assistantError);
          steps.push({ step: 'openai_assistant_error', status: 'error', message: 'Erro ao gerenciar Assistant', details: String(assistantError).slice(0, 100) });
          return new Response(JSON.stringify({ success: false, error: 'Erro ao criar/atualizar OpenAI Assistant', steps }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Salvar configuração no banco
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const botConfigData: Record<string, any> = {
        store_id: config.storeId,
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
        updated_at: new Date().toISOString(),
        bot_mode: botMode,
        uazapi_assistant_id: uazapiAssistantId || (existingBotConfig as any)?.uazapi_assistant_id || null,
        whatsapp_provider: 'uazapi',
        custom_prompt_instructions: config.customPromptInstructions || existingBotConfig?.custom_prompt_instructions || null,
        needs_sync: false,
        last_synced_at: new Date().toISOString(),
        last_sync_error: null,
      };

      if (existingBotConfig) {
        await supabaseClient.from('store_bot_config').update(botConfigData).eq('id', existingBotConfig.id);
      } else {
        await supabaseClient.from('store_bot_config').insert(botConfigData);
      }

      steps.push({ step: 'save_config', status: 'success', message: 'Configuração salva no banco' });

      return new Response(JSON.stringify({
        success: true,
        message: 'Bot UaZapi sincronizado com sucesso!',
        assistantId: uazapiAssistantId,
        steps,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========================================
    // AÇÃO: delete
    // ========================================
    if (action === 'delete') {
      steps.push({ step: 'action_start', status: 'success', message: 'Removendo bot UaZapi...' });

      const uazapiAssistantId = (existingBotConfig as any)?.uazapi_assistant_id;
      
      // Tentar deletar o Assistant na OpenAI
      if (uazapiAssistantId && openaiApiKey) {
        try {
          const deleteResp = await fetch(`https://api.openai.com/v1/assistants/${uazapiAssistantId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'OpenAI-Beta': 'assistants=v2',
            },
          });
          steps.push({
            step: 'assistant_delete',
            status: deleteResp.ok ? 'success' : 'warning',
            message: deleteResp.ok ? 'Assistant OpenAI removido' : 'Falha ao remover Assistant',
          });
        } catch (e) {
          steps.push({ step: 'assistant_delete', status: 'warning', message: 'Erro ao remover Assistant', details: String(e) });
        }
      }

      await supabaseClient.from('store_bot_config').update({
        enabled: false,
        uazapi_assistant_id: null,
        whatsapp_provider: 'uazapi',
        updated_at: new Date().toISOString(),
      }).eq('store_id', config.storeId);

      steps.push({ step: 'save_config', status: 'success', message: 'Configuração atualizada' });
      return new Response(JSON.stringify({ success: true, message: 'Bot UaZapi removido!', steps }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Ação inválida', steps }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    steps.push({ step: 'error', status: 'error', message });
    return new Response(JSON.stringify({ error: message, steps }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
