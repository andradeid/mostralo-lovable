// Sistema Unificado de Templates Inteligentes - 141+ variações
// Combina: período do dia + status + feriados + dias especiais + nicho da loja

import { 
  holidayGreetings, 
  weekdayGreetings, 
  getHolidayInfo, 
  getSpecialWeekdayTemplates,
  getCurrentWeekday,
  type Weekday,
  type HolidayTemplates 
} from "./seasonal-templates.ts";

import { 
  nicheTemplates, 
  detectNiche, 
  nicheInfo,
  type StoreNiche 
} from "./niche-templates.ts";

export type Period = 'madrugada' | 'manha' | 'almoco' | 'tarde' | 'noite' | 'noite_tarde';

// Re-export para manter compatibilidade
export { 
  holidayGreetings, 
  weekdayGreetings, 
  getHolidayInfo, 
  getSpecialWeekdayTemplates,
  getCurrentWeekday,
  nicheTemplates, 
  detectNiche, 
  nicheInfo 
};
export type { Weekday, HolidayTemplates, StoreNiche };

// =============================================================================
// TEMPLATES GENÉRICOS POR PERÍODO (Fallback)
// =============================================================================

// Templates para LOJA ABERTA
const madrugadaAberto = [
  "Olá, boa noite! 🌙 Que bom ter você aqui conosco, mesmo nesse horário!\n\nEstamos abertos e prontos para atender.\n\n📱 Confira nossa loja: {link}",
  "Oi! 🌙 Ainda acordado? Nós também! A {loja} está aberta neste momento.\n\nDá uma olhada no que temos pra você: {link}",
  "Boa noite! 🌙 Noite de fome? Estamos funcionando! Seja bem-vindo(a) à {loja}.\n\n📱 Veja nossa loja: {link}",
  "Olá! 🌙 A {loja} está aberta pra você! Que bom te ter por aqui de madrugada.\n\nAproveita e confere: {link}",
  "Oi, tudo bem? 🌙 Mesmo de madrugada, estamos aqui pra você! A {loja} está funcionando.\n\n📱 Veja tudo aqui: {link}"
];

const manhaAberto = [
  "Bom dia! ☀️ Seja bem-vindo(a) à {loja}! Estamos abertos e prontos para começar seu dia bem.\n\n📱 Confira: {link}",
  "Oi, bom dia! ☀️ A {loja} já está funcionando! Que tal começar o dia com algo especial?\n\nVeja nossa loja: {link}",
  "Bom dia! ☀️ Que bom ter você aqui! A {loja} está aberta e esperando seu pedido.\n\n📱 Confira: {link}",
  "Olá, bom dia! ☀️ Estamos abertos! Seja muito bem-vindo(a) à {loja}.\n\nDá uma olhada: {link}",
  "Bom dia! ☀️ Pronto(a) pra um pedido? A {loja} está funcionando agora!\n\n📱 Produtos: {link}"
];

const almocoAberto = [
  "Oi! 🍽️ Hora do almoço! A {loja} está aberta e pronta pra matar sua fome.\n\n📱 Veja nossa loja: {link}",
  "Boa tarde! 🍽️ Tá com fome? A {loja} está funcionando! Confira nossas opções.\n\n📱 Produtos: {link}",
  "Olá! 🍽️ Hora perfeita pra um pedido! Estamos abertos e esperando você.\n\nConfira: {link}",
  "Oi! 🍽️ Bora almoçar? A {loja} está aberta agora!\n\n📱 Veja tudo aqui: {link}",
  "Boa tarde! 🍽️ Chegou a hora do almoço! A {loja} está pronta pra atender.\n\nConfira: {link}"
];

const tardeAberto = [
  "Boa tarde! 🌤️ Seja bem-vindo(a) à {loja}! Estamos abertos e prontos para atender.\n\n📱 Confira: {link}",
  "Oi, boa tarde! 🌤️ A {loja} está funcionando! O que você tá procurando hoje?\n\nVeja nossa loja: {link}",
  "Boa tarde! 🌤️ Que bom ter você aqui! Estamos abertos e com tudo fresquinho.\n\n📱 Confira: {link}",
  "Olá! 🌤️ A {loja} está aberta neste momento! Seja bem-vindo(a).\n\nConfira: {link}",
  "Boa tarde! 🌤️ Estamos funcionando! Aproveita e dá uma olhada no que temos.\n\n📱 Veja: {link}"
];

