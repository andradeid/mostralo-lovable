// Templates de saudação humanizados - espelho do backend
export type Period = 'madrugada' | 'manha' | 'almoco' | 'tarde' | 'noite' | 'noite_tarde';

export const greetingTemplates: Record<Period, { aberto: string[]; fechado: string[] }> = {
  madrugada: {
    aberto: [
      "Olá, boa noite! 🌙 Que bom ter você aqui conosco, mesmo nesse horário!\n\nEstamos abertos e prontos para atender.\n\n📱 Confira nosso cardápio: {link}",
      "Oi! 🌙 Ainda acordado? Nós também! A {loja} está aberta neste momento.\n\nDá uma olhada no que temos pra você: {link}",
      "Boa noite! 🌙 Noite de fome? Estamos funcionando! Seja bem-vindo(a) à {loja}.\n\n📱 Veja nosso cardápio: {link}",
      "Olá! 🌙 A {loja} está aberta pra você! Que bom te ter por aqui de madrugada.\n\nAproveita e confere: {link}",
      "Oi, tudo bem? 🌙 Mesmo de madrugada, estamos aqui pra você! A {loja} está funcionando.\n\n📱 Cardápio completo: {link}"
    ],
    fechado: [
      "Boa noite! 🌙 Estamos fechados no momento{proxima_abertura}.\n\nMas você pode conferir nosso cardápio: {link}",
      "Oi! 🌙 A {loja} já encerrou o expediente{proxima_abertura}.\n\n📱 Veja o cardápio para quando abrirmos: {link}",
      "Olá! 🌙 No momento não estamos funcionando{proxima_abertura}.\n\nAproveita e conhece nosso cardápio: {link}",
      "Boa noite! 🌙 Infelizmente estamos fechados{proxima_abertura}.\n\n📱 Confira o que temos: {link}",
      "Oi! 🌙 A {loja} está fechada agora{proxima_abertura}.\n\nDá uma olhada no cardápio: {link}"
    ]
  },
  manha: {
    aberto: [
      "Bom dia! ☀️ Seja bem-vindo(a) à {loja}! Estamos abertos e prontos para começar seu dia bem.\n\n📱 Confira: {link}",
      "Oi, bom dia! ☀️ A {loja} já está funcionando! Que tal começar o dia com algo especial?\n\nVeja nosso cardápio: {link}",
      "Bom dia! ☀️ Que bom ter você aqui! A {loja} está aberta e esperando seu pedido.\n\n📱 Confira: {link}",
      "Olá, bom dia! ☀️ Estamos abertos! Seja muito bem-vindo(a) à {loja}.\n\nDá uma olhada: {link}",
      "Bom dia! ☀️ Pronto(a) pra um pedido? A {loja} está funcionando agora!\n\n📱 Cardápio: {link}"
    ],
    fechado: [
      "Bom dia! ☀️ Ainda estamos fechados{proxima_abertura}.\n\nMas você pode ver nosso cardápio: {link}",
      "Oi, bom dia! ☀️ A {loja} ainda não abriu{proxima_abertura}.\n\n📱 Confira o cardápio: {link}",
      "Bom dia! ☀️ No momento não estamos funcionando{proxima_abertura}.\n\nVeja o que temos: {link}",
      "Olá! ☀️ Estamos fechados agora{proxima_abertura}.\n\n📱 Cardápio disponível: {link}",
      "Bom dia! ☀️ A {loja} abre em breve{proxima_abertura}.\n\nEnquanto isso, confira: {link}"
    ]
  },
  almoco: {
    aberto: [
      "Oi! 🍽️ Hora do almoço! A {loja} está aberta e pronta pra matar sua fome.\n\n📱 Veja nosso cardápio: {link}",
      "Boa tarde! 🍽️ Tá com fome? A {loja} está funcionando! Confira nossas opções.\n\n📱 Cardápio: {link}",
      "Olá! 🍽️ Hora perfeita pra um pedido! Estamos abertos e esperando você.\n\nConfira: {link}",
      "Oi! 🍽️ Bora almoçar? A {loja} está aberta agora!\n\n📱 Veja tudo aqui: {link}",
      "Boa tarde! 🍽️ Chegou a hora do almoço! A {loja} está pronta pra atender.\n\nCardápio: {link}"
    ],
    fechado: [
      "Oi! 🍽️ Que pena, estamos fechados no horário do almoço{proxima_abertura}.\n\nMas confira nosso cardápio: {link}",
      "Olá! 🍽️ A {loja} não está funcionando agora{proxima_abertura}.\n\n📱 Veja o cardápio: {link}",
      "Boa tarde! 🍽️ Infelizmente estamos fechados{proxima_abertura}.\n\nConfira o que temos: {link}",
      "Oi! 🍽️ Estamos fechados no momento{proxima_abertura}.\n\n📱 Cardápio: {link}",
      "Olá! 🍽️ A {loja} está fechada agora{proxima_abertura}.\n\nDá uma olhada: {link}"
    ]
  },
  tarde: {
    aberto: [
      "Boa tarde! 🌤️ Seja bem-vindo(a) à {loja}! Estamos abertos e prontos para atender.\n\n📱 Confira: {link}",
      "Oi, boa tarde! 🌤️ A {loja} está funcionando! O que você tá procurando hoje?\n\nVeja nosso cardápio: {link}",
      "Boa tarde! 🌤️ Que bom ter você aqui! Estamos abertos e com tudo fresquinho.\n\n📱 Confira: {link}",
      "Olá! 🌤️ A {loja} está aberta neste momento! Seja bem-vindo(a).\n\nCardápio: {link}",
      "Boa tarde! 🌤️ Estamos funcionando! Aproveita e dá uma olhada no que temos.\n\n📱 Veja: {link}"
    ],
    fechado: [
      "Boa tarde! 🌤️ Estamos fechados no momento{proxima_abertura}.\n\nMas você pode conferir o cardápio: {link}",
      "Oi! 🌤️ A {loja} não está funcionando agora{proxima_abertura}.\n\n📱 Veja nosso cardápio: {link}",
      "Boa tarde! 🌤️ Infelizmente estamos fechados{proxima_abertura}.\n\nConfira: {link}",
      "Olá! 🌤️ No momento não estamos atendendo{proxima_abertura}.\n\n📱 Cardápio: {link}",
      "Boa tarde! 🌤️ A {loja} está fechada agora{proxima_abertura}.\n\nDá uma olhada no cardápio: {link}"
    ]
  },
  noite: {
    aberto: [
      "Boa noite! 🌆 Seja bem-vindo(a) à {loja}! Estamos abertos e prontos pra você.\n\n📱 Confira nosso cardápio: {link}",
      "Oi, boa noite! 🌆 A {loja} está funcionando! Que tal fazer um pedido?\n\nVeja: {link}",
      "Boa noite! 🌆 Que bom ter você aqui! Estamos abertos e esperando seu pedido.\n\n📱 Cardápio: {link}",
      "Olá, boa noite! 🌆 A {loja} está aberta neste momento! Confira nossas opções.\n\nVeja: {link}",
      "Boa noite! 🌆 Tá com fome? Estamos funcionando! Seja bem-vindo(a) à {loja}.\n\n📱 Confira: {link}"
    ],
    fechado: [
      "Boa noite! 🌆 Infelizmente estamos fechados agora{proxima_abertura}.\n\nMas você pode ver nosso cardápio: {link}",
      "Oi, boa noite! 🌆 A {loja} já encerrou o expediente{proxima_abertura}.\n\n📱 Confira o cardápio para quando abrirmos: {link}",
      "Boa noite! 🌆 Que pena, estamos fechados no momento{proxima_abertura}.\n\nAproveita e dá uma olhada no cardápio: {link}",
      "Olá! 🌆 No momento não estamos funcionando{proxima_abertura}.\n\n📱 Veja nosso cardápio e escolha com calma: {link}",
      "Boa noite! 🌆 A {loja} está fechada agora{proxima_abertura}.\n\nConfira o cardápio para quando abrirmos: {link}"
    ]
  },
  noite_tarde: {
    aberto: [
      "Boa noite! 🌙 Ainda estamos abertos! A {loja} funciona até tarde pra você.\n\n📱 Confira: {link}",
      "Oi! 🌙 Já é tarde, mas a {loja} ainda está funcionando! Aproveita!\n\nCardápio: {link}",
      "Boa noite! 🌙 Fome de noite? A {loja} está aberta! Confira o cardápio.\n\n📱 Veja: {link}",
      "Olá! 🌙 A noite tá boa e a {loja} também está aberta! Seja bem-vindo(a).\n\nConfira: {link}",
      "Boa noite! 🌙 Ainda dá tempo! Estamos funcionando e prontos para atender.\n\n📱 Cardápio: {link}"
    ],
    fechado: [
      "Boa noite! 🌙 Já encerramos o expediente{proxima_abertura}.\n\nMas você pode conferir o cardápio: {link}",
      "Oi! 🌙 A {loja} já fechou por hoje{proxima_abertura}.\n\n📱 Veja o cardápio: {link}",
      "Boa noite! 🌙 Infelizmente estamos fechados{proxima_abertura}.\n\nConfira o que temos: {link}",
      "Olá! 🌙 Estamos fechados no momento{proxima_abertura}.\n\n📱 Cardápio: {link}",
      "Boa noite! 🌙 A {loja} encerrou as atividades{proxima_abertura}.\n\nDá uma olhada no cardápio: {link}"
    ]
  }
};

