import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função auxiliar para aguardar entre operações
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

// Formatador de moeda
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// =====================================================
// TOOLS UNIFICADAS (VENDAS + RECRUTAMENTO + SUPORTE)
// =====================================================

const UNIFIED_MASTER_TOOLS = [
  // IDENTIFICAÇÃO DE INTENÇÃO (NOVA - roteamento dinâmico)
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
            description: 'Intenção detectada: sales=interessado em planos/sistema, recruitment=interessado em trabalhar/vender, support=dúvidas/problemas'
          }
        },
        required: ['message', 'detected_intent']
      }
    }
  },
  
  // === VENDAS ===
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
  
  // === RECRUTAMENTO ===
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
  
  // === SUPORTE ===
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

    default: // intermediate
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

    default: // moderate
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
  // Extrair configurações de abordagem
  const salesApproach = config.sales_bot_approach || 'intermediate';
  const recruitmentApproach = config.recruitment_bot_approach || 'moderate';
  const supportCustomPrompt = config.support_bot_custom_prompt || '';

  console.log(`📋 Configurações de abordagem: Vendas=${salesApproach}, Recrutamento=${recruitmentApproach}`);

  // Formatar lista de planos
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

  // Formatar tiers de bônus
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

  return `# 🤖 ASSISTENTE VIRTUAL MOSTRALO

Você é o Assistente Virtual da Mostralo, uma plataforma completa de Delivery + Marketing Digital + Gestão Financeira.

## 🎯 CAPACIDADES DE ATENDIMENTO

Você consegue atender TRÊS tipos de contexto automaticamente:

1. **VENDAS** - Novos lojistas interessados na plataforma
2. **RECRUTAMENTO** - Pessoas interessadas em trabalhar como vendedor/parceiro
3. **SUPORTE** - Clientes com dúvidas ou problemas técnicos

## 🔄 FLUXO DE ATENDIMENTO DINÂMICO

1. Ao receber uma mensagem, SEMPRE use a tool "identify_intent" para detectar a intenção
2. Baseado no resultado, use as tools apropriadas:
   - Se **intent="sales"**: use get_plans, calculate_savings, get_modules, get_testimonials
   - Se **intent="recruitment"**: use get_bonus_tiers, calculate_commission, get_recruitment_link
   - Se **intent="support"**: use search_faq, get_store_info, get_system_status

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
1. **Você paga para eles crescerem** - Até 27% de taxa por pedido
2. **Clientes fiéis ao app, não a você** - Seus clientes são do marketplace
3. **Seus dados vendidos para concorrentes** - O marketplace usa seus dados

### Diferenciais Mostralo
- **0% de taxa por pedido**: Você fica com 100% do valor
- **100% dos clientes são seus**: Base própria de clientes fiéis
- **Marketing Digital Incluso**: Gestão de redes sociais
- **WhatsApp Marketing**: Recuperação automática de clientes inativos
- **Relatórios com IA**: Inteligência para decisões
- **Gestão Financeira Completa**: Dashboard, fluxo de caixa, relatórios

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
**Frase-chave: "Venda uma vez, receba todo mês."**

Enquanto seu cliente usar o Mostralo, a comissão cai na sua conta. É renda RECORRENTE!

### Comparativo PF vs PJ

| Tipo | Documento | Comissão | Limite Mensal | Bônus |
|------|-----------|----------|---------------|-------|
| AFILIADO (PF) | CPF | 5-7% | R$ 1.900 | ❌ |
| PARCEIRO (PJ) | CNPJ/MEI | 10% | ILIMITADO | ✅ |

**Recomendação:** Comece como PF para testar. Quando ver resultados, abra MEI!

${bonusSection}

### FAQ Recrutamento
1. "A comissão é só uma vez?" → É RECORRENTE! Vende uma vez, recebe todo mês.
2. "Preciso de CNPJ?" → Não! Comece como Afiliado PF usando CPF.
3. "Preciso de experiência?" → Não! Oferecemos treinamento completo.
4. "Qual investimento inicial?" → ZERO! Não paga nada para participar.

**Link de cadastro:** https://mostralo.com.br/seja-vendedor

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

**IMPORTANTE:** Quando não souber responder ou a dúvida for muito específica, diga:
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

    // Buscar Evolution Config
    const { data: evolutionConfig } = await supabase
      .from('evolution_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (!evolutionConfig) {
      throw new Error('Evolution config not found');
    }

    const openaiApiKey = config.openai_api_key;
    if (!openaiApiKey) {
      throw new Error('Configure a OpenAI API Key no painel WhatsApp Master');
    }

    const evolutionUrl = evolutionConfig.api_url.replace(/\/$/, '');

    // ========================================
    // FUNÇÃO: Garantir credenciais OpenAI
    // ========================================
    const MASTER_CRED_NAME = 'master_whatsapp_openai';
    
    async function ensureOpenAiCreds(instanceName: string): Promise<string | null> {
      console.log(`🔑 Verificando credenciais OpenAI para instância:`, instanceName);

      let existingCreds: any[] = [];
      try {
        const listResp = await fetch(`${evolutionUrl}/openai/creds/${instanceName}`, {
          method: 'GET',
          headers: { 'apikey': evolutionConfig.api_key },
        });

        if (listResp.ok) {
          const data = await listResp.json();
          existingCreds = Array.isArray(data) ? data : (data?.creds || data?.data || []);
        }
      } catch (e) {
        console.log('⚠️ Erro ao listar credenciais:', e);
      }

      const masterCredential = existingCreds.find((c) => c.name === MASTER_CRED_NAME);
      if (masterCredential?.id) {
        console.log(`✅ Credencial existente encontrada:`, masterCredential.id);
        return masterCredential.id;
      }

      console.log(`🆕 Criando nova credencial OpenAI...`);
      try {
        const createResp = await fetch(`${evolutionUrl}/openai/creds/${instanceName}`, {
          method: 'POST',
          headers: {
            'apikey': evolutionConfig.api_key,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: MASTER_CRED_NAME,
            apiKey: openaiApiKey,
          }),
        });

        const createText = await createResp.text();
        console.log(`📥 Resposta criação credencial:`, createResp.status);

        if (!createResp.ok) {
          if (createText.includes('already')) {
            const retryResp = await fetch(`${evolutionUrl}/openai/creds/${instanceName}`, {
              method: 'GET',
              headers: { 'apikey': evolutionConfig.api_key },
            });
            if (retryResp.ok) {
              const retryData = await retryResp.json();
              const retryCreds = Array.isArray(retryData) ? retryData : (retryData?.creds || []);
              const found = retryCreds.find((c: any) => c.name === MASTER_CRED_NAME);
              if (found?.id) return found.id;
            }
          }
          return null;
        }

        let createdId: string | null = null;
        try {
          const data = JSON.parse(createText);
          createdId = data?.id || data?.openaiCredsId || data?.creds?.id || null;
        } catch {}

        return createdId;
      } catch (e) {
        console.error('❌ Erro ao criar credencial:', e);
        return null;
      }
    }

    // ========================================
    // FUNÇÃO: Buscar e deletar bots existentes
    // ========================================
    async function findExistingBots(instanceName: string): Promise<any[]> {
      try {
        const findResp = await fetch(`${evolutionUrl}/openai/find/${instanceName}`, {
          method: 'GET',
          headers: { 'apikey': evolutionConfig.api_key },
        });

        if (findResp.ok) {
          const data = await findResp.json();
          return Array.isArray(data) ? data : (data?.bots || data?.data || []);
        }
        return [];
      } catch {
        return [];
      }
    }

    async function deleteExistingBot(instanceName: string, botId: string): Promise<boolean> {
      try {
        const deleteResp = await fetch(`${evolutionUrl}/openai/delete/${botId}/${instanceName}`, {
          method: 'DELETE',
          headers: { 'apikey': evolutionConfig.api_key },
        });
        return deleteResp.ok || deleteResp.status === 404;
      } catch {
        return false;
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
    // OBTER CREDENCIAL OPENAI
    // ========================================
    const openaiCredsId = await ensureOpenAiCreds(config.instance_name);
    if (!openaiCredsId) {
      throw new Error('Falha ao obter credenciais OpenAI');
    }

    // ========================================
    // LIMPAR BOTS EXISTENTES
    // ========================================
    console.log('🧹 Limpando bots existentes...');
    
    const botIdsToDelete = [
      config.sales_bot_evolution_id,
      config.recruitment_bot_evolution_id,
      config.support_bot_evolution_id,
    ].filter((id): id is string => typeof id === 'string' && id.length > 0);

    for (const botId of botIdsToDelete) {
      await deleteExistingBot(config.instance_name, botId);
    }

    // Buscar e deletar bots fantasmas
    const existingBots = await findExistingBots(config.instance_name);
    for (const bot of existingBots) {
      const botId = bot?.id || bot?.openaiBot?.id;
      if (botId) await deleteExistingBot(config.instance_name, botId);
    }

    await delay(1500);

    // ========================================
    // CRIAR/ATUALIZAR ASSISTANT UNIFICADO
    // ========================================
    console.log('🤖 Criando/Atualizando OpenAI Assistant UNIFICADO...');
    
    const unifiedPrompt = buildUnifiedPrompt(config, plansForPrompt, bonusTiers);
    let unifiedAssistantId = config.unified_openai_assistant_id as string | null;
    
    const assistantPayload = {
      name: 'Mostralo Master Bot',
      instructions: unifiedPrompt,
      tools: UNIFIED_MASTER_TOOLS,
      model: config.openai_model || evolutionConfig.openai_default_model || 'gpt-4o-mini',
    };

    try {
      if (unifiedAssistantId) {
        // Tentar atualizar existente
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
          console.log(`⚠️ Update falhou, criando novo...`);
          unifiedAssistantId = null;
        }
      }

      if (!unifiedAssistantId) {
        // Criar novo Assistant
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
    // CRIAR BOT NA EVOLUTION API
    // ========================================
    console.log('📡 Criando bot na Evolution API...');
    
    const functionUrl = `${supabaseUrl}/functions/v1/master-faq-agent`;

    const botPayload = {
      enabled: true,
      openaiCredsId: openaiCredsId,
      botType: 'assistant',
      model: config.openai_model || evolutionConfig.openai_default_model || 'gpt-4o-mini',
      maxTokens: evolutionConfig.openai_max_tokens || 1000,
      description: 'Mostralo Master Bot - Atendimento unificado de Vendas, Recrutamento e Suporte',
      systemMessages: [unifiedPrompt],
      assistantMessages: [
        'Olá! 👋 Sou o Assistente Virtual da Mostralo. Posso ajudar com informações sobre nossa plataforma, oportunidades de parceria ou suporte técnico. Como posso ajudar você hoje?'
      ],
      userMessages: ['Oi', 'Olá', 'Boa tarde', 'Boa noite', 'Bom dia'],
      triggerType: 'all',
      triggerOperator: 'contains',
      triggerValue: '',
      expire: config.sales_bot_expire_minutes || 60,
      keywordFinish: '#SAIR',
      delayMessage: config.sales_bot_delay_message || 4000,
      unknownMessage: 'Desculpe, não entendi. Pode reformular sua pergunta?',
      listeningFromMe: false,
      stopBotFromMe: true,
      keepOpen: false,
      debounceTime: 10,
      ignoreJids: [],
      splitMessages: true,
      timePerChar: 0,
      assistantId: unifiedAssistantId,
      functionUrl: functionUrl,
    };

    console.log(`🔧 Payload do bot unificado:`, JSON.stringify({
      botType: botPayload.botType,
      assistantId: botPayload.assistantId,
      functionUrl: botPayload.functionUrl,
    }, null, 2));

    const createBotResp = await fetch(`${evolutionUrl}/openai/create/${config.instance_name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionConfig.api_key,
      },
      body: JSON.stringify(botPayload),
    });

    const createBotText = await createBotResp.text();
    console.log(`📥 Resposta create bot:`, createBotResp.status, createBotText);

    if (!createBotResp.ok) {
      throw new Error(`Falha ao criar bot na Evolution: ${createBotText}`);
    }

    let newBotId: string | null = null;
    try {
      const responseData = JSON.parse(createBotText);
      newBotId = responseData.id || responseData.openaiBot?.id || responseData.openai?.id;
    } catch {}

    // ========================================
    // ATUALIZAR BANCO DE DADOS
    // ========================================
    console.log('💾 Atualizando banco de dados...');
    
    await supabase
      .from('master_whatsapp_config')
      .update({
        unified_openai_assistant_id: unifiedAssistantId,
        sales_bot_evolution_id: newBotId,
        recruitment_bot_evolution_id: null,
        support_bot_evolution_id: null,
        sales_openai_assistant_id: null,
        recruitment_openai_assistant_id: null,
        support_openai_assistant_id: null,
      })
      .eq('id', configId);

    console.log(`✅ Sincronização UNIFICADA concluída!`);
    console.log(`   - Assistant ID: ${unifiedAssistantId}`);
    console.log(`   - Evolution Bot ID: ${newBotId}`);

    return new Response(JSON.stringify({ 
      success: true, 
      results: {
        unified: {
          success: true,
          assistantId: unifiedAssistantId,
          evolutionBotId: newBotId,
        }
      },
      message: 'Bot unificado criado com sucesso! Vendas, Recrutamento e Suporte agora são atendidos por um único assistente dinâmico.'
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
