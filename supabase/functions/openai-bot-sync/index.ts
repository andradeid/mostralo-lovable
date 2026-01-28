// OpenAI Bot Sync - v3.2.0 - Suporte a Assistente Inteligente v2
// Adicionado: modo 'assistant' com function calling para catálogos grandes
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tipos de modo do bot
type BotModeType = 'chat_completion' | 'assistant';

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
      return origin.replace(/\/$/, '');
    }
  }
  
  // 3º Prioridade: Fallback padrão
  return 'https://mostralo.com.br';
}

function generateSystemPrompt(
  botName: string, 
  store: any, 
  products: any[], 
  categories: any[], 
  origin?: string,
  personalitySettings?: PersonalitySettings
): string {
  const baseUrl = getStoreBaseUrl(store, origin);
  const storeLink = `${baseUrl}/loja/${store.slug}`;
  
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

PERSONALIZAÇÃO COM NOME DO CLIENTE E SAUDAÇÃO DINÂMICA (MUITO IMPORTANTE):
- Você receberá o nome do cliente no campo "pushName" das mensagens do WhatsApp
- SEMPRE use o nome do cliente na primeira interação para criar conexão pessoal
- Durante a conversa, chame o cliente pelo nome ocasionalmente de forma natural
- Se o pushName não estiver disponível, use "você" de forma amigável

SAUDAÇÃO BASEADA NO HORÁRIO (Fuso: Brasília UTC-3):
- 05:00 às 11:59 → "Bom dia, [Nome]! ☀️"
- 12:00 às 17:59 → "Boa tarde, [Nome]! 🌤️"
- 18:00 às 23:59 → "Boa noite, [Nome]! 🌙"
- 00:00 às 04:59 → "Boa madrugada, [Nome]! 🌃"

EXEMPLO DE PRIMEIRA MENSAGEM:
"Bom dia, Andrade! ☀️ Bem-vindo à ${store.name || 'nossa loja'}! Como posso te ajudar?"

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

CATEGORIAS DISPONÍVEIS:
${categoryList || 'Não há categorias cadastradas'}

PRODUTOS DISPONÍVEIS:
${productList || 'Não há produtos cadastrados'}

INSTRUÇÕES DE SAUDAÇÃO:
1. Seja sempre acolhedor e educado
2. Se o cliente informar o nome, USE o nome nas respostas seguintes
3. **SEMPRE envie o link da loja na primeira mensagem**
4. Se perguntarem se está aberto, consulte o horário de funcionamento acima

RESTRIÇÕES IMPORTANTES (OBRIGATÓRIO):
- Você SOMENTE responde sobre a loja, produtos, pedidos, entregas, pagamentos e informações do negócio
- Se o cliente perguntar sobre assuntos fora do contexto da loja (história, política, celebridades, etc.), responda educadamente: "Desculpe, sou especialista apenas em ajudar você com nossa loja! 😊 Posso ajudar com nossos produtos ou pedidos?"
- NUNCA mencione concorrentes, outras lojas ou marketplaces (iFood, Rappi, Uber Eats, etc.)
- NUNCA responda perguntas de conhecimento geral que não sejam sobre a loja
- Mantenha o foco EXCLUSIVAMENTE nos produtos e serviços da ${store.name}

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

LINKS DE PRODUTOS:
- Quando o cliente perguntar sobre um produto específico, SEMPRE envie o link do produto
- Use o formato: "Você pode ver mais detalhes e pedir aqui: [link]"

ENCERRAMENTO:
- Quando o cliente digitar a palavra de encerramento, agradeça e finalize
- Sempre deseje uma boa experiência ao cliente`;
}

// ========================================
// GERADOR DE PROMPT v2 - ASSISTENTE INTELIGENTE
// Prompt enxuto com function calling
// ========================================
function generateAssistantModePrompt(
  botName: string,
  store: any,
  storeLink: string,
  navigationLink: string,
  personalitySettings: PersonalitySettings,
  customInstructions?: string
): string {
  const personalityInstructions = generatePersonalityInstructions(personalitySettings);

  // Seção de localização
  const locationSection = navigationLink 
    ? `\nLOCALIZAÇÃO E NAVEGAÇÃO:
- Endereço: ${store.address || 'Não informado'}
- Cidade/Estado: ${store.city || ''}${store.city && store.state ? '/' : ''}${store.state || ''}
- 📍 Link para navegação: ${navigationLink}
- Quando cliente pedir localização/endereço, ENVIE o link de navegação
- O cliente poderá escolher: Google Maps, Waze ou Uber`
    : (store.google_maps_link 
        ? `\nLOCALIZAÇÃO:
- Endereço: ${store.address || 'Não informado'}
- 📍 Link do Google Maps: ${store.google_maps_link}` 
        : '');

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

  return `Você é ${botName}, assistente virtual da ${store.name || 'loja'}.

Quando o cliente perguntar seu nome, responda: "Meu nome é ${botName}!"

PERSONALIZAÇÃO COM NOME DO CLIENTE E SAUDAÇÃO DINÂMICA (MUITO IMPORTANTE):
- Você receberá o nome do cliente no campo "pushName" das mensagens
- SEMPRE use o nome do cliente na primeira interação para criar conexão pessoal
- Durante a conversa, chame o cliente pelo nome ocasionalmente de forma natural
- Se o pushName não estiver disponível, use "você" de forma amigável

SAUDAÇÃO BASEADA NO HORÁRIO (Fuso: Brasília UTC-3):
- 05:00 às 11:59 → "Bom dia, [Nome]! ☀️"
- 12:00 às 17:59 → "Boa tarde, [Nome]! 🌤️"
- 18:00 às 23:59 → "Boa noite, [Nome]! 🌙"
- 00:00 às 04:59 → "Boa madrugada, [Nome]! 🌃"

EXEMPLO DE PRIMEIRA MENSAGEM:
"Bom dia, Andrade! ☀️ Bem-vindo à ${store.name || 'nossa loja'}! Como posso te ajudar?"

${personalityInstructions}

CAPACIDADES (use as funções disponíveis):
- Buscar produtos: search_products("termo")
- Verificar estoque: check_stock("nome produto")
- Ver detalhes: get_product_details("slug")
- Listar categorias: list_categories()
- Mostrar promoções: get_promotions()
- Recomendar produtos: get_recommendations()

REGRAS CRÍTICAS:
1. SEMPRE use search_products antes de falar sobre produtos
2. Se perguntarem "tem X?", verifique estoque real com check_stock
3. NÃO invente produtos - só use dados retornados pelas funções
4. SEMPRE inclua o LINK do produto nas respostas
5. Se pedirem sugestão/recomendação, use get_recommendations()
6. Se não encontrar, sugira buscar com outros termos

FORMATAÇÃO OBRIGATÓRIA DE PRODUTOS:
Ao listar produtos, use EXATAMENTE este formato limpo:

1. *Dipirona 1000mg 30cps* - R$ 37,80
   👉 https://mostralo.com.br/loja/farmacia/produto/dipirona

2. *Vitamina C 1g* - R$ 25,90
   👉 https://mostralo.com.br/loja/farmacia/produto/vitamina-c

REGRAS DE FORMATAÇÃO (OBRIGATÓRIO):
- NÃO use colchetes [ ] em nenhuma parte do texto
- NÃO use parênteses ( ) ao redor de links
- NÃO use formato markdown de link como [texto](url) ou (url)
- O link deve estar SOZINHO na linha, sem parênteses
- Use asterisco simples *nome* para negrito (não duplo **)
- Separe cada produto com uma linha em branco
- Coloque um emoji 👉 antes do link para destacar

${customInstructions ? `INSTRUÇÕES PERSONALIZADAS DA LOJA:
${customInstructions}
` : ''}
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

RESTRIÇÕES IMPORTANTES (OBRIGATÓRIO):
- Você SOMENTE responde sobre a loja, produtos, pedidos, entregas, pagamentos e informações do negócio
- Se o cliente perguntar sobre assuntos fora do contexto da loja (história, política, celebridades, etc.), responda educadamente: "Desculpe, sou especialista apenas em ajudar você com nossa loja! 😊 Posso ajudar com nossos produtos ou pedidos?"
- NUNCA mencione concorrentes, outras lojas ou marketplaces (iFood, Rappi, Uber Eats, etc.)
- NUNCA responda perguntas de conhecimento geral que não sejam sobre a loja
- Mantenha o foco EXCLUSIVAMENTE nos produtos e serviços da loja

INSTRUÇÕES GERAIS:
1. Quando pedirem localização, envie o link de navegação
2. Informe horários quando perguntado
3. Informe formas de pagamento quando perguntado
4. Responda sempre em português brasileiro
5. Seja acolhedor e prestativo
6. **SEMPRE envie o link da loja na primeira mensagem**

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

    // Verificar autenticação do usuário
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
    
    const userId = user.id;

    const { action, config, origin } = await req.json() as { action: string; config: BotConfig; origin?: string };

    // Buscar loja do usuário com todos os campos necessários
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

    // Verificar permissão do usuário
    const isMasterAdmin = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'master_admin')
      .single();

    if (!isMasterAdmin.data && store.owner_id !== userId) {
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

    // Verificar API Key OpenAI da loja
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

    // Buscar produtos e categorias
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

      // Se temos ID salvo, verificar se ainda é válido
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

      // Buscar credencial existente para esta loja específica
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

      // Criar nova credencial para a loja
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
    // FUNÇÃO: Atualizar bot existente na Evolution (PUT)
    // ========================================
    async function updateExistingBot(
      instanceName: string, 
      botId: string, 
      botPayload: any
    ): Promise<{ success: boolean; error?: string }> {
      try {
        console.log('Atualizando bot via PUT:', botId, 'na instância:', instanceName);
        console.log('Payload de atualização:', JSON.stringify(botPayload, null, 2));
        
        const updateResp = await fetch(
          `${evolutionUrl}/openai/update/${botId}/${instanceName}`, 
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
          return { success: true };
        }
        
        return { 
          success: false, 
          error: `Status ${updateResp.status}: ${updateText.slice(0, 200)}` 
        };
      } catch (e) {
        console.log('Erro ao atualizar bot:', e);
        return { success: false, error: String(e) };
      }
    }

    // ========================================
    // FUNÇÃO: Garantir bot com estratégia UPDATE > DELETE + CREATE
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
        const mainBot = existingBots[0];
        
        steps.push({
          step: 'bot_list',
          status: 'success',
          message: `${existingBots.length} bot(s) encontrado(s)`,
          details: existingBots.map((b) => `${b.description || b.id?.slice(0, 8) || 'sem-id'}`).join(', '),
        });

        // ESTRATÉGIA 1: Tentar UPDATE primeiro (mais seguro, bot não fica offline)
        if (mainBot.id) {
          steps.push({
            step: 'bot_update',
            status: 'success',
            message: 'Atualizando bot existente via PUT...',
            details: `Bot ID: ${mainBot.id.slice(0, 8)}...`,
          });

          const updateResult = await updateExistingBot(instanceName, mainBot.id, botPayload);
          
          if (updateResult.success) {
            steps.push({
              step: 'bot_updated',
              status: 'success',
              message: '✅ Bot atualizado com sucesso! (sem interrupção)',
              details: `ID: ${mainBot.id.slice(0, 8)}...`,
            });
            return { success: true, botId: mainBot.id, created: false };
          }

          // UPDATE falhou, usar fallback DELETE + CREATE
          steps.push({
            step: 'bot_update_fallback',
            status: 'warning',
            message: 'UPDATE falhou, tentando DELETE + CREATE...',
            details: updateResult.error?.slice(0, 100) || 'Erro desconhecido',
          });
        }

        // ESTRATÉGIA 2 (Fallback): DELETE + CREATE
        for (const bot of existingBots) {
          if (bot.id) {
            steps.push({
              step: 'bot_delete',
              status: 'success',
              message: 'Removendo bot para recriar...',
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

      // Detectar modo do bot (v1 ou v2)
      const botMode: BotModeType = (existingBotConfig?.bot_mode as BotModeType) || config.botMode || 'chat_completion';
      const isAssistantMode = botMode === 'assistant';

      steps.push({
        step: 'bot_mode',
        status: 'success',
        message: `Modo: ${isAssistantMode ? 'Assistente Inteligente v2' : 'Simples (chat_completion)'}`,
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

      // 2. Gerar prompt com dados da loja
      const botName = config.botName || 'Assistente';
      
      // Buscar configurações de personalidade do banco
      const personalitySettings: PersonalitySettings = {
        personality: (existingBotConfig?.personality || 'friendly') as PersonalityType,
        emojiLevel: (existingBotConfig?.emoji_level || 'moderate') as EmojiLevel,
        customGreeting: existingBotConfig?.custom_greeting || ''
      };
      
      console.log('Personalidade do bot:', personalitySettings);
      
      // Calcular storeLink para usar no assistantMessages
      const baseUrl = getStoreBaseUrl(store, origin);
      const storeLink = `${baseUrl}/loja/${store.slug}`;
      
      let systemPrompt: string;
      
      if (isAssistantMode) {
        // Modo v2: Prompt enxuto com function calling
        const customInstructions = existingBotConfig?.custom_prompt_instructions || config.customPromptInstructions || '';
        const navigationLink = store.latitude && store.longitude && store.slug
          ? `${baseUrl}/navegar?lat=${store.latitude}&lng=${store.longitude}&store=${store.slug}`
          : store.google_maps_link || '';

        systemPrompt = generateAssistantModePrompt(
          botName,
          store,
          storeLink,
          navigationLink,
          personalitySettings,
          customInstructions
        );

        steps.push({
          step: 'prompt_generate',
          status: 'success',
          message: 'Prompt v2 gerado (modo inteligente)',
          details: 'Sem produtos no prompt - consultas em tempo real',
        });
      } else {
        // Modo v1: Prompt com todos os produtos
        systemPrompt = generateSystemPrompt(
          botName, 
          store, 
          products || [], 
          categories || [], 
          origin,
          personalitySettings
        );

        steps.push({
          step: 'prompt_generate',
          status: 'success',
          message: 'Prompt gerado com dados da loja',
          details: `${products?.length || 0} produto(s), ${categories?.length || 0} categoria(s)`,
        });
      }

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

      // 4. Montar saudação fixa (sem horário dinâmico)
      const greeting = personalitySettings.customGreeting || `Olá! 👋 Seja bem-vindo(a) à ${store.name}!`;
      const fixedGreeting = `${greeting}\n\n📱 Confira nossa loja: ${storeLink}`;

      // 5. Montar payload do bot
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      
      const botPayload: any = {
        enabled: true,
        openaiCredsId: openaiCredsId,
        botType: isAssistantMode ? 'assistant' : 'chatCompletion',
        model: model,
        maxTokens: evolutionConfig.openai_max_tokens || 1000,
        systemMessages: [systemPrompt],
        assistantMessages: [fixedGreeting],
        userMessages: ['Oi', 'Olá', 'Boa tarde', 'Boa noite', 'Bom dia', 'Vocês estão abertos?', 'Está aberto?'],
        triggerType: config.triggerType || 'all',
        triggerOperator: config.triggerOperator || 'contains',
        triggerValue: config.triggerValue || '',
        // IMPORTANTE: expire=0 = sessão nunca expira (mantém bot sempre ativo)
        // Anteriormente era 20min o que causava "travamentos" do bot
        expire: config.expireMinutes === 0 ? 0 : (config.expireMinutes || 0),
        keywordFinish: config.keywordFinish || '#SAIR',
        delayMessage: config.delayMessage || 4000,
        unknownMessage: config.unknownMessage || 'Desculpe, não entendi. Digite #SAIR para encerrar ou acesse nossa loja online.',
        listeningFromMe: config.listeningFromMe || false,
        stopBotFromMe: config.stopBotFromMe !== undefined ? config.stopBotFromMe : true,
        // IMPORTANTE: keepOpen=true mantém a thread aberta entre mensagens
        // Isso evita que o bot "trave" e pare de responder
        keepOpen: config.keepOpen !== undefined ? config.keepOpen : true,
        debounceTime: config.debounceTime || 10,
        ignoreJids: config.ignoreJids || [],
        splitMessages: config.splitMessages !== undefined ? config.splitMessages : true,
        timePerChar: config.timePerChar || 0,
      };

      // Se modo assistant, criar/atualizar OpenAI Assistant e adicionar ao payload
      let openaiAssistantId: string | null = existingBotConfig?.openai_assistant_id || null;
      
      if (isAssistantMode) {
        // Criar/atualizar OpenAI Assistant
        steps.push({
          step: 'openai_assistant_check',
          status: 'success',
          message: 'Verificando OpenAI Assistant...',
          details: openaiAssistantId ? `ID existente: ${openaiAssistantId.slice(0, 12)}...` : 'Criando novo...',
        });

        try {
          const assistantTools = [
            {
              type: 'function',
              function: {
                name: 'search_products',
                description: 'Busca produtos no catálogo por nome ou termo.',
                parameters: {
                  type: 'object',
                  properties: {
                    query: { type: 'string', description: 'Termo de busca' },
                    limit: { type: 'number', description: 'Quantidade máxima de resultados' },
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
                  properties: {
                    product_name: { type: 'string', description: 'Nome do produto' },
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
          ];

          const assistantPayload = {
            name: `${config.botName || 'Assistente'} - ${store.name}`,
            instructions: systemPrompt,
            tools: assistantTools,
            model: model,
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
              steps.push({
                step: 'openai_assistant_updated',
                status: 'success',
                message: 'OpenAI Assistant atualizado',
                details: `ID: ${openaiAssistantId?.slice(0, 12)}...`,
              });
            } else {
              // Se falhou (404 ou outro), criar novo
              console.log('Update do Assistant falhou, criando novo...');
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

            if (!createResp.ok) {
              const errorText = await createResp.text();
              console.error('Erro ao criar Assistant:', errorText);
              steps.push({
                step: 'openai_assistant_create',
                status: 'error',
                message: 'Falha ao criar OpenAI Assistant',
                details: errorText.slice(0, 100),
              });
              return new Response(JSON.stringify({
                success: false,
                error: 'Falha ao criar OpenAI Assistant',
                steps,
              }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }

            const assistant = await createResp.json();
            openaiAssistantId = assistant.id;
            steps.push({
              step: 'openai_assistant_created',
              status: 'success',
              message: 'OpenAI Assistant criado',
              details: `ID: ${openaiAssistantId?.slice(0, 12)}...`,
            });
          }

          // Adicionar assistantId ao payload do bot
          botPayload.assistantId = openaiAssistantId;
          botPayload.functionUrl = `${supabaseUrl}/functions/v1/product-search-agent?storeId=${config.storeId}`;
          
          steps.push({
            step: 'function_url',
            status: 'success',
            message: 'URL de funções configurada',
            details: `product-search-agent para loja ${config.storeId.slice(0, 8)}...`,
          });
        } catch (assistantError) {
          console.error('Erro ao gerenciar OpenAI Assistant:', assistantError);
          steps.push({
            step: 'openai_assistant_error',
            status: 'error',
            message: 'Erro ao gerenciar OpenAI Assistant',
            details: String(assistantError).slice(0, 100),
          });
          return new Response(JSON.stringify({
            success: false,
            error: 'Erro ao criar/atualizar OpenAI Assistant',
            steps,
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      console.log('Payload do bot:', JSON.stringify(botPayload, null, 2));

      // 6. Garantir bot com consulta prévia
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

      // 7. Salvar configuração no banco
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
        openai_creds_id: openaiCredsId,
        updated_at: new Date().toISOString(),
        // Campos do Assistente Inteligente v2
        bot_mode: botMode,
        openai_assistant_id: openaiAssistantId || existingBotConfig?.openai_assistant_id || null,
        custom_prompt_instructions: config.customPromptInstructions || existingBotConfig?.custom_prompt_instructions || null,
        // Flags de sincronização
        needs_sync: false,
        last_synced_at: new Date().toISOString(),
        last_sync_error: null,
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
    
    // Salvar erro no banco para visibilidade
    try {
      const { config } = await req.clone().json().catch(() => ({ config: null }));
      if (config?.storeId) {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        await supabaseClient
          .from('store_bot_config')
          .update({ last_sync_error: message })
          .eq('store_id', config.storeId);
      }
    } catch (e) {
      console.error('Erro ao salvar last_sync_error:', e);
    }
    
    return new Response(JSON.stringify({ error: message, steps }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
