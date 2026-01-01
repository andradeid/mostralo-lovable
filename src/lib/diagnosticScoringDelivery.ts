// Sistema de pontuação do diagnóstico de delivery - Universal Adaptativo

export type BusinessNiche = 
  | 'restaurante'
  | 'farmacia'
  | 'mercado'
  | 'petshop'
  | 'acougue'
  | 'padaria'
  | 'outro';

export interface DeliveryDiagnosticAnswers {
  nicho: BusinessNiche;
  dependencia: 'a' | 'b' | 'c';    // Dependência de apps
  volume: 'a' | 'b' | 'c' | 'd';   // Volume de pedidos
  desafio: 'a' | 'b' | 'c' | 'd';  // Maior desafio
}

export interface ContactData {
  name: string;
  phone: string;
  company: string;
  whatsappProfilePicture?: string | null;
  whatsappPushName?: string | null;
  whatsappFormattedNumber?: string | null;
}

export type QualificationLevel = 'elite' | 'potential' | 'disqualified';

export interface DeliveryDiagnosticResult {
  score: number;
  maxScore: number;
  level: QualificationLevel;
  nicho: BusinessNiche;
  answers: DeliveryDiagnosticAnswers;
  contact: ContactData;
  // Economia calculada
  estimatedMonthlyOrders: number;
  estimatedAverageTicket: number;
  currentCommission: number;
  mostraloCommission: number;
  monthlySavings: number;
  annualSavings: number;
}

// Configuração dos nichos
export const NICHE_CONFIG: Record<BusinessNiche, {
  label: string;
  icon: string;
  averageTicket: number;
  currentCommission: number;
  mostraloCommission: number;
}> = {
  restaurante: {
    label: 'Restaurante, Pizzaria ou Hamburgueria',
    icon: '🍕',
    averageTicket: 45,
    currentCommission: 0.27,
    mostraloCommission: 0.05
  },
  farmacia: {
    label: 'Farmácia ou Drogaria',
    icon: '💊',
    averageTicket: 85,
    currentCommission: 0.20,
    mostraloCommission: 0.05
  },
  mercado: {
    label: 'Supermercado ou Mercearia',
    icon: '🛒',
    averageTicket: 120,
    currentCommission: 0.18,
    mostraloCommission: 0.05
  },
  petshop: {
    label: 'Pet Shop',
    icon: '🐕',
    averageTicket: 95,
    currentCommission: 0.22,
    mostraloCommission: 0.05
  },
  acougue: {
    label: 'Açougue ou Casa de Carnes',
    icon: '🥩',
    averageTicket: 75,
    currentCommission: 0.20,
    mostraloCommission: 0.05
  },
  padaria: {
    label: 'Padaria ou Confeitaria',
    icon: '🥖',
    averageTicket: 35,
    currentCommission: 0.25,
    mostraloCommission: 0.05
  },
  outro: {
    label: 'Outro tipo de delivery',
    icon: '📦',
    averageTicket: 50,
    currentCommission: 0.22,
    mostraloCommission: 0.05
  }
};

// Perguntas adaptativas por nicho
export const NICHE_QUESTIONS: Record<BusinessNiche, {
  dependencia: string;
  volume: string;
  desafio: string;
}> = {
  restaurante: {
    dependencia: 'Qual % dos seus pedidos de delivery vem do iFood, Rappi ou 99Food?',
    volume: 'Quantos pedidos de delivery você faz por mês em média?',
    desafio: 'Qual o maior desafio do seu restaurante hoje?'
  },
  farmacia: {
    dependencia: 'Qual % das suas vendas online vem do iFood, Rappi Turbo ou apps de terceiros?',
    volume: 'Quantas entregas de medicamentos/produtos você faz por mês?',
    desafio: 'Qual o maior desafio da sua farmácia hoje?'
  },
  mercado: {
    dependencia: 'Qual % das vendas delivery vem do iFood Market, Rappi ou Cornershop?',
    volume: 'Quantas entregas de compras você realiza por mês?',
    desafio: 'Qual o maior desafio do seu mercado hoje?'
  },
  petshop: {
    dependencia: 'Qual % dos pedidos de ração e produtos vem de apps como iFood Pet ou Petlove?',
    volume: 'Quantos pedidos de delivery você processa por mês?',
    desafio: 'Qual o maior desafio do seu pet shop hoje?'
  },
  acougue: {
    dependencia: 'Qual % das suas vendas de delivery vem de apps como iFood ou Rappi?',
    volume: 'Quantas entregas de carnes você faz por mês?',
    desafio: 'Qual o maior desafio do seu açougue hoje?'
  },
  padaria: {
    dependencia: 'Qual % dos pedidos de delivery vem de apps como iFood ou Rappi?',
    volume: 'Quantos pedidos de delivery você processa por mês?',
    desafio: 'Qual o maior desafio da sua padaria hoje?'
  },
  outro: {
    dependencia: 'Qual % dos seus pedidos vem de apps de delivery como iFood, Rappi, etc.?',
    volume: 'Quantos pedidos de delivery você processa por mês?',
    desafio: 'Qual o maior desafio operacional do seu negócio hoje?'
  }
};

