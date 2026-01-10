// Sistema Unificado de Templates Inteligentes - Frontend (Preview)
// Espelho do backend para preview no dashboard

export type Period = 'madrugada' | 'manha' | 'almoco' | 'tarde' | 'noite' | 'noite_tarde';
export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type StoreNiche = 
  | 'restaurante' | 'pizzaria' | 'hamburgueria' | 'lanchonete' | 'cafeteria'
  | 'padaria' | 'doceria' | 'sushi' | 'churrascaria' | 'farmacia' 
  | 'supermercado' | 'acougue' | 'hortifruti' | 'petshop' | 'conveniencia' | 'bebidas' | 'default';

// =============================================================================
// INFORMAÇÕES DOS PERÍODOS
// =============================================================================

export const periodInfo: Record<Period, { label: string; emoji: string; hours: string }> = {
  madrugada: { label: 'Madrugada', emoji: '🌙', hours: '00h - 05h' },
  manha: { label: 'Manhã', emoji: '☀️', hours: '06h - 10h' },
  almoco: { label: 'Almoço', emoji: '🍽️', hours: '11h - 13h' },
  tarde: { label: 'Tarde', emoji: '🌤️', hours: '14h - 17h' },
  noite: { label: 'Noite', emoji: '🌆', hours: '18h - 21h' },
  noite_tarde: { label: 'Noite Tarde', emoji: '🌙', hours: '22h - 23h' }
};

// =============================================================================
// INFORMAÇÕES DOS NICHOS
// =============================================================================

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

// =============================================================================
// TEMPLATES GENÉRICOS POR PERÍODO
// =============================================================================

export const greetingTemplates: Record<Period, { aberto: string[]; fechado: string[] }> = {
  madrugada: {
    aberto: [
      "Olá, boa noite! 🌙 Que bom ter você aqui conosco, mesmo nesse horário!\n\nEstamos abertos e prontos para atender.\n\n📱 Confira nosso cardápio: {link}",
      "Oi! 🌙 Ainda acordado? Nós também! A {loja} está aberta neste momento.\n\nDá uma olhada no que temos pra você: {link}",
      "Boa noite! 🌙 Noite de fome? Estamos funcionando! Seja bem-vindo(a) à {loja}.\n\n📱 Veja nosso cardápio: {link}",
    ],
    fechado: [
      "Boa noite! 🌙 Estamos fechados no momento{proxima_abertura}.\n\nMas você pode conferir nosso cardápio: {link}",
      "Oi! 🌙 A {loja} já encerrou o expediente{proxima_abertura}.\n\n📱 Veja o cardápio para quando abrirmos: {link}",
    ]
  },
  manha: {
    aberto: [
      "Bom dia! ☀️ Seja bem-vindo(a) à {loja}! Estamos abertos e prontos para começar seu dia bem.\n\n📱 Confira: {link}",
      "Oi, bom dia! ☀️ A {loja} já está funcionando! Que tal começar o dia com algo especial?\n\nVeja nosso cardápio: {link}",
    ],
    fechado: [
      "Bom dia! ☀️ Ainda estamos fechados{proxima_abertura}.\n\nMas você pode ver nosso cardápio: {link}",
      "Oi, bom dia! ☀️ A {loja} ainda não abriu{proxima_abertura}.\n\n📱 Confira o cardápio: {link}",
    ]
  },
  almoco: {
    aberto: [
      "Oi! 🍽️ Hora do almoço! A {loja} está aberta e pronta pra matar sua fome.\n\n📱 Veja nosso cardápio: {link}",
      "Boa tarde! 🍽️ Tá com fome? A {loja} está funcionando! Confira nossas opções.\n\n📱 Cardápio: {link}",
    ],
    fechado: [
      "Oi! 🍽️ Que pena, estamos fechados no horário do almoço{proxima_abertura}.\n\nMas confira nosso cardápio: {link}",
      "Olá! 🍽️ A {loja} não está funcionando agora{proxima_abertura}.\n\n📱 Veja o cardápio: {link}",
    ]
  },
  tarde: {
    aberto: [
      "Boa tarde! 🌤️ Seja bem-vindo(a) à {loja}! Estamos abertos e prontos para atender.\n\n📱 Confira: {link}",
      "Oi, boa tarde! 🌤️ A {loja} está funcionando! O que você tá procurando hoje?\n\nVeja nosso cardápio: {link}",
    ],
    fechado: [
      "Boa tarde! 🌤️ Estamos fechados no momento{proxima_abertura}.\n\nMas você pode conferir o cardápio: {link}",
      "Oi! 🌤️ A {loja} não está funcionando agora{proxima_abertura}.\n\n📱 Veja nosso cardápio: {link}",
    ]
  },
  noite: {
    aberto: [
      "Boa noite! 🌆 Seja bem-vindo(a) à {loja}! Estamos abertos e prontos pra você.\n\n📱 Confira nosso cardápio: {link}",
      "Oi, boa noite! 🌆 A {loja} está funcionando! Que tal fazer um pedido?\n\nVeja: {link}",
    ],
    fechado: [
      "Boa noite! 🌆 Infelizmente estamos fechados agora{proxima_abertura}.\n\nMas você pode ver nosso cardápio: {link}",
      "Oi, boa noite! 🌆 A {loja} já encerrou o expediente{proxima_abertura}.\n\n📱 Confira o cardápio: {link}",
    ]
  },
  noite_tarde: {
    aberto: [
      "Boa noite! 🌙 Ainda estamos abertos! A {loja} funciona até tarde pra você.\n\n📱 Confira: {link}",
      "Oi! 🌙 Já é tarde, mas a {loja} ainda está funcionando! Aproveita!\n\nCardápio: {link}",
    ],
    fechado: [
      "Boa noite! 🌙 Já encerramos o expediente{proxima_abertura}.\n\nMas você pode conferir o cardápio: {link}",
      "Oi! 🌙 A {loja} já fechou por hoje{proxima_abertura}.\n\n📱 Veja o cardápio: {link}",
    ]
  }
};

