import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ========================================
// VERSÃO DA FUNÇÃO - Para debug de deploy
// ========================================
const FUNCTION_VERSION = "2026-01-10-v2";

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

interface OperationStep {
  step: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

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

// Função para verificar se loja está aberta agora
function isStoreOpenNow(businessHours: any, timezone: string): boolean {
  if (!businessHours) return false;
  if (businessHours.service_paused === true || businessHours.service_paused === 'true') {
    return false;
  }

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

  const dayMap: Record<string, string> = {
    'sunday': 'sunday',
    'monday': 'monday',
    'tuesday': 'tuesday',
    'wednesday': 'wednesday',
    'thursday': 'thursday',
    'friday': 'friday',
    'saturday': 'saturday',
  };

  const dayKey = dayMap[weekdayEn];
  if (!dayKey) return false;

  const dayHours = businessHours[dayKey];
  if (!dayHours || dayHours.closed) return false;

  return currentTime >= dayHours.open && currentTime <= dayHours.close;
}

// Função para calcular próxima abertura
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

  // Verificar se abre ainda hoje
  const todayHours = businessHours[dayNamesEn[currentDayIndex]];
  if (todayHours && !todayHours.closed && currentTime < todayHours.open) {
    return `hoje às ${todayHours.open}`;
  }

  // Procurar próximo dia aberto
  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (currentDayIndex + i) % 7;
    const nextDayHours = businessHours[dayNamesEn[nextDayIndex]];

    if (nextDayHours && !nextDayHours.closed) {
      if (i === 1) {
        return `amanhã às ${nextDayHours.open}`;
      }
      return `${dayNamesPt[nextDayIndex]} às ${nextDayHours.open}`;
    }
  }

  return null;
}

// Função para calcular saudação baseada no horário
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

