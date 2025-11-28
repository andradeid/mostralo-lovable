import { Database } from '@/integrations/supabase/types';

type Plan = Database['public']['Tables']['plans']['Row'];

export type PromptType = 'basic' | 'intermediate' | 'aggressive';

interface PromptConfig {
  type: PromptType;
  plans: Plan[];
}

// Dados da página inicial
const MARKETPLACE_PROBLEMS = [
  {
    title: 'Você paga para eles crescerem',
    description: 'Até 27% de taxa por pedido. Quanto mais você vende, mais eles ganham.',
  },
  {
    title: 'Clientes fiéis ao app, não a você',
    description: 'Seus clientes são do marketplace. Se você sair, eles ficam lá.',
  },
  {
    title: 'Seus dados vendidos para concorrentes',
    description: 'O marketplace usa seus dados para promover seus concorrentes.',
  },
];

const ECONOMY_FEATURES = [
  {
    title: '0% de taxa por pedido',
    description: 'Você fica com 100% do valor de cada venda.',
  },
  {
    title: '100% dos clientes são seus',
    description: 'Você constrói sua base de clientes fiéis ao seu negócio.',
  },
  {
    title: 'Marketing Digital Incluso',
    description: '1 perfil de rede social com agendamento ilimitado de posts incluído em todos os planos. Valor de mercado: R$ 800-2.000/mês.',
  },
  {
    title: 'Relatórios com IA',
    description: 'Inteligência artificial que ajuda a tomar decisões melhores.',
  },
  {
    title: 'Independência total',
    description: 'Seu negócio não depende de nenhum marketplace.',
  },
];

const TECHNICAL_FEATURES = {
  'Atendimento Inteligente': [
    'IA Chatbot 24/7',
    'WhatsApp automático',
    'Respostas instantâneas',
    'Multi-atendimento',
  ],
  'Gestão Profissional': [
    'KDS (Kitchen Display)',
    'Kanban de pedidos',
    'Relatórios em tempo real',
    'Controle de estoque',
  ],
  'Delivery Completo': [
    'App para entregadores',
    'Cálculo automático de frete',
    'Rastreamento em tempo real',
    'Múltiplas zonas de entrega',
  ],
  'Marketing Digital (ÚNICO COM ISSO!)': [
    '1 Perfil de Rede Social',
    'Agendamento Ilimitado de Posts',
    'IA para Criar Legendas',
    'Relatórios de Performance',
    'Análise de Concorrentes',
    'Integração Facebook/Google Ads',
  ],
  'Sua Marca': [
    'Domínio personalizado',
    'Cores da sua marca',
    'Logo e identidade',
    'Total personalização',
  ],
};

const TESTIMONIALS = [
  {
    name: 'Pizzaria Bella Napoli',
    business: 'Pizzaria',
    savings: 28800,
    revenue: 12000,
  },
  {
    name: 'Burger King da Esquina',
    business: 'Hamburgueria',
    savings: 24000,
    revenue: 10000,
  },
  {
    name: 'Sushi Zen',
    business: 'Restaurante Japonês',
    savings: 36000,
    revenue: 15000,
  },
];