// =============================================================================
// TEMPLATES SAZONAIS - DIAS DA SEMANA
// =============================================================================

export const weekdayGreetings: Partial<Record<Weekday, { aberto: string[]; fechado: string[] }>> = {
  friday: {
    aberto: [
      "Sextou! 🎉 A {loja} está aberta e pronta pra você começar bem o fim de semana!\n\n📱 Confira: {link}",
      "Opa, sexta-feira! 🥳 A {loja} tá funcionando! Bora celebrar?\n\nVeja o cardápio: {link}",
      "É sexta, meu povo! 🎊 Estamos abertos e esperando seu pedido!\n\n📱 Cardápio: {link}",
    ],
    fechado: [
      "Sextou! 🎉 Mas infelizmente estamos fechados{proxima_abertura}.\n\nVeja o cardápio: {link}",
    ]
  },
  saturday: {
    aberto: [
      "Bom sábado! 🌟 A {loja} está aberta! O fim de semana começou com tudo!\n\n📱 Confira: {link}",
      "Sabadou! ✨ Estamos funcionando e prontos pra você!\n\nCardápio completo: {link}",
    ],
    fechado: [
      "Bom sábado! 🌟 Estamos fechados no momento{proxima_abertura}.\n\nVeja o cardápio: {link}",
    ]
  },
  sunday: {
    aberto: [
      "Bom domingo! ☀️ A {loja} está aberta! Aproveite o dia de descanso!\n\n📱 Confira: {link}",
      "Domingão! 🌤️ Estamos funcionando! Relaxe e faça seu pedido.\n\nVeja: {link}",
    ],
    fechado: [
      "Bom domingo! ☀️ Estamos fechados no momento{proxima_abertura}.\n\nVeja o cardápio: {link}",
    ]
  }
};

// =============================================================================
// TEMPLATES SAZONAIS - FERIADOS
// =============================================================================