export const periodInfo: Record<Period, { label: string; emoji: string; hours: string }> = {
  madrugada: { label: 'Madrugada', emoji: '🌙', hours: '00h - 05h' },
  manha: { label: 'Manhã', emoji: '☀️', hours: '06h - 10h' },
  almoco: { label: 'Almoço', emoji: '🍽️', hours: '11h - 13h' },
  tarde: { label: 'Tarde', emoji: '🌤️', hours: '14h - 17h' },
  noite: { label: 'Noite', emoji: '🌆', hours: '18h - 21h' },
  noite_tarde: { label: 'Noite Tarde', emoji: '🌙', hours: '22h - 23h' }
};

export function getPeriodFromHour(hour: number): Period {
  if (hour >= 0 && hour < 6) return 'madrugada';
  if (hour >= 6 && hour < 11) return 'manha';
  if (hour >= 11 && hour < 14) return 'almoco';
  if (hour >= 14 && hour < 18) return 'tarde';
  if (hour >= 18 && hour < 22) return 'noite';
  return 'noite_tarde';
}

export function getRandomGreeting(
  period: Period,
  isOpen: boolean,
  storeName: string,
  storeLink: string,
  nextOpening?: string | null
): string {
  const templates = greetingTemplates[period][isOpen ? 'aberto' : 'fechado'];
  const randomIndex = Math.floor(Math.random() * templates.length);
  let message = templates[randomIndex];

  message = message
    .replace(/{loja}/g, storeName)
    .replace(/{link}/g, storeLink)
    .replace(/{proxima_abertura}/g, nextOpening ? `, mas abrimos ${nextOpening}` : '');

  return message;
}