// Opções de resposta para dependência
export const DEPENDENCIA_OPTIONS = [
  { value: 'a', label: 'Mais de 70% - sou muito dependente', points: 3 },
  { value: 'b', label: 'Entre 30% e 70% - uso bastante mas tenho outros canais', points: 2 },
  { value: 'c', label: 'Menos de 30% - tenho meu próprio canal forte', points: 0 }
];

// Opções de volume (para cálculo de economia)
export const VOLUME_OPTIONS = [
  { value: 'a', label: 'Mais de 500 pedidos/mês', points: 3, estimatedOrders: 600 },
  { value: 'b', label: 'Entre 200 e 500 pedidos/mês', points: 2, estimatedOrders: 350 },
  { value: 'c', label: 'Entre 50 e 200 pedidos/mês', points: 1, estimatedOrders: 125 },
  { value: 'd', label: 'Menos de 50 pedidos/mês', points: 0, estimatedOrders: 30 }
];

// Opções de desafio adaptativas por nicho
export const DESAFIO_OPTIONS_BY_NICHE: Record<BusinessNiche, Array<{ value: string; label: string; points: number }>> = {
  restaurante: [
    { value: 'a', label: 'As altas comissões do iFood (12-27%) estão comendo minha margem', points: 3 },
    { value: 'b', label: 'Não tenho os dados dos clientes para fidelizar', points: 2 },
    { value: 'c', label: 'Quero ter meu próprio app sem pagar % por pedido', points: 3 },
    { value: 'd', label: 'Estou satisfeito com os apps atuais', points: -10 }
  ],
  farmacia: [
    { value: 'a', label: 'As comissões dos apps estão reduzindo minha margem', points: 3 },
    { value: 'b', label: 'Não consigo criar campanhas de fidelização sem os dados dos clientes', points: 2 },
    { value: 'c', label: 'Quero ter meu próprio canal de vendas online', points: 3 },
    { value: 'd', label: 'Estou satisfeito com os apps atuais', points: -10 }
  ],
  mercado: [
    { value: 'a', label: 'As taxas do iFood Market e Rappi estão muito altas', points: 3 },
    { value: 'b', label: 'Preciso dos dados dos clientes para criar promoções', points: 2 },
    { value: 'c', label: 'Quero meu próprio app de compras online', points: 3 },
    { value: 'd', label: 'Estou satisfeito com os apps atuais', points: -10 }
  ],
  petshop: [
    { value: 'a', label: 'As comissões dos apps de pet estão comendo minha margem', points: 3 },
    { value: 'b', label: 'Quero enviar lembretes de ração e vacinas direto pro cliente', points: 2 },
    { value: 'c', label: 'Preciso de um app próprio para minha loja', points: 3 },
    { value: 'd', label: 'Estou satisfeito com os apps atuais', points: -10 }
  ],
  acougue: [
    { value: 'a', label: 'As comissões dos apps estão diminuindo meu lucro', points: 3 },
    { value: 'b', label: 'Quero fidelizar clientes com promoções personalizadas', points: 2 },
    { value: 'c', label: 'Preciso de um canal próprio de vendas online', points: 3 },
    { value: 'd', label: 'Estou satisfeito com os apps atuais', points: -10 }
  ],
  padaria: [
    { value: 'a', label: 'As taxas do iFood e Rappi estão altas demais', points: 3 },
    { value: 'b', label: 'Quero ter o WhatsApp dos clientes para enviar ofertas', points: 2 },
    { value: 'c', label: 'Quero meu próprio app de delivery', points: 3 },
    { value: 'd', label: 'Estou satisfeito com os apps atuais', points: -10 }
  ],
  outro: [
    { value: 'a', label: 'Quero reduzir as comissões que pago aos apps', points: 3 },
    { value: 'b', label: 'Preciso ter acesso aos dados dos meus clientes', points: 2 },
    { value: 'c', label: 'Quero criar meu próprio canal de vendas', points: 3 },
    { value: 'd', label: 'Estou satisfeito com a situação atual', points: -10 }
  ]
};

