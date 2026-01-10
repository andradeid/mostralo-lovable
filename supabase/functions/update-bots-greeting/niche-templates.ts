// Templates por nicho de loja - Personalização por segmento de negócio

export type StoreNiche = 
  | 'restaurante' 
  | 'pizzaria' 
  | 'hamburgueria' 
  | 'lanchonete'
  | 'cafeteria'
  | 'padaria'
  | 'doceria'
  | 'sushi'
  | 'churrascaria'
  | 'farmacia' 
  | 'supermercado' 
  | 'acougue'
  | 'hortifruti'
  | 'petshop' 
  | 'conveniencia'
  | 'bebidas'
  | 'default';

// Mapeamento de segment do banco para nicho
export const segmentToNiche: Record<string, StoreNiche> = {
  'alimentacao-e-bebidas': 'restaurante',
  'pizzaria': 'pizzaria',
  'hamburgueria': 'hamburgueria',
  'lanchonete': 'lanchonete',
  'cafeteria': 'cafeteria',
  'padaria': 'padaria',
  'doceria': 'doceria',
  'sushi': 'sushi',
  'japonesa': 'sushi',
  'churrascaria': 'churrascaria',
  'farmacia': 'farmacia',
  'saude': 'farmacia',
  'supermercado': 'supermercado',
  'mercado': 'supermercado',
  'acougue': 'acougue',
  'carnes': 'acougue',
  'hortifruti': 'hortifruti',
  'verduras': 'hortifruti',
  'petshop': 'petshop',
  'pet': 'petshop',
  'conveniencia': 'conveniencia',
  'bebidas': 'bebidas',
  'adega': 'bebidas',
  'servicos': 'default',
  'varejo': 'default',
};

// Informações visuais dos nichos
export const nicheInfo: Record<StoreNiche, { label: string; emoji: string }> = {
  restaurante: { label: 'Restaurante', emoji: '🍽️' },
  pizzaria: { label: 'Pizzaria', emoji: '🍕' },
  hamburgueria: { label: 'Hamburgueria', emoji: '🍔' },
  lanchonete: { label: 'Lanchonete', emoji: '🥪' },
  cafeteria: { label: 'Cafeteria', emoji: '☕' },
  padaria: { label: 'Padaria', emoji: '🥐' },
  doceria: { label: 'Doceria', emoji: '🍰' },
  sushi: { label: 'Sushi', emoji: '🍣' },
  churrascaria: { label: 'Churrascaria', emoji: '🥩' },
  farmacia: { label: 'Farmácia', emoji: '💊' },
  supermercado: { label: 'Supermercado', emoji: '🛒' },
  acougue: { label: 'Açougue', emoji: '🥩' },
  hortifruti: { label: 'Hortifruti', emoji: '🥬' },
  petshop: { label: 'Pet Shop', emoji: '🐾' },
  conveniencia: { label: 'Conveniência', emoji: '🏪' },
  bebidas: { label: 'Bebidas', emoji: '🍺' },
  default: { label: 'Loja', emoji: '🏪' },
};