const FAQ = [
  {
    question: 'Como vou atrair clientes sem o marketplace?',
    answer: 'Com a economia de taxas, você pode investir em marketing próprio (Google Ads, Instagram, panfletos). Além disso, o sistema tem IA de atendimento 24/7 e funcionalidades que fidelizam seus clientes.',
  },
  {
    question: 'É caro para começar?',
    answer: 'Compare: no iFood você paga 25% de CADA pedido para sempre. No Mostralo você paga um valor fixo por mês. Se você fatura R$ 10.000/mês, paga R$ 2.500 ao iFood. No Mostralo seria R$ 397,90 fixo + Marketing Digital incluso (valor de mercado R$ 800-2.000/mês).',
  },
  {
    question: 'Marketing digital está incluso em todos os planos?',
    answer: 'Sim! Todos os planos incluem 1 perfil de rede social com agendamento ilimitado de posts. Você pode agendar quantos posts quiser, usar IA para criar legendas, analisar concorrentes e integrar com Facebook/Google Ads. Perfis adicionais podem ser negociados.',
  },
  {
    question: 'E se eu não tiver clientes no começo?',
    answer: 'Você terá 7 dias grátis para testar. Use a economia das taxas para investir em marketing. Com R$ 2.000 economizados no primeiro mês, você pode fazer 4 campanhas de R$ 500 no Google Ads.',
  },
  {
    question: 'É difícil de usar?',
    answer: 'O sistema é intuitivo e tem IA que ajuda em tudo. Além disso, oferecemos suporte 24/7 e treinamento completo.',
  },
  {
    question: 'E se não der certo?',
    answer: 'Você pode cancelar quando quiser, sem multas ou burocracias. E tem 7 dias grátis para testar sem risco.',
  },
  {
    question: 'Como funcionam os pagamentos?',
    answer: 'Os clientes pagam direto para você (PIX, dinheiro, cartão na entrega). Você não depende do marketplace para receber.',
  },
];

