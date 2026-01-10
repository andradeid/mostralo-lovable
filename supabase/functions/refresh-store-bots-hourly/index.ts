import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * REFRESH-STORE-BOTS-HOURLY
 * 
 * Esta função usa estratégia DELETE + CREATE para garantir que o prompt
 * seja sempre atualizado corretamente na Evolution API:
 * - Deleta o bot existente
 * - Cria um novo bot com o prompt atualizado
 * - Atualiza o novo ID do bot no banco de dados
 * - Usa fallback para UPDATE se DELETE falhar
 * 
 * Chamada pelo CRON a cada hora para atualizar a saudação dos bots.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ========================================
// FUNÇÃO: Sanitizar textos - remover "cardápio" e trocar por "loja"
// ========================================
function sanitizeText(text: string): string {
  if (!text) return text;
  // Regex case-insensitive para pegar "cardápio" e "cardapio" (sem acento)
  return text
    .replace(/cardápio/giu, 'loja')
    .replace(/cardapio/giu, 'loja');
}

function sanitizeBotPayload(payload: any): any {
  // Sanitizar systemMessages (array de strings)
  if (payload.systemMessages && Array.isArray(payload.systemMessages)) {
    payload.systemMessages = payload.systemMessages.map((msg: string) => sanitizeText(msg));
  }
  
  // Sanitizar assistantMessages (array de strings)
  if (payload.assistantMessages && Array.isArray(payload.assistantMessages)) {
    payload.assistantMessages = payload.assistantMessages.map((msg: string) => sanitizeText(msg));
  }
  
  // Sanitizar unknownMessage (string)
  if (payload.unknownMessage) {
    payload.unknownMessage = sanitizeText(payload.unknownMessage);
  }
  
  // Sanitizar description (string)
  if (payload.description) {
    payload.description = sanitizeText(payload.description);
  }
  
  return payload;
}

// Tipos de personalidade do bot
type PersonalityType = 'professional' | 'friendly' | 'fun' | 'consultive';
type EmojiLevel = 'none' | 'moderate' | 'abundant';

interface PersonalitySettings {
  personality: PersonalityType;
  emojiLevel: EmojiLevel;
  customGreeting: string;
}

// Função para gerar instruções de personalidade
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
  } catch {
    return 'Não informado';
  }
}

function formatPaymentMethods(store: any): string {
  const methods: string[] = [];
  if (store.accepts_pix !== false) methods.push('✅ PIX');
  if (store.accepts_card !== false) methods.push('✅ Cartão');
  if (store.accepts_cash !== false) methods.push('✅ Dinheiro');
  return methods.length === 0 ? '- Consulte a loja sobre formas de pagamento' : methods.join('\n');
}

function isStoreOpenNow(businessHours: any, timezone: string): boolean {
  if (!businessHours) return false;
  if (businessHours.service_paused === true || businessHours.service_paused === 'true') return false;

  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const weekdayEn = parts.find(p => p.type === 'weekday')?.value?.toLowerCase() || '';
  const hour = parts.find(p => p.type === 'hour')?.value || '00';
  const minute = parts.find(p => p.type === 'minute')?.value || '00';
  const currentTime = `${hour}:${minute}`;

  const dayKey = weekdayEn;
  if (!dayKey) return false;

  const dayHours = businessHours[dayKey];
  if (!dayHours || dayHours.closed) return false;

  return currentTime >= dayHours.open && currentTime <= dayHours.close;
}

function getNextOpeningTime(businessHours: any, timezone: string): string | null {
  if (!businessHours) return null;

  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const weekdayEn = parts.find(p => p.type === 'weekday')?.value?.toLowerCase() || '';
  const hour = parts.find(p => p.type === 'hour')?.value || '00';
  const minute = parts.find(p => p.type === 'minute')?.value || '00';
  const currentTime = `${hour}:${minute}`;

  const dayNamesEn = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayNamesPt = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  const currentDayIndex = dayNamesEn.indexOf(weekdayEn);
  if (currentDayIndex === -1) return null;

  const todayHours = businessHours[dayNamesEn[currentDayIndex]];
  if (todayHours && !todayHours.closed && currentTime < todayHours.open) {
    return `hoje às ${todayHours.open}`;
  }

  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (currentDayIndex + i) % 7;
    const nextDayHours = businessHours[dayNamesEn[nextDayIndex]];
    if (nextDayHours && !nextDayHours.closed) {
      if (i === 1) return `amanhã às ${nextDayHours.open}`;
      return `${dayNamesPt[nextDayIndex]} às ${nextDayHours.open}`;
    }
  }

  return null;
}