// Pontuação por resposta
const SCORING = {
  dependencia: { a: 3, b: 2, c: 0 },
  volume: { a: 3, b: 2, c: 1, d: 0 }
};

export function calculateDeliveryScore(answers: DeliveryDiagnosticAnswers): number {
  let total = 0;
  
  // Pontos de dependência
  total += SCORING.dependencia[answers.dependencia] || 0;
  
  // Pontos de volume
  total += SCORING.volume[answers.volume] || 0;
  
  // Pontos de desafio (buscar no array correto do nicho)
  const desafioOptions = DESAFIO_OPTIONS_BY_NICHE[answers.nicho];
  const selectedDesafio = desafioOptions.find(opt => opt.value === answers.desafio);
  total += selectedDesafio?.points || 0;
  
  return Math.max(0, total);
}

export function getDeliveryQualificationLevel(score: number, answers: DeliveryDiagnosticAnswers): QualificationLevel {
  // Se marcou "satisfeito", é desqualificado
  if (answers.desafio === 'd') {
    return 'disqualified';
  }
  
  // Elite: 7+ pontos (alta dependência + bom volume + dor de comissão)
  if (score >= 7) {
    return 'elite';
  }
  
  // Potencial: 4-6 pontos
  if (score >= 4) {
    return 'potential';
  }
  
  // Desqualificado: menos de 4 pontos
  return 'disqualified';
}

export function calculateSavings(nicho: BusinessNiche, volumeAnswer: string): {
  estimatedMonthlyOrders: number;
  estimatedAverageTicket: number;
  currentCommission: number;
  mostraloCommission: number;
  monthlySavings: number;
  annualSavings: number;
} {
  const nicheConfig = NICHE_CONFIG[nicho];
  const volumeOption = VOLUME_OPTIONS.find(opt => opt.value === volumeAnswer);
  
  const estimatedMonthlyOrders = volumeOption?.estimatedOrders || 100;
  const estimatedAverageTicket = nicheConfig.averageTicket;
  const currentCommission = nicheConfig.currentCommission;
  const mostraloCommission = nicheConfig.mostraloCommission;
  
  // Faturamento mensal estimado
  const monthlyRevenue = estimatedMonthlyOrders * estimatedAverageTicket;
  
  // Economia = diferença entre comissões
  const monthlySavings = monthlyRevenue * (currentCommission - mostraloCommission);
  const annualSavings = monthlySavings * 12;
  
  return {
    estimatedMonthlyOrders,
    estimatedAverageTicket,
    currentCommission,
    mostraloCommission,
    monthlySavings: Math.round(monthlySavings),
    annualSavings: Math.round(annualSavings)
  };
}

export function getDeliveryDiagnosticResult(
  answers: DeliveryDiagnosticAnswers, 
  contact: ContactData
): DeliveryDiagnosticResult {
  const score = calculateDeliveryScore(answers);
  const level = getDeliveryQualificationLevel(score, answers);
  const savings = calculateSavings(answers.nicho, answers.volume);
  
  return {
    score,
    maxScore: 9,
    level,
    nicho: answers.nicho,
    answers,
    contact,
    ...savings
  };
}

// Gerar mensagem do WhatsApp
export function generateDeliveryWhatsAppMessage(result: DeliveryDiagnosticResult): string {
  const levelLabels: Record<QualificationLevel, string> = {
    elite: 'Elite',
    potential: 'Potencial',
    disqualified: 'Em Avaliação'
  };

  const nicheLabel = NICHE_CONFIG[result.nicho].label;
  const formattedSavings = result.monthlySavings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formattedAnnualSavings = result.annualSavings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const message = `Olá Marcos! 👋

Acabei de fazer o Diagnóstico de Delivery do meu negócio *${result.contact.company}* (${nicheLabel}) e fui qualificado para o *Programa de Migração para App Próprio*.

📊 Minha pontuação: ${result.score}/${result.maxScore} pontos
🎯 Classificação: ${levelLabels[result.level]}
💰 Economia estimada: ${formattedSavings}/mês (${formattedAnnualSavings}/ano)

Quero saber como migrar para um app próprio!`;

  return encodeURIComponent(message);
}

// Número do WhatsApp do Marcos
export const MARCOS_WHATSAPP = '5561994009368';