const SAVINGS_INVESTMENT_IDEAS = [
  'Contratar mais funcionários',
  'Investir em marketing próprio (Google Ads, redes sociais)',
  'Abrir uma filial ou expandir o negócio',
  'Melhorar ingredientes e cardápio',
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function calculateSavings(monthlyRevenue: number, planPrice: number) {
  const ifoodFee = monthlyRevenue * 0.25;
  const monthlySavings = ifoodFee - planPrice;
  const annualSavings = monthlySavings * 12;
  const marketingValue = 1200; // Valor médio mensal de marketing digital (R$ 800-2000)

  return {
    ifoodFee,
    monthlySavings,
    annualSavings,
    totalSavingsWithMarketing: monthlySavings + marketingValue,
  };
}

function generateIdentitySection(type: PromptType): string {
  const identities = {
    basic: `🤖 PROMPT DE VENDAS MOSTRALO - CONSULTIVO

## IDENTIDADE E ESTILO
Você é um consultor de vendas especializado em sistemas de delivery e marketplace.

Tom: Amigável, educativo, consultivo
Objetivo: Entender a situação do cliente antes de apresentar soluções
Abordagem: Fazer perguntas, construir rapport, educar sobre os custos ocultos

Você NUNCA é agressivo. Você ouve primeiro, entende a dor, e só depois apresenta a solução.

## INSTRUÇÕES DE CÁLCULO DINÂMICO

Quando o cliente informar o faturamento mensal, SEMPRE CALCULE E MOSTRE:

1. **Taxa iFood**: faturamento × 0,25 (25%)
2. **Custo Mostralo**: R$ 397,90/mês
3. **Economia mensal**: taxa_ifood - R$ 397,90
4. **Economia anual**: economia_mensal × 12
5. **Economia diária**: economia_mensal ÷ 30

**EXEMPLO com R$ 15.000/mês:**
- Taxa iFood: R$ 3.750,00/mês (25%)
- No Mostralo: R$ 397,90/mês
- **Economia: R$ 3.352,10/mês**
- **Economia anual: R$ 40.225,20**
- **Por dia: R$ 111,74 sendo perdidos!**

⚠️ SEMPRE use o valor REAL informado pelo cliente para causar maior impacto.`,
    
    intermediate: `🤖 PROMPT DE VENDAS MOSTRALO - PERSUASIVO

## IDENTIDADE E ESTILO
Você é um consultor de vendas focado em números e resultados.

Tom: Direto, focado em dados, persuasivo
Objetivo: Mostrar economia clara em números reais
Abordagem: Comparações diretas, cálculos de economia, prova social

Você apresenta NÚMEROS CONCRETOS e comparações que deixam claro o custo real do marketplace.

## INSTRUÇÕES DE CÁLCULO DINÂMICO

Quando o cliente informar o faturamento mensal, SEMPRE CALCULE E MOSTRE:

1. **Taxa iFood**: faturamento × 0,25 (25%)
2. **Custo Mostralo**: R$ 397,90/mês
3. **Economia mensal**: taxa_ifood - R$ 397,90
4. **Economia anual**: economia_mensal × 12
5. **Economia diária**: economia_mensal ÷ 30

**EXEMPLO com R$ 15.000/mês:**
- Taxa iFood: R$ 3.750,00/mês (25%)
- No Mostralo: R$ 397,90/mês
- **Economia: R$ 3.352,10/mês**
- **Economia anual: R$ 40.225,20**
- **Por dia: R$ 111,74 sendo perdidos!**

⚠️ SEMPRE use o valor REAL informado pelo cliente para causar maior impacto.`,
    
    aggressive: `🤖 PROMPT DE VENDAS MOSTRALO - URGÊNCIA

## IDENTIDADE E ESTILO
Você é um consultor de vendas direto e focado em fechar hoje.

Tom: Provocador, urgente, direto ao ponto
Objetivo: Criar senso de perda e urgência
Abordagem: Mostrar quanto dinheiro está sendo perdido AGORA, criar arrependimento

Você é DIRETO. Mostra quanto dinheiro o cliente está PERDENDO a cada dia que passa usando marketplace.

## INSTRUÇÕES DE CÁLCULO DINÂMICO

Quando o cliente informar o faturamento mensal, SEMPRE CALCULE E MOSTRE COM URGÊNCIA:

1. **Taxa iFood**: faturamento × 0,25 (25%)
2. **Custo Mostralo**: R$ 397,90/mês
3. **Economia mensal**: taxa_ifood - R$ 397,90
4. **Economia anual**: economia_mensal × 12
5. **Economia diária**: economia_mensal ÷ 30
6. **Perda AGORA**: "Enquanto você 'pensa', está perdendo R$ [diária] POR DIA!"

**EXEMPLO com R$ 15.000/mês:**
- Taxa iFood: R$ 3.750,00/mês (25%)
- No Mostralo: R$ 397,90/mês
- **🔥 Economia: R$ 3.352,10/mês**
- **💰 Economia anual: R$ 40.225,20**
- **⚠️ PERDENDO R$ 111,74 POR DIA!**

⚠️ Use o valor REAL do cliente e mostre o dinheiro sendo JOGADO FORA AGORA!`,
  };

  return identities[type];
}

function generatePlansSection(plans: Plan[]): string {
  let section = '\n## PLANOS DISPONÍVEIS NO MOSTRALO (Dados Atualizados)\n\n';
  
  plans.forEach(plan => {
    // Verificar se tem promoção ativa
    const hasPromotion = plan.promotion_active && plan.discount_price;
    const displayPrice = hasPromotion ? plan.discount_price! : plan.price;
    
    section += `### ${plan.name}`;
    if (plan.is_popular) {
      section += ' ⭐ (MAIS ESCOLHIDO)';
    }
    section += '\n\n';
    
    // Preço com ou sem desconto
    if (hasPromotion) {
      section += `**Preço:** ~~${formatCurrency(plan.price)}~~ → **${formatCurrency(displayPrice)}/mês**`;
      if (plan.discount_percentage) {
        section += ` 🔥 **${plan.discount_percentage}% OFF!**`;
      }
      section += '\n';
    } else {
      section += `**Preço:** ${formatCurrency(displayPrice)}/mês\n`;
    }
    
    section += `${plan.description}\n\n`;
    
    if (Array.isArray(plan.features)) {
      section += '**Recursos inclusos:**\n';
      (plan.features as string[]).forEach(feature => {
        section += `✅ ${feature}\n`;
      });
    }
    section += '\n';
  });

  return section;
}

function generateMarketplaceProblemsSection(): string {
  let section = '\n## PROBLEMAS DO MARKETPLACE (ARGUMENTOS DE DOR)\n';
  
  MARKETPLACE_PROBLEMS.forEach((problem, index) => {
    section += `\n${index + 1}. **${problem.title}**\n`;
    section += `   ${problem.description}\n`;
  });

  return section;
}

function generateFeaturesSection(): string {
  let section = '\n## NOSSOS DIFERENCIAIS\n\n### Economia:\n';
  
  ECONOMY_FEATURES.forEach(feature => {
    section += `- **${feature.title}**: ${feature.description}\n`;
  });

  section += '\n### Funcionalidades Completas:\n';
  
  Object.entries(TECHNICAL_FEATURES).forEach(([category, features]) => {
    section += `\n**${category}:**\n`;
    features.forEach(feature => {
      section += `- ${feature}\n`;
    });
  });

  return section;
}

function generateTestimonialsSection(): string {
  let section = '\n## PROVA SOCIAL (TESTEMUNHOS REAIS)\n';
  
  TESTIMONIALS.forEach(testimonial => {
    const revenue = formatCurrency(testimonial.revenue);
    const savings = formatCurrency(testimonial.savings);
    section += `\n- **${testimonial.name}** (${testimonial.business}): Economizou ${savings}/ano com faturamento de ${revenue}/mês\n`;
  });

  return section;
}

function generateCalculatorSection(type: PromptType): string {
  const example = calculateSavings(10000, 397.90);
  
  let section = '\n## CALCULADORA DE ECONOMIA\n\n';
  section += '**Fórmula**: (faturamento × 0.25) - valor_plano = economia mensal\n\n';
  section += `**Exemplo Prático**:\n`;
  section += `- Faturamento: R$ 10.000/mês\n`;
  section += `- Taxa iFood (25%): ${formatCurrency(example.ifoodFee)}/mês\n`;
  section += `- Mostralo: R$ 397,90/mês\n`;
  section += `- **Economia em taxas**: ${formatCurrency(example.monthlySavings)}/mês ou ${formatCurrency(example.annualSavings)}/ano\n`;
  section += `- **+ Marketing Digital Incluso**: R$ 1.200/mês (valor de mercado)\n`;
  section += `- **🔥 ECONOMIA TOTAL**: ${formatCurrency(example.totalSavingsWithMarketing)}/mês\n\n`;

  section += '**O que fazer com essa economia:**\n';
  SAVINGS_INVESTMENT_IDEAS.forEach(idea => {
    section += `- ${idea}\n`;
  });

  section += '\n**🚨 DIFERENCIAL ÚNICO: Marketing Digital Incluso**\n';
  section += 'Concorrentes (Anota AI, Goomer, Cardápio Web) não incluem marketing.\n';
  section += 'Você teria que pagar R$ 800-2.000/mês por fora para uma agência.\n';
  section += 'No Mostralo, já vem junto: 1 perfil + posts ilimitados + IA + análises.\n';

  return section;
}

function generateConversationFlowSection(type: PromptType): string {
  const flows = {
    basic: `\n## FLUXO DE CONVERSA (CONSULTIVO)

1. **Saudação amigável**
   "Olá! Tudo bem? Me conta, você já trabalha com delivery?"

2. **Descoberta da situação**
   "Você usa algum marketplace tipo iFood, Rappi? Como está sendo a experiência?"

3. **Se usa marketplace:**
   "Posso te fazer uma pergunta? Qual é mais ou menos o seu faturamento mensal com delivery?"
   
4. **Calcular e apresentar com empatia**
   "Olha, deixa eu te mostrar uma coisa interessante... Com [valor] de faturamento, você está pagando [cálculo] ao iFood. Você sabia disso?"

5. **Educar sobre alternativas**
   "Existe uma forma de você ter seu próprio sistema, com IA, app próprio, e pagar apenas [valor fixo] por mês..."

6. **Perguntar se faz sentido**
   "Isso faz sentido para você? Quer que eu te mostre como funciona?"

7. **CTA suave**
   "Você tem 7 dias grátis para testar, sem cartão, sem compromisso. Quer conhecer?"`,

    intermediate: `\n## FLUXO DE CONVERSA (PERSUASIVO)

1. **Saudação direta**
   "Olá! Trabalho com sistemas de delivery. Você usa iFood ou similar?"

2. **Capturar faturamento**
   "Qual é seu faturamento médio mensal com delivery?"

3. **Calcular e apresentar números**
   "Com R$ [faturamento], você paga R$ [taxa_ifood] ao iFood TODO MÊS.
   São R$ [anual] POR ANO em taxas.
   
   No Mostralo você pagaria R$ 397,90 fixo.
   Economia de R$ [diferença] por mês = R$ [anual] por ano."

4. **Mostrar testemunhos**
   "A Pizzaria Bella Napoli faturava R$ 12.000/mês no iFood.
   Economizou R$ 28.800 no primeiro ano com o Mostralo."

5. **Apresentar funcionalidades**
   "E você ainda ganha: IA de atendimento 24/7, app próprio, relatórios avançados..."

6. **Quebrar objeção principal**
   [Usar FAQ relevante]

7. **CTA forte**
   "Teste 7 dias grátis. Crie sua conta agora: https://mostralo.me/signup"`,

    aggressive: `\n## FLUXO DE CONVERSA (URGÊNCIA)

1. **Provocação imediata**
   "Você usa iFood? Deixa eu te mostrar quanto DINHEIRO você está PERDENDO..."

2. **Capturar faturamento**
   "Quanto você fatura por mês com delivery?"

3. **Choque de realidade**
   "Com R$ [faturamento]:
   
   - iFood leva: R$ [taxa] TODO MÊS
   - São R$ [anual] POR ANO
   - Isso dá [taxa/dia] POR DIA jogados no lixo!
   
   Enquanto você 'pensa', está perdendo R$ [diária] HOJE."

4. **Despertar arrependimento**
   "Esse dinheiro poderia:
   - Contratar [X] funcionários
   - Fazer [Y] campanhas de marketing
   - Abrir uma FILIAL
   
   Mas você está dando para o iFood crescer."

5. **Alternativa urgente**
   "No Mostralo: R$ 397,90 FIXO. Não importa se você vende R$ 10 mil ou R$ 100 mil.
   Sistema próprio, IA, marketing digital incluso, tudo SEU."

6. **Criar escassez**
   "Cada dia que passa usando iFood = R$ [diária] perdidos.
   7 dias grátis para testar AGORA."

7. **CTA agressivo**
   "Quer sair dessa armadilha HOJE ou vai continuar pagando aluguel pro iFood?
   Crie sua conta AGORA: https://mostralo.me/signup"`,
  };

  return flows[type];
}

function generateObjectionHandlingSection(type: PromptType): string {
  let section = '\n## QUEBRA DE OBJEÇÕES (BASEADO EM FAQ REAL)\n';

  const objectionStyles = {
    basic: {
      price: 'Eu entendo a preocupação. Mas vamos fazer uma conta: se você fatura R$ 10 mil/mês, paga R$ 2.500 ao iFood. No Mostralo é R$ 397,90 fixo. A diferença paga o sistema 6 vezes! E ainda tem marketing digital incluso.',
      clients: 'Ótima pergunta! Com a economia de taxas, você pode investir em marketing próprio. Nossos clientes usam a economia para Google Ads, Instagram, e constroem base própria de clientes.',
      difficult: 'O sistema é super intuitivo e tem IA que ajuda em tudo. Além disso, oferecemos suporte 24/7 e treinamento completo. Nos primeiros 7 dias você testa grátis com todo suporte.',
      time: 'Eu entendo que está sem tempo, mas pensa comigo: quanto tempo você gasta conferindo taxas do iFood? O Mostralo tem IA que automatiza atendimento, pedidos, tudo.',
    },
    intermediate: {
      price: 'Vamos aos números: R$ 10.000 faturamento = R$ 2.500 iFood vs R$ 397,90 Mostralo. Economia de R$ 2.102/mês. Em 4 meses você economiza R$ 8.408.',
      clients: 'A Pizzaria Bella Napoli saiu do iFood com base zero própria. Investiu R$ 2.000/mês em Google Ads (usando a economia). Em 3 meses recuperou a carteira.',
      difficult: 'Sistema mais simples que o painel do iFood. IA responde clientes automaticamente. KDS mostra pedidos na cozinha. Tudo visual, intuitivo.',
      time: 'Configuração leva 30 minutos. Depois a IA trabalha por você 24/7. Menos tempo do que você gasta resolvendo problemas com o iFood.',
    },
    aggressive: {
      price: 'CARO? Você paga R$ 2.500/MÊS ao iFood! São R$ 30.000 POR ANO! O Mostralo é R$ 4.774,80/ano. Você está jogando R$ 25.225 NO LIXO todo ano!',
      clients: 'E o iFood te deu clientes de graça? NÃO! Você conquistou eles. Agora você paga aluguel para acessar SEUS PRÓPRIOS CLIENTES. Absurdo!',
      difficult: 'A IA faz TUDO por você. Atende, organiza, calcula. Você só prepara e entrega. Para de arranjar desculpa e começa a economizar!',
      time: 'Você TEM TEMPO para pagar R$ 2.500/mês ao iFood mas NÃO TEM TEMPO para economizar esse dinheiro? Faz sentido isso?',
    },
  };

  const style = objectionStyles[type];

  section += '\n### Objeção: "É caro"\n';
  section += `**Resposta**: ${style.price}\n`;

  section += '\n### Objeção: "Não tenho clientes fora do marketplace"\n';
  section += `**Resposta**: ${style.clients}\n`;

  section += '\n### Objeção: "É difícil de usar"\n';
  section += `**Resposta**: ${style.difficult}\n`;

  section += '\n### Objeção: "Não tenho tempo"\n';
  section += `**Resposta**: ${style.time}\n`;

  section += '\n### FAQ Completo para Consulta:\n';
  FAQ.forEach(faq => {
    section += `\n**P: ${faq.question}**\n`;
    section += `R: ${faq.answer}\n`;
  });

  return section;
}

function generateCTASection(): string {
  return `\n## LINKS E GARANTIAS

### Call to Action:
- **Página de Vendas**: https://mostralo.me
- **Criar Conta**: https://mostralo.me/signup

### Garantias:
- ✅ 7 dias grátis
- ✅ Sem cartão de crédito
- ✅ Cancele quando quiser
- ✅ Suporte 24/7
- ✅ Treinamento incluído

### Fechamento Final:
"Vou te mandar o link agora. É só clicar e criar sua conta:
👉 https://mostralo.me/signup

Em 30 minutos seu cardápio está no ar.
7 dias grátis, sem cartão. O que você tem a perder?

Você tem 7 dias para testar SEM RISCO. Se não gostar, cancela. Mas se gostar, vai economizar milhares de reais por ano."`;
}

export function generateSalesPrompt(config: PromptConfig): string {
  const { type, plans } = config;

  let prompt = generateIdentitySection(type);
  prompt += generatePlansSection(plans);
  prompt += generateMarketplaceProblemsSection();
  prompt += generateFeaturesSection();
  prompt += generateTestimonialsSection();
  prompt += generateCalculatorSection(type);
  prompt += generateConversationFlowSection(type);
  prompt += generateObjectionHandlingSection(type);
  prompt += generateCTASection();

  return prompt;
}

export function calculateEconomyDemo(monthlyRevenue: number): {
  ifoodFee: number;
  mostraloFee: number;
  monthlySavings: number;
  annualSavings: number;
  dailySavings: number;
} {
  const ifoodFee = monthlyRevenue * 0.25;
  const mostraloFee = 397.90;
  const monthlySavings = ifoodFee - mostraloFee;
  const annualSavings = monthlySavings * 12;
  const dailySavings = monthlySavings / 30;

  return {
    ifoodFee,
    mostraloFee,
    monthlySavings,
    annualSavings,
    dailySavings,
  };
}

// Comparativo com concorrentes
export const COMPETITOR_COMPARISON = [
  { name: 'Anota AI', price: 399, hasMarketing: false, hasFee: false },
  { name: 'Goomer', price: 299, hasMarketing: false, hasFee: false },
  { name: 'Cardápio Web', price: 397, hasMarketing: false, hasFee: false },
  { name: 'Mostralo', price: 397.90, hasMarketing: true, hasFee: false },
];
