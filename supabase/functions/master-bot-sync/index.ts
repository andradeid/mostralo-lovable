import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface Plan {
  id: string;
  name: string;
  price: number;
  discount_price?: number | null;
  promotion_active?: boolean | null;
  discount_percentage?: number | null;
  description?: string | null;
  features?: string[] | null;
  is_popular?: boolean | null;
}

interface BonusTier {
  id: string;
  tier_name: string;
  min_sales: number;
  bonus_amount: number;
  is_cumulative: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// =====================================================
// TOOLS UNIFICADAS (VENDAS + RECRUTAMENTO + SUPORTE)
// =====================================================

const UNIFIED_MASTER_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'identify_intent',
      description: 'Identifica a intenção do usuário para direcionar o atendimento. Retorna: sales (vendas/planos), recruitment (trabalhar/parceiro), support (dúvidas/problemas)',
      parameters: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Mensagem do usuário para análise' },
          detected_intent: { 
            type: 'string', 
            enum: ['sales', 'recruitment', 'support'],
            description: 'Intenção detectada'
          }
        },
        required: ['message', 'detected_intent']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_plans',
      description: 'Retorna lista de planos disponíveis com preços atualizados',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'calculate_savings',
      description: 'Calcula economia vs iFood baseado no faturamento mensal',
      parameters: {
        type: 'object',
        properties: {
          monthly_revenue: { type: 'number', description: 'Faturamento mensal em reais' }
        },
        required: ['monthly_revenue']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_testimonials',
      description: 'Retorna depoimentos de clientes satisfeitos',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_modules',
      description: 'Lista módulos e funcionalidades disponíveis na plataforma',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_bonus_tiers',
      description: 'Retorna tiers de bônus para vendedores/parceiros',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'calculate_commission',
      description: 'Calcula comissão e ganhos potenciais baseada em vendas',
      parameters: {
        type: 'object',
        properties: {
          sales: { type: 'number', description: 'Número de vendas' },
          plan_value: { type: 'number', description: 'Valor médio do plano' },
          is_pj: { type: 'boolean', description: 'Se é parceiro PJ (10%) ou afiliado PF (5-7%)' }
        },
        required: ['sales']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_recruitment_link',
      description: 'Retorna link de cadastro para novos parceiros/vendedores',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_faq',
      description: 'Busca perguntas frequentes por termo',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Termo de busca' }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_store_info',
      description: 'Retorna informações gerais da plataforma Mostralo',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_system_status',
      description: 'Verifica status dos sistemas e serviços',
      parameters: { type: 'object', properties: {} }
    }
  }
];

// =====================================================
// FUNÇÕES DE ESTILO DE ABORDAGEM
// =====================================================

function getSalesApproachInstructions(approach: string): string {
  switch (approach) {
    case 'basic':
      return `### 🟢 VENDAS - ESTILO: CONSULTIVO
- Seja educativo e informativo, SEM pressionar
- Foque em explicar benefícios de forma clara
- Deixe o cliente tomar a decisão no tempo dele
- Use frases como: "Fico à disposição para mais informações"
- NÃO use urgência ou escassez artificial
- Ofereça comparativos objetivos (vs iFood)
- Seja um consultor de negócios, não um vendedor`;

    case 'aggressive':
      return `### 🔴 VENDAS - ESTILO: URGÊNCIA
- Crie senso de urgência REAL (vagas limitadas, promoções)
- Use gatilhos de escassez: "Últimas vagas", "Promoção termina hoje"
- Pergunte "O que te impede de começar agora?"
- Oferte bônus exclusivos para decisão rápida
- Use FOMO: "Enquanto você pensa, concorrentes estão agindo"
- Calcule quanto o cliente PERDE por dia no iFood
- Pressione suavemente por decisão imediata`;

    default:
      return `### 🟡 VENDAS - ESTILO: PERSUASIVO
- Destaque benefícios e diferenciais com entusiasmo
- Use comparações favoráveis (vs iFood) de forma estratégica
- Conte histórias de sucesso de outros clientes
- Faça perguntas que levem à reflexão
- Sugira próximos passos sem pressionar demais
- Crie desejo mostrando resultados reais
- Equilibre informação com motivação`;
  }
}