function getGreetingForTime(timezone: string): { greeting: string; currentTime: string; hour: number } {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const currentTime = formatter.format(now);
  const hour = parseInt(currentTime.split(':')[0]);

  let greeting = 'Olá';
  if (hour >= 5 && hour < 12) greeting = 'Bom dia';
  else if (hour >= 12 && hour < 18) greeting = 'Boa tarde';
  else greeting = 'Boa noite';

  return { greeting, currentTime, hour };
}

function getStoreBaseUrl(store: any): string {
  if (store.custom_domain && store.custom_domain_verified) {
    return `https://${store.custom_domain}`;
  }
  return 'https://mostralo.com.br';
}

interface StoreStatusContext {
  greeting: string;
  currentTime: string;
  isOpen: boolean;
  nextOpening: string | null;
  timezone: string;
}

function generateSystemPrompt(
  botName: string, 
  store: any, 
  products: any[], 
  categories: any[], 
  personalitySettings: PersonalitySettings,
  statusContext: StoreStatusContext
): string {
  const baseUrl = getStoreBaseUrl(store);
  const storeLink = `${baseUrl}/loja/${store.slug}`;
  
  const { greeting, currentTime, isOpen, nextOpening, timezone } = statusContext;
  const statusSection = `

[CONTEXTO ATUAL - ${currentTime} (${timezone})]
- Horário da loja: ${currentTime}
- Saudação apropriada: "${greeting}"
- STATUS: ${isOpen ? '✅ ABERTO AGORA' : `❌ FECHADO${nextOpening ? ` - Abre ${nextOpening}` : ''}`}
${!isOpen && nextOpening ? `- Próxima abertura: ${nextOpening}` : ''}

INSTRUÇÕES DE STATUS:
- Se cliente perguntar se está aberto: Responda "${isOpen ? 'Sim, estamos abertos!' : `No momento estamos fechados. ${nextOpening ? `Abrimos ${nextOpening}.` : ''}`}"
- NUNCA diga que está aberto se o STATUS mostrar FECHADO
- Use a saudação "${greeting}" nas interações
- Mesmo fechado, ofereça a loja: "Enquanto isso, acesse nossa loja: ${storeLink}"`;
  
  const productList = products
    .filter(p => p.is_available)
    .map(p => {
      const productLink = p.slug ? `${storeLink}/produto/${p.slug}` : storeLink;
      return `- ${p.name}: R$ ${p.price?.toFixed(2)}
    Descrição: ${p.description || 'Sem descrição'}
    📎 Ver produto: ${productLink}`;
    })
    .join('\n\n');

  const categoryList = categories.filter(c => c.is_active).map(c => c.name).join(', ');
  
  const locationSection = store.google_maps_link 
    ? `\nLOCALIZAÇÃO:
- Endereço: ${store.address || 'Não informado'}
- Cidade/Estado: ${store.city || ''}${store.city && store.state ? '/' : ''}${store.state || ''}
- 📍 Link do Google Maps: ${store.google_maps_link}
- Quando cliente pedir localização, SEMPRE envie o link acima`
    : '';

  const paymentSection = `\nFORMAS DE PAGAMENTO:\n${formatPaymentMethods(store)}`;
  const deliverySection = `\nDELIVERY:
- Taxa de entrega: ${store.delivery_fee ? `R$ ${store.delivery_fee.toFixed(2)}` : 'Consulte na loja'}
- Pedido mínimo: ${store.min_order_value ? `R$ ${store.min_order_value.toFixed(2)}` : 'Sem valor mínimo'}`;
  const hoursSection = `\nHORÁRIO DE FUNCIONAMENTO:\n${formatBusinessHours(store.business_hours)}`;

  const personalityInstructions = generatePersonalityInstructions(personalitySettings);

  return `Você é ${botName}, o assistente virtual da ${store.name || 'loja'}.

Quando o cliente perguntar seu nome, responda: "Meu nome é ${botName}!"

${personalityInstructions}
${statusSection}

INFORMAÇÕES DA LOJA:
- Nome: ${store.name || 'Loja'}
- Descrição: ${store.description || 'Delivery de qualidade'}
- Endereço: ${store.address || 'Não informado'}
- WhatsApp: ${store.whatsapp || 'Não informado'}
- Acesse nossa loja: ${storeLink}
${locationSection}
${paymentSection}
${deliverySection}
${hoursSection}

CATEGORIAS DISPONÍVEIS:
${categoryList || 'Não há categorias cadastradas'}

PRODUTOS DISPONÍVEIS:
${productList || 'Não há produtos cadastrados'}

SAUDAÇÃO INTELIGENTE:
1. USE a saudação do [CONTEXTO ATUAL] acima (Bom dia/Boa tarde/Boa noite)
2. Se o cliente informar o nome, USE o nome nas respostas seguintes
3. Se não souber o nome, seja acolhedor
4. **SEMPRE envie o link da loja na primeira mensagem**

INSTRUÇÕES GERAIS:
1. Apresente os produtos quando perguntado
2. Informe preços corretamente
3. SEMPRE inclua o link do produto quando falar sobre ele
4. Direcione o cliente para a loja online: ${storeLink}
5. Para finalizar pedido, peça para acessar o link do produto ou da loja
6. Não invente produtos ou preços
7. Se não souber algo, direcione ao link da loja
8. Responda sempre em português brasileiro
9. Mencione promoções se houver
10. Quando pedirem localização, envie o link do Google Maps se disponível
11. Informe horário de funcionamento quando perguntado
12. Informe formas de pagamento aceitas quando perguntado
13. SE CLIENTE PERGUNTAR SE ESTÁ ABERTO - USE O STATUS DO [CONTEXTO ATUAL]

LINKS DE PRODUTOS:
- Quando o cliente perguntar sobre um produto específico, SEMPRE envie o link do produto
- Use o formato: "Você pode ver mais detalhes e pedir aqui: [link]"

ENCERRAMENTO:
- Quando o cliente digitar a palavra de encerramento, agradeça e finalize
- Sempre deseje uma boa experiência ao cliente`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const results: any[] = [];

  try {
    // Kill-switch: verificar se está desabilitado
    const disableFlag = Deno.env.get('DISABLE_REFRESH_STORE_BOTS');
    if (disableFlag === 'true') {
      console.log('⛔ CRON desabilitado via DISABLE_REFRESH_STORE_BOTS');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'CRON desabilitado via kill-switch',
        skipped: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔄 Iniciando refresh de bots de lojas...');

    // Buscar Evolution config
    const { data: evolutionConfig, error: configError } = await supabase
      .from('evolution_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !evolutionConfig) {
      console.error('❌ Evolution API não configurada');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Evolution API não configurada' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const evolutionUrl = evolutionConfig.api_url.replace(/\/$/, '');

    // Buscar todos os bots ATIVOS das lojas (com evolution_bot_id)
    const { data: activeBots, error: botsError } = await supabase
      .from('store_bot_config')
      .select(`
        *,
        stores!inner (
          id, name, slug, description, address, whatsapp,
          google_maps_link, business_hours, delivery_fee, min_order_value,
          accepts_cash, accepts_card, accepts_pix, city, state,
          custom_domain, custom_domain_verified, openai_api_key, timezone
        )
      `)
      .eq('enabled', true)
      .not('evolution_bot_id', 'is', null);

    if (botsError) {
      console.error('❌ Erro ao buscar bots:', botsError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Erro ao buscar bots ativos' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!activeBots || activeBots.length === 0) {
      console.log('ℹ️ Nenhum bot ativo para atualizar');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Nenhum bot ativo para atualizar',
        processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📦 ${activeBots.length} bot(s) ativo(s) para atualizar`);

    // Buscar instância WhatsApp
    const { data: whatsappInstance } = await supabase
      .from('whatsapp_instances')
      .select('instance_name')
      .eq('is_active', true)
      .single();

    if (!whatsappInstance?.instance_name) {
      console.error('❌ Nenhuma instância WhatsApp ativa');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Nenhuma instância WhatsApp ativa' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const instanceName = whatsappInstance.instance_name;
    console.log(`📱 Instância WhatsApp: ${instanceName}`);

    // Lista de modelos válidos (igual ao openai-bot-sync)
    const validModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4'];

    // Processar cada bot
    for (const botConfig of activeBots) {
      const store = botConfig.stores;
      const storeSlug = store?.slug || 'unknown';
      
      console.log(`\n🏪 Processando: ${store?.name || storeSlug}`);

      try {
        // 1. Verificar se a loja tem API Key OpenAI
        if (!store?.openai_api_key) {
          console.log(`⚠️ [${storeSlug}] Sem API Key OpenAI, pulando...`);
          results.push({
            store: storeSlug,
            status: 'skipped',
            reason: 'Sem API Key OpenAI'
          });
          continue;
        }

        // 2. Buscar credencial OpenAI existente para esta loja
        const storeCredentialName = `store_${storeSlug}_openai`;
        let openaiCredsId: string | null = null;

        try {
          const listResp = await fetch(`${evolutionUrl}/openai/creds/${instanceName}`, {
            method: 'GET',
            headers: { 'apikey': evolutionConfig.api_key },
          });

          if (listResp.ok) {
            const data = await listResp.json();
            const existingCreds = Array.isArray(data) ? data : (data?.creds || data?.data || []);
            const storeCredential = existingCreds.find((c: any) => c.name === storeCredentialName);
            
            if (storeCredential?.id) {
              openaiCredsId = storeCredential.id;
              console.log(`✅ [${storeSlug}] Credencial encontrada: ${storeCredential.id.slice(0, 8)}...`);
            }
          }
        } catch (e) {
          console.log(`⚠️ [${storeSlug}] Erro ao buscar credenciais:`, e);
        }

        // Se não encontrou credencial, criar uma nova
        if (!openaiCredsId) {
          console.log(`🔑 [${storeSlug}] Criando nova credencial...`);
          try {
            const createResp = await fetch(`${evolutionUrl}/openai/creds/${instanceName}`, {
              method: 'POST',
              headers: {
                'apikey': evolutionConfig.api_key,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: storeCredentialName,
                apiKey: store.openai_api_key,
              }),
            });

            if (createResp.ok) {
              const data = await createResp.json();
              openaiCredsId = data?.id || data?.openaiCredsId || data?.creds?.id || null;
              if (openaiCredsId) {
                console.log(`✅ [${storeSlug}] Credencial criada: ${openaiCredsId.slice(0, 8)}...`);
              }
            }
          } catch (e) {
            console.log(`❌ [${storeSlug}] Erro ao criar credencial:`, e);
          }
        }

        if (!openaiCredsId) {
          console.log(`❌ [${storeSlug}] Não foi possível obter credenciais, pulando...`);
          results.push({
            store: storeSlug,
            status: 'error',
            reason: 'Falha ao obter credenciais OpenAI'
          });
          continue;
        }

        // 3. Buscar produtos e categorias da loja
        const { data: products } = await supabase
          .from('products')
          .select('*, slug')
          .eq('store_id', store.id)
          .eq('is_available', true);

        const { data: categories } = await supabase
          .from('categories')
          .select('*')
          .eq('store_id', store.id)
          .eq('is_active', true);

        // 4. Calcular contexto de status (horário, saudação, aberto/fechado)
        const timezone = store.timezone || 'America/Sao_Paulo';
        const { greeting, currentTime } = getGreetingForTime(timezone);
        const isOpen = isStoreOpenNow(store.business_hours, timezone);
        const nextOpening = !isOpen ? getNextOpeningTime(store.business_hours, timezone) : null;

        const statusContext: StoreStatusContext = {
          greeting,
          currentTime,
          isOpen,
          nextOpening,
          timezone
        };

        // 5. Configurações de personalidade
        const personalitySettings: PersonalitySettings = {
          personality: (botConfig.personality || 'friendly') as PersonalityType,
          emojiLevel: (botConfig.emoji_level || 'moderate') as EmojiLevel,
          customGreeting: botConfig.custom_greeting || ''
        };

        // 6. Gerar prompt do sistema
        const botName = botConfig.bot_name || 'Assistente';
        const systemPrompt = generateSystemPrompt(
          botName,
          store,
          products || [],
          categories || [],
          personalitySettings,
          statusContext
        );

        // 7. Validar modelo (CRÍTICO - igual ao openai-bot-sync)
        let model = evolutionConfig.openai_default_model || 'gpt-4o-mini';
        if (!validModels.includes(model)) {
          console.log(`⚠️ [${storeSlug}] Modelo "${model}" inválido, usando gpt-4o-mini`);
          model = 'gpt-4o-mini';
        }

        // 8. Montar saudação dinâmica (few-shot learning)
        const baseUrl = getStoreBaseUrl(store);
        const storeLink = `${baseUrl}/loja/${store.slug}`;
        
        const dynamicGreeting = isOpen
          ? `${greeting}! 👋 Estamos abertos e prontos para atender! Seja bem-vindo(a) à ${store.name}!\n\n📱 Acesse nossa loja: ${storeLink}`
          : `${greeting}! 👋 No momento estamos fechados${nextOpening ? `, mas abrimos ${nextOpening}` : ''}. Seja bem-vindo(a) à ${store.name}!\n\n📱 Enquanto isso, acesse nossa loja: ${storeLink}`;

        // 9. Montar payload do bot (EXATAMENTE igual ao openai-bot-sync)
        let botPayload: any = {
          enabled: true,
          openaiCredsId: openaiCredsId,
          botType: 'chatCompletion',
          model: model,
          maxTokens: evolutionConfig.openai_max_tokens || 1000,
          systemMessages: [systemPrompt],
          assistantMessages: [dynamicGreeting],
          userMessages: ['Oi', 'Olá', 'Boa tarde', 'Boa noite', 'Bom dia', 'Vocês estão abertos?', 'Está aberto?'],
          triggerType: botConfig.trigger_type || 'all',
          triggerOperator: botConfig.trigger_operator || 'contains',
          triggerValue: botConfig.trigger_value || '',
          expire: botConfig.expire_minutes || 20,
          keywordFinish: botConfig.keyword_finish || '#SAIR',
          delayMessage: botConfig.delay_message || 4000,
          unknownMessage: botConfig.unknown_message || 'Desculpe, não entendi. Digite #SAIR para encerrar ou acesse nossa loja online.',
          listeningFromMe: botConfig.listening_from_me || false,
          stopBotFromMe: botConfig.stop_bot_from_me !== undefined ? botConfig.stop_bot_from_me : true,
          keepOpen: botConfig.keep_open || false,
          debounceTime: botConfig.debounce_time || 10,
          ignoreJids: botConfig.ignore_jids || [],
          splitMessages: botConfig.bot_split_messages !== undefined ? botConfig.bot_split_messages : true,
          timePerChar: botConfig.bot_time_per_char || 0,
          description: `Bot Mostralo - ${store.name}`,
        };

        // 🧹 SANITIZAÇÃO: Remover "cardápio" de todos os textos
        botPayload = sanitizeBotPayload(botPayload);
        console.log(`🧹 [${storeSlug}] Payload sanitizado (cardápio -> loja)`);

        // 10. DELETE + CREATE: Deletar bot antigo e criar novo com prompt atualizado
        const existingBotId = botConfig.evolution_bot_id;
        let success = false;
        let finalBotId = existingBotId;

        console.log(`🗑️ [${storeSlug}] Deletando bot antigo para aplicar mudanças...`);

        try {
          // PASSO 1: Deletar o bot existente
            const deleteResp = await fetch(
              // ⚠️ IMPORTANTE: manter padrão de rotas da Evolution igual ao /openai/status/{instance}/{botId}
              `${evolutionUrl}/openai/delete/${instanceName}/${existingBotId}`,
              {
                method: 'DELETE',
                headers: { 'apikey': evolutionConfig.api_key },
              }
            );

          const deleteOk = deleteResp.ok || deleteResp.status === 404;
          console.log(`🗑️ [${storeSlug}] Delete: ${deleteResp.status} (${deleteOk ? 'OK' : 'FALHOU'})`);

          if (!deleteOk) {
            console.log(`⚠️ [${storeSlug}] Falha ao deletar, tentando UPDATE...`);
            
            // Fallback: tentar UPDATE se delete falhar
            const updateResp = await fetch(
              `${evolutionUrl}/openai/settings/${existingBotId}/${instanceName}`,
              {
                method: 'PUT',
                headers: {
                  'apikey': evolutionConfig.api_key,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(botPayload),
              }
            );

            if (updateResp.ok) {
              console.log(`✅ [${storeSlug}] Bot atualizado via UPDATE (fallback)`);
              success = true;
              results.push({
                store: storeSlug,
                status: 'updated',
                botId: existingBotId.slice(0, 8),
                greeting,
                isOpen,
                method: 'update'
              });
            } else {
              const updateText = await updateResp.text();
              console.log(`❌ [${storeSlug}] Falha no UPDATE: ${updateResp.status}`);
              results.push({
                store: storeSlug,
                status: 'error',
                reason: `DELETE e UPDATE falharam: ${updateResp.status}`,
                details: updateText.slice(0, 100)
              });
            }
          } else {
            // PASSO 2: Criar novo bot com configurações atualizadas
            console.log(`🆕 [${storeSlug}] Criando novo bot com prompt atualizado...`);
            
            const createResp = await fetch(
              `${evolutionUrl}/openai/create/${instanceName}`,
              {
                method: 'POST',
                headers: {
                  'apikey': evolutionConfig.api_key,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(botPayload),
              }
            );

            if (createResp.ok) {
              const createData = await createResp.json();
              const newBotId = createData.id || createData.openaiBot?.id || null;
              
              if (newBotId) {
                console.log(`✅ [${storeSlug}] Novo bot criado: ${newBotId.slice(0, 8)}...`);
                finalBotId = newBotId;
                success = true;

                // PASSO 3: Atualizar o ID do novo bot no banco
                await supabase
                  .from('store_bot_config')
                  .update({
                    evolution_bot_id: newBotId,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', botConfig.id);

                results.push({
                  store: storeSlug,
                  status: 'recreated',
                  oldBotId: existingBotId.slice(0, 8),
                  newBotId: newBotId.slice(0, 8),
                  greeting,
                  isOpen,
                  method: 'delete+create'
                });
              } else {
                console.log(`⚠️ [${storeSlug}] Bot criado mas sem ID retornado`);
                results.push({
                  store: storeSlug,
                  status: 'warning',
                  reason: 'Bot criado mas ID não retornado'
                });
              }
            } else {
              const createText = await createResp.text();
              console.log(`❌ [${storeSlug}] Falha ao criar bot: ${createResp.status}`);
              results.push({
                store: storeSlug,
                status: 'error',
                reason: `Falha ao criar: ${createResp.status}`,
                details: createText.slice(0, 100)
              });
            }
          }
        } catch (e) {
          console.error(`❌ [${storeSlug}] Exceção:`, e);
          results.push({
            store: storeSlug,
            status: 'error',
            reason: String(e)
          });
        }

      } catch (storeError) {
        console.error(`❌ [${storeSlug}] Erro geral:`, storeError);
        results.push({
          store: storeSlug,
          status: 'error',
          reason: String(storeError)
        });
      }
    }

    const elapsed = Date.now() - startTime;
    const successCount = results.filter(r => r.status === 'updated' || r.status === 'created' || r.status === 'recreated').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const skippedCount = results.filter(r => r.status === 'skipped' || r.status === 'warning').length;

    console.log(`\n✅ Refresh completo em ${elapsed}ms`);
    console.log(`   - Sucesso: ${successCount}`);
    console.log(`   - Erros: ${errorCount}`);
    console.log(`   - Pulados: ${skippedCount}`);

    return new Response(JSON.stringify({
      success: true,
      processed: activeBots.length,
      successCount,
      errorCount,
      skippedCount,
      elapsedMs: elapsed,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
