import type { DiagnosticAnswers, QualificationLevel } from './diagnosticScoring';

interface ScriptData {
  leadName: string;
  companyName: string;
  answers: DiagnosticAnswers;
  score: number;
  level: QualificationLevel;
}

/**
 * Gera script persuasivo personalizado usando abordagem "Sofia"
 * Técnica Flávio Augusto: Pedestal + Escassez + Inversão de Poder
 * 
 * Framework PAS implícito:
 * - Problem: Diagnóstico processado, potencial identificado
 * - Agitate: Insight factual sobre a dor (sutil)
 * - Solve: Marcos analisou e qualificou pessoalmente
 */
export function generateSofiaScript(data: ScriptData): string {
  const firstName = data.leadName.split(' ')[0];
  const parts: string[] = [];

  // 1. ABERTURA - Apresentação da Sofia (Assistente de IA)
  parts.push(
    `Olá, ${firstName}! Aqui é a Sofia, assistente de inteligência do Marcos Andrade, da Mostralo.`
  );

  // 2. PROBLEM (implícito) - Diagnóstico processado
  parts.push(
    `O sistema de diagnóstico acabou de processar os dados da ${data.companyName} ` +
    `e identificou um potencial significativo de crescimento para o seu negócio.`
  );

  // 3. AGITATE (sutil) - Insight factual baseado nas respostas
  const insight = getInsight(data.answers, data.companyName);
  parts.push(insight);

  // 4. SOLVE - Marcos analisou e qualificou
  const qualification = getQualificationMessage(firstName, data.level);
  parts.push(qualification);

  // 5. ESCASSEZ + CTA suave - Aguardar contato
  parts.push(
    `A agenda dele está bem concorrida essa semana, mas ele reservou um horário especial ` +
    `pra conversar com você. Fica de olho aqui no WhatsApp que ele vai te chamar. Até já!`
  );

  return parts.join(' ');
}

/**
 * Insight factual baseado nas dores identificadas
 * PAS: Agitate de forma sutil e profissional
 */
function getInsight(answers: DiagnosticAnswers, companyName: string): string {
  // Q1 - Visibilidade online
  if (answers.q1 === 'b' || answers.q1 === 'c') {
    return `Atualmente, seus produtos não aparecem nas buscas do Google na sua região, ` +
           `o que significa que clientes prontos pra comprar estão encontrando seus concorrentes primeiro.`;
  }
  
  // Q2 - Tempo de resposta
  if (answers.q2 === 'a' || answers.q2 === 'b') {
    return `O diagnóstico mostrou que o tempo de resposta no WhatsApp pode estar ` +
           `custando vendas importantes, já que clientes geralmente compram de quem responde primeiro.`;
  }
  
  // Q3 - Upsell
  if (answers.q3 === 'a' || answers.q3 === 'b') {
    return `Identificamos uma oportunidade de aumentar o ticket médio da ${companyName} ` +
           `com estratégias de venda complementar que poucos lojistas da sua região usam.`;
  }

  // Fallback genérico
  return `O Marcos identificou oportunidades específicas pra ${companyName} ` +
         `que podem acelerar bastante o crescimento do seu negócio.`;
}

/**
 * Mensagem de qualificação por nível
 * Técnica Flávio Augusto: Posicionar Marcos no pedestal
 */
function getQualificationMessage(firstName: string, level: QualificationLevel): string {
  if (level === 'elite') {
    return `${firstName}, o Marcos analisou pessoalmente o seu perfil e você foi qualificado ` +
           `para o Programa de Aceleração Elite. Isso significa mentoria direta com ele e ` +
           `isenção da taxa de implementação. Ele pediu prioridade pro seu caso.`;
  }
  
  return `${firstName}, o Marcos analisou pessoalmente o seu perfil e você foi qualificado ` +
         `para o Programa de Aceleração Mostralo. Ele pediu prioridade pro seu caso.`;
}

// Manter função antiga para compatibilidade (deprecated)
export function generatePersonalizedScript(data: ScriptData): string {
  return generateSofiaScript(data);
}