// Templates específicos por nicho
export const nicheTemplates: Record<StoreNiche, { aberto: string[]; fechado: string[] }> = {
  restaurante: {
    aberto: [
      "Oi! 🍽️ Bateu aquela fome? A {loja} está aberta e pronta pra você!\n\n📱 Confira: {link}",
      "Olá! 😋 Tá com fome? A {loja} está funcionando! Escolhe o que você vai comer!\n\nVeja: {link}",
      "Oi! 🍴 O cheirinho tá bom por aqui! A {loja} está pronta pra matar sua fome!\n\n📱 Loja: {link}",
      "Eaí! 🍽️ Bora comer? A {loja} está aberta e esperando seu pedido!\n\nConfira: {link}",
      "Olá! 😋 A cozinha tá funcionando! Vem pro {loja} fazer seu pedido!\n\n📱 Veja: {link}",
    ],
    fechado: [
      "Oi! 🍽️ Que pena, a cozinha já fechou{proxima_abertura}.\n\nMas veja nossa loja: {link}",
      "Olá! 😋 Estamos fechados agora{proxima_abertura}.\n\n📱 Confira a loja: {link}",
      "Oi! 🍴 A {loja} está fechada no momento{proxima_abertura}.\n\nVeja a loja: {link}",
    ]
  },
  
  pizzaria: {
    aberto: [
      "Oi! 🍕 Dia de pizza! A {loja} está com o forno ligado e pronta pra você!\n\n📱 Confira os sabores: {link}",
      "Olá! 🍕 A {loja} está aberta! Uma pizza quentinha cairia bem, né?\n\nVeja: {link}",
      "Oi! 🔥 Forno ligado, massa fresquinha! A {loja} está funcionando!\n\n📱 Loja: {link}",
      "Pizza time! 🍕 A {loja} está aberta! Escolhe seus sabores favoritos!\n\nConfira: {link}",
      "Oi! 🍕 Tá com vontade de pizza? A {loja} tá aberta e esperando você!\n\n📱 Sabores: {link}",
    ],
    fechado: [
      "Oi! 🍕 O forno já apagou por hoje{proxima_abertura}.\n\nVeja nossos sabores: {link}",
      "Olá! 🔥 A {loja} está fechada agora{proxima_abertura}.\n\n📱 Confira os sabores: {link}",
      "Oi! 🍕 Estamos fechados no momento{proxima_abertura}.\n\nLoja: {link}",
    ]
  },
  
  hamburgueria: {
    aberto: [
      "Oi! 🍔 Bateu aquela vontade de hambúrguer? A {loja} está aberta!\n\n📱 Confira: {link}",
      "Olá! 🍔 A chapa tá quente! A {loja} está funcionando e esperando seu pedido!\n\nVeja: {link}",
      "Oi! 🔥 Burger time! A {loja} está pronta pra fazer aquele lanche perfeito!\n\n📱 Loja: {link}",
      "Smash! 🍔 A {loja} está aberta! Vem pro melhor hambúrguer!\n\nConfira: {link}",
      "Oi! 🍔 Fome de hambúrguer? A {loja} tá funcionando!\n\n📱 Veja os burgers: {link}",
    ],
    fechado: [
      "Oi! 🍔 A chapa já esfriou por hoje{proxima_abertura}.\n\nVeja nossa loja: {link}",
      "Olá! 🔥 Estamos fechados agora{proxima_abertura}.\n\n📱 Confira os burgers: {link}",
      "Oi! 🍔 A {loja} está fechada no momento{proxima_abertura}.\n\nLoja: {link}",
    ]
  },

  lanchonete: {
    aberto: [
      "Oi! 🥪 Bateu aquela fominha? A {loja} está aberta!\n\n📱 Confira: {link}",
      "Olá! 🍟 A {loja} está funcionando! Que tal um lanche?\n\nVeja: {link}",
      "Oi! 🥤 Hora do lanche! A {loja} está pronta pra atender!\n\n📱 Loja: {link}",
    ],
    fechado: [
      "Oi! 🥪 Estamos fechados agora{proxima_abertura}.\n\nVeja nossa loja: {link}",
      "Olá! 🍟 A {loja} está fechada no momento{proxima_abertura}.\n\n📱 Confira: {link}",
    ]
  },

  cafeteria: {
    aberto: [
      "Oi! ☕ Hora do café! A {loja} está aberta com o aroma mais gostoso!\n\n📱 Confira: {link}",
      "Olá! ☕ Que tal um cafézinho? A {loja} está funcionando!\n\nVeja: {link}",
      "Oi! 🧁 Café fresquinho esperando você! A {loja} está aberta!\n\n📱 Loja: {link}",
    ],
    fechado: [
      "Oi! ☕ A {loja} já fechou por hoje{proxima_abertura}.\n\nVeja nossa loja: {link}",
      "Olá! ☕ Estamos fechados no momento{proxima_abertura}.\n\n📱 Confira: {link}",
    ]
  },

  padaria: {
    aberto: [
      "Bom dia! 🥐 Cheirinho de pão fresquinho! A {loja} está aberta!\n\n📱 Confira: {link}",
      "Olá! 🍞 A {loja} está funcionando! Pães quentinhos saindo do forno!\n\nVeja: {link}",
      "Oi! ☕ Café com pão? A {loja} está aberta e esperando você!\n\n📱 Loja: {link}",
      "Padariaaaa! 🥖 A {loja} está com os pães fresquinhos!\n\nConfira: {link}",
    ],
    fechado: [
      "Oi! 🥐 Os fornos já descansaram por hoje{proxima_abertura}.\n\nVeja nossa loja: {link}",
      "Olá! 🍞 A {loja} está fechada agora{proxima_abertura}.\n\n📱 Confira: {link}",
    ]
  },

  doceria: {
    aberto: [
      "Oi! 🍰 Vontade de doce? A {loja} está aberta com as melhores sobremesas!\n\n📱 Confira: {link}",
      "Olá! 🧁 A {loja} está funcionando! Doces deliciosos esperando você!\n\nVeja: {link}",
      "Oi! 🎂 Hora de adoçar o dia! A {loja} está aberta!\n\n📱 Loja: {link}",
    ],
    fechado: [
      "Oi! 🍰 A doceria já fechou{proxima_abertura}.\n\nVeja nossos doces: {link}",
      "Olá! 🧁 Estamos fechados no momento{proxima_abertura}.\n\n📱 Confira: {link}",
    ]
  },

  sushi: {
    aberto: [
      "Oi! 🍣 Sushi fresco! A {loja} está aberta!\n\n📱 Confira a loja: {link}",
      "Olá! 🥢 A {loja} está funcionando! Combinados e temakis esperando você!\n\nVeja: {link}",
      "Oi! 🍱 Hora do japonês! A {loja} está aberta!\n\n📱 Loja: {link}",
    ],
    fechado: [
      "Oi! 🍣 A cozinha japonesa já fechou{proxima_abertura}.\n\nVeja a loja: {link}",
      "Olá! 🥢 Estamos fechados no momento{proxima_abertura}.\n\n📱 Confira: {link}",
    ]
  },

  churrascaria: {
    aberto: [
      "Oi! 🥩 Dia de carne! A {loja} está aberta com cortes especiais!\n\n📱 Confira: {link}",
      "Olá! 🔥 A brasa tá acesa! A {loja} está funcionando!\n\nVeja: {link}",
      "Oi! 🥩 Churras time! A {loja} está pronta pra você!\n\n📱 Loja: {link}",
    ],
    fechado: [
      "Oi! 🥩 A brasa já apagou por hoje{proxima_abertura}.\n\nVeja nossa loja: {link}",
      "Olá! 🔥 Estamos fechados no momento{proxima_abertura}.\n\n📱 Confira: {link}",
    ]
  },
  
  farmacia: {
    aberto: [
      "Olá! 💊 Precisando de algo? A {loja} está aberta e pronta para ajudar!\n\n📱 Confira: {link}",
      "Oi! 🏥 A {loja} está funcionando! Cuidamos da sua saúde com carinho.\n\nVeja: {link}",
      "Olá! 💚 Sua saúde em primeiro lugar! A {loja} está aberta!\n\n📱 Produtos: {link}",
      "Oi! 💊 A {loja} está atendendo! Saúde e bem-estar pra você!\n\nConfira: {link}",
    ],
    fechado: [
      "Olá! 💊 Estamos fechados no momento{proxima_abertura}.\n\nConfira nossos produtos: {link}",
      "Oi! 🏥 A {loja} está fechada agora{proxima_abertura}.\n\n📱 Veja nossos produtos: {link}",
    ]
  },
  
  supermercado: {
    aberto: [
      "Olá! 🛒 Hora das compras? A {loja} está aberta com tudo fresquinho!\n\n📱 Confira: {link}",
      "Oi! 🥬 A {loja} está funcionando! Ofertas especiais esperando você!\n\nVeja: {link}",
      "Olá! 🛍️ Compras do dia? A {loja} está aberta com os melhores preços!\n\n📱 Produtos: {link}",
      "Oi! 🛒 Mercadinho aberto! A {loja} tem tudo que você precisa!\n\nConfira: {link}",
    ],
    fechado: [
      "Olá! 🛒 Estamos fechados agora{proxima_abertura}.\n\nVeja nossos produtos: {link}",
      "Oi! 🛍️ A {loja} está fechada no momento{proxima_abertura}.\n\n📱 Confira: {link}",
    ]
  },

  acougue: {
    aberto: [
      "Olá! 🥩 Carnes frescas! A {loja} está aberta!\n\n📱 Confira: {link}",
      "Oi! 🥓 A {loja} está funcionando! Cortes especiais esperando você!\n\nVeja: {link}",
      "Olá! 🥩 Açougue aberto! A {loja} tem as melhores carnes!\n\n📱 Produtos: {link}",
    ],
    fechado: [
      "Olá! 🥩 Estamos fechados agora{proxima_abertura}.\n\nVeja nossos cortes: {link}",
      "Oi! 🥓 A {loja} está fechada no momento{proxima_abertura}.\n\n📱 Confira: {link}",
    ]
  },

  hortifruti: {
    aberto: [
      "Olá! 🥬 Produtos fresquinhos! A {loja} está aberta!\n\n📱 Confira: {link}",
      "Oi! 🍎 A {loja} está funcionando! Frutas e verduras do dia!\n\nVeja: {link}",
      "Olá! 🥕 Hortifruti aberto! Tudo fresquinho esperando você!\n\n📱 Produtos: {link}",
    ],
    fechado: [
      "Olá! 🥬 Estamos fechados agora{proxima_abertura}.\n\nVeja nossos produtos: {link}",
      "Oi! 🍎 A {loja} está fechada no momento{proxima_abertura}.\n\n📱 Confira: {link}",
    ]
  },
  
  petshop: {
    aberto: [
      "Olá! 🐾 Seu pet precisa de algo? A {loja} está aberta!\n\n📱 Confira: {link}",
      "Oi! 🐕 A {loja} está funcionando! Cuidamos do seu melhor amigo!\n\nVeja: {link}",
      "Olá! 🐱 Hora de mimar o pet! A {loja} está aberta!\n\n📱 Produtos: {link}",
      "Au au! 🐶 A {loja} está aberta pra você e seu pet!\n\nConfira: {link}",
    ],
    fechado: [
      "Olá! 🐾 Estamos fechados no momento{proxima_abertura}.\n\nVeja nossos produtos: {link}",
      "Oi! 🐕 A {loja} está fechada agora{proxima_abertura}.\n\n📱 Confira: {link}",
    ]
  },

  conveniencia: {
    aberto: [
      "Olá! 🏪 Precisando de algo? A {loja} está aberta!\n\n📱 Confira: {link}",
      "Oi! 🛒 Conveniência aberta! A {loja} tem tudo que você precisa!\n\nVeja: {link}",
      "Olá! 🏪 Rapidinho e prático! A {loja} está funcionando!\n\n📱 Produtos: {link}",
    ],
    fechado: [
      "Olá! 🏪 Estamos fechados agora{proxima_abertura}.\n\nVeja nossos produtos: {link}",
      "Oi! 🛒 A {loja} está fechada no momento{proxima_abertura}.\n\n📱 Confira: {link}",
    ]
  },

  bebidas: {
    aberto: [
      "Olá! 🍺 Hora de gelar! A {loja} está aberta com bebidas geladas!\n\n📱 Confira: {link}",
      "Oi! 🥃 A {loja} está funcionando! Cervejas, destilados e mais!\n\nVeja: {link}",
      "Olá! 🍷 Adega aberta! A {loja} tem as melhores bebidas!\n\n📱 Produtos: {link}",
    ],
    fechado: [
      "Olá! 🍺 Estamos fechados agora{proxima_abertura}.\n\nVeja nossas bebidas: {link}",
      "Oi! 🥃 A {loja} está fechada no momento{proxima_abertura}.\n\n📱 Confira: {link}",
    ]
  },
  
  default: {
    aberto: [
      "Olá! 🏪 A {loja} está aberta e pronta para atender você!\n\n📱 Confira: {link}",
      "Oi! ✨ Estamos funcionando! A {loja} espera seu pedido!\n\nVeja: {link}",
      "Olá! 🌟 A {loja} está aberta! Seja bem-vindo(a)!\n\n📱 Produtos: {link}",
    ],
    fechado: [
      "Olá! 🏪 Estamos fechados no momento{proxima_abertura}.\n\nVeja nossos produtos: {link}",
      "Oi! ✨ A {loja} está fechada agora{proxima_abertura}.\n\n📱 Confira: {link}",
    ]
  }
};

