import type { DeliveryDiagnosticAnswers, QualificationLevel, BusinessNiche } from './diagnosticScoringDelivery';
import { NICHE_CONFIG } from './diagnosticScoringDelivery';

interface DeliveryScriptData {
  leadName: string;
  companyName: string;
  nicho: BusinessNiche;
  answers: DeliveryDiagnosticAnswers;
  score: number;
  level: QualificationLevel;
  monthlySavings: number;
  annualSavings: number;
  currentCommission: number;
}

/**
 * Gera script persuasivo personalizado para diagnóstico de delivery
 * Adaptado por nicho com foco em economia de comissões
 * Técnica Flávio Augusto: Pedestal + Escassez + Inversão de Poder
 * 
 * Framework PAS:
 * - Problem: Comissões altas dos apps
 * - Agitate: Quanto está perdendo por mês/ano
 * - Solve: App próprio com comissão reduzida
 */
export function generateDeliverySofiaScript(data: DeliveryScriptData): string {
  const firstName = data.leadName.split(' ')[0];
  const nicheConfig = NICHE_CONFIG[data.nicho];
  const commissionPercent = Math.round(data.currentCommission * 100);
  const formattedMonthlySavings = data.monthlySavings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formattedAnnualSavings = data.annualSavings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  const parts: string[] = [];

  // 1. ABERTURA - Apresentação da Sofia
  parts.push(
    `Olá, ${firstName}! Aqui é a Sofia, assistente de inteligência do Marcos Andrade, da Mostralo.`
  );

  // 2. PROBLEM - Diagnóstico processado com número concreto
  parts.push(
    `O diagnóstico de delivery da ${data.companyName} acabou de ser processado e ` +
    getNicheSpecificProblem(data.nicho, commissionPercent, formattedMonthlySavings)
  );

  // 3. AGITATE - Impacto anual
  parts.push(
    `Em um ano, isso representa aproximadamente ${formattedAnnualSavings} que poderiam estar no seu caixa ` +
    `ao invés de ir pro bolso dos apps de terceiros.`
  );

  // 4. SOLVE + QUALIFICAÇÃO - Marcos analisou
  const qualification = getDeliveryQualificationMessage(firstName, data.level, data.nicho);
  parts.push(qualification);

  // 5. ESCASSEZ FORTE - Vagas limitadas por segmento + Inversão de poder
  const nicheLabel = getNicheSimpleLabel(data.nicho);
  parts.push(
    `Só pra você saber: essa semana o Marcos vai atender apenas 3 empresas do segmento de ${nicheLabel}. ` +
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
 * Problema específico por nicho
 */
function getNicheSpecificProblem(nicho: BusinessNiche, commissionPercent: number, monthlySavings: string): string {
  const problems: Record<BusinessNiche, string> = {
    restaurante: `identificamos que você está pagando até ${commissionPercent}% de comissão pro iFood e Rappi. ` +
                 `Isso representa aproximadamente ${monthlySavings} por mês saindo do seu lucro.`,
    
    farmacia: `identificamos que as plataformas de delivery estão cobrando até ${commissionPercent}% por pedido. ` +
              `Isso significa cerca de ${monthlySavings} por mês que poderiam ficar na sua farmácia.`,
    
    mercado: `identificamos que apps como iFood Market e Rappi estão levando até ${commissionPercent}% do valor das suas vendas. ` +
             `Estamos falando de aproximadamente ${monthlySavings} por mês em comissões.`,
    
    petshop: `identificamos que as plataformas de pet estão cobrando comissões de até ${commissionPercent}%. ` +
             `Isso representa cerca de ${monthlySavings} por mês que poderiam ficar no seu pet shop.`,
    
    acougue: `identificamos que os apps de delivery estão levando até ${commissionPercent}% das suas vendas online. ` +
             `Isso significa aproximadamente ${monthlySavings} por mês saindo do seu açougue.`,
    
    padaria: `identificamos que as plataformas de delivery cobram até ${commissionPercent}% por pedido. ` +
             `Estamos falando de cerca de ${monthlySavings} por mês em comissões.`,
    
    outro: `identificamos que você está pagando comissões de até ${commissionPercent}% pros apps de delivery. ` +
           `Isso representa aproximadamente ${monthlySavings} por mês saindo do seu negócio.`
  };
  
  return problems[nicho];
}

/**
 * Mensagem de qualificação por nível e nicho
 * Técnica Flávio Augusto: Pedestal + Inversão
 */
function getDeliveryQualificationMessage(firstName: string, level: QualificationLevel, nicho: BusinessNiche): string {
  const nicheLabel = getNicheSimpleLabel(nicho);
  
  if (level === 'elite') {
    return `${firstName}, o Marcos analisou pessoalmente o seu perfil e você foi qualificado ` +
           `para o Programa de Migração Elite. Isso significa acompanhamento direto dele na transição do seu ` +
           `${nicheLabel} para um app próprio, além da isenção da taxa de implementação. ` +
           `Ele pediu prioridade pro seu caso.`;
  }
  
  return `${firstName}, o Marcos analisou pessoalmente o seu perfil e você foi qualificado ` +
         `para o Programa de Migração para App Próprio. Com a Mostralo, você paga apenas 5% por pedido ` +
         `e mantém 100% dos dados dos seus clientes. Ele pediu prioridade pro seu caso.`;
}

/**
 * Label simples do nicho
 */
function getNicheSimpleLabel(nicho: BusinessNiche): string {
  const labels: Record<BusinessNiche, string> = {
    restaurante: 'restaurante',
    farmacia: 'farmácia',
    mercado: 'mercado',
    petshop: 'pet shop',
    acougue: 'açougue',
    padaria: 'padaria',
    outro: 'negócio'
  };
  return labels[nicho];
}

/**
 * Gera mensagem de follow-up personalizada para o Marcos enviar
 * Técnica Flávio Augusto: Entrada pelo pedestal após Sofia preparar o terreno
 */
export function generateDeliveryMarcosFollowUp(data: DeliveryScriptData): string {
  const firstName = data.leadName.split(' ')[0];
  const formattedSavings = data.monthlySavings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const nicheLabel = getNicheSimpleLabel(data.nicho);
  
  // Insight baseado nas respostas do diagnóstico
  const insight = getDeliveryFollowUpInsight(data.answers, data.nicho, formattedSavings);
  
  if (data.level === 'elite') {
    return `Olá, ${firstName}! Marcos Andrade aqui 👋\n\n` +
      `Minha assistente me passou seu diagnóstico agora. ${insight}\n\n` +
      `Vi que você foi qualificado pro Programa de Migração Elite - isso significa acompanhamento direto ` +
      `comigo na transição pro app próprio e isenção da taxa de implementação.\n\n` +
      `Tenho um horário amanhã às 10h ou às 15h para validarmos seu plano de migração. ` +
      `Qual fica melhor pra você?`;
  }
  
  return `Olá, ${firstName}! Marcos Andrade aqui 👋\n\n` +
    `A Sofia me passou o diagnóstico da ${data.companyName}. ${insight}\n\n` +
    `Vi que seu ${nicheLabel} tem um bom potencial pra migrar pro app próprio e parar de pagar ` +
    `essas comissões altas pros apps de delivery.\n\n` +
    `Posso te ligar amanhã pra conversarmos? Qual melhor horário?`;
}

/**
 * Insight específico para o follow-up baseado nas dores
 */
function getDeliveryFollowUpInsight(
  answers: DeliveryScriptData['answers'], 
  nicho: BusinessNiche,
  formattedSavings: string
): string {
  // Alta dependência de apps
  if (answers.dependencia === 'a') {
    return `Realmente, depender mais de 70% do iFood e Rappi é complicado - você fica refém das comissões deles.`;
  }
  
  // Bom volume de pedidos
  if (answers.volume === 'a' || answers.volume === 'b') {
    return `Com o volume de pedidos que você tem, ${formattedSavings} por mês em economia faz uma diferença enorme no final do ano.`;
  }
  
  // Dor de comissão explícita
  if (answers.desafio === 'a') {
    return `Sei bem como é ver aquelas comissões de 20-27% comendo o lucro. Com app próprio você paga só 5%.`;
  }
  
  // Quer dados dos clientes
  if (answers.desafio === 'b') {
    return `Ter os dados dos clientes é fundamental. Com app próprio você tem WhatsApp, histórico de pedidos, tudo pra fidelizar.`;
  }
  
  // Quer app próprio
  if (answers.desafio === 'c') {
    return `Ter seu próprio app é o caminho certo. Você para de pagar % alto e ainda constrói sua base de clientes.`;
  }

  return `Vi algumas oportunidades interessantes no seu diagnóstico de delivery.`;
}
