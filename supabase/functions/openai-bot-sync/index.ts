// OpenAI Bot Sync - v3.2.0 - Suporte a Assistente Inteligente v2
// Adicionado: modo 'assistant' com function calling para catálogos grandes
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tipos de modo do bot
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

// Tipos de personalidade do bot
type PersonalityType = 'professional' | 'friendly' | 'fun' | 'consultive';
type EmojiLevel = 'none' | 'moderate' | 'abundant';

interface PersonalitySettings {
  personality: PersonalityType;
  emojiLevel: EmojiLevel;
  customGreeting: string;
}

// Mapeamento de timezones brasileiros para descrições legíveis
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

// Gera texto das regras de nicho para injetar no prompt
function buildNicheRulesText(nicheConfig: any, nicheRules: any[]): string {
  if (!nicheConfig && nicheRules.length === 0) return '';

  const sections: string[] = [];

  // Limite de produtos por resposta
  if (nicheConfig?.max_products_per_response) {
    sections.push(`LIMITE DE PRODUTOS POR RESPOSTA: Ao mostrar produtos, exiba no MÁXIMO ${nicheConfig.max_products_per_response} opções por mensagem. Se houver mais resultados, pergunte se o cliente quer ver mais.`);
  }

  // Prompt base do nicho (template adicional)
  if (nicheConfig?.prompt_base) {
    const promptBase = nicheConfig.prompt_base
      .replace(/\{\{store_name\}\}/g, '{{STORE_NAME}}')
      .replace(/\{\{bot_name\}\}/g, '{{BOT_NAME}}');
    sections.push(`INSTRUÇÕES ESPECÍFICAS DO NICHO:\n${promptBase}`);
  }

  // Restrições do nicho
  if (nicheConfig?.restrictions) {
    sections.push(`RESTRIÇÕES DO NICHO:\n${nicheConfig.restrictions}`);
  }

  // Regras modulares ativas
  if (nicheRules.length > 0) {
    const rulesText = nicheRules.map((rule, i) => {
      return `${i + 1}. *${rule.name}* (${rule.rule_type})\n   Gatilho: ${rule.trigger_condition}\n   ${rule.action_prompt}`;
    }).join('\n\n');
    sections.push(`REGRAS DE COMPORTAMENTO DO NICHO (SIGA RIGOROSAMENTE):\n${rulesText}`);
  }

  return sections.length > 0 ? `\n\n${'='.repeat(40)}\nCONFIGURAÇÕES INTELIGENTES DO NICHO\n${'='.repeat(40)}\n${sections.join('\n\n')}` : '';
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

// Formatar zonas de entrega com taxas por horário
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
  personalitySettings?: PersonalitySettings,
  deliveryZones?: any[]
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

  // Seção de delivery com zonas
  const zonesText = formatDeliveryZones(deliveryZones || []);
  const deliverySection = `\nDELIVERY:${zonesText 
    ? `\nÁREAS DE ENTREGA (taxa varia por região${(deliveryZones || []).some((z: any) => z.timeFees?.length) ? ' e horário' : ''}):\n${zonesText}`
    : `\n- Taxa de entrega: ${store.delivery_fee ? `R$ ${store.delivery_fee.toFixed(2)}` : 'Consulte na loja'}`}
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

PERSONALIZAÇÃO COM NOME DO CLIENTE (MUITO IMPORTANTE):
- Você pode receber o nome do cliente no campo "pushName" das mensagens do WhatsApp
- Se o pushName estiver disponível e for um nome real (não apenas números), use-o naturalmente
- Se o pushName NÃO estiver disponível ou for apenas números, NÃO invente um nome e NÃO use "[Nome]"
- Nesse caso, trate o cliente por "você" de forma amigável
- NUNCA escreva literalmente "[Nome]" nas mensagens - isso é proibido

SAUDAÇÃO BASEADA NO HORÁRIO (Fuso: ${getTimezoneDescription(store.timezone)}):
- 05:00 às 11:59 → "Bom dia! ☀️" (adicione o nome do cliente APENAS se souber)
- 12:00 às 17:59 → "Boa tarde! 🌤️" (adicione o nome do cliente APENAS se souber)
- 18:00 às 23:59 → "Boa noite! 🌙" (adicione o nome do cliente APENAS se souber)
- 00:00 às 04:59 → "Boa madrugada! 🌃" (adicione o nome do cliente APENAS se souber)

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
  customInstructions?: string,
  deliveryZones?: any[]
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

  // Seção de delivery com zonas
  const zonesTextV2 = formatDeliveryZones(deliveryZones || []);
  const deliverySection = `\nDELIVERY:${zonesTextV2 
    ? `\nÁREAS DE ENTREGA (taxa varia por região${(deliveryZones || []).some((z: any) => z.timeFees?.length) ? ' e horário' : ''}):\n${zonesTextV2}`
    : `\n- Taxa de entrega: ${store.delivery_fee ? `R$ ${store.delivery_fee.toFixed(2)}` : 'Consulte na loja'}`}
- Pedido mínimo: ${store.min_order_value ? `R$ ${store.min_order_value.toFixed(2)}` : 'Sem valor mínimo'}`;

  // Seção de horários
  const hoursSection = `\nHORÁRIO DE FUNCIONAMENTO:
${formatBusinessHours(store.business_hours)}`;

  return `Você é ${botName}, assistente virtual da ${store.name || 'loja'}.

Quando o cliente perguntar seu nome, responda: "Meu nome é ${botName}!"

PERSONALIZAÇÃO COM NOME DO CLIENTE (MUITO IMPORTANTE):
- Você pode receber o nome do cliente no campo "pushName" das mensagens
- Se o pushName estiver disponível e for um nome real, use-o naturalmente
- Se NÃO estiver disponível, NÃO invente e NÃO use "[Nome]" - trate por "você"
- NUNCA escreva literalmente "[Nome]" nas mensagens

SAUDAÇÃO NA PRIMEIRA MENSAGEM:
- Use "Oi! 😊" ou "Olá! 👋" como saudação (adicione o nome APENAS se souber pelo pushName)
- NÃO use saudações baseadas em horário (Bom dia, Boa tarde, Boa noite)
- Seja acolhedor e direto
- Exemplo: "Oi, ${store.name ? 'Cliente' : 'Cliente'}! 😊 Bem-vindo à ${store.name || 'nossa loja'}! Como posso te ajudar?"

${personalityInstructions}

CAPACIDADES (use as funções disponíveis):
- Use saudação simples "Oi/Olá" + nome do cliente na primeira mensagem
- Buscar produtos: search_products("termo")
- Verificar estoque: check_stock("nome produto")
- Ver detalhes: get_product_details("slug")
- Listar categorias: list_categories()
- Mostrar promoções: get_promotions()
- Recomendar produtos: get_recommendations()
- Verificar se está aberto: check_store_status()

REGRAS CRÍTICAS:
1. NA PRIMEIRA MENSAGEM: Use saudação simples "Oi/Olá" + nome do cliente (NÃO use Bom dia/Boa tarde/Boa noite)
2. SEMPRE use search_products antes de falar sobre produtos
3. Se perguntarem "tem X?", verifique estoque real com check_stock
4. NÃO invente produtos - só use dados retornados pelas funções
5. SEMPRE inclua o LINK do produto nas respostas
6. Se pedirem sugestão/recomendação, use get_recommendations()
7. Se não encontrar, sugira buscar com outros termos

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

// ========================================
// GERADOR DE PROMPT CONVERSACIONAL
// Modo informal sem links, com recomendação de genéricos
// ========================================
function generateConversationalModePrompt(
  botName: string,
  store: any,
  personalitySettings: PersonalitySettings,
  deliveryZones: any[],
  conversationalSettings: any,
  orderQuestions: any[],
  nicheRuleTypes?: string[], // tipos de regras do nicho para suprimir seções duplicadas
  enabledTools?: string[] // tools habilitadas do nicho para condicionar seções
): string {
  // Flag: se o nicho NÃO tem calculate_delivery_fee, usar fechamento manual
  const hasDeliveryCalc = !enabledTools || enabledTools.includes('calculate_delivery_fee');
  // Determinar quais seções o nicho já cobre
  const nicheCoversGenerics = nicheRuleTypes?.some(t => t === 'generic_suggestion' || t === 'behavior') || false;
  const nicheCoversPreSearch = nicheRuleTypes?.some(t => t === 'pre_search' || t === 'behavior') || false;
  const hasAnyNicheRules = nicheRuleTypes && nicheRuleTypes.length > 0;
  const personalityInstructions = generatePersonalityInstructions(personalitySettings);

  // Seção de pagamento
  const paymentSection = `\nFORMAS DE PAGAMENTO:
${formatPaymentMethods(store)}`;

  // Seção de delivery com zonas
  const zonesText = formatDeliveryZones(deliveryZones || []);
  const deliverySection = `\nDELIVERY:${zonesText
    ? `\nÁREAS DE ENTREGA (taxa varia por região${(deliveryZones || []).some((z: any) => z.timeFees?.length) ? ' e horário' : ''}):\n${zonesText}`
    : `\n- Taxa de entrega: ${store.delivery_fee ? `R$ ${store.delivery_fee.toFixed(2)}` : 'Consulte na loja'}`}
- Pedido mínimo: ${store.min_order_value ? `R$ ${store.min_order_value.toFixed(2)}` : 'Sem valor mínimo'}`;

  // Seção de horários
  const hoursSection = `\nHORÁRIO DE FUNCIONAMENTO:
${formatBusinessHours(store.business_hours)}`;

  // Montar perguntas sequenciais
  const enabledQuestions = (orderQuestions || [])
    .filter((q: any) => q.enabled)
    .sort((a: any, b: any) => a.sort_order - b.sort_order);

  const questionsText = enabledQuestions.length > 0
    ? enabledQuestions.map((q: any, i: number) => {
        const required = q.is_required ? '(OBRIGATÓRIA)' : '(opcional)';
        let typeHint = '';
        if (q.question_type === 'location') {
          typeHint = ' → Peça para o cliente compartilhar localização pelo WhatsApp';
        } else if (q.question_type === 'payment') {
          typeHint = ' → Ofereça as opções de pagamento disponíveis';
        } else if (q.question_type === 'address' || q.question_text?.toLowerCase().includes('endereço')) {
          typeHint = ' → ⚠️ ANTES de fazer esta pergunta, OBRIGATORIAMENTE chame get_last_delivery_info(customer_phone) com o telefone extraído do remoteJid';
        }
        return `${i + 1}. "${q.question_text}" ${required}${typeHint}`;
      }).join('\n')
    : `1. "Confirmar nome do cliente" (OBRIGATÓRIA) → ⚠️ PRIMEIRO chame get_last_delivery_info(customer_phone) para obter o nome do cadastro. Se retornar customer_name, use esse nome e apenas CONFIRME: "Seu nome é *[nome retornado]*, certo?". Só pergunte o nome se customer_name vier null E o pushName não for um nome válido.
2. "Qual o seu endereço de entrega?" (OBRIGATÓRIA) → ⚠️ ANTES de fazer esta pergunta, use o resultado do get_last_delivery_info já chamado no passo 1. Se retornou found=true com endereço, confirme-o. Se não, pergunte.
3. "Me envie sua localização 📍" (OBRIGATÓRIA) → Peça para o cliente compartilhar localização pelo WhatsApp
4. "Deseja mais alguma coisa?" (opcional)
5. "Qual forma de pagamento? (Pix, cartão, dinheiro)" (OBRIGATÓRIA) → Ofereça as opções de pagamento disponíveis
6. "Vai precisar de troco? Se sim, pra quanto?" (opcional)`;

  // Frases de genéricos
  const genericPhrases = conversationalSettings?.generic_phrases || [
    'Temos a versão genérica com o mesmo princípio ativo por um preço menor, deseja?',
    'Posso sugerir o genérico equivalente? O preço é bem mais acessível!',
  ];
  const genericPhrasesText = genericPhrases.map((p: string, i: number) => `  ${i + 1}. "${p}"`).join('\n');

  const recommendGenerics = conversationalSettings?.recommend_generics !== false;
  const neverSendLinks = conversationalSettings?.never_send_links !== false;
  const sendPhotos = conversationalSettings?.send_product_photos !== false;
  const informalTone = conversationalSettings?.informal_tone !== false;
  const closingMessage = conversationalSettings?.closing_message || 'Obrigada! Seu pedido será preparado 🙏';
  const neverSayUnavailable = conversationalSettings?.never_say_unavailable !== false;
  const unavailablePhrases = conversationalSettings?.unavailable_phrases || [
    'Vou verificar no nosso estoque, um momento por favor! 🔍',
    'No momento não localizei, mas posso encomendar pra você! Deseja?',
    'Deixa eu confirmar com nosso estoque. Pode aguardar um instante? 😊',
  ];
  const unavailablePhrasesText = unavailablePhrases.map((p: string, i: number) => `  ${i + 1}. "${p}"`).join('\n');

  return `Você é ${botName}, assistente virtual da ${store.name || 'loja'}.

Quando o cliente perguntar seu nome, responda: "Meu nome é ${botName}!"

PERSONALIZAÇÃO COM NOME DO CLIENTE (MUITO IMPORTANTE):
- Você pode receber o nome do cliente no campo "pushName" das mensagens do WhatsApp
- Se o pushName estiver disponível e for um nome real (não apenas números), use-o naturalmente na conversa
- Se o pushName NÃO estiver disponível ou for apenas números, NÃO invente um nome e NÃO use "[Nome]"
- Nesse caso, trate o cliente por "você" de forma amigável até descobrir o nome no fluxo de fechamento
- NUNCA escreva literalmente "[Nome]" nas mensagens - isso é proibido

SAUDAÇÃO BASEADA NO HORÁRIO (Fuso: ${getTimezoneDescription(store.timezone)}):
- 05:00 às 11:59 → "Bom dia! ☀️" (adicione o nome do cliente APENAS se souber)
- 12:00 às 17:59 → "Boa tarde! 🌤️" (adicione o nome do cliente APENAS se souber)
- 18:00 às 23:59 → "Boa noite! 🌙" (adicione o nome do cliente APENAS se souber)
- 00:00 às 04:59 → "Boa madrugada! 🌃" (adicione o nome do cliente APENAS se souber)

${personalityInstructions}

${informalTone ? `TOM DE COMUNICAÇÃO:
- Seja informal, acolhedor e próximo do cliente
- Use linguagem de conversa natural, como se fosse um amigo ajudando
- Evite ser robótico ou excessivamente formal` : ''}

⚠️ PROIBIÇÕES ABSOLUTAS:
${neverSendLinks ? `- NUNCA envie links de produtos, loja ou qualquer URL
- NUNCA use formato de link como https:// ou http://
- NUNCA direcione o cliente para "acessar o site" ou "ver no link"
- Se o cliente pedir link, diga que pode ajudar diretamente aqui na conversa` : '- Envie links apenas quando o cliente solicitar explicitamente'}
- NUNCA mencione concorrentes ou marketplaces
- NUNCA invente produtos ou preços
- Mantenha foco EXCLUSIVAMENTE nos produtos e serviços da loja

${sendPhotos ? `FOTOS DE PRODUTOS (IMPORTANTE):
- As fotos dos produtos são enviadas AUTOMATICAMENTE quando você usa search_products, check_stock ou get_product_details
- NÃO tente enviar fotos manualmente ou mencionar que vai enviar foto — elas já aparecem automaticamente para o cliente
- Apenas descreva o produto com nome e preço na sua resposta de texto
- O cliente já recebe a imagem junto, então não precisa dizer "vou enviar a foto"` : ''}

${(recommendGenerics && !nicheCoversGenerics) ? `RECOMENDAÇÃO DE GENÉRICOS (IMPORTANTE):
- Quando o cliente pedir um medicamento de MARCA, SEMPRE verifique se existe versão GENÉRICA disponível
- Se existir genérico, use UMA das frases abaixo (escolha aleatoriamente):
${genericPhrasesText}
- Liste primeiro o produto de marca com preço, depois sugira o genérico com preço
- Se o cliente aceitar o genérico, prossiga com ele
- Se recusar, continue com o de marca sem insistir
- NUNCA force a troca, apenas sugira educadamente` : ''}

${neverSayUnavailable ? `PRODUTO NÃO ENCONTRADO (REGRA CRÍTICA):
- NUNCA diga que o produto "não está disponível", "não temos", "está em falta" ou qualquer variação negativa
- Se não encontrar o produto no estoque, use UMA das frases abaixo (escolha aleatoriamente):
${unavailablePhrasesText}
- Após usar a frase, aguarde a resposta do cliente e continue a conversa normalmente
- O objetivo é que um atendente humano possa intervir e verificar manualmente
- NUNCA invente que tem o produto se não encontrou, apenas use as frases acima` : ''}

CAPACIDADES (use as funções disponíveis):
- Buscar produtos: search_products("termo")
- Verificar estoque: check_stock("nome produto")
- Ver detalhes: get_product_details("slug")
- Listar categorias: list_categories()
- Mostrar promoções: get_promotions()
- Recomendar produtos: get_recommendations()
- Verificar se está aberto: check_store_status()
${hasDeliveryCalc ? '- Calcular taxa de entrega por localização: calculate_delivery_fee(latitude, longitude)' : '- ⚠️ NÃO calcule taxa de entrega — colete endereço e GPS e passe para atendente humano'}

COMPORTAMENTO PROATIVO (MUITO IMPORTANTE):
- Quando o cliente perguntar "tem X?" ou "vocês têm X?", NÃO responda apenas listando o produto
- Responda com entusiasmo confirmando: "Temos sim! 😊" (adicione o nome se souber) e já descreva o produto com preço
- Logo em seguida pergunte: "Posso adicionar no seu pedido?" ou "Quer que eu anote?"
- Seja PROATIVO: aja como um vendedor animado que quer ajudar
- Se encontrou algo parecido (busca fuzzy), diga: "Achei algo parecido com o que você pediu:" e mostre

${!nicheCoversPreSearch ? `REGRA PARA CATEGORIA GENÉRICA (CRÍTICA):
- Se o cliente pedir algo amplo como "sabonete", "medicamento", "vitamina", "shampoo" etc., NÃO liste produtos direto
- Primeiro pergunte: "Perfeito! Qual tipo você procura?" e peça 1-2 critérios (ex.: infantil/adulto, marca, faixa de preço, uso)
- Só depois da resposta do cliente, aí sim busque produtos e mostre opções` : ''}

FLUXO DE ATENDIMENTO (SEGUIR RIGOROSAMENTE):
1. Saudação personalizada com nome do cliente
2. Perguntar o que o cliente precisa
${!nicheCoversPreSearch ? '3. Se pedido for genérico (ex.: sabonete), pedir especificação antes de buscar' : '3. Seguir as regras de especificação do nicho'}
4. Buscar produtos, descrever informalmente e${sendPhotos ? ' enviar foto quando disponível' : ' informar preço'}
5. SEMPRE confirme com entusiasmo: "Temos sim!" antes de mostrar o produto
${(recommendGenerics && !nicheCoversGenerics) ? '6. Se for medicamento de marca, sugerir genérico quando disponível' : hasAnyNicheRules ? '6. Seguir as regras específicas do nicho para sugestões' : ''}
7. APÓS informar cada produto com preço, SEMPRE pergunte: "Deseja mais alguma coisa?" ou variação natural
8. Continue buscando produtos enquanto o cliente pedir mais itens
9. Mantenha internamente uma LISTA MENTAL de todos os produtos pedidos com quantidades e preços
${conversationalSettings?.upsell_enabled && conversationalSettings?.upsell_product_id ? `10. ⚠️ PASSO OBRIGATÓRIO - UPSELL: Quando o cliente disser que NÃO quer mais nada (ex: "não", "só isso", "é só", "por enquanto não", "nada mais"), você DEVE OBRIGATORIAMENTE oferecer o produto de upsell ANTES de qualquer pergunta de fechamento:
   - Diga exatamente: "${conversationalSettings.upsell_message || 'Estamos com uma promoção especial! Quer aproveitar e levar também?'}"
   - Informe: Produto: *${conversationalSettings._upsell_product_name || 'Produto em promoção'}* por apenas R$ ${((conversationalSettings.upsell_custom_price || conversationalSettings._upsell_product_price || 0)).toFixed(2)}${conversationalSettings.upsell_custom_price ? ' (preço especial!)' : ''}
   - AGUARDE a resposta do cliente antes de prosseguir
   - Se ACEITAR: adicione ao carrinho e vá para o passo 11
   - Se RECUSAR: vá para o passo 11 sem insistir
   - Ofereça APENAS UMA VEZ por atendimento
   - NÃO ofereça se o cliente já pediu esse produto
   - ESTE PASSO É OBRIGATÓRIO E NÃO PODE SER PULADO` : `10. Quando o cliente disser que não quer mais nada (ex: "não", "só isso", "é só", "por enquanto não", "nada mais"), inicie o FLUXO DE FECHAMENTO`}
11. Após o upsell (ou se não houver upsell), inicie as PERGUNTAS DE FECHAMENTO abaixo
${hasDeliveryCalc ? `12. Ao receber localização GPS, calcular taxa de entrega automaticamente com calculate_delivery_fee
13. Após coletar TODAS as informações, apresentar RESUMO FINAL com:
     - Lista de todos os produtos com quantidade e preço unitário
     - Subtotal dos produtos
     - Taxa de entrega (se aplicável)
     - *TOTAL GERAL* (subtotal + taxa de entrega)
14. Confirmar pedido com o cliente` : `12. NÃO calcule taxa de entrega. Apenas colete endereço (texto) e localização GPS (para referência do entregador)
13. Após coletar TODAS as informações (nome, endereço, GPS, pagamento), apresentar RESUMO FINAL com:
     - Lista de todos os produtos com quantidade e preço unitário
     - Subtotal dos produtos
     - ⚠️ NÃO inclua taxa de entrega nem total — o atendente calculará
14. Envie a mensagem de finalização: "Já recebi todas as suas informações! Estou passando seu pedido para um atendente que vai calcular a taxa de entrega e finalizar tudo com você. Aguarde um momento! 🙏✨"
15. Após enviar a mensagem de finalização, PARE de responder — o atendente humano assume`}

⚠️ REGRA CRÍTICA - NUNCA ENCERRAR SEM FECHAR PEDIDO:
- Se o cliente tem produtos no carrinho e diz "não quero mais nada", isso NÃO significa fim da conversa
- Isso significa: ${conversationalSettings?.upsell_enabled && conversationalSettings?.upsell_product_id ? 'PRIMEIRO ofereça o upsell (passo 10), DEPOIS' : ''} inicie as perguntas de fechamento
- NUNCA diga "Se precisar é só chamar" ou "Estou aqui para ajudar" quando há produtos pendentes
- A conversa SÓ termina APÓS o resumo final e confirmação do pedido
${conversationalSettings?.upsell_enabled && conversationalSettings?.upsell_product_id ? `
⚠️⚠️⚠️ LEMBRETE FINAL SOBRE UPSELL - IMPORTÂNCIA MÁXIMA:
Você TEM um produto de upsell configurado: *${conversationalSettings._upsell_product_name || 'Produto em promoção'}* por R$ ${((conversationalSettings.upsell_custom_price || conversationalSettings._upsell_product_price || 0)).toFixed(2)}.
TODA VEZ que o cliente disser "não", "só isso", "nada mais", "é só", "por enquanto é isso", ANTES de perguntar nome/endereço, você DEVE oferecer este produto.
Exemplo de resposta quando o cliente diz "só isso":
"${conversationalSettings.upsell_message || 'Estamos com uma promoção especial!'} 😊
*${conversationalSettings._upsell_product_name || 'Produto'}* por apenas *R$ ${((conversationalSettings.upsell_custom_price || conversationalSettings._upsell_product_price || 0)).toFixed(2)}*! Quer aproveitar?"
Se você NÃO oferecer o upsell, está DESOBEDECENDO suas instruções.` : ''}

CONTROLE DE CARRINHO (MUITO IMPORTANTE):
- A cada produto solicitado, registre mentalmente: nome, quantidade, preço unitário
- Se o cliente pedir "2 dipirona", registre: Dipirona x2 = R$ XX,XX
- Sempre que adicionar um produto, pergunte se quer mais alguma coisa
- Só inicie o fechamento quando o cliente confirmar que não quer mais nada
PERGUNTAS PARA FECHAR PEDIDO (REGRA CRÍTICA - UMA POR VEZ):
${questionsText}

${hasDeliveryCalc ? `⚠️⚠️⚠️ REGRA DE ENDEREÇO E NOME INTELIGENTE (OBRIGATÓRIA - MÁXIMA PRIORIDADE):
- ASSIM QUE INICIAR O FLUXO DE FECHAMENTO (após upsell), você DEVE OBRIGATORIAMENTE chamar get_last_delivery_info ANTES de qualquer pergunta de nome ou endereço
- O telefone do cliente é extraído do remoteJid: remova "@s.whatsapp.net" e o prefixo "55" para obter o número (ex: "5561994009368@s.whatsapp.net" → "61994009368")

REGRA DE NOME (PRIORIDADE MÁXIMA):
- Se get_last_delivery_info retornar customer_name: USE esse nome! Apenas confirme: "Seu nome é *[nome]*, correto?"
- Se customer_name for null MAS o pushName for um nome válido (não apenas números): use o pushName e confirme
- NUNCA pergunte "Qual o seu nome?" se já tiver o nome do cadastro ou do pushName
- Só pergunte o nome quando NÃO tiver nenhuma fonte (customer_name=null E pushName inválido)

CENÁRIO A — Endereço anterior encontrado COM coordenadas GPS:
- Se get_last_delivery_info retornar found=true E customer_latitude/customer_longitude não forem null:
  → Pergunte: "Tenho aqui o endereço *[endereço retornado]* do seu último pedido. É o mesmo endereço de entrega?"
  → Se o cliente CONFIRMAR: chame calculate_delivery_fee(customer_latitude, customer_longitude) para obter a taxa ATUALIZADA (pode variar por horário). Use o resultado como taxa de entrega. PULE as perguntas de endereço e localização.
  → Se o cliente NEGAR: siga para o Cenário C (novo endereço)

CENÁRIO A2 — Endereço anterior encontrado SEM coordenadas GPS:
- Se get_last_delivery_info retornar found=true MAS customer_latitude/customer_longitude forem null:
  → Pergunte: "Tenho aqui o endereço *[endereço retornado]* do seu último pedido. É o mesmo endereço de entrega?"
  → Se CONFIRMAR: Diga "Ótimo! Para eu calcular a taxa de entrega certinha, pode me enviar sua *localização pelo WhatsApp*? 📍 É só clicar no 📎 (clipe) → Localização."
  → Aguarde o cliente enviar GPS e siga o Cenário B
  → Se NEGAR: siga para o Cenário C

CENÁRIO B — Cliente envia localização GPS pelo WhatsApp:
- A mensagem de localização chega no formato: "📍 Localização: LATITUDE, LONGITUDE"
- Exemplo: "📍 Localização: -16.0667, -47.9833"
- Quando receber uma mensagem neste formato, EXTRAIA os números e chame calculate_delivery_fee(latitude, longitude) IMEDIATAMENTE
- Use o resultado para informar a taxa de entrega ao cliente
- Se retornar dentro da área: informe a taxa e prossiga
- Se retornar fora da área: informe educadamente que o endereço está fora da área de entrega

CENÁRIO C — Endereço novo (sem GPS):
- Peça o endereço em texto ao cliente
- APÓS receber o endereço, peça: "Agora, por favor, envie sua *localização pelo WhatsApp* 📍 para calcularmos a taxa de entrega certinha! É só clicar no 📎 (clipe) → Localização."
- Aguarde o GPS e siga o Cenário B

⚠️⚠️⚠️ REGRA ABSOLUTA — NUNCA INVENTAR COORDENADAS GPS:
- NUNCA tente "adivinhar", "estimar" ou "deduzir" coordenadas GPS a partir de um endereço em texto
- Se você NÃO recebeu coordenadas reais (do get_last_delivery_info com valores não-null, ou de uma mensagem "📍 Localização"), você NÃO TEM coordenadas
- Sem coordenadas reais, NUNCA chame calculate_delivery_fee. Em vez disso, PEÇA ao cliente que envie a localização pelo WhatsApp
- Se chamar calculate_delivery_fee com coordenadas inventadas, o resultado será ERRADO e o cliente receberá uma taxa incorreta ou será informado incorretamente que está fora da área
- SOMENTE use coordenadas que vieram de: (1) customer_latitude/customer_longitude retornados por get_last_delivery_info, ou (2) mensagem "📍 Localização: LAT, LNG" enviada pelo cliente

REGRA ABSOLUTA SOBRE ÁREA DE ENTREGA:
- NUNCA diga que o endereço está "fora da área de entrega" SEM antes ter chamado calculate_delivery_fee com coordenadas GPS REAIS (não inventadas)
- Se não tem coordenadas GPS reais, peça ao cliente que envie a localização pelo WhatsApp
- Só o resultado da função calculate_delivery_fee com coordenadas REAIS determina se está dentro ou fora da área

- Se get_last_delivery_info retornar found=false: siga para o Cenário C
- Se você perguntar "qual o seu endereço?" SEM antes chamar get_last_delivery_info, você está DESOBEDECENDO suas instruções
- JAMAIS use a palavra "frete". Use sempre "taxa de entrega"` : `⚠️⚠️⚠️ REGRA DE ENDEREÇO E NOME — FECHAMENTO MANUAL (SEM CÁLCULO DE FRETE):
- ASSIM QUE INICIAR O FLUXO DE FECHAMENTO (após upsell), você DEVE OBRIGATORIAMENTE chamar get_last_delivery_info ANTES de qualquer pergunta de nome ou endereço
- O telefone do cliente é extraído do remoteJid: remova "@s.whatsapp.net" e o prefixo "55" para obter o número

REGRA DE NOME (PRIORIDADE MÁXIMA):
- Se get_last_delivery_info retornar customer_name: USE esse nome! Apenas confirme: "Seu nome é *[nome]*, correto?"
- Se customer_name for null MAS o pushName for um nome válido (não apenas números): use o pushName e confirme
- NUNCA pergunte "Qual o seu nome?" se já tiver o nome do cadastro ou do pushName
- Só pergunte o nome quando NÃO tiver nenhuma fonte (customer_name=null E pushName inválido)

FLUXO DE ENDEREÇO (MANUAL — SEM CÁLCULO):
1. Chame get_last_delivery_info para verificar dados anteriores
2. Se encontrou endereço anterior: confirme com o cliente "Tenho aqui o endereço *[endereço]*. É o mesmo?"
   - Se CONFIRMAR: pule para o passo 4
   - Se NEGAR: siga para o passo 3
3. Peça endereço COMPLETO em texto: "Qual o seu endereço completo de entrega? (Rua, número, bairro e um ponto de referência) 🏠"
4. Peça localização GPS: "Agora, por favor, clique no 📎 (clipe) e mande sua *Localização Atual* do WhatsApp. É só para confirmarmos o ponto certinho para o entregador! 📍"
5. Pergunte forma de pagamento: "Qual será a forma de pagamento? (Pix, Cartão ou Dinheiro) 💳"
6. Apresente o resumo SEM taxa de entrega e SEM total
7. Envie a mensagem de finalização passando para atendente humano

⚠️⚠️⚠️ REGRAS ABSOLUTAS DE FECHAMENTO MANUAL:
- NÃO chame calculate_delivery_fee em hipótese alguma
- NÃO tente calcular, estimar ou informar taxa de entrega — isso é responsabilidade EXCLUSIVA do atendente humano
- NÃO mostre "Total" no resumo (pois não sabe o frete) — mostre apenas o Subtotal dos produtos
- JAMAIS use a palavra "frete". Use sempre "taxa de entrega"
- Após enviar o resumo e a mensagem de finalização, PARE de responder — o atendente humano assume`}


⚠️ REGRA ABSOLUTA: Faça APENAS UMA pergunta por vez!
- Envie a primeira pergunta e PARE. Aguarde a resposta do cliente.
- Só depois de receber a resposta, envie a próxima pergunta.
- NUNCA envie duas ou mais perguntas na mesma mensagem.
- NUNCA liste todas as perguntas de uma vez.
${hasDeliveryCalc ? '- Quando o cliente enviar localização pelo WhatsApp (formato "📍 Localização: LAT, LNG"), EXTRAIA os números e chame calculate_delivery_fee(lat, lng) IMEDIATAMENTE. Nunca ignore uma mensagem de localização.' : '- Quando o cliente enviar localização pelo WhatsApp, registre para referência do entregador. NÃO chame calculate_delivery_fee.'}
- TODAS as perguntas marcadas como OBRIGATÓRIA devem ser feitas antes do resumo.

${!hasDeliveryCalc ? `⚠️ REGRA DO NICHO — FOCO EXCLUSIVO:
- NUNCA fale sobre assuntos não relacionados ao segmento da loja
- Se o cliente desviar o assunto, volte educadamente: "Eu sou especializada nessa área! Posso te ajudar com algum produto? 😊"
- Mantenha o foco 100% nos produtos e serviços da loja` : ''}

⚠️⚠️⚠️ REGRA CRÍTICA SOBRE FORMA DE PAGAMENTO:
- Você DEVE OBRIGATORIAMENTE perguntar a forma de pagamento ANTES de apresentar o resumo final.
- NUNCA apresente o resumo com "Pagamento: [aguardando definição]" ou qualquer placeholder.
- O campo "Pagamento" no resumo DEVE conter a resposta REAL do cliente (ex: Pix, Dinheiro, Cartão).
- Se o cliente não informou a forma de pagamento, PARE e pergunte antes de montar o resumo.
- A sequência correta é: Nome → Endereço → Localização → Mais alguma coisa? → FORMA DE PAGAMENTO → Resumo.
- SEM EXCEÇÕES: O resumo SÓ pode ser apresentado DEPOIS de ter TODAS as respostas obrigatórias coletadas.

RESUMO FINAL DO PEDIDO (SOMENTE após coletar TODAS as informações incluindo PAGAMENTO):
Apresente assim:
*📋 Resumo do seu pedido:*

1. Produto A x1 — R$ XX,XX
2. Produto B x2 — R$ XX,XX

*Subtotal:* R$ XX,XX
*Taxa de entrega:* R$ XX,XX
*Total:* R$ XX,XX

*Entrega para:* [endereço informado pelo cliente]
*Pagamento:* [forma informada pelo cliente - NUNCA usar placeholder]

Tudo certo? Posso confirmar? 😊

MENSAGEM DE FECHAMENTO (após confirmar pedido):
"${closingMessage}"

INFORMAÇÕES DA LOJA:
- Nome: ${store.name || 'Loja'}
- Descrição: ${store.description || 'Delivery de qualidade'}
- Endereço: ${store.address || 'Não informado'}
- WhatsApp: ${store.whatsapp || 'Não informado'}
${paymentSection}
${deliverySection}
${hoursSection}

FORMATAÇÃO OBRIGATÓRIA (WhatsApp):
- Use asterisco simples *texto* para negrito (não duplo **)
- NÃO use colchetes [ ] ou parênteses ( ) ao redor de links
- NÃO use formato markdown de link como [texto](url)
- Separe informações com linhas em branco para legibilidade

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

    const requestBody = await req.json() as { action?: string; config?: BotConfig; origin?: string; storeId?: string; forceSync?: boolean };
    
    // Suporte a formato simplificado (apenas storeId) ou completo (action + config)
    let action = requestBody.action;
    let config = requestBody.config;
    const origin = requestBody.origin;
    
    // Se recebeu apenas storeId (formato simplificado), buscar config do banco
    if (requestBody.storeId && !config) {
      const { data: existingConfig, error: configFetchError } = await supabaseClient
        .from('store_bot_config')
        .select('*')
        .eq('store_id', requestBody.storeId)
        .maybeSingle();

      if (configFetchError) {
        steps.push({ step: 'fetch_config', status: 'error', message: 'Erro ao buscar configuração' });
        return new Response(JSON.stringify({ error: 'Erro ao buscar configuração do bot', steps }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Buscar instância WhatsApp
      const { data: instance } = await supabaseClient
        .from('whatsapp_instances')
        .select('instance_name')
        .eq('store_id', requestBody.storeId)
        .maybeSingle();

      // Construir config a partir dos dados do banco
      config = {
        storeId: requestBody.storeId,
        instanceName: instance?.instance_name || existingConfig?.trigger_value || '',
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
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar loja do usuário com todos os campos necessários
    const [storeRes, configRes] = await Promise.all([
      supabaseClient
        .from('stores')
        .select(`
          *, 
          google_maps_link, business_hours, delivery_fee, min_order_value,
          accepts_cash, accepts_card, accepts_pix, city, state,
          custom_domain, custom_domain_verified,
          openai_api_key, niche_id
        `)
        .eq('id', config.storeId)
        .single(),
      supabaseClient
        .from('store_configurations')
        .select('delivery_zones')
        .eq('store_id', config.storeId)
        .maybeSingle(),
    ]);

    const store = storeRes.data;
    const storeError = storeRes.error;
    const deliveryZones = (configRes.data?.delivery_zones as any[]) || [];

    if (storeError || !store) {
      steps.push({ step: 'store_check', status: 'error', message: 'Loja não encontrada' });
      return new Response(JSON.stringify({ error: 'Loja não encontrada', steps }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    steps.push({ step: 'store_check', status: 'success', message: 'Loja encontrada', details: store.name });

    // ========================================
    // BUSCAR CONFIGURAÇÕES DE NICHO (IA dinâmica)
    // ========================================
    let nicheConfig: any = null;
    let nicheRules: any[] = [];

    if (store.niche_id) {
      // Buscar config do nicho filtrando pelo bot_mode atual
      const currentBotMode: BotModeType = config.botMode || 'chat_completion';
      
      // Tentar buscar config específica do bot_mode, senão pegar qualquer uma
      const nicheConfigRes = await supabaseClient
        .from('niche_ai_configs')
        .select('*')
        .eq('niche_id', store.niche_id)
        .eq('bot_mode', currentBotMode)
        .limit(1);

      nicheConfig = nicheConfigRes.data?.[0] || null;
      
      // Fallback: se não encontrou config para o bot_mode específico, buscar qualquer config do nicho
      if (!nicheConfig) {
        const fallbackRes = await supabaseClient
          .from('niche_ai_configs')
          .select('*')
          .eq('niche_id', store.niche_id)
          .limit(1);
        nicheConfig = fallbackRes.data?.[0] || null;
      }

      // Se config existe, buscar regras vinculadas a ela
      if (nicheConfig) {
        const nicheRulesRes = await supabaseClient
          .from('niche_ai_rules')
          .select('*')
          .eq('niche_ai_config_id', nicheConfig.id)
          .eq('is_enabled', true)
          .order('sort_order');

        nicheRules = nicheRulesRes.data || [];
      }

      if (nicheConfig) {
        steps.push({
          step: 'niche_config',
          status: 'success',
          message: `Config de nicho carregada`,
          details: `max_products: ${nicheConfig.max_products_per_response}, ${nicheRules.length} regra(s) ativa(s)`,
        });
      }
    } else {
      steps.push({
        step: 'niche_config',
        status: 'warning',
        message: 'Loja sem nicho vinculado — usando configuração padrão',
      });
    }

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

    // (updateExistingBot removido — estratégia nuclear: sempre delete-all + create)

    // ========================================
    // FUNÇÃO: Garantir bot - NUCLEAR: deletar TODOS + criar 1 novo
    // Estratégia segura contra duplicatas
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

      // PASSO 1: Buscar TODOS os bots existentes
      const existingBots = await findExistingBots(instanceName);

      if (existingBots.length > 0) {
        steps.push({
          step: 'bot_list',
          status: 'success',
          message: `${existingBots.length} bot(s) encontrado(s) — removendo TODOS para recriar limpo`,
          details: existingBots.map((b) => `${b.description || b.id?.slice(0, 8) || 'sem-id'}`).join(', '),
        });

        // PASSO 2: Deletar TODOS os bots existentes (nuclear)
        for (const bot of existingBots) {
          if (bot.id) {
            const deleted = await deleteExistingBot(instanceName, bot.id);
            steps.push({
              step: 'bot_delete',
              status: deleted ? 'success' : 'warning',
              message: deleted ? `Bot ${bot.id.slice(0, 8)}... removido` : `Falha ao remover ${bot.id.slice(0, 8)}...`,
            });
          }
        }

        // Aguardar brevemente para a Evolution processar as deleções
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        steps.push({
          step: 'bot_list',
          status: 'success',
          message: 'Nenhum bot existente — criando novo',
        });
      }

      // PASSO 3: Criar novo bot limpo
      steps.push({
        step: 'bot_creating',
        status: 'success',
        message: 'Criando bot único na Evolution...',
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
          // Se "already exists", deletar novamente e retry
          const alreadyExists = createText.includes('already exists') || createText.includes('already');
          if (alreadyExists) {
            steps.push({
              step: 'bot_create_retry',
              status: 'warning',
              message: 'Evolution reportou "already exists" — limpando e tentando novamente...',
            });

            const botsAfter = await findExistingBots(instanceName);
            for (const bot of botsAfter) {
              if (bot.id) await deleteExistingBot(instanceName, bot.id);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));

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
              try { retryData = JSON.parse(retryText); } catch { retryData = {}; }
              const retryBotId = retryData.id || retryData.openaiBot?.id || null;
              if (retryBotId) {
                steps.push({
                  step: 'bot_created',
                  status: 'success',
                  message: '✅ Bot único criado com sucesso (retry)',
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
        try { botData = JSON.parse(createText); } catch { botData = {}; }
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
          message: '✅ Bot único criado com sucesso!',
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

      // Detectar modo do bot (v1, v2 ou conversacional)
      const botMode: BotModeType = (existingBotConfig?.bot_mode as BotModeType) || config.botMode || 'chat_completion';
      const isAssistantMode = botMode === 'assistant' || botMode === 'conversational';
      const isConversationalMode = botMode === 'conversational';

      steps.push({
        step: 'bot_mode',
        status: 'success',
        message: `Modo: ${isConversationalMode ? 'Conversacional' : isAssistantMode ? 'Assistente Inteligente v2' : 'Simples (chat_completion)'}`,
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
      
      if (isConversationalMode) {
        // Modo Conversacional: Buscar configurações específicas
        const [convSettingsRes, orderQuestionsRes] = await Promise.all([
          supabaseClient
            .from('store_bot_conversational_settings')
            .select('*')
            .eq('store_id', config.storeId)
            .maybeSingle(),
          supabaseClient
            .from('store_bot_order_questions')
            .select('*')
            .eq('store_id', config.storeId)
            .order('sort_order'),
        ]);

        // Se upsell está ativo, buscar dados do produto
        const convSettings = convSettingsRes.data as any;
        if (convSettings?.upsell_enabled && convSettings?.upsell_product_id) {
          const { data: upsellProduct } = await supabaseClient
            .from('products')
            .select('name, price, slug')
            .eq('id', convSettings.upsell_product_id)
            .single();
          if (upsellProduct) {
            convSettings._upsell_product_name = upsellProduct.name;
            convSettings._upsell_product_price = upsellProduct.price;
            convSettings._upsell_product_slug = upsellProduct.slug;
          }
        }

        // Extrair tipos de regras do nicho para suprimir seções duplicadas
        const nicheRuleTypes = nicheRules.map(r => r.rule_type);
        
        systemPrompt = generateConversationalModePrompt(
          botName,
          store,
          personalitySettings,
          deliveryZones,
          convSettings || null,
          orderQuestionsRes.data || [],
          nicheRuleTypes.length > 0 ? nicheRuleTypes : undefined
        );

        const suppressedSections = nicheRuleTypes.length > 0 
          ? 'Seções duplicadas suprimidas (cobertas pelo nicho)' 
          : 'Sem nicho — usando todas as seções padrão';
        
        steps.push({
          step: 'prompt_generate',
          status: 'success',
          message: 'Prompt conversacional gerado',
          details: `${orderQuestionsRes.data?.length || 0} perguntas, ${nicheRuleTypes.length} regras nicho. ${suppressedSections}`,
        });
      } else if (isAssistantMode) {
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
          customInstructions,
          deliveryZones
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
          personalitySettings,
          deliveryZones
        );

        steps.push({
          step: 'prompt_generate',
          status: 'success',
          message: 'Prompt gerado com dados da loja',
          details: `${products?.length || 0} produto(s), ${categories?.length || 0} categoria(s)`,
        });
      }

      // ========================================
      // INJETAR REGRAS DE NICHO NO PROMPT
      // ========================================
      const nicheRulesText = buildNicheRulesText(nicheConfig, nicheRules);
      if (nicheRulesText) {
        // Substituir variáveis de template
        const processedNicheText = nicheRulesText
          .replace(/\{\{STORE_NAME\}\}/g, store.name || 'Loja')
          .replace(/\{\{BOT_NAME\}\}/g, config.botName || 'Assistente');
        
        systemPrompt += processedNicheText;
        
        steps.push({
          step: 'niche_rules_injected',
          status: 'success',
          message: `${nicheRules.length} regra(s) de nicho injetada(s) no prompt`,
          details: nicheRules.map(r => r.name).join(', '),
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
      // No modo conversacional, NUNCA incluir links na saudação
      const fixedGreeting = isConversationalMode
        ? greeting
        : `${greeting}\n\n📱 Confira nossa loja: ${storeLink}`;

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
        unknownMessage: isConversationalMode
          ? (config.unknownMessage || 'Desculpe, não entendi. Pode reformular sua pergunta? 😊')
          : (config.unknownMessage || 'Desculpe, não entendi. Digite #SAIR para encerrar ou acesse nossa loja online.'),
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
                description: `Busca produtos no catálogo por nome ou termo. Use o nome completo do produto que o cliente mencionou. Se não encontrar resultados, tente com menos palavras ou termos alternativos.${nicheConfig?.max_products_per_response ? ` Limite padrão: ${nicheConfig.max_products_per_response} produtos.` : ''}`,
                parameters: {
                  type: 'object',
                  properties: {
                    query: { type: 'string', description: 'Termo de busca' },
                    limit: { type: 'number', description: `Quantidade máxima de resultados (padrão: ${nicheConfig?.max_products_per_response || 3})` },
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
            {
              type: 'function',
              function: {
                name: 'analyze_image',
                description: 'Analisa uma imagem enviada pelo cliente para identificar produtos, receitas médicas ou embalagens. Use quando o cliente enviar uma foto ou imagem.',
                parameters: {
                  type: 'object',
                  properties: {
                    image_data: {
                      type: 'object',
                      description: 'Dados da imagem (base64 ou url)',
                      properties: {
                        base64: { type: 'string', description: 'Imagem codificada em base64' },
                        url: { type: 'string', description: 'URL da imagem' },
                        mimetype: { type: 'string', description: 'Tipo MIME da imagem' },
                      },
                    },
                    image_context: {
                      type: 'string',
                      description: 'Contexto adicional sobre a imagem fornecido pelo cliente',
                    },
                  },
                  required: ['image_data'],
                },
              },
            },
            {
              type: 'function',
              function: {
                name: 'check_store_status',
                description: 'Verifica se a loja está aberta ou fechada no momento atual, baseado no horário de funcionamento.',
                parameters: { type: 'object', properties: {} },
              },
            },
            {
              type: 'function',
              function: {
                name: 'get_current_greeting',
                description: 'Retorna a saudação correta baseada no horário atual (Bom dia, Boa tarde, Boa noite). USE ESTA FUNÇÃO NA PRIMEIRA MENSAGEM de cada conversa.',
                parameters: { type: 'object', properties: {} },
              },
            },
            {
              type: 'function',
              function: {
                name: 'calculate_delivery_fee',
                description: 'Calcula a taxa de entrega baseada na localização GPS do cliente. Use quando o cliente enviar sua localização pelo WhatsApp.',
                parameters: {
                  type: 'object',
                  properties: {
                    latitude: { type: 'number', description: 'Latitude da localização do cliente' },
                    longitude: { type: 'number', description: 'Longitude da localização do cliente' },
                  },
                  required: ['latitude', 'longitude'],
                },
              },
            },
            {
              type: 'function',
              function: {
                name: 'get_last_delivery_info',
                description: 'Busca o endereço e a taxa de entrega do último pedido do cliente pelo telefone. Use ANTES de perguntar o endereço para verificar se o cliente já tem um endereço cadastrado.',
                parameters: {
                  type: 'object',
                  properties: {
                    customer_phone: { type: 'string', description: 'Telefone do cliente (extraído do remoteJid do WhatsApp, apenas números)' },
                  },
                  required: ['customer_phone'],
                },
              },
            },
          ];

          // Filtrar tools pelo enabled_tools do nicho (se configurado)
          const enabledToolKeys = nicheConfig?.enabled_tools as string[] | null;
          const filteredTools = enabledToolKeys && enabledToolKeys.length > 0
            ? assistantTools.filter(t => {
                const toolName = (t as any).function?.name;
                // Sempre manter search_products e get_current_greeting
                if (toolName === 'search_products' || toolName === 'get_current_greeting') return true;
                return enabledToolKeys.includes(toolName);
              })
            : assistantTools;

          steps.push({
            step: 'tools_filter',
            status: 'success',
            message: enabledToolKeys?.length ? `Tools filtradas pelo nicho` : 'Usando todas as tools (sem filtro de nicho)',
            details: `${filteredTools.length}/${assistantTools.length} tools ativas`,
          });

          const assistantPayload = {
            name: `${config.botName || 'Assistente'} - ${store.name}`,
            instructions: systemPrompt,
            tools: filteredTools,
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
