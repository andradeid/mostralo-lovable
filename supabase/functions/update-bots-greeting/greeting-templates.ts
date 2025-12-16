// Templates de saudação humanizadas - 60 variações (6 períodos × 2 status × 5 modelos)

export type Period = 'madrugada' | 'manha' | 'almoco' | 'tarde' | 'noite' | 'noite_tarde';

// Templates para LOJA ABERTA
const madrugadaAberto = [
  "Olá, boa noite! 🌙 Que bom ter você aqui conosco, mesmo nesse horário!\n\nEstamos abertos e prontos para atender.\n\n📱 Confira nosso cardápio: {link}",
  "Oi! 🌙 Ainda acordado? Nós também! A {loja} está aberta neste momento.\n\nDá uma olhada no que temos pra você: {link}",
  "Boa noite! 🌙 Noite de fome? Estamos funcionando! Seja bem-vindo(a) à {loja}.\n\n📱 Veja nosso cardápio: {link}",
  "Olá! 🌙 A {loja} está aberta pra você! Que bom te ter por aqui de madrugada.\n\nAproveita e confere: {link}",
  "Oi, tudo bem? 🌙 Mesmo de madrugada, estamos aqui pra você! A {loja} está funcionando.\n\n📱 Cardápio completo: {link}"
];

const manhaAberto = [
  "Bom dia! ☀️ Seja bem-vindo(a) à {loja}! Estamos abertos e prontos para começar seu dia bem.\n\n📱 Confira: {link}",
  "Oi, bom dia! ☀️ A {loja} já está funcionando! Que tal começar o dia com algo especial?\n\nVeja nosso cardápio: {link}",
  "Bom dia! ☀️ Que bom ter você aqui! A {loja} está aberta e esperando seu pedido.\n\n📱 Confira: {link}",
  "Olá, bom dia! ☀️ Estamos abertos! Seja muito bem-vindo(a) à {loja}.\n\nDá uma olhada: {link}",
  "Bom dia! ☀️ Pronto(a) pra um pedido? A {loja} está funcionando agora!\n\n📱 Cardápio: {link}"
];

const almocoAberto = [
  "Oi! 🍽️ Hora do almoço! A {loja} está aberta e pronta pra matar sua fome.\n\n📱 Veja nosso cardápio: {link}",
  "Boa tarde! 🍽️ Tá com fome? A {loja} está funcionando! Confira nossas opções.\n\n📱 Cardápio: {link}",
  "Olá! 🍽️ Hora perfeita pra um pedido! Estamos abertos e esperando você.\n\nConfira: {link}",
  "Oi! 🍽️ Bora almoçar? A {loja} está aberta agora!\n\n📱 Veja tudo aqui: {link}",
  "Boa tarde! 🍽️ Chegou a hora do almoço! A {loja} está pronta pra atender.\n\nCardápio: {link}"
];

const tardeAberto = [
  "Boa tarde! 🌤️ Seja bem-vindo(a) à {loja}! Estamos abertos e prontos para atender.\n\n📱 Confira: {link}",
  "Oi, boa tarde! 🌤️ A {loja} está funcionando! O que você tá procurando hoje?\n\nVeja nosso cardápio: {link}",
  "Boa tarde! 🌤️ Que bom ter você aqui! Estamos abertos e com tudo fresquinho.\n\n📱 Confira: {link}",
  "Olá! 🌤️ A {loja} está aberta neste momento! Seja bem-vindo(a).\n\nCardápio: {link}",
  "Boa tarde! 🌤️ Estamos funcionando! Aproveita e dá uma olhada no que temos.\n\n📱 Veja: {link}"
];