export const holidayGreetings: Record<string, { name: string; templates: { aberto: string[]; fechado: string[] } }> = {
  '01/01': {
    name: 'Ano Novo',
    templates: {
      aberto: ["🎊 Feliz Ano Novo! A {loja} está aberta para começar o ano com você!\n\n📱 Confira: {link}"],
      fechado: ["🎊 Feliz Ano Novo! Estamos descansando hoje{proxima_abertura}.\n\nVeja nosso cardápio: {link}"]
    }
  },
  '12/06': {
    name: 'Dia dos Namorados',
    templates: {
      aberto: ["💕 Feliz Dia dos Namorados! A {loja} está aberta para tornar seu dia mais especial!\n\n📱 Confira: {link}"],
      fechado: ["💕 Feliz Dia dos Namorados! Estamos fechados{proxima_abertura}.\n\nCardápio: {link}"]
    }
  },
  '12/10': {
    name: 'Dia das Crianças',
    templates: {
      aberto: ["🎈 Feliz Dia das Crianças! A {loja} está aberta para a criançada!\n\n📱 Confira: {link}"],
      fechado: ["🎈 Feliz Dia das Crianças! Estamos fechados{proxima_abertura}.\n\nVeja o cardápio: {link}"]
    }
  },
  '25/12': {
    name: 'Natal',
    templates: {
      aberto: ["🎄 Feliz Natal! A {loja} está aberta para deixar seu Natal ainda mais especial!\n\n📱 Confira: {link}"],
      fechado: ["🎄 Feliz Natal! Hoje estamos curtindo em família{proxima_abertura}.\n\n📱 Cardápio: {link}"]
    }
  },
  '31/12': {
    name: 'Véspera de Ano Novo',
    templates: {
      aberto: ["🎆 Último dia do ano! A {loja} está aberta! Bora celebrar!\n\n📱 Confira: {link}"],
      fechado: ["🎆 Véspera de Ano Novo! Estamos em recesso{proxima_abertura}.\n\nCardápio: {link}"]
    }
  }
};

// =============================================================================
// TEMPLATES POR NICHO
// =============================================================================

