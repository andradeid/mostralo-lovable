// Gerador de scripts de ligação para serviços de agendamento
import type { 
  ServiceNiche, 
  ServiceDiagnosticAnswers, 
  QualificationLevel 
} from './diagnosticScoringServices';
import { SERVICE_NICHE_CONFIG } from './diagnosticScoringServices';

export interface ServiceScriptData {
  leadName: string;
  companyName: string;
  nicho: ServiceNiche;
  answers: ServiceDiagnosticAnswers;
  score: number;
  level: QualificationLevel;
  noShowSavings: number;
  timeSavedHours: number;
  inactiveRecovery: number;
  totalMonthlySavings: number;
}

function getNicheSpecificProblem(nicho: ServiceNiche, noShowRate: number, noShowSavings: string): string {
  const noShowPercent = Math.round(noShowRate * 100);
  
  const problems: Record<ServiceNiche, string> = {
    barbearia: `Você sabia que barbearias perdem em média ${noShowPercent}% dos atendimentos por no-show? Com seu volume de clientes, isso representa ${noShowSavings} por mês deixando de entrar no seu caixa.`,
    salao: `Salões de beleza como o seu perdem em média ${noShowPercent}% do faturamento com clientes que marcam e não aparecem. No seu caso, isso representa ${noShowSavings} por mês.`,
    nail_designer: `Nail designers perdem em média ${noShowPercent}% dos horários com clientes que não aparecem. Para você, isso significa ${noShowSavings} perdidos todo mês.`,
    estetica: `Clínicas de estética têm uma taxa média de ${noShowPercent}% de no-show, especialmente em procedimentos de alto valor. No seu caso, são ${noShowSavings} por mês.`,
    tatuador: `Estúdios de tatuagem têm uma das maiores taxas de no-show do mercado: ${noShowPercent}%. Com sessões de alto valor, você pode estar perdendo ${noShowSavings} por mês.`,
    clinica: `Clínicas e consultórios perdem em média ${noShowPercent}% das consultas com pacientes que faltam. No seu caso, isso representa ${noShowSavings} mensais.`,
    outro: `Negócios de agendamento como o seu perdem em média ${noShowPercent}% dos atendimentos por no-show. Isso representa ${noShowSavings} por mês.`
  };
  
  return problems[nicho];
}

function getNicheSolution(nicho: ServiceNiche): string {
  const solutions: Record<ServiceNiche, string> = {
    barbearia: `Com o Mostralo, seus clientes recebem lembretes automáticos no WhatsApp 24 horas e 1 hora antes do corte. Isso reduz no-shows em até 80%. Além disso, identificamos clientes que não aparecem há mais de 30 dias e enviamos mensagens automáticas de retorno.`,
    salao: `O Mostralo envia lembretes automáticos no WhatsApp para suas clientes antes de cada atendimento. Isso reduz faltas em até 80%. E ainda identifica clientes inativos para você recuperar com promoções personalizadas.`,
    nail_designer: `Com o sistema de lembretes automáticos do Mostralo, suas clientes recebem confirmação de horário direto no WhatsApp. Isso elimina quase 80% dos no-shows. E você ainda consegue ver quem está há tempo sem marcar.`,
    estetica: `O Mostralo confirma automaticamente os procedimentos pelo WhatsApp das suas pacientes. Com lembretes 24h e 1h antes, você reduz no-shows em 80%. Perfeito para protocolos que exigem continuidade.`,
    tatuador: `Com confirmações automáticas no WhatsApp, o Mostralo avisa seus clientes antes das sessões e pede confirmação. Isso reduz no-shows em até 80% e você ainda pode cobrar sinal antecipado.`,
    clinica: `O Mostralo envia lembretes automáticos aos pacientes pelo WhatsApp, reduzindo faltas em até 80%. Ideal para manter a agenda completa e garantir que pacientes não percam retornos importantes.`,
    outro: `O sistema de lembretes automáticos do Mostralo reduz no-shows em até 80%, enviando mensagens no WhatsApp dos seus clientes antes de cada atendimento.`
  };
  
  return solutions[nicho];
}