const noiteAberto = [
  "Boa noite! 🌆 Seja bem-vindo(a) à {loja}! Estamos abertos e prontos pra você.\n\n📱 Confira nossa loja: {link}",
  "Oi, boa noite! 🌆 A {loja} está funcionando! Que tal fazer um pedido?\n\nVeja: {link}",
  "Boa noite! 🌆 Que bom ter você aqui! Estamos abertos e esperando seu pedido.\n\n📱 Produtos: {link}",
  "Olá, boa noite! 🌆 A {loja} está aberta neste momento! Confira nossas opções.\n\nVeja: {link}",
  "Boa noite! 🌆 Tá com fome? Estamos funcionando! Seja bem-vindo(a) à {loja}.\n\n📱 Confira: {link}"
];

const noiteTardeAberto = [
  "Boa noite! 🌙 Ainda estamos abertos! A {loja} funciona até tarde pra você.\n\n📱 Confira: {link}",
  "Oi! 🌙 Já é tarde, mas a {loja} ainda está funcionando! Aproveita!\n\nVeja: {link}",
  "Boa noite! 🌙 Fome de noite? A {loja} está aberta! Confira nossa loja.\n\n📱 Veja: {link}",
  "Olá! 🌙 A noite tá boa e a {loja} também está aberta! Seja bem-vindo(a).\n\nConfira: {link}",
  "Boa noite! 🌙 Ainda dá tempo! Estamos funcionando e prontos para atender.\n\n📱 Produtos: {link}"
];

// Templates para LOJA FECHADA
const madrugadaFechado = [
  "Oi, boa noite! 🌙 A {loja} está fechada agora{proxima_abertura}.\n\nMas você pode já ir escolhendo o que vai pedir: {link}",
  "Olá! 🌙 Infelizmente estamos fechados neste horário{proxima_abertura}.\n\n📱 Dá uma olhada na loja e escolha com calma: {link}",
  "Boa noite! 🌙 No momento não estamos funcionando{proxima_abertura}.\n\nAproveita pra ver nossa loja: {link}",
  "Oi! 🌙 A {loja} já encerrou o expediente{proxima_abertura}.\n\n📱 Confira a loja enquanto isso: {link}",
  "Olá! 🌙 Que pena, estamos fechados agora{proxima_abertura}.\n\nVeja nossa loja e escolha o que vai pedir: {link}"
];

const manhaFechado = [
  "Bom dia! ☀️ A {loja} ainda não está funcionando{proxima_abertura}.\n\nMas você já pode ver a loja: {link}",
  "Oi, bom dia! ☀️ Estamos fechados no momento{proxima_abertura}.\n\n📱 Aproveita pra conferir nossas opções: {link}",
  "Bom dia! ☀️ Infelizmente ainda não abrimos{proxima_abertura}.\n\nDá uma olhada na loja: {link}",
  "Olá, bom dia! ☀️ A {loja} está fechada agora{proxima_abertura}.\n\n📱 Confira a loja enquanto espera: {link}",
  "Bom dia! ☀️ Ainda não começamos o expediente{proxima_abertura}.\n\nVeja nossa loja: {link}"
];

const almocoFechado = [
  "Oi! 🍽️ Que pena, estamos fechados agora{proxima_abertura}.\n\nMas você já pode escolher o que vai pedir: {link}",
  "Olá! 🍽️ A {loja} não está funcionando neste horário{proxima_abertura}.\n\n📱 Confira a loja: {link}",
  "Boa tarde! 🍽️ Infelizmente estamos fechados{proxima_abertura}.\n\nAproveita pra ver a loja: {link}",
  "Oi! 🍽️ No momento a {loja} está fechada{proxima_abertura}.\n\n📱 Veja as opções enquanto isso: {link}",
  "Olá! 🍽️ Estamos fechados agora{proxima_abertura}.\n\nDá uma olhada na loja: {link}"
];

const tardeFechado = [
  "Boa tarde! 🌤️ A {loja} está fechada neste momento{proxima_abertura}.\n\nMas você pode conferir nossa loja: {link}",
  "Oi, boa tarde! 🌤️ Infelizmente não estamos funcionando agora{proxima_abertura}.\n\n📱 Veja a loja: {link}",
  "Boa tarde! 🌤️ Estamos fechados{proxima_abertura}.\n\nAproveita e já escolhe o que vai querer: {link}",
  "Olá! 🌤️ A {loja} não está aberta no momento{proxima_abertura}.\n\n📱 Confira a loja enquanto isso: {link}",
  "Boa tarde! 🌤️ Que pena, estamos fechados{proxima_abertura}.\n\nDá uma olhada na loja: {link}"
];