export const nicheTemplates: Record<StoreNiche, { aberto: string[]; fechado: string[] }> = {
  restaurante: {
    aberto: [
      "Oi! 🍽️ Bateu aquela fome? A {loja} está aberta e com o cardápio quentinho!\n\n📱 Confira: {link}",
      "Olá! 😋 Tá com fome? A {loja} está funcionando! Escolhe o que você vai comer!\n\nVeja: {link}",
    ],
    fechado: [
      "Oi! 🍽️ Que pena, a cozinha já fechou{proxima_abertura}.\n\nMas veja nosso cardápio: {link}",
    ]
  },
  pizzaria: {
    aberto: [
      "Oi! 🍕 Dia de pizza! A {loja} está com o forno ligado e pronta pra você!\n\n📱 Confira os sabores: {link}",
      "Pizza time! 🍕 A {loja} está aberta! Escolhe seus sabores favoritos!\n\nConfira: {link}",
    ],
    fechado: [
      "Oi! 🍕 O forno já apagou por hoje{proxima_abertura}.\n\nVeja nossos sabores: {link}",
    ]
  },
  hamburgueria: {
    aberto: [
      "Oi! 🍔 Bateu aquela vontade de hambúrguer? A {loja} está aberta!\n\n📱 Confira: {link}",
      "Smash! 🍔 A {loja} está aberta! Vem pro melhor hambúrguer!\n\nConfira: {link}",
    ],
    fechado: [
      "Oi! 🍔 A chapa já esfriou por hoje{proxima_abertura}.\n\nVeja nosso cardápio: {link}",
    ]
  },
  lanchonete: {
    aberto: ["Oi! 🥪 Bateu aquela fominha? A {loja} está aberta!\n\n📱 Confira: {link}"],
    fechado: ["Oi! 🥪 Estamos fechados agora{proxima_abertura}.\n\nVeja nosso cardápio: {link}"]
  },
  cafeteria: {
    aberto: ["Oi! ☕ Hora do café! A {loja} está aberta com o aroma mais gostoso!\n\n📱 Confira: {link}"],
    fechado: ["Oi! ☕ A {loja} já fechou por hoje{proxima_abertura}.\n\nVeja nosso cardápio: {link}"]
  },
  padaria: {
    aberto: ["Bom dia! 🥐 Cheirinho de pão fresquinho! A {loja} está aberta!\n\n📱 Confira: {link}"],
    fechado: ["Oi! 🥐 Os fornos já descansaram por hoje{proxima_abertura}.\n\nVeja nosso cardápio: {link}"]
  },
  doceria: {
    aberto: ["Oi! 🍰 Vontade de doce? A {loja} está aberta com as melhores sobremesas!\n\n📱 Confira: {link}"],
    fechado: ["Oi! 🍰 A doceria já fechou{proxima_abertura}.\n\nVeja nossos doces: {link}"]
  },
  sushi: {
    aberto: ["Oi! 🍣 Sushi fresco! A {loja} está aberta!\n\n📱 Confira o cardápio: {link}"],
    fechado: ["Oi! 🍣 A cozinha japonesa já fechou{proxima_abertura}.\n\nVeja o cardápio: {link}"]
  },
  churrascaria: {
    aberto: ["Oi! 🥩 Dia de carne! A {loja} está aberta com cortes especiais!\n\n📱 Confira: {link}"],
    fechado: ["Oi! 🥩 A brasa já apagou por hoje{proxima_abertura}.\n\nVeja nosso cardápio: {link}"]
  },
  farmacia: {
    aberto: ["Olá! 💊 Precisando de algo? A {loja} está aberta e pronta para ajudar!\n\n📱 Confira: {link}"],
    fechado: ["Olá! 💊 Estamos fechados no momento{proxima_abertura}.\n\nConfira nossos produtos: {link}"]
  },
  supermercado: {
    aberto: ["Olá! 🛒 Hora das compras? A {loja} está aberta com tudo fresquinho!\n\n📱 Confira: {link}"],
    fechado: ["Olá! 🛒 Estamos fechados agora{proxima_abertura}.\n\nVeja nossos produtos: {link}"]
  },
  acougue: {
    aberto: ["Olá! 🥩 Carnes frescas! A {loja} está aberta!\n\n📱 Confira: {link}"],
    fechado: ["Olá! 🥩 Estamos fechados agora{proxima_abertura}.\n\nVeja nossos cortes: {link}"]
  },
  hortifruti: {
    aberto: ["Olá! 🥬 Produtos fresquinhos! A {loja} está aberta!\n\n📱 Confira: {link}"],
    fechado: ["Olá! 🥬 Estamos fechados agora{proxima_abertura}.\n\nVeja nossos produtos: {link}"]
  },
  petshop: {
    aberto: ["Olá! 🐾 Seu pet precisa de algo? A {loja} está aberta!\n\n📱 Confira: {link}"],
    fechado: ["Olá! 🐾 Estamos fechados no momento{proxima_abertura}.\n\nVeja nossos produtos: {link}"]
  },
  conveniencia: {
    aberto: ["Olá! 🏪 Precisando de algo? A {loja} está aberta!\n\n📱 Confira: {link}"],
    fechado: ["Olá! 🏪 Estamos fechados agora{proxima_abertura}.\n\nVeja nossos produtos: {link}"]
  },
  bebidas: {
    aberto: ["Olá! 🍺 Hora de gelar! A {loja} está aberta com bebidas geladas!\n\n📱 Confira: {link}"],
    fechado: ["Olá! 🍺 Estamos fechados agora{proxima_abertura}.\n\nVeja nossas bebidas: {link}"]
  },
  default: {
    aberto: ["Olá! 🏪 A {loja} está aberta e pronta para atender você!\n\n📱 Confira: {link}"],
    fechado: ["Olá! 🏪 Estamos fechados no momento{proxima_abertura}.\n\nVeja nossos produtos: {link}"]
  }
};

// =============================================================================
// FUNÇÕES AUXILIARES
// =============================================================================

export function getPeriodFromHour(hour: number): Period {
  if (hour >= 0 && hour < 6) return 'madrugada';
  if (hour >= 6 && hour < 11) return 'manha';
  if (hour >= 11 && hour < 14) return 'almoco';
  if (hour >= 14 && hour < 18) return 'tarde';
  if (hour >= 18 && hour < 22) return 'noite';
  return 'noite_tarde';
}