// Determinar domínio correto para links da loja
function getStoreBaseUrl(store: any, origin?: string): string {
  // 1º Prioridade: Domínio customizado VERIFICADO da loja
  if (store.custom_domain && store.custom_domain_verified) {
    return `https://${store.custom_domain}`;
  }
  
  // 2º Prioridade: Domínio de origem da requisição (se não for dev)
  if (origin) {
    const devDomains = ['localhost', 'lovable.app', 'lovable.dev', 'gptengineer.run', 'webcontainer.io', 'stackblitz.io', 'codesandbox.io'];
    const isDevDomain = devDomains.some(d => origin.includes(d));
    
    if (!isDevDomain) {
      // Remove trailing slash e retorna origem
      return origin.replace(/\/$/, '');
    }
  }
  
  // 3º Prioridade: Fallback padrão
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
  origin?: string,
  personalitySettings?: PersonalitySettings,
  statusContext?: StoreStatusContext
): string {
  const baseUrl = getStoreBaseUrl(store, origin);
  const storeLink = `${baseUrl}/loja/${store.slug}`;
  
  // Gerar seção de contexto atual (horário + status)
  let statusSection = '';
  if (statusContext) {
    const { greeting, currentTime, isOpen, nextOpening, timezone } = statusContext;
    statusSection = `

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
  }
  
  const productList = products
    .filter(p => p.is_available)
    .map(p => {
      const productLink = p.slug 
        ? `${storeLink}/produto/${p.slug}`
        : storeLink;
      return `- ${p.name}: R$ ${p.price?.toFixed(2)}
    Descrição: ${p.description || 'Sem descrição'}
    📎 Ver produto: ${productLink}`;
    })
    .join('\n\n');

  const categoryList = categories
    .filter(c => c.is_active)
    .map(c => c.name)
    .join(', ');
  
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

  // Gerar instruções de personalidade dinâmicas
  const defaultPersonality: PersonalitySettings = {
    personality: 'friendly',
    emojiLevel: 'moderate',
    customGreeting: ''
  };
  
  const personalityInstructions = generatePersonalityInstructions(
    personalitySettings || defaultPersonality
  );

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

    console.log(`[openai-bot-sync] version: ${FUNCTION_VERSION}`);

    const requestBody = await req.json() as { action: string; config: BotConfig & { forceRecreate?: boolean }; origin?: string };
    const { action, origin } = requestBody;
    
    // ========================================
    // SANITIZAR CONFIG NA ENTRADA (blindagem contra "cardápio")
    // ========================================
    const config = {
      ...requestBody.config,
      unknownMessage: sanitizeText(requestBody.config.unknownMessage),
      botName: sanitizeText(requestBody.config.botName),
    };

    // Buscar loja do usuário com todos os campos necessários (incluindo domínio customizado e openai_api_key)
    const { data: store, error: storeError } = await supabaseClient
      .from('stores')
      .select(`
        *, 
        google_maps_link, business_hours, delivery_fee, min_order_value,
        accepts_cash, accepts_card, accepts_pix, city, state,
        custom_domain, custom_domain_verified,
        openai_api_key
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

    // Verificar API Key OpenAI da loja (de stores.openai_api_key, não de evolution_config)
    const openaiApiKey = store.openai_api_key;
    
    if (!openaiApiKey) {
      steps.push({ 
        step: 'openai_key_check', 
        status: 'error', 
        message: 'Chave OpenAI não configurada para esta loja',
        details: 'O Master Admin precisa configurar a API Key OpenAI para esta loja'
      });
      return new Response(JSON.stringify({ 
        error: 'API Key OpenAI não configurada para esta loja. Solicite ao administrador.', 
        steps 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    steps.push({ step: 'openai_key_check', status: 'success', message: 'Chave OpenAI da loja configurada', details: '****' + openaiApiKey.slice(-4) });

    const evolutionUrl = evolutionConfig.api_url.replace(/\/$/, '');

    // Buscar produtos e categorias (incluindo slug para links)
    const { data: products } = await supabaseClient
      .from('products')
      .select('*, slug')
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

      // 3. Buscar credencial existente para esta loja específica
      const storeCredentialName = `store_${store.slug}_openai`;
      const storeCredential = existingCreds.find(c => c.name === storeCredentialName);
      if (storeCredential?.id) {
        console.log('Reutilizando credencial existente:', storeCredential.id);
        steps.push({
          step: 'openai_creds_reuse',
          status: 'success',
          message: `Reutilizando credencial "${storeCredentialName}"`,
          details: `ID: ${storeCredential.id.slice(0, 8)}...`,
        });
        
        return storeCredential.id;
      }

      // 4. Criar nova credencial para a loja
      if (!openaiApiKey) {
        steps.push({
          step: 'openai_creds_create',
          status: 'error',
          message: 'Chave OpenAI necessária para criar credencial',
        });
        return null;
      }

      console.log('Criando nova credencial OpenAI para loja:', store.slug);
      steps.push({
        step: 'openai_creds_creating',
        status: 'success',
        message: `Criando credencial "${storeCredentialName}"...`,
      });

      try {
        const createResp = await fetch(`${evolutionUrl}/openai/creds/${instanceName}`, {
          method: 'POST',
          headers: {
            'apikey': evolutionConfig.api_key,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: storeCredentialName,
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

        // ⚠️ IMPORTANTE: manter padrão de rotas da Evolution igual ao /openai/status/{instance}/{botId}
        // Ou seja: /openai/delete/{instanceName}/{botId}
        const deleteResp = await fetch(`${evolutionUrl}/openai/delete/${instanceName}/${botId}`, {
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
    // FUNÇÃO: Garantir bot com estratégia UPDATE-FIRST (preserva configurações!)
    // ========================================
    async function ensureOpenAiBot(
      instanceName: string,
      openaiCredsId: string,
      botPayload: any,
      storeName: string,
      existingBotId?: string | null
    ): Promise<{ success: boolean; botId: string | null; created: boolean }> {
      botPayload.description = `Bot Mostralo - ${storeName}`;

      // Se já temos um bot ID salvo no banco, tentar UPDATE primeiro (SEGURO - preserva configurações!)
      if (existingBotId) {
        steps.push({
          step: 'bot_update_attempt',
          status: 'success',
          message: 'Atualizando bot existente via UPDATE (preserva configurações)...',
          details: `ID: ${existingBotId.slice(0, 8)}...`,
        });

        try {
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

          const updateText = await updateResp.text();
          console.log('Resposta update bot:', updateResp.status, updateText);

          if (updateResp.ok) {
            steps.push({
              step: 'bot_updated',
              status: 'success',
              message: 'Bot atualizado com sucesso! (configurações preservadas)',
              details: `ID mantido: ${existingBotId.slice(0, 8)}...`,
            });
            return { success: true, botId: existingBotId, created: false };
          }

          if (updateResp.status === 404) {
            steps.push({
              step: 'bot_not_found',
              status: 'warning',
              message: 'Bot não encontrado na Evolution, criando novo...',
            });
            // Continua para criar novo
          } else {
            steps.push({
              step: 'bot_update_failed',
              status: 'warning',
              message: 'Falha ao atualizar, tentando criar novo...',
              details: updateText.slice(0, 100),
            });
          }
        } catch (e) {
          steps.push({
            step: 'bot_update_error',
            status: 'warning',
            message: 'Erro ao atualizar, tentando criar novo...',
            details: String(e),
          });
        }
      } else {
        // Sem ID existente, verificar se há bots na instância
        steps.push({
          step: 'bot_search',
          status: 'success',
          message: 'Consultando bots existentes na Evolution...',
        });

        const existingBots = await findExistingBots(instanceName);

        if (existingBots.length > 0 && existingBots[0].id) {
          const foundBotId = existingBots[0].id;
          steps.push({
            step: 'bot_found',
            status: 'success',
            message: `Bot encontrado na instância, tentando atualizar...`,
            details: `ID: ${foundBotId.slice(0, 8)}...`,
          });

          try {
            const updateResp = await fetch(
              `${evolutionUrl}/openai/settings/${foundBotId}/${instanceName}`,
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
              steps.push({
                step: 'bot_updated',
                status: 'success',
                message: 'Bot encontrado e atualizado com sucesso!',
                details: `ID: ${foundBotId.slice(0, 8)}...`,
              });
              return { success: true, botId: foundBotId, created: false };
            }
          } catch (e) {
            console.log('Erro ao atualizar bot encontrado:', e);
          }
        }
      }

      // Criar novo bot (apenas se UPDATE falhou ou não existe)
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

        if (createResp.ok) {
          let botData: any = {};
          try {
            botData = JSON.parse(createText);
          } catch {
            botData = {};
          }

          const newBotId = botData.id || botData.openaiBot?.id || null;

          steps.push({
            step: 'bot_created',
            status: 'success',
            message: 'Novo bot criado com sucesso!',
            details: newBotId ? `ID: ${newBotId.slice(0, 8)}...` : 'ID não retornado',
          });

          // ✅ GARANTIA: alguns ambientes criam o bot "vazio" no /openai/create.
          // Após criar, sempre aplicar as configurações via PUT /openai/settings.
          if (newBotId) {
            try {
              console.log('Aplicando settings no bot recém-criado:', newBotId);
              const applyResp = await fetch(
                `${evolutionUrl}/openai/settings/${newBotId}/${instanceName}`,
                {
                  method: 'PUT',
                  headers: {
                    'apikey': evolutionConfig.api_key,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(botPayload),
                }
              );

              const applyText = await applyResp.text();
              console.log('Resposta apply settings:', applyResp.status, applyText);

              if (!applyResp.ok) {
                steps.push({
                  step: 'bot_apply_settings_failed',
                  status: 'error',
                  message: 'Bot criado, mas falhou ao aplicar configurações (settings).',
                  details: `Status: ${applyResp.status} - ${applyText.slice(0, 150)}`,
                });
                return { success: false, botId: newBotId, created: true };
              }

              steps.push({
                step: 'bot_apply_settings',
                status: 'success',
                message: 'Configurações aplicadas no bot recém-criado (settings).',
                details: `ID: ${newBotId.slice(0, 8)}...`,
              });
            } catch (e) {
              steps.push({
                step: 'bot_apply_settings_error',
                status: 'error',
                message: 'Bot criado, mas erro ao aplicar configurações (settings).',
                details: String(e),
              });
              return { success: false, botId: newBotId, created: true };
            }
          }

          return { success: true, botId: newBotId, created: true };
        }

        // Se já existe, buscar o ID existente e tentar aplicar settings
        if (createText.includes('already exists') || createText.includes('already')) {
          const existingBots = await findExistingBots(instanceName);
          if (existingBots.length > 0 && existingBots[0].id) {
            const existingId = existingBots[0].id as string;
            steps.push({
              step: 'bot_exists',
              status: 'success',
              message: 'Bot já existe, aplicando configurações via UPDATE',
              details: `ID: ${existingId.slice(0, 8)}...`,
            });

            try {
              const applyResp = await fetch(
                `${evolutionUrl}/openai/settings/${existingId}/${instanceName}`,
                {
                  method: 'PUT',
                  headers: {
                    'apikey': evolutionConfig.api_key,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(botPayload),
                }
              );
              const applyText = await applyResp.text();
              console.log('Resposta apply settings (existing):', applyResp.status, applyText);

              if (!applyResp.ok) {
                steps.push({
                  step: 'bot_apply_settings_failed',
                  status: 'error',
                  message: 'Bot já existia, mas falhou ao aplicar configurações (settings).',
                  details: `Status: ${applyResp.status} - ${applyText.slice(0, 150)}`,
                });
                return { success: false, botId: existingId, created: false };
              }

              steps.push({
                step: 'bot_apply_settings',
                status: 'success',
                message: 'Configurações aplicadas no bot existente (settings).',
                details: `ID: ${existingId.slice(0, 8)}...`,
              });

              return { success: true, botId: existingId, created: false };
            } catch (e) {
              steps.push({
                step: 'bot_apply_settings_error',
                status: 'error',
                message: 'Erro ao aplicar configurações no bot existente (settings).',
                details: String(e),
              });
              return { success: false, botId: existingId, created: false };
            }
          }
        }

        steps.push({
          step: 'bot_create_failed',
          status: 'error',
          message: 'Falha ao criar bot',
          details: `Status: ${createResp.status} - ${createText.slice(0, 150)}`,
        });

        return { success: false, botId: null, created: false };
      } catch (e) {
        steps.push({
          step: 'bot_create_error',
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

      // 2. Gerar prompt com dados da loja (com detecção automática de domínio e personalidade)
      const botName = config.botName || 'Assistente';
      
      // Buscar configurações de personalidade do banco
      const personalitySettings: PersonalitySettings = {
        personality: (existingBotConfig?.personality || 'friendly') as PersonalityType,
        emojiLevel: (existingBotConfig?.emoji_level || 'moderate') as EmojiLevel,
        customGreeting: existingBotConfig?.custom_greeting || ''
      };
      
      console.log('Personalidade do bot:', personalitySettings);
      
      // Calcular storeLink para usar no assistantMessages (few-shot learning)
      const baseUrl = getStoreBaseUrl(store, origin);
      const storeLink = `${baseUrl}/loja/${store.slug}`;
      
      // ==============================
      // CONTEXTO DE HORÁRIO E STATUS
      // ==============================
      const timezone = store.timezone || 'America/Sao_Paulo';
      const { greeting, currentTime, hour } = getGreetingForTime(timezone);
      const isOpen = isStoreOpenNow(store.business_hours, timezone);
      const nextOpening = !isOpen ? getNextOpeningTime(store.business_hours, timezone) : null;
      
      const statusContext: StoreStatusContext = {
        greeting,
        currentTime,
        isOpen,
        nextOpening,
        timezone
      };
      
      console.log('Contexto de status:', statusContext);
      
      const systemPrompt = generateSystemPrompt(
        botName, 
        store, 
        products || [], 
        categories || [], 
        origin,
        personalitySettings,
        statusContext
      );

      steps.push({
        step: 'prompt_generate',
        status: 'success',
        message: 'Prompt gerado com dados da loja',
        details: `${products?.length || 0} produto(s), ${categories?.length || 0} categoria(s), ${greeting}, ${isOpen ? 'ABERTO' : 'FECHADO'}`,
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

      // 4. Montar saudação dinâmica para few-shot learning
      const dynamicGreeting = isOpen
        ? `${greeting}! 👋 Estamos abertos e prontos para atender! Seja bem-vindo(a) à ${store.name}!\n\n📱 Acesse nossa loja: ${storeLink}`
        : `${greeting}! 👋 No momento estamos fechados${nextOpening ? `, mas abrimos ${nextOpening}` : ''}. Seja bem-vindo(a) à ${store.name}!\n\n📱 Enquanto isso, acesse nossa loja: ${storeLink}`;

      // 5. Montar payload do bot
      let botPayload: any = {
        enabled: true,
        openaiCredsId: openaiCredsId,
        botType: 'chatCompletion',
        model: model,
        maxTokens: evolutionConfig.openai_max_tokens || 1000,
        systemMessages: [systemPrompt],
        assistantMessages: [dynamicGreeting],
        userMessages: ['Oi', 'Olá', 'Boa tarde', 'Boa noite', 'Bom dia', 'Vocês estão abertos?', 'Está aberto?'],
        triggerType: config.triggerType || 'all',
        triggerOperator: config.triggerOperator || 'contains',
        triggerValue: config.triggerValue || '',
        expire: config.expireMinutes || 20,
        keywordFinish: config.keywordFinish || '#SAIR',
        delayMessage: config.delayMessage || 4000,
        unknownMessage: config.unknownMessage || 'Desculpe, não entendi. Digite #SAIR para encerrar ou acesse nossa loja online.',
        listeningFromMe: config.listeningFromMe || false,
        stopBotFromMe: config.stopBotFromMe !== undefined ? config.stopBotFromMe : true,
        keepOpen: config.keepOpen || false,
        debounceTime: config.debounceTime || 10,
        ignoreJids: config.ignoreJids || [],
        splitMessages: config.splitMessages !== undefined ? config.splitMessages : true,
        timePerChar: config.timePerChar || 0,
      };

      // 🧹 SANITIZAÇÃO: Remover "cardápio" de todos os textos antes de enviar
      botPayload = sanitizeBotPayload(botPayload);
      console.log('Payload do bot sanitizado (cardápio -> loja):', JSON.stringify(botPayload, null, 2));

      // 5. Garantir bot com estratégia UPDATE-FIRST (preserva configurações!)
      const botResult = await ensureOpenAiBot(
        config.instanceName, 
        openaiCredsId, 
        botPayload, 
        store.name,
        existingBotConfig?.evolution_bot_id  // Passa o ID existente
      );

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
        responseMeta: {
          function: 'openai-bot-sync',
          version: FUNCTION_VERSION,
          timestamp: new Date().toISOString(),
          methodUsed: botResult.created ? 'CREATE' : 'UPDATE'
        }
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