// Função para detectar nicho pelo segment ou nome da loja
export function detectNiche(segment?: string | null, storeName?: string): StoreNiche {
  // Primeiro tenta pelo segment
  if (segment) {
    const normalized = segment.toLowerCase().trim();
    if (segmentToNiche[normalized]) {
      return segmentToNiche[normalized];
    }
    
    // Tenta encontrar parcialmente
    for (const [key, niche] of Object.entries(segmentToNiche)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return niche;
      }
    }
  }
  
  // Tenta detectar pelo nome da loja
  if (storeName) {
    const nameLower = storeName.toLowerCase();
    
    if (nameLower.includes('pizza') || nameLower.includes('pizzaria')) return 'pizzaria';
    if (nameLower.includes('burger') || nameLower.includes('hamburguer') || nameLower.includes('hamburgueria')) return 'hamburgueria';
    if (nameLower.includes('sushi') || nameLower.includes('japonês') || nameLower.includes('japones')) return 'sushi';
    if (nameLower.includes('café') || nameLower.includes('cafe') || nameLower.includes('cafeteria')) return 'cafeteria';
    if (nameLower.includes('padaria') || nameLower.includes('pão') || nameLower.includes('pao')) return 'padaria';
    if (nameLower.includes('doceria') || nameLower.includes('doces') || nameLower.includes('confeitaria')) return 'doceria';
    if (nameLower.includes('churras') || nameLower.includes('churrasco')) return 'churrascaria';
    if (nameLower.includes('farm') || nameLower.includes('drogaria')) return 'farmacia';
    if (nameLower.includes('mercado') || nameLower.includes('super') || nameLower.includes('mercearia')) return 'supermercado';
    if (nameLower.includes('açougue') || nameLower.includes('acougue') || nameLower.includes('carne')) return 'acougue';
    if (nameLower.includes('pet') || nameLower.includes('vet')) return 'petshop';
    if (nameLower.includes('bebida') || nameLower.includes('adega') || nameLower.includes('distribuidora')) return 'bebidas';
    if (nameLower.includes('lanche') || nameLower.includes('lanchonete')) return 'lanchonete';
    if (nameLower.includes('conveniência') || nameLower.includes('conveniencia')) return 'conveniencia';
    if (nameLower.includes('hortifruti') || nameLower.includes('verdura') || nameLower.includes('fruta')) return 'hortifruti';
    
    // Palavras genéricas de restaurante
    if (nameLower.includes('restaurante') || nameLower.includes('grill') || nameLower.includes('bistrô')) return 'restaurante';
  }
  
  return 'default';
}