function getCurrentDateKey(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

function getCurrentWeekday(): Weekday {
  const days: Weekday[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
}

function getRandomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function detectNiche(segment?: string | null, storeName?: string): StoreNiche {
  const segmentMap: Record<string, StoreNiche> = {
    'alimentacao-e-bebidas': 'restaurante',
    'pizzaria': 'pizzaria',
    'hamburgueria': 'hamburgueria',
    'farmacia': 'farmacia',
    'supermercado': 'supermercado',
    'petshop': 'petshop',
  };
  
  if (segment && segmentMap[segment.toLowerCase()]) {
    return segmentMap[segment.toLowerCase()];
  }
  
  if (storeName) {
    const nameLower = storeName.toLowerCase();
    if (nameLower.includes('pizza')) return 'pizzaria';
    if (nameLower.includes('burger') || nameLower.includes('hamburguer')) return 'hamburgueria';
    if (nameLower.includes('sushi')) return 'sushi';
    if (nameLower.includes('café') || nameLower.includes('cafe')) return 'cafeteria';
    if (nameLower.includes('padaria')) return 'padaria';
    if (nameLower.includes('farm') || nameLower.includes('drogaria')) return 'farmacia';
    if (nameLower.includes('mercado') || nameLower.includes('super')) return 'supermercado';
    if (nameLower.includes('pet')) return 'petshop';
  }
  
  return 'default';
}

// =============================================================================
// FUNÇÃO PRINCIPAL UNIFICADA
// =============================================================================

export function getRandomGreeting(
  period: Period,
  isOpen: boolean,
  storeName: string,
  storeLink: string,
  nextOpening?: string | null,
  storeSegment?: string | null
): string {
  const status = isOpen ? 'aberto' : 'fechado';
  let selectedTemplate: string | null = null;

  // PRIORIDADE 1: Feriado
  const dateKey = getCurrentDateKey();
  const holiday = holidayGreetings[dateKey];
  if (holiday) {
    const templates = holiday.templates[status];
    if (templates?.length) {
      selectedTemplate = getRandomFromArray(templates);
    }
  }

  // PRIORIDADE 2: Dia da semana especial (50% chance)
  if (!selectedTemplate && Math.random() > 0.5) {
    const weekday = getCurrentWeekday();
    const weekdayTemplates = weekdayGreetings[weekday];
    if (weekdayTemplates) {
      const templates = weekdayTemplates[status];
      if (templates?.length) {
        selectedTemplate = getRandomFromArray(templates);
      }
    }
  }

  // PRIORIDADE 3: Nicho específico (70% chance)
  if (!selectedTemplate && Math.random() > 0.3) {
    const niche = detectNiche(storeSegment, storeName);
    if (niche !== 'default') {
      const templates = nicheTemplates[niche][status];
      if (templates?.length) {
        selectedTemplate = getRandomFromArray(templates);
      }
    }
  }

  // PRIORIDADE 4: Genérico por período
  if (!selectedTemplate) {
    const templates = greetingTemplates[period][status];
    selectedTemplate = getRandomFromArray(templates);
  }

  return selectedTemplate
    .replace(/{loja}/g, storeName)
    .replace(/{link}/g, storeLink)
    .replace(/{proxima_abertura}/g, nextOpening ? `, mas abrimos ${nextOpening}` : '');
}

// Informações para o preview
export function getHolidayInfo(): { name: string } | null {
  const dateKey = getCurrentDateKey();
  return holidayGreetings[dateKey] || null;
}

export function getWeekdayInfo(): { name: string; isSpecial: boolean } {
  const weekday = getCurrentWeekday();
  const weekdayNames: Record<Weekday, string> = {
    monday: 'Segunda-feira',
    tuesday: 'Terça-feira',
    wednesday: 'Quarta-feira',
    thursday: 'Quinta-feira',
    friday: 'Sexta-feira',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };
  return {
    name: weekdayNames[weekday],
    isSpecial: ['friday', 'saturday', 'sunday'].includes(weekday)
  };
}