function getRecruitmentApproachInstructions(approach: string): string {
  switch (approach) {
    case 'cold_lead':
      return `### 🟢 RECRUTAMENTO - ESTILO: LEAD FRIO
- Abordagem suave e informativa
- Foque em educar sobre a oportunidade
- NÃO pressione por cadastro imediato
- Responda dúvidas com paciência
- Use: "Quando se sentir pronto, estou aqui"
- Explique o modelo de comissão recorrente calmamente
- Deixe a pessoa processar as informações`;

    case 'aggressive':
      return `### 🔴 RECRUTAMENTO - ESTILO: AGRESSIVO
- Enfatize ganhos financeiros com exemplos concretos
- Crie urgência: "Cada dia sem vender é dinheiro perdido"
- Pergunte: "Por que esperar para começar a ganhar?"
- Use projeções de ganhos mensais/anuais
- Calcule renda passiva em 6 meses, 1 ano, 2 anos
- Mostre casos de sucesso reais
- Direcione para cadastro com call-to-action forte`;

    case 'super_aggressive':
      return `### 🔴🔴 RECRUTAMENTO - ESTILO: SUPER AGRESSIVO
- MÁXIMO senso de urgência e FOMO
- "Vagas de parceiro podem fechar a qualquer momento"
- Calcule quanto a pessoa PERDE por NÃO começar HOJE
- "Enquanto você pensa, outros já estão ganhando"
- Use projeções detalhadas de renda passiva
- Pressione por cadastro IMEDIATO
- "Imagina daqui 1 ano recebendo R$X todo mês sem fazer nada"
- Foque na transformação de vida que a renda extra proporciona`;

    default:
      return `### 🟡 RECRUTAMENTO - ESTILO: MODERADO
- Equilíbrio entre informação e motivação
- Destaque benefícios da comissão recorrente
- Use exemplos de ganhos reais
- Encoraje sem pressionar demais
- Sugira: "Que tal dar o primeiro passo hoje?"
- Explique PF vs PJ de forma clara
- Mostre a evolução natural de afiliado para parceiro`;
  }
}

// =====================================================
// GERADOR DE PROMPT UNIFICADO
// =====================================================