const noiteFechado = [
  "Boa noite! 🌆 Infelizmente estamos fechados agora{proxima_abertura}.\n\nMas você pode ver nossa loja e já escolher: {link}",
  "Oi, boa noite! 🌆 A {loja} já encerrou o expediente{proxima_abertura}.\n\n📱 Confira a loja para quando abrirmos: {link}",
  "Boa noite! 🌆 Que pena, estamos fechados no momento{proxima_abertura}.\n\nAproveita e dá uma olhada na loja: {link}",
  "Olá! 🌆 No momento não estamos funcionando{proxima_abertura}.\n\n📱 Veja nossa loja e escolha com calma: {link}",
  "Boa noite! 🌆 A {loja} está fechada agora{proxima_abertura}.\n\nConfira a loja para quando abrirmos: {link}"
];

const noiteTardeFechado = [
  "Boa noite! 🌙 A {loja} já fechou por hoje{proxima_abertura}.\n\nMas você pode ver a loja: {link}",
  "Oi! 🌙 Já encerramos o expediente{proxima_abertura}.\n\n📱 Confira nossa loja: {link}",
  "Boa noite! 🌙 Infelizmente já estamos fechados{proxima_abertura}.\n\nVeja a loja enquanto isso: {link}",
  "Olá! 🌙 A {loja} não está mais funcionando hoje{proxima_abertura}.\n\n📱 Confira a loja: {link}",
  "Boa noite! 🌙 Que pena, já fechamos{proxima_abertura}.\n\nDá uma olhada na loja: {link}"
];

// Mapa de templates genéricos organizados
export const greetingTemplates: Record<Period, { aberto: string[]; fechado: string[] }> = {
  madrugada: { aberto: madrugadaAberto, fechado: madrugadaFechado },
  manha: { aberto: manhaAberto, fechado: manhaFechado },
  almoco: { aberto: almocoAberto, fechado: almocoFechado },
  tarde: { aberto: tardeAberto, fechado: tardeFechado },
  noite: { aberto: noiteAberto, fechado: noiteFechado },
  noite_tarde: { aberto: noiteTardeAberto, fechado: noiteTardeFechado },
};

// =============================================================================
// FUNÇÕES AUXILIARES
// =============================================================================

