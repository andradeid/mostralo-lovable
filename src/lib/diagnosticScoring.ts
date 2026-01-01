// Sistema de pontuação do diagnóstico de maturidade tecnológica

export interface DiagnosticAnswers {
  q1: 'a' | 'b' | 'c'; // Visibilidade Google Shopping
  q2: 'a' | 'b' | 'c'; // Conversão WhatsApp/IA
  q3: 'a' | 'b' | 'c'; // Upsell no Balcão
  q4: 'a' | 'b' | 'c' | 'd'; // Maior Desafio
}

export interface ContactData {
  name: string;
  phone: string;
  company: string;
  // Dados do perfil WhatsApp (buscados na validação)
  whatsappProfilePicture?: string | null;
  whatsappPushName?: string | null;
  whatsappFormattedNumber?: string | null;
}

export type QualificationLevel = 'elite' | 'potential' | 'disqualified';

export interface DiagnosticResult {
  score: number;
  maxScore: number;
  level: QualificationLevel;
  answers: DiagnosticAnswers;
  contact: ContactData;
}

// Pontuação por resposta
const SCORING: Record<keyof DiagnosticAnswers, Record<string, number>> = {
  q1: { a: 0, b: 3, c: 2 },  // Invisível = 3 pontos (dor maior)
  q2: { a: 3, b: 2, c: 0 },  // Perde vendas = 3 pontos
  q3: { a: 3, b: 2, c: 0 },  // Não automatizado = 3 pontos
  q4: { a: 2, b: 2, c: 3, d: -10 }  // Escalar = 3, Satisfeito = desqualifica
};

export function calculateScore(answers: DiagnosticAnswers): number {
  let total = 0;
  
  for (const [question, answer] of Object.entries(answers) as [keyof DiagnosticAnswers, string][]) {
    total += SCORING[question][answer] || 0;
  }
  
  return Math.max(0, total);
}

export function getQualificationLevel(score: number, answers: DiagnosticAnswers): QualificationLevel {
  // Se marcou "satisfeito", é desqualificado
  if (answers.q4 === 'd') {
    return 'disqualified';
  }
  
  // Elite: 8+ pontos
  if (score >= 8) {
    return 'elite';
  }
  
  // Potencial: 4-7 pontos
  if (score >= 4) {
    return 'potential';
  }
  
  // Desqualificado: menos de 4 pontos
  return 'disqualified';
}

export function getDiagnosticResult(answers: DiagnosticAnswers, contact: ContactData): DiagnosticResult {
  const score = calculateScore(answers);
  const level = getQualificationLevel(score, answers);
  
  return {
    score,
    maxScore: 12,
    level,
    answers,
    contact
  };
}

// Textos das respostas para exibição
export const ANSWER_LABELS: Record<keyof DiagnosticAnswers, Record<string, string>> = {
  q1: {
    a: 'Sim, apareço no Google Shopping',
    b: 'Não, sou invisível para quem pesquisa',
    c: 'Não sei como fazer isso'
  },
  q2: {
    a: 'Perco muitas vendas por demora',
    b: 'Dependo 100% de funcionários humanos',
    c: 'Minha IA já atende 24h'
  },
  q3: {
    a: 'Não, depende da proatividade do atendente',
    b: 'Às vezes, mas não é automatizado',
    c: 'Sim, meu Totem já faz isso'
  },
  q4: {
    a: 'Reduzir custos com funcionários e erros',
    b: 'Atrair novos clientes qualificados',
    c: 'Padronizar para abrir novas unidades',
    d: 'Já estou satisfeito com meu faturamento'
  }
};

// Gerar mensagem do WhatsApp
export function generateWhatsAppMessage(result: DiagnosticResult): string {
  const levelLabels: Record<QualificationLevel, string> = {
    elite: 'Elite',
    potential: 'Potencial',
    disqualified: 'Em Avaliação'
  };

  const message = `Olá Marcos! 👋

Acabei de fazer o Diagnóstico de Maturidade Tecnológica da minha loja *${result.contact.company}* e fui qualificado para o *Programa de Aceleração Mostralo*.

📊 Minha pontuação: ${result.score}/${result.maxScore} pontos
🎯 Classificação: ${levelLabels[result.level]}

Quero agendar minha consultoria!`;

  return encodeURIComponent(message);
}

// Número do WhatsApp do Marcos
export const MARCOS_WHATSAPP = '5561994009368';
