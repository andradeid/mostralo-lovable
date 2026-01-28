interface Store {
  name: string;
  description?: string;
  address?: string;
  whatsapp?: string;
  slug: string;
  google_maps_link?: string;
  business_hours?: any;
  delivery_fee?: number;
  min_order_value?: number;
  accepts_cash?: boolean;
  accepts_card?: boolean;
  accepts_pix?: boolean;
  city?: string;
  state?: string;
  custom_domain?: string;
  custom_domain_verified?: boolean;
}

// Determinar domínio correto para links da loja (preview)
function getPreviewBaseUrl(store: Store): string {
  // 1º Prioridade: Domínio customizado VERIFICADO da loja
  if (store.custom_domain && store.custom_domain_verified) {
    return `https://${store.custom_domain}`;
  }
  
  // 2º Prioridade: Domínio de origem atual (se não for dev)
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const devDomains = ['localhost', 'lovable.app', 'lovable.dev', 'gptengineer.run', 'webcontainer.io', 'stackblitz.io', 'codesandbox.io'];
    const isDevDomain = devDomains.some(d => origin.includes(d));
    
    if (!isDevDomain) {
      return origin;
    }
  }
  
  // 3º Prioridade: Fallback padrão
  return 'https://mostralo.com.br';
}

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  is_available: boolean;
  slug?: string;
}

interface Category {
  id: string;
  name: string;
  is_active: boolean;
}

export interface BotPromptData {
  prompt: string;
  productsCount: number;
  categoriesCount: number;
  storeLink: string;
  navigationLink?: string;
}

// Interface para store completo usado no prompt v2
interface StoreV2 extends Store {
  latitude?: number;
  longitude?: number;
}

export type PersonalityType = 'professional' | 'friendly' | 'fun' | 'consultive';
export type EmojiLevel = 'none' | 'moderate' | 'abundant';

export interface PersonalitySettings {
  personality: PersonalityType;
  emojiLevel: EmojiLevel;
  customGreeting: string;
}

export interface PromptSettings {
  includeLocation: boolean;
  includeBusinessHours: boolean;
  includePaymentMethods: boolean;
  includeDeliveryFee: boolean;
  includeMinOrder: boolean;
  personalitySettings: PersonalitySettings;
}