// Função para determinar período do dia
export function getPeriodFromHour(hour: number): Period {
  if (hour >= 0 && hour < 6) return 'madrugada';
  if (hour >= 6 && hour < 11) return 'manha';
  if (hour >= 11 && hour < 14) return 'almoco';
  if (hour >= 14 && hour < 18) return 'tarde';
  if (hour >= 18 && hour < 22) return 'noite';
  return 'noite_tarde'; // 22-23
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

// Função auxiliar para selecionar template aleatório
function getRandomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Substitui placeholders no template
function replacePlaceholders(
  template: string,
  storeName: string,
  storeLink: string,
  nextOpening?: string | null
): string {
  return template
    .replace(/{loja}/g, storeName)
    .replace(/{link}/g, storeLink)
    .replace(/{proxima_abertura}/g, nextOpening ? `, mas abrimos ${nextOpening}` : '');
}

// =============================================================================
// SISTEMA UNIFICADO DE SELEÇÃO DE TEMPLATES
// =============================================================================

export interface GreetingContext {
  period: Period;
  isOpen: boolean;
  storeName: string;
  storeLink: string;
  nextOpening?: string | null;
  timezone?: string;
  storeSegment?: string | null;
}

/**
 * Seleciona o melhor template seguindo prioridades:
 * 1. Feriado/Data comemorativa (100% chance)
 * 2. Dia da semana especial (50% chance - para não ficar repetitivo)
 * 3. Nicho específico da loja (70% chance)
 * 4. Template genérico por período (fallback)
 */
export function selectBestGreeting(context: GreetingContext): string {
  const { 
    period, 
    isOpen, 
    storeName, 
    storeLink, 
    nextOpening,
    timezone = 'America/Sao_Paulo',
    storeSegment 
  } = context;

  const status = isOpen ? 'aberto' : 'fechado';
  let selectedTemplate: string | null = null;

  // PRIORIDADE 1: Feriado/Data comemorativa (100% chance)
  const holiday = getHolidayInfo(timezone);
  if (holiday) {
    const templates = holiday.templates[status];
    if (templates && templates.length > 0) {
      selectedTemplate = getRandomFromArray(templates);
      console.log(`🎉 Template de feriado selecionado: ${holiday.name}`);
    }
  }

  // PRIORIDADE 2: Dia da semana especial (50% chance)
  if (!selectedTemplate && Math.random() > 0.5) {
    const weekdayTemplates = getSpecialWeekdayTemplates(timezone);
    if (weekdayTemplates) {
      const templates = weekdayTemplates[status];
      if (templates && templates.length > 0) {
        selectedTemplate = getRandomFromArray(templates);
        const weekday = getCurrentWeekday(timezone);
        console.log(`📅 Template de dia especial selecionado: ${weekday}`);
      }
    }
  }

  // PRIORIDADE 3: Nicho específico da loja (70% chance)
  if (!selectedTemplate && Math.random() > 0.3) {
    const niche = detectNiche(storeSegment, storeName);
    if (niche !== 'default') {
      const templates = nicheTemplates[niche][status];
      if (templates && templates.length > 0) {
        selectedTemplate = getRandomFromArray(templates);
        console.log(`🏪 Template de nicho selecionado: ${niche}`);
      }
    }
  }

  // PRIORIDADE 4: Template genérico por período (fallback)
  if (!selectedTemplate) {
    const templates = greetingTemplates[period][status];
    selectedTemplate = getRandomFromArray(templates);
    console.log(`⏰ Template genérico selecionado: ${period}`);
  }

  return replacePlaceholders(selectedTemplate, storeName, storeLink, nextOpening);
}

// =============================================================================
// FUNÇÃO PRINCIPAL (mantém compatibilidade com versão anterior)
// =============================================================================

/**
 * Função principal para selecionar saudação
 * Agora usa o sistema unificado internamente
 */
export function getRandomGreeting(
  period: Period,
  isOpen: boolean,
  storeName: string,
  storeLink: string,
  nextOpening?: string | null,
  timezone?: string,
  storeSegment?: string | null
): string {
  return selectBestGreeting({
    period,
    isOpen,
    storeName,
    storeLink,
    nextOpening,
    timezone,
    storeSegment
  });
}

// =============================================================================
// PRÓXIMA ABERTURA CONTEXTUAL
// =============================================================================

export interface NextOpeningContextual {
  text: string;
  proximity: 'soon' | 'today' | 'tomorrow' | 'later';
  hoursRemaining?: number;
  dayName?: string;
  time: string;
}

/**
 * Calcula próxima abertura com contexto detalhado
 */
export function getNextOpeningContextual(
  businessHours: any,
  timezone: string = 'America/Sao_Paulo'
): NextOpeningContextual | null {
  if (!businessHours) return null;

  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const weekdayEn = parts.find(p => p.type === 'weekday')?.value?.toLowerCase() || '';
  const hourStr = parts.find(p => p.type === 'hour')?.value || '00';
  const minuteStr = parts.find(p => p.type === 'minute')?.value || '00';
  const currentHour = parseInt(hourStr);
  const currentMinute = parseInt(minuteStr);
  const currentTime = `${hourStr}:${minuteStr}`;

  const dayNamesEn = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayNamesPt = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  const currentDayIndex = dayNamesEn.indexOf(weekdayEn);
  if (currentDayIndex === -1) return null;

  // Verificar se abre ainda hoje
  const todayHours = businessHours[dayNamesEn[currentDayIndex]];
  if (todayHours && !todayHours.closed && currentTime < todayHours.open) {
    const [openHour, openMinute] = todayHours.open.split(':').map(Number);
    const minutesUntilOpen = (openHour * 60 + openMinute) - (currentHour * 60 + currentMinute);
    const hoursRemaining = Math.floor(minutesUntilOpen / 60);

    if (minutesUntilOpen <= 60) {
      // Abre em menos de 1 hora
      return {
        text: `em ${minutesUntilOpen} minutos, às ${todayHours.open}`,
        proximity: 'soon',
        hoursRemaining: 0,
        time: todayHours.open
      };
    } else if (hoursRemaining <= 3) {
      // Abre em até 3 horas
      return {
        text: `em ${hoursRemaining} ${hoursRemaining === 1 ? 'hora' : 'horas'}, às ${todayHours.open}`,
        proximity: 'soon',
        hoursRemaining,
        time: todayHours.open
      };
    } else {
      // Abre mais tarde hoje
      return {
        text: `hoje às ${todayHours.open}`,
        proximity: 'today',
        hoursRemaining,
        time: todayHours.open
      };
    }
  }

  // Procurar próximo dia aberto
  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (currentDayIndex + i) % 7;
    const nextDayHours = businessHours[dayNamesEn[nextDayIndex]];

    if (nextDayHours && !nextDayHours.closed) {
      if (i === 1) {
        return {
          text: `amanhã às ${nextDayHours.open}`,
          proximity: 'tomorrow',
          dayName: dayNamesPt[nextDayIndex],
          time: nextDayHours.open
        };
      }
      return {
        text: `${dayNamesPt[nextDayIndex]} às ${nextDayHours.open}`,
        proximity: 'later',
        dayName: dayNamesPt[nextDayIndex],
        time: nextDayHours.open
      };
    }
  }

  return null;
}
