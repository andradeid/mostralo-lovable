// Templates sazonais - Dias da semana especiais e feriados brasileiros

export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

// Dias da semana especiais
export const weekdayGreetings: Partial<Record<Weekday, { aberto: string[]; fechado: string[] }>> = {
  friday: {
    aberto: [
      "Sextou! 🎉 A {loja} está aberta e pronta pra você começar bem o fim de semana!\n\n📱 Confira: {link}",
      "Opa, sexta-feira! 🥳 A {loja} tá funcionando! Bora celebrar?\n\nVeja o cardápio: {link}",
      "É sexta, meu povo! 🎊 Estamos abertos e esperando seu pedido!\n\n📱 Cardápio: {link}",
      "Sexta-feira chegou! 🎉 A {loja} está pronta pra fazer seu fim de semana especial!\n\nConfira: {link}",
      "Sextouuu! 🥳 Que tal um pedido pra comemorar? A {loja} está aberta!\n\n📱 Veja: {link}",
    ],
    fechado: [
      "Sextou! 🎉 Mas infelizmente estamos fechados{proxima_abertura}.\n\nVeja o cardápio: {link}",
      "É sexta-feira! 🎊 A {loja} está fechada agora{proxima_abertura}.\n\nConfira nosso cardápio: {link}",
      "Sexta chegou! 🥳 Estamos fechados no momento{proxima_abertura}.\n\n📱 Cardápio: {link}",
    ]
  },
  saturday: {
    aberto: [
      "Bom sábado! 🌟 A {loja} está aberta! O fim de semana começou com tudo!\n\n📱 Confira: {link}",
      "Sabadou! ✨ Estamos funcionando e prontos pra você!\n\nCardápio completo: {link}",
      "Sábado maravilhoso! 🎊 A {loja} está aberta! Aproveite o dia!\n\n📱 Veja: {link}",
      "É sábado! 🌴 Dia de relaxar e fazer um pedido especial!\n\nConfira: {link}",
      "Sabadão chegou! 🎉 A {loja} está funcionando! Bora pedir?\n\n📱 Cardápio: {link}",
    ],
    fechado: [
      "Bom sábado! 🌟 Estamos fechados no momento{proxima_abertura}.\n\nVeja o cardápio: {link}",
      "Sabadou! ✨ A {loja} está fechada agora{proxima_abertura}.\n\n📱 Confira: {link}",
      "É sábado! 🎊 Infelizmente estamos fechados{proxima_abertura}.\n\nCardápio: {link}",
    ]
  },
  sunday: {
    aberto: [
      "Bom domingo! ☀️ A {loja} está aberta! Aproveite o dia de descanso!\n\n📱 Confira: {link}",
      "Domingão! 🌤️ Estamos funcionando! Relaxe e faça seu pedido.\n\nVeja: {link}",
      "Domingo especial! 🌈 A {loja} está pronta pra deixar seu dia ainda melhor!\n\n📱 Cardápio: {link}",
      "É domingo! ☀️ Dia de curtir com a família! A {loja} está aberta!\n\nConfira: {link}",
      "Domingou! 🌟 Estamos funcionando e esperando seu pedido!\n\n📱 Veja: {link}",
    ],
    fechado: [
      "Bom domingo! ☀️ Estamos fechados no momento{proxima_abertura}.\n\nVeja o cardápio: {link}",
      "Domingão! 🌤️ A {loja} está fechada agora{proxima_abertura}.\n\n📱 Confira: {link}",
      "É domingo! 🌈 Infelizmente estamos fechados{proxima_abertura}.\n\nCardápio: {link}",
    ]
  }
};

// Feriados brasileiros (DD/MM)
export interface HolidayTemplates {
  name: string;
  templates: {
    aberto: string[];
    fechado: string[];
  };
}