export function generateServicesSofiaScript(data: ServiceScriptData): string {
  const firstName = data.leadName.split(' ')[0];
  const nicheConfig = SERVICE_NICHE_CONFIG[data.nicho];
  const formattedNoShowSavings = data.noShowSavings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formattedTotal = data.totalMonthlySavings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  // Framework PAS: Problem, Agitate, Solve
  const problem = getNicheSpecificProblem(data.nicho, nicheConfig.noShowRate, formattedNoShowSavings);
  const solution = getNicheSolution(data.nicho);
  
  // Script base
  let script = `Olá ${firstName}! Aqui é a Sofia do Mostralo.

Acabei de analisar o diagnóstico que você fez sobre ${data.companyName} e preciso te contar algo importante.

${problem}

E isso não é tudo. Você também mencionou que`;

  // Adiciona agitação baseada no desafio escolhido
  if (data.answers.maiorDesafio === 'a') {
    script += ` os clientes que não aparecem são seu maior desafio. Cada horário vago é um prejuízo direto no seu bolso.`;
  } else if (data.answers.maiorDesafio === 'b') {
    script += ` você perde muito tempo gerenciando agendamentos manualmente. São ${data.timeSavedHours} horas por mês que você poderia estar atendendo mais clientes.`;
  } else {
    script += ` tem dificuldade em fazer clientes retornarem. Isso significa ${data.inactiveRecovery.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} em receita perdida todo mês.`;
  }

  script += `

Mas a boa notícia é que existe uma solução.

${solution}

No total, você pode economizar até ${formattedTotal} por mês e ainda ganhar ${data.timeSavedHours} horas de tempo livre para atender mais clientes.`;

  // Fechamento baseado no nível de qualificação
  if (data.level === 'elite') {
    script += `

${firstName}, com base no seu perfil, você foi selecionado para o nosso Programa Elite de Gestão Profissional. Isso significa que você tem direito a 20% de desconto exclusivo usando o cupom DIAG20.

O Marcos Andrade, nosso especialista em gestão de agendamentos, vai entrar em contato com você em breve para apresentar como implementar isso no seu ${nicheConfig.label.toLowerCase()}.

Fique de olho no WhatsApp!`;
  } else {
    script += `

${firstName}, você tem um grande potencial de otimização. Com o cupom DIAG15 você garante 15% de desconto especial.

O Marcos Andrade vai entrar em contato para mostrar como o Mostralo pode transformar a gestão da sua agenda.

Até logo!`;
  }

  return script;
}

export function generateServicesMarcosFollowUp(data: ServiceScriptData): string {
  const firstName = data.leadName.split(' ')[0];
  const nicheConfig = SERVICE_NICHE_CONFIG[data.nicho];
  const formattedNoShowSavings = data.noShowSavings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  let insight = '';
  
  // Insight baseado no desafio escolhido
  if (data.answers.maiorDesafio === 'a') {
    insight = `Vi que clientes que não aparecem são seu maior problema. Com ${nicheConfig.noShowRate * 100}% de taxa de no-show na média do setor, você pode estar perdendo ${formattedNoShowSavings}/mês. Nossos lembretes automáticos resolvem isso.`;
  } else if (data.answers.maiorDesafio === 'b') {
    insight = `Entendo que a gestão manual de agenda consome seu tempo. São aproximadamente ${data.timeSavedHours}h/mês que você poderia usar para atender mais clientes ou descansar.`;
  } else {
    insight = `Vi que recuperar clientes inativos é um desafio. Com mensagens automáticas de reengajamento, você pode recuperar até R$ ${data.inactiveRecovery}/mês em clientes que pararam de frequentar.`;
  }
  
  const message = `E aí ${firstName}! Aqui é o Marcos do Mostralo 🖐️

Acabei de ver o diagnóstico que você fez sobre ${data.companyName} e queria bater um papo.

${insight}

Posso te mostrar em 10 minutos como resolver isso?

📱 Me responde aqui que a gente marca`;

  return message;
}