function buildUnifiedPrompt(config: any, plans: Plan[], bonusTiers: BonusTier[]): string {
  const salesApproach = config.sales_bot_approach || 'intermediate';
  const recruitmentApproach = config.recruitment_bot_approach || 'moderate';
  const supportCustomPrompt = config.support_bot_custom_prompt || '';

  // Personalidade
  const botName = config.bot_name || 'Assistente';
  const personality = config.bot_personality || 'amigavel';
  const emojiUsage = config.bot_emoji_usage || 'moderado';
  const customGreeting = config.bot_custom_greeting || '';

  console.log(`📋 Configurações: Nome=${botName}, Personalidade=${personality}, Emojis=${emojiUsage}, Vendas=${salesApproach}, Recrutamento=${recruitmentApproach}`);

  // Gerar instruções de personalidade
  const personalityInstructions = getPersonalityInstructions(personality);
  const emojiInstructions = getEmojiInstructions(emojiUsage);
  const greetingInstructions = getGreetingInstructions(personality, customGreeting, emojiUsage);

  let plansSection = '';
  if (plans.length > 0) {
    plansSection = '\n## 💰 PLANOS DISPONÍVEIS\n\n';
    plans.forEach(plan => {
      const hasPromotion = plan.promotion_active && plan.discount_price;
      const displayPrice = hasPromotion ? plan.discount_price! : plan.price;
      
      plansSection += `### ${plan.name}`;
      if (plan.is_popular) plansSection += ' ⭐ (MAIS ESCOLHIDO)';
      plansSection += '\n';
      
      if (hasPromotion) {
        plansSection += `**Preço:** ~~${formatCurrency(plan.price)}~~ → **${formatCurrency(displayPrice)}/mês**`;
        if (plan.discount_percentage) plansSection += ` 🔥 **${plan.discount_percentage}% OFF!**`;
        plansSection += '\n';
      } else {
        plansSection += `**Preço:** ${formatCurrency(displayPrice)}/mês\n`;
      }
      
      if (plan.description) plansSection += `${plan.description}\n`;
      
      if (Array.isArray(plan.features) && plan.features.length > 0) {
        plansSection += '**Recursos:**\n';
        plan.features.slice(0, 5).forEach(f => plansSection += `✅ ${f}\n`);
      }
      plansSection += '\n';
    });
  }

  let bonusSection = '';
  if (bonusTiers.length > 0) {
    const sortedTiers = [...bonusTiers].sort((a, b) => a.min_sales - b.min_sales);
    const maxBonus = sortedTiers.reduce((sum, tier) => sum + tier.bonus_amount, 0);
    
    bonusSection = `\n## 🏆 BÔNUS TRIMESTRAIS (Apenas PJ)

| Tier | Vendas/Trimestre | Bônus |
|------|-----------------|-------|
${sortedTiers.map(t => `| ${t.tier_name} | ${t.min_sales} | ${formatCurrency(t.bonus_amount)} |`).join('\n')}

**IMPORTANTE:** Os bônus são CUMULATIVOS!
Atingindo o tier máximo = **${formatCurrency(maxBonus)}** de bônus!\n`;
  }

  return `# 🤖 ${botName.toUpperCase()} - ASSISTENTE VIRTUAL MOSTRALO

Você é *${botName}*, o Assistente Virtual da Mostralo, uma plataforma completa de Delivery + Marketing Digital + Gestão Financeira.

## 🎭 SUA PERSONALIDADE

${personalityInstructions}

${emojiInstructions}

### Saudação
${greetingInstructions}

*IMPORTANTE:* NUNCA use saudações baseadas em horário ("Bom dia", "Boa tarde", "Boa noite") pois você não tem acesso ao horário real do usuário. Use SEMPRE saudações neutras.

## 🚫 ESCOPO DE ATENDIMENTO (CRÍTICO!)

Você SOMENTE pode responder sobre:
1. *VENDAS* - Planos, preços, funcionalidades e benefícios do Mostralo
2. *RECRUTAMENTO* - Oportunidade de trabalho, comissões, como se tornar vendedor/parceiro
3. *SUPORTE* - Dúvidas técnicas, problemas com a plataforma, FAQ

*PROIBIDO RESPONDER:*
- Perguntas de conhecimento geral (história, política, ciência, etc.)
- Perguntas sobre outras empresas ou concorrentes
- Piadas, curiosidades ou assuntos não relacionados ao Mostralo
- Solicitações de conteúdo criativo (poemas, histórias, etc.)
- Qualquer tema que não seja vendas, recrutamento ou suporte do Mostralo

*RESPOSTA PADRÃO PARA ASSUNTOS FORA DO ESCOPO:*
"Oi! 😊 Sou o assistente virtual do *Mostralo* e estou aqui para ajudar com:

🛒 *Vendas* - Conhecer nossos planos e funcionalidades
👔 *Parcerias* - Trabalhar conosco e ganhar comissões
🛠️ *Suporte* - Dúvidas sobre a plataforma

Como posso te ajudar hoje?"

---

## ⚠️ REGRAS DE FORMATAÇÃO (CRÍTICO!)

VOCÊ ESTÁ RESPONDENDO VIA WHATSAPP. Use APENAS estas formatações:

- Negrito: *texto* (UM asterisco de cada lado)
- Itálico: _texto_ (underscore de cada lado)
- Tachado: ~texto~ (til de cada lado)
- Monoespaço: \`texto\` (crase de cada lado)

*PROIBIDO* (não funciona no WhatsApp):
- NÃO use **texto** (dois asteriscos)
- NÃO use [texto](link) - envie apenas o link direto
- NÃO coloque links entre parênteses
- NÃO mencione números de telefone (o cliente já está no WhatsApp)
- NÃO use colchetes [] em nenhuma circunstância

## 🎯 CAPACIDADES DE ATENDIMENTO

Você consegue atender TRÊS tipos de contexto automaticamente:

1. *VENDAS* - Novos lojistas interessados na plataforma
2. *RECRUTAMENTO* - Pessoas interessadas em trabalhar como vendedor/parceiro
3. *SUPORTE* - Clientes com dúvidas ou problemas técnicos

## 🔄 FLUXO DE ATENDIMENTO DINÂMICO

1. Ao receber uma mensagem, SEMPRE use a tool "identify_intent" para detectar a intenção
2. Baseado no resultado, use as tools apropriadas:
   - Se *intent="sales"*: use get_plans, calculate_savings, get_modules, get_testimonials
   - Se *intent="recruitment"*: use get_bonus_tiers, calculate_commission, get_recruitment_link
   - Se *intent="support"*: use search_faq, get_store_info, get_system_status

3. Responda de forma contextualizada de acordo com a intenção detectada

---

## 🎨 ESTILOS DE ABORDAGEM CONFIGURADOS

${getSalesApproachInstructions(salesApproach)}

---

${getRecruitmentApproachInstructions(recruitmentApproach)}

---

### 🟢 SUPORTE - ESTILO: EMPÁTICO
- Seja sempre paciente e empático
- Resolva problemas de forma clara e objetiva
- Demonstre compreensão pela frustração do cliente
- Ofereça soluções práticas e passo-a-passo
${supportCustomPrompt ? `\n### 📝 INSTRUÇÕES CUSTOMIZADAS DE SUPORTE:\n${supportCustomPrompt}` : ''}

---

## 🛒 CONTEXTO: VENDAS

### Problemas do Marketplace (Argumentos de Dor)
1. *Você paga para eles crescerem* - Até 27% de taxa por pedido
2. *Clientes fiéis ao app, não a você* - Seus clientes são do marketplace
3. *Seus dados vendidos para concorrentes* - O marketplace usa seus dados

### Diferenciais Mostralo
- *0% de taxa por pedido*: Você fica com 100% do valor
- *100% dos clientes são seus*: Base própria de clientes fiéis
- *Marketing Digital Incluso*: Gestão de redes sociais
- *WhatsApp Marketing*: Recuperação automática de clientes inativos
- *Relatórios com IA*: Inteligência para decisões
- *Gestão Financeira Completa*: Dashboard, fluxo de caixa, relatórios

### Funcionalidades Presenciais
- PDV, Comandas Digitais, App do Garçom
- KDS (Kitchen Display), Cardápio QR Code
- Chamada de Senhas, Painel Digital

### Cálculo de Economia
Quando o cliente informar faturamento mensal, CALCULE:
1. Taxa iFood: faturamento × 0,25 (25%)
2. Custo Mostralo: valor do plano
3. Economia mensal: taxa_ifood - custo_mostralo
4. Economia anual: economia_mensal × 12

${plansSection}

---

## 👔 CONTEXTO: RECRUTAMENTO

### O que é o Mostralo
*Frase-chave: "Venda uma vez, receba todo mês."*

Enquanto seu cliente usar o Mostralo, a comissão cai na sua conta. É renda RECORRENTE!

### Comparativo PF vs PJ

| Tipo | Documento | Comissão | Limite Mensal | Bônus |
|------|-----------|----------|---------------|-------|
| AFILIADO (PF) | CPF | 5-7% | R$ 1.900 | ❌ |
| PARCEIRO (PJ) | CNPJ/MEI | 10% | ILIMITADO | ✅ |

*Recomendação:* Comece como PF para testar. Quando ver resultados, abra MEI!

${bonusSection}

### FAQ Recrutamento
1. "A comissão é só uma vez?" → É RECORRENTE! Vende uma vez, recebe todo mês.
2. "Preciso de CNPJ?" → Não! Comece como Afiliado PF usando CPF.
3. "Preciso de experiência?" → Não! Oferecemos treinamento completo.
4. "Qual investimento inicial?" → ZERO! Não paga nada para participar.

*Link de cadastro:* https://mostralo.com.br/seja-vendedor

---

## 🛠️ CONTEXTO: SUPORTE

### Sobre o Mostralo
- Sistema completo de delivery e vendas online
- Para restaurantes, lojas, farmácias, açougues, etc.
- 0% de taxa por pedido
- WhatsApp Marketing integrado
- Gestão Financeira completa

### FAQ Comum
1. "Como funciona o pagamento?" → Assinatura mensal via PIX ou cartão
2. "Tem taxa por pedido?" → NÃO! 0% de taxa
3. "Posso testar?" → Sim, período de teste gratuito
4. "Funciona no celular?" → Sim, sistema web/app
5. "Preciso de CNPJ?" → Pode ser PF ou PJ
6. "Como recebo pedidos?" → WhatsApp, app ou painel web

---

## 📞 CONTATO E ESCALAÇÃO

Site: https://mostralo.com.br
Email: suporte@mostralo.com.br

*IMPORTANTE:* Quando não souber responder ou a dúvida for muito específica, diga:
"Vou encaminhar sua solicitação para um de nossos especialistas. Em breve um assistente entrará em contato para ajudar você com mais detalhes!"`;
}

// =====================================================
// HANDLER PRINCIPAL
// =====================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Autenticar usuário
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid token');
    }

    // Verificar se é master admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (profile?.user_type !== 'master_admin') {
      throw new Error('Only master admins can sync bots');
    }

    const { configId } = await req.json();
    
    if (!configId) {
      throw new Error('configId is required');
    }

    // Buscar configuração
    const { data: config, error: configError } = await supabase
      .from('master_whatsapp_config')
      .select('*')
      .eq('id', configId)
      .single();

    if (configError || !config) {
      throw new Error('Config not found');
    }

    const openaiApiKey = config.openai_api_key;
    if (!openaiApiKey) {
      throw new Error('Configure a OpenAI API Key no painel WhatsApp Master');
    }

    // ========================================
    // LIMPEZA NEGATIVA UAZAPI
    // Desabilitar chatbots nativos e deletar agentes internos
    // ========================================
    console.log('🧹 Limpeza negativa UaZapi...');
    
    const { data: uazapiConfig } = await supabase
      .from('uazapi_config')
      .select('api_url')
      .order('is_active', { ascending: false })
      .limit(1)
      .single();

    if (uazapiConfig?.api_url && config.instance_name && config.evolution_instance_id) {
      const uazapiUrl = uazapiConfig.api_url.replace(/\/$/, '');
      const instanceToken = config.evolution_instance_id;
      
      try {
        // Desabilitar chatbot nativo
        console.log('🔇 Desabilitando chatbot nativo da UaZapi...');
        const settingsResp = await fetch(`${uazapiUrl}/instance/settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'token': instanceToken },
          body: JSON.stringify({ chatbot_enabled: false }),
        });
        const settingsText = await settingsResp.text();
        console.log(`📡 Settings response: ${settingsResp.status} - ${settingsText.substring(0, 200)}`);

        // Deletar agentes nativos
        console.log('🗑️ Verificando agentes nativos...');
        const agentsResp = await fetch(`${uazapiUrl}/agent/list`, {
          method: 'GET',
          headers: { 'token': instanceToken },
        });
        if (agentsResp.ok) {
          const agentsData = await agentsResp.json();
          const agents = Array.isArray(agentsData) ? agentsData : (agentsData?.data || []);
          for (const agent of agents) {
            if (agent?.id) {
              console.log(`🗑️ Deletando agente nativo: ${agent.id}`);
              await fetch(`${uazapiUrl}/agent/delete/${agent.id}`, {
                method: 'DELETE',
                headers: { 'token': instanceToken },
              });
            }
          }
        }
      } catch (cleanupError) {
        console.warn('⚠️ Erro na limpeza UaZapi (não bloqueante):', cleanupError);
      }
    }

    // ========================================
    // BUSCAR DADOS DO BANCO
    // ========================================
    console.log('📊 Buscando planos e bônus do banco...');
    
    const { data: plans } = await supabase
      .from('plans')
      .select('*')
      .order('price', { ascending: true });

    const { data: bonusTiersData } = await supabase
      .from('salesperson_bonus_tiers')
      .select('*')
      .eq('is_active', true)
      .order('min_sales', { ascending: true });

    const plansForPrompt: Plan[] = (plans || []).map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      discount_price: p.discount_price,
      promotion_active: p.promotion_active,
      discount_percentage: p.discount_percentage,
      description: p.description,
      features: p.features as string[] | null,
      is_popular: p.is_popular
    }));

    const bonusTiers: BonusTier[] = (bonusTiersData || []).map(b => ({
      id: b.id,
      tier_name: b.tier_name,
      min_sales: b.min_sales,
      bonus_amount: b.bonus_amount,
      is_cumulative: b.is_cumulative ?? true
    }));

    console.log(`✅ Encontrados ${plansForPrompt.length} planos e ${bonusTiers.length} tiers de bônus`);

    // ========================================
    // CRIAR/ATUALIZAR ASSISTANT UNIFICADO (OpenAI DIRETA)
    // ========================================
    console.log('🤖 Criando/Atualizando OpenAI Assistant UNIFICADO via API direta...');
    
    const unifiedPrompt = buildUnifiedPrompt(config, plansForPrompt, bonusTiers);
    let unifiedAssistantId = config.unified_openai_assistant_id as string | null;
    
    const assistantPayload = {
      name: 'Mostralo Master Bot',
      instructions: unifiedPrompt,
      tools: UNIFIED_MASTER_TOOLS,
      model: config.openai_model || 'gpt-4o-mini',
    };

    try {
      if (unifiedAssistantId) {
        console.log(`📝 Atualizando Assistant existente: ${unifiedAssistantId}`);
        const updateResp = await fetch(
          `https://api.openai.com/v1/assistants/${unifiedAssistantId}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json',
              'OpenAI-Beta': 'assistants=v2',
            },
            body: JSON.stringify(assistantPayload),
          }
        );

        if (updateResp.ok) {
          const assistant = await updateResp.json();
          unifiedAssistantId = assistant.id;
          console.log(`✅ Assistant atualizado: ${unifiedAssistantId}`);
        } else {
          const errText = await updateResp.text();
          console.log(`⚠️ Update falhou (${updateResp.status}): ${errText.substring(0, 200)}, criando novo...`);
          unifiedAssistantId = null;
        }
      }

      if (!unifiedAssistantId) {
        console.log(`🆕 Criando novo OpenAI Assistant UNIFICADO...`);
        const createResp = await fetch('https://api.openai.com/v1/assistants', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2',
          },
          body: JSON.stringify(assistantPayload),
        });

        if (!createResp.ok) {
          const errorText = await createResp.text();
          throw new Error(`Falha ao criar Assistant: ${errorText.slice(0, 200)}`);
        }

        const assistant = await createResp.json();
        unifiedAssistantId = assistant.id;
        console.log(`✅ Assistant UNIFICADO criado: ${unifiedAssistantId}`);
      }
    } catch (assistantError) {
      console.error('❌ Erro ao gerenciar Assistant:', assistantError);
      throw assistantError;
    }

    // ========================================
    // ATUALIZAR BANCO DE DADOS
    // Não cria bot na Evolution — o webhook é o handler
    // ========================================
    console.log('💾 Atualizando banco de dados...');
    
    await supabase
      .from('master_whatsapp_config')
      .update({
        unified_openai_assistant_id: unifiedAssistantId,
        // Limpar IDs legados da Evolution
        sales_bot_evolution_id: null,
        recruitment_bot_evolution_id: null,
        support_bot_evolution_id: null,
        sales_openai_assistant_id: null,
        recruitment_openai_assistant_id: null,
        support_openai_assistant_id: null,
      })
      .eq('id', configId);

    console.log(`✅ Sincronização UNIFICADA concluída!`);
    console.log(`   - Assistant ID: ${unifiedAssistantId}`);

    return new Response(JSON.stringify({ 
      success: true, 
      results: {
        unified: {
          success: true,
          assistantId: unifiedAssistantId,
        }
      },
      message: 'Assistente IA Master sincronizado com sucesso! Vendas, Recrutamento e Suporte agora são atendidos por um único assistente dinâmico via OpenAI.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