export const holidayGreetings: Record<string, HolidayTemplates> = {
  '01/01': {
    name: 'Ano Novo',
    templates: {
      aberto: [
        "🎊 Feliz Ano Novo! A {loja} está aberta para começar o ano com você!\n\n📱 Confira: {link}",
        "🎆 Primeiro dia do ano! A {loja} está funcionando! Bora começar bem?\n\nVeja: {link}",
        "🎉 Ano Novo, vida nova! A {loja} está aberta! Feliz 2025!\n\n📱 Cardápio: {link}",
      ],
      fechado: [
        "🎊 Feliz Ano Novo! Estamos descansando hoje{proxima_abertura}.\n\nVeja nosso cardápio: {link}",
        "🎆 Ano Novo! A {loja} está fechada{proxima_abertura}.\n\n📱 Confira: {link}",
      ]
    }
  },
  '14/02': {
    name: 'Carnaval',
    templates: {
      aberto: [
        "🎭 É Carnaval! A {loja} está aberta pra animar sua folia!\n\n📱 Confira: {link}",
        "🎊 Carnaval chegou! Estamos funcionando! Aproveite!\n\nVeja: {link}",
        "🥳 Carnavaaaal! A {loja} está aberta! Bora curtir?\n\n📱 Cardápio: {link}",
      ],
      fechado: [
        "🎭 É Carnaval! Estamos curtindo a folia{proxima_abertura}.\n\nVeja o cardápio: {link}",
        "🎊 Carnaval! A {loja} está fechada{proxima_abertura}.\n\n📱 Confira: {link}",
      ]
    }
  },
  '21/04': {
    name: 'Tiradentes',
    templates: {
      aberto: [
        "📜 Feriado de Tiradentes! A {loja} está aberta pra você!\n\n📱 Confira: {link}",
        "🇧🇷 Dia de Tiradentes! Estamos funcionando!\n\nVeja: {link}",
      ],
      fechado: [
        "📜 Feriado de Tiradentes! Estamos fechados{proxima_abertura}.\n\nCardápio: {link}",
      ]
    }
  },
  '01/05': {
    name: 'Dia do Trabalho',
    templates: {
      aberto: [
        "🛠️ Feliz Dia do Trabalho! A {loja} está aberta pra você!\n\n📱 Confira: {link}",
        "💪 Dia do Trabalhador! Estamos funcionando!\n\nVeja nosso cardápio: {link}",
      ],
      fechado: [
        "🛠️ Feliz Dia do Trabalho! Merecemos descansar{proxima_abertura}.\n\nCardápio: {link}",
        "💪 Dia do Trabalhador! Estamos fechados hoje{proxima_abertura}.\n\n📱 Confira: {link}",
      ]
    }
  },
  '12/06': {
    name: 'Dia dos Namorados',
    templates: {
      aberto: [
        "💕 Feliz Dia dos Namorados! A {loja} está aberta para tornar seu dia mais especial!\n\n📱 Confira: {link}",
        "❤️ Dia dos Namorados! Surpreenda quem você ama! Estamos abertos!\n\nVeja: {link}",
        "💘 Amor está no ar! A {loja} está funcionando pra deixar seu dia romântico!\n\n📱 Cardápio: {link}",
        "🌹 Dia dos Namorados! Que tal algo especial pra dois? A {loja} está aberta!\n\nConfira: {link}",
      ],
      fechado: [
        "💕 Feliz Dia dos Namorados! Estamos fechados{proxima_abertura}.\n\nCardápio: {link}",
        "❤️ Dia dos Namorados! A {loja} está fechada{proxima_abertura}.\n\n📱 Veja: {link}",
      ]
    }
  },
  '24/06': {
    name: 'São João',
    templates: {
      aberto: [
        "🔥 Viva São João! A {loja} está aberta! Arraiá chegou!\n\n📱 Confira: {link}",
        "🎆 Festa Junina! Estamos funcionando! Forró e comida boa!\n\nVeja: {link}",
        "🌽 São João chegou! A {loja} está aberta! Arretado!\n\n📱 Cardápio: {link}",
      ],
      fechado: [
        "🔥 Viva São João! Estamos curtindo a fogueira{proxima_abertura}.\n\nCardápio: {link}",
        "🎆 Festa Junina! A {loja} está fechada{proxima_abertura}.\n\n📱 Confira: {link}",
      ]
    }
  },
  '07/09': {
    name: 'Independência do Brasil',
    templates: {
      aberto: [
        "🇧🇷 Feliz 7 de Setembro! A {loja} está aberta! Viva o Brasil!\n\n📱 Confira: {link}",
        "💚💛 Independência! Estamos funcionando e celebrando!\n\nVeja: {link}",
      ],
      fechado: [
        "🇧🇷 Feliz Independência! Estamos fechados{proxima_abertura}.\n\nCardápio: {link}",
      ]
    }
  },
  '12/10': {
    name: 'Dia das Crianças / Nossa Senhora Aparecida',
    templates: {
      aberto: [
        "🎈 Feliz Dia das Crianças! A {loja} está aberta para a criançada!\n\n📱 Confira: {link}",
        "👧👦 Dia das Crianças! Estamos funcionando com alegria!\n\nVeja: {link}",
        "🎁 Dia especial! A {loja} está aberta! Venha comemorar!\n\n📱 Cardápio: {link}",
      ],
      fechado: [
        "🎈 Feliz Dia das Crianças! Estamos fechados{proxima_abertura}.\n\nVeja o cardápio: {link}",
        "👧👦 Dia das Crianças! A {loja} está fechada{proxima_abertura}.\n\n📱 Confira: {link}",
      ]
    }
  },
  '02/11': {
    name: 'Finados',
    templates: {
      aberto: [
        "🕯️ Dia de Finados. A {loja} está aberta com respeito e carinho.\n\n📱 Confira: {link}",
      ],
      fechado: [
        "🕯️ Dia de Finados. Estamos fechados{proxima_abertura}.\n\nCardápio: {link}",
      ]
    }
  },
  '15/11': {
    name: 'Proclamação da República',
    templates: {
      aberto: [
        "🇧🇷 Feriado da República! A {loja} está aberta!\n\n📱 Confira: {link}",
        "💚 Proclamação da República! Estamos funcionando!\n\nVeja: {link}",
      ],
      fechado: [
        "🇧🇷 Feriado da República! Estamos fechados{proxima_abertura}.\n\nCardápio: {link}",
      ]
    }
  },
  '20/11': {
    name: 'Consciência Negra',
    templates: {
      aberto: [
        "✊🏿 Dia da Consciência Negra! A {loja} está aberta e celebrando a diversidade!\n\n📱 Confira: {link}",
        "🖤 Consciência Negra! Estamos funcionando com orgulho!\n\nVeja: {link}",
      ],
      fechado: [
        "✊🏿 Dia da Consciência Negra! Estamos fechados{proxima_abertura}.\n\nCardápio: {link}",
      ]
    }
  },
  '24/12': {
    name: 'Véspera de Natal',
    templates: {
      aberto: [
        "🎄 Véspera de Natal! A {loja} está aberta! Feliz Natal!\n\n📱 Confira: {link}",
        "🎅 É Natal! Estamos funcionando pra deixar sua ceia especial!\n\nVeja: {link}",
        "✨ Noite de Natal chegando! A {loja} está aberta!\n\n📱 Cardápio: {link}",
      ],
      fechado: [
        "🎄 Véspera de Natal! Estamos em confraternização{proxima_abertura}.\n\nCardápio: {link}",
        "🎅 Natal chegando! A {loja} está fechada{proxima_abertura}.\n\n📱 Confira: {link}",
      ]
    }
  },
  '25/12': {
    name: 'Natal',
    templates: {
      aberto: [
        "🎄 Feliz Natal! A {loja} está aberta para deixar seu Natal ainda mais especial!\n\n📱 Confira: {link}",
        "🎅 Ho ho ho! A {loja} deseja um Feliz Natal! Estamos abertos!\n\nVeja: {link}",
        "✨ Natal mágico! A {loja} está funcionando! Feliz Natal!\n\n📱 Cardápio: {link}",
        "🎁 Feliz Natal! Que tal um presente delicioso? Estamos abertos!\n\nConfira: {link}",
      ],
      fechado: [
        "🎄 Feliz Natal! Hoje estamos curtindo em família{proxima_abertura}.\n\n📱 Cardápio: {link}",
        "🎅 Natal! A {loja} está fechada, descansando{proxima_abertura}.\n\nConfira: {link}",
      ]
    }
  },
  '31/12': {
    name: 'Véspera de Ano Novo',
    templates: {
      aberto: [
        "🎆 Último dia do ano! A {loja} está aberta! Bora celebrar!\n\n📱 Confira: {link}",
        "🥂 Réveillon chegando! Estamos funcionando! Feliz Ano Novo!\n\nVeja: {link}",
        "🎇 31 de dezembro! A {loja} está aberta pra sua festa!\n\n📱 Cardápio: {link}",
      ],
      fechado: [
        "🎆 Véspera de Ano Novo! Estamos em recesso{proxima_abertura}.\n\nCardápio: {link}",
        "🥂 Réveillon! A {loja} está fechada{proxima_abertura}.\n\n📱 Confira: {link}",
      ]
    }
  }
};

// Função para obter data atual formatada DD/MM
export function getCurrentDateKey(timezone: string = 'America/Sao_Paulo'): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    day: '2-digit',
    month: '2-digit',
  });
  return formatter.format(now);
}

// Função para obter dia da semana atual
export function getCurrentWeekday(timezone: string = 'America/Sao_Paulo'): Weekday {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
  });
  return formatter.format(now).toLowerCase() as Weekday;
}

// Verifica se é um feriado
export function getHolidayInfo(timezone: string = 'America/Sao_Paulo'): HolidayTemplates | null {
  const dateKey = getCurrentDateKey(timezone);
  return holidayGreetings[dateKey] || null;
}

// Verifica se é um dia da semana especial
export function getSpecialWeekdayTemplates(timezone: string = 'America/Sao_Paulo'): { aberto: string[]; fechado: string[] } | null {
  const weekday = getCurrentWeekday(timezone);
  return weekdayGreetings[weekday] || null;
}