const noiteAberto = [
  "Boa noite! 🌆 Seja bem-vindo(a) à {loja}! Estamos abertos e prontos pra você.\n\n📱 Confira nosso cardápio: {link}",
  "Oi, boa noite! 🌆 A {loja} está funcionando! Que tal fazer um pedido?\n\nVeja: {link}",
  "Boa noite! 🌆 Que bom ter você aqui! Estamos abertos e esperando seu pedido.\n\n📱 Cardápio: {link}",
  "Olá, boa noite! 🌆 A {loja} está aberta neste momento! Confira nossas opções.\n\nVeja: {link}",
  "Boa noite! 🌆 Tá com fome? Estamos funcionando! Seja bem-vindo(a) à {loja}.\n\n📱 Confira: {link}"
];

const noiteTardeAberto = [
  "Boa noite! 🌙 Ainda estamos abertos! A {loja} funciona até tarde pra você.\n\n📱 Confira: {link}",
  "Oi! 🌙 Já é tarde, mas a {loja} ainda está funcionando! Aproveita!\n\nCardápio: {link}",
  "Boa noite! 🌙 Fome de noite? A {loja} está aberta! Confira o cardápio.\n\n📱 Veja: {link}",
  "Olá! 🌙 A noite tá boa e a {loja} também está aberta! Seja bem-vindo(a).\n\nConfira: {link}",
  "Boa noite! 🌙 Ainda dá tempo! Estamos funcionando e prontos para atender.\n\n📱 Cardápio: {link}"
];

// Templates para LOJA FECHADA
const madrugadaFechado = [
  "Oi, boa noite! 🌙 A {loja} está fechada agora{proxima_abertura}.\n\nMas você pode já ir escolhendo o que vai pedir: {link}",
  "Olá! 🌙 Infelizmente estamos fechados neste horário{proxima_abertura}.\n\n📱 Dá uma olhada no cardápio e escolha com calma: {link}",
  "Boa noite! 🌙 No momento não estamos funcionando{proxima_abertura}.\n\nAproveita pra ver nosso cardápio: {link}",
  "Oi! 🌙 A {loja} já encerrou o expediente{proxima_abertura}.\n\n📱 Confira o cardápio enquanto isso: {link}",
  "Olá! 🌙 Que pena, estamos fechados agora{proxima_abertura}.\n\nVeja nosso cardápio e escolha o que vai pedir: {link}"
];

const manhaFechado = [
  "Bom dia! ☀️ A {loja} ainda não está funcionando{proxima_abertura}.\n\nMas você já pode ver o cardápio: {link}",
  "Oi, bom dia! ☀️ Estamos fechados no momento{proxima_abertura}.\n\n📱 Aproveita pra conferir nossas opções: {link}",
  "Bom dia! ☀️ Infelizmente ainda não abrimos{proxima_abertura}.\n\nDá uma olhada no cardápio: {link}",
  "Olá, bom dia! ☀️ A {loja} está fechada agora{proxima_abertura}.\n\n📱 Confira o cardápio enquanto espera: {link}",
  "Bom dia! ☀️ Ainda não começamos o expediente{proxima_abertura}.\n\nVeja nosso cardápio: {link}"
];

const almocoFechado = [
  "Oi! 🍽️ Que pena, estamos fechados agora{proxima_abertura}.\n\nMas você já pode escolher o que vai pedir: {link}",
  "Olá! 🍽️ A {loja} não está funcionando neste horário{proxima_abertura}.\n\n📱 Confira o cardápio: {link}",
  "Boa tarde! 🍽️ Infelizmente estamos fechados{proxima_abertura}.\n\nAproveita pra ver o cardápio: {link}",
  "Oi! 🍽️ No momento a {loja} está fechada{proxima_abertura}.\n\n📱 Veja as opções enquanto isso: {link}",
  "Olá! 🍽️ Estamos fechados agora{proxima_abertura}.\n\nDá uma olhada no cardápio: {link}"
];

