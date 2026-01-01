import type { DiagnosticAnswers, QualificationLevel } from './diagnosticScoring';

interface ScriptData {
  leadName: string;
  companyName: string;
  answers: DiagnosticAnswers;
  score: number;
  level: QualificationLevel;
}

/**
 * Gera script persuasivo personalizado usando Framework PAS
 * (Problem - Agitate - Solve)
 * 
 * Técnicas utilizadas:
 * - Pattern interrupt + suspense na abertura
 * - Espelhamento + empatia na validação
 * - Gatilhos de perda + urgência na agitação
 * - Contraste + benefício quantificado na solução
 * - Prova social com resultado específico
 * - CTA com escassez e exclusividade
 */
export function generatePersonalizedScript(data: ScriptData): string {
  const firstName = data.leadName.split(' ')[0];
  const parts: string[] = [];

  // 1. ABERTURA COM GANCHO (Pattern interrupt + suspense)
  parts.push(
    `${firstName}! Aqui é o Marcos Andrade, da Mostralo. ` +
    `Acabei de analisar pessoalmente o diagnóstico da ${data.companyName} e preciso te contar uma coisa...`
  );

  // 2. VALIDAÇÃO DO MAIOR DESAFIO - Q4 (Espelhamento + empatia)
  const q4Response = data.answers.q4;
  const painValidation = getPainValidation(q4Response);
  if (painValidation) {
    parts.push(painValidation);
  }

  // 3. AGITAR A DOR - Q1, Q2, Q3 (Gatilho de perda + urgência)
  const painAgitation = getPainAgitation(data.answers, data.companyName);
  if (painAgitation) {
    parts.push(painAgitation);
  }

  // 4. VIRADA - APRESENTAR A SOLUÇÃO (Contraste + benefício quantificado)
  const solution = getSolutionPresentation(data.answers);
  parts.push(solution);

  // 5. PROVA SOCIAL (Resultado específico + timeframe)
  parts.push(
    `Lojistas como você já aumentaram o faturamento em até 40% nos primeiros 90 dias usando essas mesmas estratégias.`
  );

  // 6. CTA COM URGÊNCIA E ESCASSEZ
  const cta = getCTA(firstName, data.level);
  parts.push(cta);

  return parts.filter(Boolean).join(' ');
}

function getPainValidation(q4: string): string {
  const painMap: Record<string, string> = {
    'a': `Você disse que seu maior desafio é reduzir custos com funcionários e erros. ` +
         `Eu te entendo perfeitamente. Folha de pagamento que só cresce, funcionário que falta, pedido errado... ` +
         `é dinheiro escorrendo pelo ralo todo dia.`,
    
    'b': `Você disse que precisa atrair mais clientes qualificados. ` +
         `E olha, esse é o desafio número um de 80% dos lojistas que chegam até mim. ` +
         `Você investe em divulgação mas parece que o retorno nunca vem, não é?`,
    
    'c': `Você quer escalar sua operação e abrir novas unidades. ` +
         `Isso me mostra que você pensa grande! Mas deixa eu te perguntar: ` +
         `como você vai replicar o que funciona se cada atendente faz de um jeito diferente?`,
    
    'd': `Você quer mais tempo livre para viver e curtir a família. ` +
         `E isso é totalmente possível quando você tem os processos certos automatizados. ` +
         `Hoje você trabalha demais porque o negócio depende 100% de você.`
  };

  return painMap[q4] || painMap['b'];
}

function getPainAgitation(answers: DiagnosticAnswers, companyName: string): string {
  const agitations: string[] = [];

  // Q1 - Visibilidade online
  if (answers.q1 === 'b' || answers.q1 === 'c') {
    agitations.push(
      `E tem mais: enquanto a gente conversa, dezenas de pessoas estão pesquisando exatamente o que você vende no Google. ` +
      `Só que elas não encontram a ${companyName}. Estão comprando do seu concorrente. Todo. Santo. Dia.`
    );
  }

  // Q2 - Tempo de resposta
  if (answers.q2 === 'a' || answers.q2 === 'b') {
    agitations.push(
      `Além disso, cada mensagem no WhatsApp que demora mais de 5 minutos pra responder é uma venda que você perdeu. ` +
      `O cliente já foi pro próximo. E isso está acontecendo agora mesmo.`
    );
  }

  // Q3 - Upsell
  if (answers.q3 === 'a' || answers.q3 === 'b') {
    agitations.push(
      `E quando o cliente compra, você depende da boa vontade do atendente pra oferecer mais. ` +
      `Resultado? Ticket médio baixo e dinheiro que poderia ser seu ficando na mesa.`
    );
  }

  // Retornar no máximo 2 agitações para não ficar muito longo
  return agitations.slice(0, 2).join(' ');
}

function getSolutionPresentation(answers: DiagnosticAnswers): string {
  let mainBenefit = '';

  // Priorizar baseado na maior dor identificada
  if (answers.q1 === 'b' || answers.q1 === 'c') {
    mainBenefit = `Seus produtos aparecem automaticamente no Google Shopping, na frente de quem está pronto pra comprar.`;
  } else if (answers.q2 === 'a' || answers.q2 === 'b') {
    mainBenefit = `Uma inteligência artificial atende seus clientes no WhatsApp 24 horas, 7 dias por semana, sem você pagar um centavo de hora extra.`;
  } else if (answers.q3 === 'a' || answers.q3 === 'b') {
    mainBenefit = `O sistema sugere automaticamente produtos complementares em cada venda, aumentando seu ticket médio em até 25%.`;
  } else {
    mainBenefit = `Você automatiza todo o atendimento e gestão da loja, ganhando tempo e vendendo mais.`;
  }

  return `Mas a boa notícia é que isso tem solução. E é exatamente isso que o Mostralo faz. ${mainBenefit}`;
}

function getCTA(firstName: string, level: QualificationLevel): string {
  if (level === 'elite') {
    return (
      `${firstName}, pela sua pontuação no diagnóstico, você foi qualificado para o Programa de Aceleração Elite. ` +
      `Isso significa mentoria direta comigo e isenção da taxa de implementação. ` +
      `Mas atenção: só tenho 5 vagas por semana. ` +
      `Clica agora no botão Agendar Consultoria que aparece na tela e garante a sua. Te vejo do outro lado!`
    );
  }

  return (
    `${firstName}, você foi qualificado para o Programa de Aceleração Mostralo. ` +
    `Tenho um horário especial reservado pra você essa semana. ` +
    `Clica no botão Agendar Consultoria e vamos desenhar juntos o plano de crescimento da sua loja. Te espero!`
  );
}
