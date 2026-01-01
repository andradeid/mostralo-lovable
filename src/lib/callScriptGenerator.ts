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

  // 5. ESCASSEZ FORTE - Vagas limitadas + Inversão de poder
  parts.push(
    `Só pra você saber: essa semana o Marcos vai atender apenas 3 lojas de suplementos. ` +
    `Se por algum motivo você não tiver interesse, só me avisa que a gente passa a vaga pro próximo da lista.`
  );

  // 6. CTA + ENCERRAMENTO POSITIVO
  parts.push(
    `Mas acredito que você vai querer aproveitar essa oportunidade. ` +
    `Fica de olho aqui no WhatsApp que ele vai te chamar em breve. Até já!`
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

/**
 * Gera mensagem de follow-up personalizada para o Marcos enviar
 * Técnica Flávio Augusto: Entrada pelo pedestal após Sofia preparar o terreno
 */
export function generateMarcosFollowUp(data: ScriptData): string {
  const firstName = data.leadName.split(' ')[0];
  
  // Insight baseado nas respostas do diagnóstico
  const insight = getFollowUpInsight(data.answers);
  
  if (data.level === 'elite') {
    return `Olá, ${firstName}! Marcos Andrade aqui 👋\n\n` +
      `Minha assistente me passou seu diagnóstico agora. ${insight}\n\n` +
      `Vi que você foi qualificado pro Programa Elite - isso significa mentoria direta comigo ` +
      `e isenção da taxa de implementação.\n\n` +
      `Tenho um horário amanhã às 10h ou às 15h para validarmos seu plano de implementação. ` +
      `Qual fica melhor pra você?`;
  }
  
  return `Olá, ${firstName}! Marcos Andrade aqui 👋\n\n` +
    `A Sofia me passou o diagnóstico da ${data.companyName}. ${insight}\n\n` +
    `Vi que vocês têm um bom potencial pra crescer com as estratégias certas.\n\n` +
    `Posso te ligar amanhã pra conversarmos? Qual melhor horário?`;
}

/**
 * Insight específico para o follow-up baseado nas dores
 */
function getFollowUpInsight(answers: ScriptData['answers']): string {
  if (answers.q1 === 'b' || answers.q1 === 'c') {
    return `Realmente, ficar invisível no Google enquanto os concorrentes aparecem é complicado.`;
  }
  
  if (answers.q2 === 'a' || answers.q2 === 'b') {
    return `Sei bem como é perder vendas por demorar pra responder no WhatsApp.`;
  }
  
  if (answers.q3 === 'a' || answers.q3 === 'b') {
    return `Aumentar o ticket médio sem parecer insistente é uma arte - e a gente domina isso.`;
  }

  return `Vi algumas oportunidades interessantes no seu diagnóstico.`;
}