function formatBusinessHours(hours: any): string {
  if (!hours) return 'Não informado';
  
  try {
    if (typeof hours === 'string') {
      return hours;
    }
    
    if (typeof hours === 'object') {
      const days = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
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

function formatPaymentMethods(store: Store): string {
  const methods: string[] = [];
  
  if (store.accepts_pix !== false) methods.push('✅ PIX');
  if (store.accepts_card !== false) methods.push('✅ Cartão');
  if (store.accepts_cash !== false) methods.push('✅ Dinheiro');
  
  if (methods.length === 0) {
    return '- Consulte a loja sobre formas de pagamento';
  }
  
  return methods.join('\n');
}

const defaultPersonalitySettings: PersonalitySettings = {
  personality: 'friendly',
  emojiLevel: 'moderate',
  customGreeting: '',
};

const defaultSettings: PromptSettings = {
  includeLocation: true,
  includeBusinessHours: true,
  includePaymentMethods: true,
  includeDeliveryFee: true,
  includeMinOrder: true,
  personalitySettings: defaultPersonalitySettings,
};

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
- Demonstre conhecimento profundo do cardápio`
  };

  const emojiInstructions: Record<EmojiLevel, string> = {
    none: 'USO DE EMOJIS: NÃO use emojis nas respostas. Mantenha texto limpo.',
    moderate: 'USO DE EMOJIS: Use emojis com moderação (1-2 por mensagem para dar tom amigável).',
    abundant: 'USO DE EMOJIS: Use bastante emojis para deixar a conversa animada e expressiva! 🎉😊🍕'
  };

  const customGreetingNote = settings.customGreeting 
    ? `\nSAUDAÇÃO PERSONALIZADA: Use "${settings.customGreeting}" como saudação inicial.`
    : '';

  return `${personalities[settings.personality]}

${emojiInstructions[settings.emojiLevel]}${customGreetingNote}`;
}

export function generateBotPromptPreview(
  store: Store,
  products: Product[],
  categories: Category[],
  botName?: string,
  settings: PromptSettings = defaultSettings
): BotPromptData {
  const availableProducts = products.filter(p => p.is_available);
  const activeCategories = categories.filter(c => c.is_active);

  // Usar função de detecção de domínio com prioridade correta
  const baseUrl = getPreviewBaseUrl(store);
  const storeLink = `${baseUrl}/loja/${store.slug}`;

  const productList = availableProducts
    .map(p => {
      const productLink = p.slug 
        ? `${baseUrl}/loja/${store.slug}/produto/${p.slug}`
        : storeLink;
      return `- ${p.name}: R$ ${p.price?.toFixed(2)}
    Descrição: ${p.description || 'Sem descrição'}
    📎 Ver produto: ${productLink}`;
    })
    .join('\n\n');

  const categoryList = activeCategories
    .map(c => c.name)
    .join(', ');

  const assistantName = botName || 'Assistente Virtual';
  
  const locationSection = settings.includeLocation && store.google_maps_link 
    ? `\nLOCALIZAÇÃO:
- Endereço: ${store.address || 'Não informado'}
- Cidade/Estado: ${store.city || ''}${store.city && store.state ? '/' : ''}${store.state || ''}
- 📍 Link do Google Maps: ${store.google_maps_link}
- Quando cliente pedir localização, SEMPRE envie o link acima`
    : '';

  const paymentSection = settings.includePaymentMethods 
    ? `\nFORMAS DE PAGAMENTO:
${formatPaymentMethods(store)}`
    : '';

  const deliverySection = (settings.includeDeliveryFee || settings.includeMinOrder)
    ? `\nDELIVERY:${settings.includeDeliveryFee ? `
- Taxa de entrega: ${store.delivery_fee ? `R$ ${store.delivery_fee.toFixed(2)}` : 'Consulte na loja'}` : ''}${settings.includeMinOrder ? `
- Pedido mínimo: ${store.min_order_value ? `R$ ${store.min_order_value.toFixed(2)}` : 'Sem valor mínimo'}` : ''}`
    : '';

  const hoursSection = settings.includeBusinessHours 
    ? `\nHORÁRIO DE FUNCIONAMENTO:
${formatBusinessHours(store.business_hours)}`
    : '';

  const personalityInstructions = generatePersonalityInstructions(settings.personalitySettings);

  const prompt = `Você é ${assistantName}, o assistente virtual da ${store.name || 'loja'}.

Quando o cliente perguntar seu nome, responda: "Meu nome é ${assistantName}!"

${personalityInstructions}

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

SAUDAÇÃO INTELIGENTE:
1. O sistema irá informar o horário atual da loja no contexto da mensagem
2. Use a saudação indicada pelo sistema: [CONTEXTO: Saudação: "Bom dia/Boa tarde/Boa noite"]
3. Se o cliente informar o nome, USE o nome nas respostas seguintes
   - Exemplo: "Boa tarde, Maria! Como posso ajudar?"
4. Se não souber o nome, seja acolhedor:
   - Exemplo: "Boa tarde! Seja bem-vindo(a)! Como posso ajudar?"
5. Demonstre interesse genuíno: "Que bom ter você aqui!"
6. **SEMPRE envie o link do cardápio na primeira mensagem de saudação**
   - Inclua: "📱 Confira nosso cardápio completo: ${storeLink}"
   - Exemplo completo de saudação:
     "Boa tarde! 👋 Seja bem-vindo(a) à ${store.name || 'nossa loja'}! Como posso ajudar?
     
     📱 Confira nosso cardápio completo: ${storeLink}"

REGRAS DE HORÁRIO:
- O webhook injeta automaticamente [CONTEXTO: Horário: HH:MM | Saudação: "X"]
- USE SEMPRE a saudação informada no contexto
- Não tente "adivinhar" o horário - confie no contexto do sistema

INSTRUÇÕES GERAIS:
1. Apresente os produtos quando perguntado
2. Informe preços corretamente
3. SEMPRE inclua o link do produto quando falar sobre ele
4. Direcione o cliente para o cardápio online: ${storeLink}
5. Para finalizar pedido, peça para acessar o link do produto ou cardápio
6. Não invente produtos ou preços
7. Se não souber algo, direcione ao link do cardápio
8. Responda sempre em português brasileiro
9. Mencione promoções se houver
10. Quando pedirem localização, envie o link do Google Maps se disponível
11. Informe horário de funcionamento quando perguntado
12. Informe formas de pagamento aceitas quando perguntado

LINKS DE PRODUTOS:
- Quando o cliente perguntar sobre um produto específico, SEMPRE envie o link do produto
- Use o formato: "Você pode ver mais detalhes e pedir aqui: [link]"
- Se o cliente mostrar interesse, envie o link imediatamente

ENCERRAMENTO:
- Quando o cliente digitar a palavra de encerramento, agradeça e finalize
- Sempre deseje uma boa experiência ao cliente`;

  return {
    prompt,
    productsCount: availableProducts.length,
    categoriesCount: activeCategories.length,
    storeLink,
  };
}

// ============================================
// GERADOR DE PROMPT V2 - ASSISTENTE INTELIGENTE
// Com Function Calling e link de navegação
// ============================================

function generateNavigationLink(store: StoreV2): string | undefined {
  if (!store.latitude || !store.longitude || !store.slug) return undefined;
  
  const baseUrl = getPreviewBaseUrl(store);
  const address = encodeURIComponent(store.address || '');
  
  return `${baseUrl}/navegar?lat=${store.latitude}&lng=${store.longitude}&store=${store.slug}&address=${address}`;
}

export function generateBotPromptV2(
  store: StoreV2,
  botName: string,
  customPromptInstructions?: string,
  settings: PromptSettings = defaultSettings
): BotPromptData {
  const baseUrl = getPreviewBaseUrl(store);
  const storeLink = `${baseUrl}/loja/${store.slug}`;
  const navigationLink = generateNavigationLink(store);

  // Seção de localização com link de navegação
  const locationSection = settings.includeLocation
    ? `\nLOCALIZAÇÃO E NAVEGAÇÃO:
- Endereço: ${store.address || 'Não informado'}
- Cidade/Estado: ${store.city || ''}${store.city && store.state ? '/' : ''}${store.state || ''}
${navigationLink ? `- 📍 Link para navegação: ${navigationLink}
- Quando cliente pedir localização/endereço, ENVIE o link de navegação
- O cliente poderá escolher: Google Maps, Waze ou Uber` : (store.google_maps_link ? `- 📍 Link do Google Maps: ${store.google_maps_link}` : '')}`
    : '';

  const paymentSection = settings.includePaymentMethods 
    ? `\nFORMAS DE PAGAMENTO:
${formatPaymentMethods(store)}`
    : '';

  const deliverySection = (settings.includeDeliveryFee || settings.includeMinOrder)
    ? `\nDELIVERY:${settings.includeDeliveryFee ? `
- Taxa de entrega: ${store.delivery_fee ? `R$ ${store.delivery_fee.toFixed(2)}` : 'Consulte na loja'}` : ''}${settings.includeMinOrder ? `
- Pedido mínimo: ${store.min_order_value ? `R$ ${store.min_order_value.toFixed(2)}` : 'Sem valor mínimo'}` : ''}`
    : '';

  const hoursSection = settings.includeBusinessHours 
    ? `\nHORÁRIO DE FUNCIONAMENTO:
${formatBusinessHours(store.business_hours)}`
    : '';

  const personalityInstructions = generatePersonalityInstructions(settings.personalitySettings);

  // Prompt enxuto para modo Inteligente v2 (sem lista de produtos!)
  const prompt = `Você é ${botName}, assistente virtual da ${store.name || 'loja'}.

Quando o cliente perguntar seu nome, responda: "Meu nome é ${botName}!"

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

${customPromptInstructions ? `INSTRUÇÕES PERSONALIZADAS DA LOJA:
${customPromptInstructions}
` : ''}
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

INSTRUÇÕES GERAIS:
1. Quando pedirem localização, envie o link de navegação
2. Informe horários quando perguntado
3. Informe formas de pagamento quando perguntado
4. Responda sempre em português brasileiro
5. Seja acolhedor e prestativo
6. **SEMPRE envie o link do cardápio na primeira mensagem**

ENCERRAMENTO:
- Quando o cliente digitar a palavra de encerramento, agradeça e finalize
- Sempre deseje uma boa experiência ao cliente`;

  return {
    prompt,
    productsCount: 0, // v2 não carrega produtos no prompt
    categoriesCount: 0, // v2 não carrega categorias no prompt
    storeLink,
    navigationLink,
  };
}
