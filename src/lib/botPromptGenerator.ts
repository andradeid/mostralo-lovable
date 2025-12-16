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
}

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  is_available: boolean;
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

export function generateBotPromptPreview(
  store: Store,
  products: Product[],
  categories: Category[],
  botName?: string
): BotPromptData {
  const availableProducts = products.filter(p => p.is_available);
  const activeCategories = categories.filter(c => c.is_active);

  const productList = availableProducts
    .map(p => `- ${p.name}: R$ ${p.price?.toFixed(2)} - ${p.description || 'Sem descrição'}`)
    .join('\n');

  const categoryList = activeCategories
    .map(c => c.name)
    .join(', ');

  const storeLink = `${window.location.origin}/loja/${store.slug}`;

  const assistantName = botName || 'Assistente Virtual';
  
  const locationSection = store.google_maps_link 
    ? `\nLOCALIZAÇÃO:
- Endereço: ${store.address || 'Não informado'}
- Cidade/Estado: ${store.city || ''}${store.city && store.state ? '/' : ''}${store.state || ''}
- 📍 Link do Google Maps: ${store.google_maps_link}
- Quando cliente pedir localização, SEMPRE envie o link acima`
    : '';

  const paymentSection = `\nFORMAS DE PAGAMENTO:
${formatPaymentMethods(store)}`;

  const deliverySection = `\nDELIVERY:
- Taxa de entrega: ${store.delivery_fee ? `R$ ${store.delivery_fee.toFixed(2)}` : 'Consulte na loja'}
- Pedido mínimo: ${store.min_order_value ? `R$ ${store.min_order_value.toFixed(2)}` : 'Sem valor mínimo'}`;

  const hoursSection = `\nHORÁRIO DE FUNCIONAMENTO:
${formatBusinessHours(store.business_hours)}`;

  const prompt = `Você é ${assistantName}, o assistente virtual da ${store.name || 'loja'}.

Quando o cliente perguntar seu nome, responda: "Meu nome é ${assistantName}! 😊"

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

  return {
    prompt,
    productsCount: availableProducts.length,
    categoriesCount: activeCategories.length,
    storeLink,
  };
}