const tardeFechado = [
  "Boa tarde! 🌤️ A {loja} está fechada neste momento{proxima_abertura}.\n\nMas você pode conferir nosso cardápio: {link}",
  "Oi, boa tarde! 🌤️ Infelizmente não estamos funcionando agora{proxima_abertura}.\n\n📱 Veja o cardápio: {link}",
  "Boa tarde! 🌤️ Estamos fechados{proxima_abertura}.\n\nAproveita e já escolhe o que vai querer: {link}",
  "Olá! 🌤️ A {loja} não está aberta no momento{proxima_abertura}.\n\n📱 Confira o cardápio enquanto isso: {link}",
  "Boa tarde! 🌤️ Que pena, estamos fechados{proxima_abertura}.\n\nDá uma olhada no cardápio: {link}"
];

const noiteFechado = [
  "Boa noite! 🌆 Infelizmente estamos fechados agora{proxima_abertura}.\n\nMas você pode ver nosso cardápio e já escolher: {link}",
  "Oi, boa noite! 🌆 A {loja} já encerrou o expediente{proxima_abertura}.\n\n📱 Confira o cardápio para quando abrirmos: {link}",
  "Boa noite! 🌆 Que pena, estamos fechados no momento{proxima_abertura}.\n\nAproveita e dá uma olhada no cardápio: {link}",
  "Olá! 🌆 No momento não estamos funcionando{proxima_abertura}.\n\n📱 Veja nosso cardápio e escolha com calma: {link}",
  "Boa noite! 🌆 A {loja} está fechada agora{proxima_abertura}.\n\nConfira o cardápio para quando abrirmos: {link}"
];

const noiteTardeFechado = [
  "Boa noite! 🌙 A {loja} já fechou por hoje{proxima_abertura}.\n\nMas você pode ver o cardápio: {link}",
  "Oi! 🌙 Já encerramos o expediente{proxima_abertura}.\n\n📱 Confira nosso cardápio: {link}",
  "Boa noite! 🌙 Infelizmente já estamos fechados{proxima_abertura}.\n\nVeja o cardápio enquanto isso: {link}",
  "Olá! 🌙 A {loja} não está mais funcionando hoje{proxima_abertura}.\n\n📱 Confira o cardápio: {link}",
  "Boa noite! 🌙 Que pena, já fechamos{proxima_abertura}.\n\nDá uma olhada no cardápio: {link}"
];

// Mapa de templates organizados
export const greetingTemplates: Record<Period, { aberto: string[]; fechado: string[] }> = {
  madrugada: { aberto: madrugadaAberto, fechado: madrugadaFechado },
  manha: { aberto: manhaAberto, fechado: manhaFechado },
  almoco: { aberto: almocoAberto, fechado: almocoFechado },
  tarde: { aberto: tardeAberto, fechado: tardeFechado },
  noite: { aberto: noiteAberto, fechado: noiteFechado },
  noite_tarde: { aberto: noiteTardeAberto, fechado: noiteTardeFechado },
};

// Função para determinar período do dia
export function getPeriodFromHour(hour: number): Period {
  if (hour >= 0 && hour < 6) return 'madrugada';
  if (hour >= 6 && hour < 11) return 'manha';
  if (hour >= 11 && hour < 14) return 'almoco';
  if (hour >= 14 && hour < 18) return 'tarde';
  if (hour >= 18 && hour < 22) return 'noite';
  return 'noite_tarde'; // 22-23
}

// Função para selecionar saudação aleatória
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

  // Substituir placeholders
  message = message
    .replace(/{loja}/g, storeName)
    .replace(/{link}/g, storeLink)
    .replace(/{proxima_abertura}/g, nextOpening ? `, mas abrimos ${nextOpening}` : '');

  return message;
}

// Função para obter saudação simples (para instruções do prompt)
export function getSimpleGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

// Função para obter emoji do período
export function getPeriodEmoji(period: Period): string {
  const emojis: Record<Period, string> = {
    madrugada: '🌙',
    manha: '☀️',
    almoco: '🍽️',
    tarde: '🌤️',
    noite: '🌆',
    noite_tarde: '🌙',
  };
  return emojis[period];
}
