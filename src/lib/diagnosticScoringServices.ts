// Sistema de pontuação do diagnóstico de serviços de agendamento

export type ServiceNiche = 
  | 'barbearia'
  | 'salao'
  | 'nail_designer'
  | 'estetica'
  | 'tatuador'
  | 'clinica'
  | 'outro';

export interface ServiceDiagnosticAnswers {
  nicho: ServiceNiche;
  gestaoAgendamento: 'a' | 'b' | 'c' | 'd';  // Como gerencia agendamentos
  volumeSemanal: 'a' | 'b' | 'c' | 'd';      // Volume de atendimentos/semana
  maiorDesafio: 'a' | 'b' | 'c' | 'd';       // Principal dor
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

export interface ServiceDiagnosticResult {
  score: number;
  maxScore: number;
  level: QualificationLevel;
  nicho: ServiceNiche;
  answers: ServiceDiagnosticAnswers;
  contact: ContactData;
  // Economia calculada
  estimatedWeeklyAppointments: number;
  estimatedAverageTicket: number;
  noShowSavings: number;       // Economia com redução de no-shows
  timeSavedHours: number;      // Horas economizadas/mês
  inactiveRecovery: number;    // Recuperação de clientes inativos R$
  totalMonthlySavings: number; // Economia total mensal
}

// Configuração dos nichos de serviços
export const SERVICE_NICHE_CONFIG: Record<ServiceNiche, {
  label: string;
  icon: string;
  averageTicket: number;
  noShowRate: number;         // Taxa média de no-show do setor (15-25%)
  returnFrequencyWeeks: number; // Frequência média de retorno em semanas
}> = {
  barbearia: {
    label: 'Barbearia',
    icon: '✂️',
    averageTicket: 45,
    noShowRate: 0.15,
    returnFrequencyWeeks: 3
  },
  salao: {
    label: 'Salão de Beleza / Cabeleireiro',
    icon: '💇',
    averageTicket: 85,
    noShowRate: 0.18,
    returnFrequencyWeeks: 4
  },
  nail_designer: {
    label: 'Nail Designer / Manicure',
    icon: '💅',
    averageTicket: 65,
    noShowRate: 0.12,
    returnFrequencyWeeks: 2
  },
  estetica: {
    label: 'Estética / Spa',
    icon: '🧖',
    averageTicket: 150,
    noShowRate: 0.20,
    returnFrequencyWeeks: 4
  },
  tatuador: {
    label: 'Tatuador / Piercer',
    icon: '🎨',
    averageTicket: 250,
    noShowRate: 0.25,
    returnFrequencyWeeks: 12
  },
  clinica: {
    label: 'Clínica / Consultório',
    icon: '🏥',
    averageTicket: 200,
    noShowRate: 0.15,
    returnFrequencyWeeks: 8
  },
  outro: {
    label: 'Outro serviço com agendamento',
    icon: '📅',
    averageTicket: 80,
    noShowRate: 0.15,
    returnFrequencyWeeks: 4
  }
};

// Perguntas adaptativas por nicho
export const SERVICE_NICHE_QUESTIONS: Record<ServiceNiche, {
  gestaoAgendamento: string;
  volumeSemanal: string;
  maiorDesafio: string;
}> = {
  barbearia: {
    gestaoAgendamento: 'Como você gerencia os agendamentos da sua barbearia hoje?',
    volumeSemanal: 'Quantos cortes e serviços você realiza por semana?',
    maiorDesafio: 'Qual o maior desafio da sua barbearia hoje?'
  },
  salao: {
    gestaoAgendamento: 'Como você gerencia os agendamentos do seu salão hoje?',
    volumeSemanal: 'Quantos atendimentos você realiza por semana?',
    maiorDesafio: 'Qual o maior desafio do seu salão hoje?'
  },
  nail_designer: {
    gestaoAgendamento: 'Como você gerencia os agendamentos das suas clientes hoje?',
    volumeSemanal: 'Quantos atendimentos de unhas você faz por semana?',
    maiorDesafio: 'Qual o maior desafio do seu trabalho hoje?'
  },
  estetica: {
    gestaoAgendamento: 'Como você gerencia os agendamentos da sua clínica hoje?',
    volumeSemanal: 'Quantos procedimentos você realiza por semana?',
    maiorDesafio: 'Qual o maior desafio da sua clínica de estética hoje?'
  },
  tatuador: {
    gestaoAgendamento: 'Como você gerencia os agendamentos das sessões hoje?',
    volumeSemanal: 'Quantas sessões de tatuagem/piercing você faz por semana?',
    maiorDesafio: 'Qual o maior desafio do seu estúdio hoje?'
  },
  clinica: {
    gestaoAgendamento: 'Como você gerencia os agendamentos de consultas hoje?',
    volumeSemanal: 'Quantas consultas/atendimentos você realiza por semana?',
    maiorDesafio: 'Qual o maior desafio da sua clínica hoje?'
  },
  outro: {
    gestaoAgendamento: 'Como você gerencia seus agendamentos hoje?',
    volumeSemanal: 'Quantos atendimentos você realiza por semana?',
    maiorDesafio: 'Qual o maior desafio operacional do seu negócio hoje?'
  }
};

// Opções de resposta para gestão de agendamento
export const GESTAO_OPTIONS = [
  { value: 'a', label: 'WhatsApp/telefone manual - anoto tudo na mão', points: 3 },
  { value: 'b', label: 'Caderno ou planilha Excel', points: 2 },
  { value: 'c', label: 'App gratuito mas limitado', points: 1 },
  { value: 'd', label: 'Já uso sistema profissional', points: 0 }
];

// Opções de volume semanal (para cálculo de economia)
export const VOLUME_SEMANAL_OPTIONS = [
  { value: 'a', label: 'Mais de 50 atendimentos/semana', points: 3, estimatedWeekly: 60 },
  { value: 'b', label: '20 a 50 atendimentos/semana', points: 2, estimatedWeekly: 35 },
  { value: 'c', label: '10 a 20 atendimentos/semana', points: 1, estimatedWeekly: 15 },
  { value: 'd', label: 'Menos de 10 atendimentos/semana', points: 0, estimatedWeekly: 7 }
];

// Opções de desafio adaptativas por nicho
export const DESAFIO_OPTIONS_BY_NICHE: Record<ServiceNiche, Array<{ value: string; label: string; points: number }>> = {
  barbearia: [
    { value: 'a', label: 'Clientes que não aparecem (no-show) e perco o horário', points: 3 },
    { value: 'b', label: 'Tempo perdido com agendamentos manuais pelo WhatsApp', points: 3 },
    { value: 'c', label: 'Clientes que não voltam após o primeiro corte', points: 2 },
    { value: 'd', label: 'Estou satisfeito com meu sistema atual', points: -10 }
  ],
  salao: [
    { value: 'a', label: 'Clientes que marcam e não aparecem', points: 3 },
    { value: 'b', label: 'Perco muito tempo confirmando horários pelo WhatsApp', points: 3 },
    { value: 'c', label: 'Dificuldade em recuperar clientes inativos', points: 2 },
    { value: 'd', label: 'Estou satisfeito com meu sistema atual', points: -10 }
  ],
  nail_designer: [
    { value: 'a', label: 'Clientes que desmarcam em cima da hora ou não aparecem', points: 3 },
    { value: 'b', label: 'Controlar agenda pelo WhatsApp é caótico', points: 3 },
    { value: 'c', label: 'Clientes que fazem uma vez e não voltam', points: 2 },
    { value: 'd', label: 'Estou satisfeita com meu sistema atual', points: -10 }
  ],
  estetica: [
    { value: 'a', label: 'No-shows em procedimentos de alto valor', points: 3 },
    { value: 'b', label: 'Agenda manual dificulta controle de protocolos', points: 3 },
    { value: 'c', label: 'Pacientes não retornam para manutenção', points: 2 },
    { value: 'd', label: 'Estou satisfeito com meu sistema atual', points: -10 }
  ],
  tatuador: [
    { value: 'a', label: 'Clientes que marcam sessão e não aparecem', points: 3 },
    { value: 'b', label: 'Organizar orçamentos e agenda é trabalhoso', points: 3 },
    { value: 'c', label: 'Perco contato com clientes antigos', points: 2 },
    { value: 'd', label: 'Estou satisfeito com meu sistema atual', points: -10 }
  ],
  clinica: [
    { value: 'a', label: 'Pacientes que faltam às consultas', points: 3 },
    { value: 'b', label: 'Secretária perde tempo confirmando agendas', points: 3 },
    { value: 'c', label: 'Pacientes não retornam para acompanhamento', points: 2 },
    { value: 'd', label: 'Estou satisfeito com meu sistema atual', points: -10 }
  ],
  outro: [
    { value: 'a', label: 'Clientes que não comparecem aos horários marcados', points: 3 },
    { value: 'b', label: 'Gestão manual de agenda consome muito tempo', points: 3 },
    { value: 'c', label: 'Dificuldade em manter clientes retornando', points: 2 },
    { value: 'd', label: 'Estou satisfeito com meu sistema atual', points: -10 }
  ]
};

// Pontuação por resposta
const SCORING = {
  gestaoAgendamento: { a: 3, b: 2, c: 1, d: 0 },
  volumeSemanal: { a: 3, b: 2, c: 1, d: 0 }
};

export function calculateServiceScore(answers: ServiceDiagnosticAnswers): number {
  let total = 0;
  
  // Pontos de gestão de agendamento
  total += SCORING.gestaoAgendamento[answers.gestaoAgendamento] || 0;
  
  // Pontos de volume semanal
  total += SCORING.volumeSemanal[answers.volumeSemanal] || 0;
  
  // Pontos de desafio (buscar no array correto do nicho)
  const desafioOptions = DESAFIO_OPTIONS_BY_NICHE[answers.nicho];
  const selectedDesafio = desafioOptions.find(opt => opt.value === answers.maiorDesafio);
  total += selectedDesafio?.points || 0;
  
  return Math.max(0, total);
}

export function getServiceQualificationLevel(score: number, answers: ServiceDiagnosticAnswers): QualificationLevel {
  // Se marcou "satisfeito", é desqualificado
  if (answers.maiorDesafio === 'd') {
    return 'disqualified';
  }
  
  // Elite: 7+ pontos (gestão manual + bom volume + dor de no-show/tempo)
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

export function calculateServiceSavings(nicho: ServiceNiche, volumeAnswer: string): {
  estimatedWeeklyAppointments: number;
  estimatedAverageTicket: number;
  noShowSavings: number;
  timeSavedHours: number;
  inactiveRecovery: number;
  totalMonthlySavings: number;
} {
  const nicheConfig = SERVICE_NICHE_CONFIG[nicho];
  const volumeOption = VOLUME_SEMANAL_OPTIONS.find(opt => opt.value === volumeAnswer);
  
  const estimatedWeeklyAppointments = volumeOption?.estimatedWeekly || 20;
  const estimatedAverageTicket = nicheConfig.averageTicket;
  
  // Cálculo de economia com no-shows
  // Fórmula: (atendimentos/semana) x noShowRate x ticketMedio x 4 semanas x 0.80 (redução de 80%)
  const noShowSavings = Math.round(
    estimatedWeeklyAppointments * nicheConfig.noShowRate * estimatedAverageTicket * 4 * 0.80
  );
  
  // Cálculo de tempo economizado
  // Fórmula: (atendimentos/semana) x 2 minutos x 4 semanas / 60
  const timeSavedHours = Math.round(
    (estimatedWeeklyAppointments * 2 * 4) / 60 * 10
  ) / 10; // Arredonda para 1 casa decimal
  
  // Cálculo de recuperação de clientes inativos
  // Fórmula: (clientes únicos/mês) x 20% abandonam x ticketMedio x 0.50 (recuperamos metade)
  const uniqueClientsPerMonth = Math.round(estimatedWeeklyAppointments * 4 / nicheConfig.returnFrequencyWeeks);
  const inactiveRecovery = Math.round(
    uniqueClientsPerMonth * 0.20 * estimatedAverageTicket * 0.50
  );
  
  // Total mensal
  const totalMonthlySavings = noShowSavings + inactiveRecovery;
  
  return {
    estimatedWeeklyAppointments,
    estimatedAverageTicket,
    noShowSavings,
    timeSavedHours,
    inactiveRecovery,
    totalMonthlySavings
  };
}

export function getServiceDiagnosticResult(
  answers: ServiceDiagnosticAnswers, 
  contact: ContactData
): ServiceDiagnosticResult {
  const score = calculateServiceScore(answers);
  const level = getServiceQualificationLevel(score, answers);
  const savings = calculateServiceSavings(answers.nicho, answers.volumeSemanal);
  
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
export function generateServiceWhatsAppMessage(result: ServiceDiagnosticResult): string {
  const levelLabels: Record<QualificationLevel, string> = {
    elite: 'Elite',
    potential: 'Potencial',
    disqualified: 'Em Avaliação'
  };

  const nicheLabel = SERVICE_NICHE_CONFIG[result.nicho].label;
  const formattedNoShow = result.noShowSavings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formattedTotal = result.totalMonthlySavings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const message = `Olá Marcos! 👋

Acabei de fazer o Diagnóstico de Agendamento do meu negócio *${result.contact.company}* (${nicheLabel}) e fui qualificado para o *Programa de Gestão Profissional*.

📊 Minha pontuação: ${result.score}/${result.maxScore} pontos
🎯 Classificação: ${levelLabels[result.level]}
💰 Economia no-shows: ${formattedNoShow}/mês
⏰ Tempo economizado: ${result.timeSavedHours}h/mês
📈 Total economia: ${formattedTotal}/mês

Quero saber como ter um sistema de agendamento profissional!`;

  return encodeURIComponent(message);
}

// Número do WhatsApp do Marcos
export const MARCOS_WHATSAPP = '5561994009368';
