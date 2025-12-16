interface Store {
  name: string;
  description?: string;
  address?: string;
  whatsapp?: string;
  slug: string;
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

export function generateBotPromptPreview(
  store: Store,
  products: Product[],
  categories: Category[]
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

  const prompt = `Você é ${store.name ? `o assistente virtual da ${store.name}` : 'um assistente virtual de delivery'}.

INFORMAÇÕES DA LOJA:
- Nome: ${store.name || 'Loja'}
- Descrição: ${store.description || 'Delivery de qualidade'}
- Endereço: ${store.address || 'Não informado'}
- WhatsApp: ${store.whatsapp || 'Não informado'}
- Link do cardápio: ${storeLink}

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
