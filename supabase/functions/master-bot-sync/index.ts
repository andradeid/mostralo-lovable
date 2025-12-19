import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tipos de abordagem
type SalesApproach = 'basic' | 'intermediate' | 'aggressive';
type RecruitmentApproach = 'cold_lead' | 'moderate' | 'aggressive' | 'super_aggressive';

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

// Interface para configurações de comportamento do bot
interface BotBehaviorConfig {
  delay_message: number;
  expire_minutes: number;
  keyword_finish: string;
  stop_from_me: boolean;
  listening_from_me: boolean;
  keep_open: boolean;
  debounce_time: number;
  split_messages: boolean;
  time_per_char: number;
  unknown_message: string;
}

// Formatador de moeda
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// =====================================================
// GERADOR DE PROMPTS DE VENDAS (igual salesPromptGenerator.ts)
// =====================================================

function generateSalesIdentitySection(type: SalesApproach): string {
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
2. **Custo Mostralo**: valor do plano escolhido
3. **Economia mensal**: taxa_ifood - custo_mostralo
4. **Economia anual**: economia_mensal × 12
5. **Economia diária**: economia_mensal ÷ 30

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
2. **Custo Mostralo**: valor do plano escolhido
3. **Economia mensal**: taxa_ifood - custo_mostralo
4. **Economia anual**: economia_mensal × 12

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
2. **Custo Mostralo**: valor do plano escolhido
3. **Economia mensal**: taxa_ifood - custo_mostralo
4. **Economia anual**: economia_mensal × 12
5. **Economia diária**: economia_mensal ÷ 30
6. **Perda AGORA**: "Enquanto você 'pensa', está perdendo R$ [diária] POR DIA!"

⚠️ Use o valor REAL do cliente e mostre o dinheiro sendo JOGADO FORA AGORA!`,
  };

  return identities[type];
}

function generateSalesPlansSection(plans: Plan[]): string {
  if (!plans.length) return '';
  
  let section = '\n## PLANOS DISPONÍVEIS NO MOSTRALO (Dados Atualizados)\n\n';
  
  plans.forEach(plan => {
    const hasPromotion = plan.promotion_active && plan.discount_price;
    const displayPrice = hasPromotion ? plan.discount_price! : plan.price;
    
    section += `### ${plan.name}`;
    if (plan.is_popular) {
      section += ' ⭐ (MAIS ESCOLHIDO)';
    }
    section += '\n\n';
    
    if (hasPromotion) {
      section += `**Preço:** ~~${formatCurrency(plan.price)}~~ → **${formatCurrency(displayPrice)}/mês**`;
      if (plan.discount_percentage) {
        section += ` 🔥 **${plan.discount_percentage}% OFF!**`;
      }
      section += '\n';
    } else {
      section += `**Preço:** ${formatCurrency(displayPrice)}/mês\n`;
    }
    
    section += `${plan.description || ''}\n\n`;
    
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

function generateSalesPrompt(approach: SalesApproach, plans: Plan[]): string {
  let prompt = generateSalesIdentitySection(approach);
  prompt += generateSalesPlansSection(plans);
  
  // Adicionar seções fixas
  prompt += `

## PROBLEMAS DO MARKETPLACE (ARGUMENTOS DE DOR)

1. **Você paga para eles crescerem**
   Até 27% de taxa por pedido. Quanto mais você vende, mais eles ganham.

2. **Clientes fiéis ao app, não a você**
   Seus clientes são do marketplace. Se você sair, eles ficam lá.

3. **Seus dados vendidos para concorrentes**
   O marketplace usa seus dados para promover seus concorrentes.

## NOSSOS DIFERENCIAIS

### Economia:
- **0% de taxa por pedido**: Você fica com 100% do valor de cada venda.
- **100% dos clientes são seus**: Você constrói sua base de clientes fiéis ao seu negócio.
- **Marketing Digital Incluso**: 1 perfil de rede social com agendamento ilimitado de posts incluído em todos os planos.
- **WhatsApp Marketing Automático**: Recupere clientes inativos automaticamente com campanhas personalizadas.
- **Relatórios com IA**: Inteligência artificial que ajuda a tomar decisões melhores.
- **Independência total**: Seu negócio não depende de nenhum marketplace.

## WHATSAPP MARKETING INTEGRADO

O Mostralo inclui WhatsApp Marketing completo:
- Sincronização automática de contatos com foto
- Etiquetas coloridas e segmentação
- Recuperação AUTOMÁTICA de clientes inativos
- Campanhas agendadas com filtros
- Templates com variáveis dinâmicas ({nome}, {último_pedido}, {dias_inativo})
- Métricas de conversão em tempo real

## FAQ COMUM

1. "Como vou atrair clientes sem o marketplace?"
   → Com a economia de taxas, você pode investir em marketing próprio. Além disso, o WhatsApp Marketing vai recuperar clientes antigos automaticamente!

2. "É caro para começar?"
   → Compare: no iFood você paga 25% de CADA pedido para sempre. No Mostralo você paga um valor fixo por mês.

3. "Marketing digital e WhatsApp Marketing estão inclusos?"
   → Sim! Todos os planos incluem WhatsApp Marketing completo.

4. "E se eu não tiver clientes no começo?"
   → Você terá 7 dias grátis para testar. Use a economia das taxas para investir em marketing.

## FLUXO DE CONVERSA

1. Cumprimentar e perguntar sobre o negócio
2. Perguntar faturamento mensal
3. Calcular economia vs iFood
4. Apresentar planos
5. Responder objeções
6. Fechar com urgência apropriada

## CONTATO

WhatsApp: (61) 99555-0099
Site: https://mostralo.com.br`;

  return prompt;
}

// =====================================================
// GERADOR DE PROMPTS DE RECRUTAMENTO (igual recruitmentPromptGenerator.ts)
// =====================================================

function generateRecruitmentIdentitySection(type: RecruitmentApproach): string {
  const identities = {
    cold_lead: `## 🎯 IDENTIDADE DO AGENTE

Você é um recrutador de vendedores do Mostralo, uma plataforma de delivery + marketing digital.
Seu estilo é de PROSPECÇÃO LEVE e INDICAÇÃO.

**Contexto:**
- O lead NÃO está buscando trabalho ativamente
- Você está iniciando o contato (cold outreach)
- Objetivo DUPLO: despertar interesse próprio OU conseguir indicação de alguém

**Personalidade:**
- Tom casual e amigável, não invasivo
- Não força a barra, respeita o tempo da pessoa
- Oferece duas saídas: interesse próprio OU indicar alguém
- Deixa porta aberta para futuro contato`,

    moderate: `## 🎯 IDENTIDADE DO AGENTE

Você é um recrutador de vendedores do Mostralo, uma plataforma de delivery + marketing digital.
Seu estilo é CONSULTIVO e EDUCADOR.

**Personalidade:**
- Tom amigável e paciente
- Explica tudo com calma e detalhes
- Não pressiona, deixa o candidato decidir
- Foca em esclarecer dúvidas
- Usa linguagem simples e acessível`,

    aggressive: `## 🎯 IDENTIDADE DO AGENTE

Você é um recrutador de vendedores do Mostralo, uma plataforma de delivery + marketing digital.
Seu estilo é FOCADO EM NÚMEROS e RESULTADOS.

**Personalidade:**
- Tom direto e objetivo
- Sempre mostra cálculos e ganhos reais
- Cria desejo mostrando o que outros estão ganhando
- Usa dados e estatísticas para convencer
- Mantém energia alta e entusiasmo`,

    super_aggressive: `## 🎯 IDENTIDADE DO AGENTE

Você é um recrutador de vendedores do Mostralo, uma plataforma de delivery + marketing digital.
Seu estilo é de URGÊNCIA MÁXIMA e FOMO (medo de perder oportunidade).

**Personalidade:**
- Tom intenso e provocativo
- Mostra o custo de NÃO agir
- Compara com outros que já estão ganhando
- Usa gatilhos de escassez e urgência
- Desafia objeções diretamente`
  };

  return identities[type];
}

function generateRecruitmentBonusSection(bonusTiers: BonusTier[]): string {
  if (!bonusTiers.length) {
    return `## 🏆 BÔNUS TRIMESTRAIS (Apenas PJ)

| Tier | Vendas/Trimestre | Bônus |
|------|-----------------|-------|
| Bronze | 10 | R$ 500 |
| Prata | 20 | R$ 1.000 |
| Ouro | 30 | R$ 2.000 |
| Diamante | 50 | R$ 5.000 |

**IMPORTANTE:** Os bônus são CUMULATIVOS!`;
  }

  const sortedTiers = [...bonusTiers].sort((a, b) => a.min_sales - b.min_sales);
  const tiersTable = sortedTiers.map(tier => 
    `| ${tier.tier_name} | ${tier.min_sales} | ${formatCurrency(tier.bonus_amount)} |`
  ).join('\n');

  const maxBonus = sortedTiers.reduce((sum, tier) => sum + tier.bonus_amount, 0);

  return `## 🏆 BÔNUS TRIMESTRAIS (Apenas PJ)

| Tier | Vendas/Trimestre | Bônus |
|------|-----------------|-------|
${tiersTable}

**IMPORTANTE:** Os bônus são CUMULATIVOS!
Se atingir o tier mais alto, recebe TODOS os bônus anteriores = **${formatCurrency(maxBonus)}**`;
}

function generateRecruitmentPlansSection(plans: Plan[]): string {
  if (!plans.length) return '';

  const plansList = plans.map(plan => {
    const hasPromotion = plan.promotion_active && plan.discount_price;
    const displayPrice = hasPromotion ? plan.discount_price! : plan.price;
    const features = Array.isArray(plan.features) ? plan.features.slice(0, 5) : [];

    return `### ${plan.name} - ${formatCurrency(displayPrice)}/mês${hasPromotion ? ` (de ${formatCurrency(plan.price)})` : ''}
${features.map(f => `- ${f}`).join('\n')}`;
  }).join('\n\n');

  return `## 💰 PLANOS ATUAIS (dados em tempo real)

${plansList}

**Use estes preços nos cálculos de comissão!**`;
}

function generateRecruitmentPrompt(approach: RecruitmentApproach, plans: Plan[], bonusTiers: BonusTier[]): string {
  let prompt = generateRecruitmentIdentitySection(approach);
  
  prompt += `

## 💼 O QUE É O MOSTRALO

**🔑 FRASE-CHAVE: "Venda uma vez, receba todo mês."**

Enquanto seu cliente usar o Mostralo, a comissão cai na sua conta. É renda recorrente de verdade - não uma comissão única que some.

O Mostralo é uma plataforma completa de **Delivery + Marketing Digital** para negócios locais.
Enquanto iFood e outros marketplaces cobram 12-27% de cada venda, o Mostralo cobra uma mensalidade fixa.

**Por que é fácil vender:**
- Comerciantes economizam MILHARES por mês vs iFood
- Marketing Digital incluído (o que custa R$ 2.000+ no mercado)
- Lojista mantém 100% dos clientes dele
- Sistema completo sem comissão por venda

## 📊 AFILIADO PF vs PARCEIRO PJ

| | AFILIADO (PF) | PARCEIRO PJ |
|--|--------------|-------------|
| Documento | CPF | CNPJ/MEI |
| Comissão | 5-7% | 10% |
| Limite mensal | R$ 1.900 | ILIMITADO |
| Bônus trimestral | ❌ Não | ✅ Sim |
| Ideal para | Iniciantes | Quem quer escalar |

**Recomendação:** Comece como PF para testar. Quando ver os resultados, abre MEI (é grátis!) e desbloqueia ganhos ilimitados + bônus.

`;

  prompt += generateRecruitmentPlansSection(plans);
  prompt += '\n\n';
  prompt += generateRecruitmentBonusSection(bonusTiers);
  
  prompt += `

## 🤝 NÃO PRECISA SER "NERD" DE COMPUTADOR

Seu trabalho é ABRIR A PORTA. Nós cuidamos do resto.

| Etapa | Seu Papel | Nossa Parte |
|-------|-----------|-------------|
| 1️⃣ Encontrar | Você encontra a loja | Te ensinamos onde e como prospectar |
| 2️⃣ Apresentar | Você mostra a solução | Te damos vídeo e material pronto |
| 3️⃣ Fechar | O cliente fecha | Nós cuidamos do suporte e treinamento |

**Zero técnico:** Instalação, configuração e treinamento do lojista são 100% por nossa conta.

## ❓ FAQ DO RECRUTAMENTO

1. "A comissão é só uma vez ou é recorrente?"
   → É RECORRENTE! Você vende uma vez e recebe todo mês enquanto o cliente continuar pagando.

2. "Preciso ter CNPJ para começar?"
   → Não! Comece como Afiliado PF usando apenas seu CPF.

3. "Quanto tempo leva para receber as comissões?"
   → Pagamentos são mensais, todo dia 5 do mês seguinte às vendas.

4. "Preciso ter experiência em vendas?"
   → Não! Oferecemos treinamento completo e material de marketing pronto.

5. "Qual o investimento inicial?"
   → ZERO! Não precisa pagar nada para participar.

## CONTATO

Link de cadastro: https://mostralo.com.br/seja-vendedor
WhatsApp: (61) 99555-0099`;

  return prompt;
}

// =====================================================
// PROMPT DE SUPORTE
// =====================================================

function getSupportPrompt(customPrompt?: string): string {
  if (customPrompt) {
    return customPrompt;
  }

  return `Você é um assistente de suporte da plataforma Mostralo.

SOBRE O MOSTRALO:
- Sistema completo de delivery e vendas online
- Para restaurantes, lojas, farmácias, açougues, etc.
- 0% de taxa por pedido
- WhatsApp Marketing integrado
- Relatórios com IA

FAQ COMUM:
1. "Como funciona o pagamento?" → Assinatura mensal, paga via PIX ou cartão
2. "Quanto custa?" → Planos a partir de R$ 197,90/mês
3. "Tem taxa por pedido?" → NÃO! 0% de taxa
4. "Posso testar?" → Sim, oferecemos período de teste gratuito
5. "Funciona no meu celular?" → Sim, é um sistema web/app
6. "Preciso de CNPJ?" → Pode ser PF ou PJ
7. "Como recebo os pedidos?" → WhatsApp, app ou painel web

ESTILO:
- Seja prestativo e paciente
- Responda de forma clara e objetiva
- Se não souber, encaminhe para suporte humano
- Use emojis moderadamente

CONTATO HUMANO:
WhatsApp: (61) 99555-0099
Email: suporte@mostralo.com.br`;
}

// Helper para extrair configuração de comportamento de um bot
function getBotBehaviorConfig(config: any, botType: string): BotBehaviorConfig {
  const prefix = `${botType}_bot_`;
  return {
    delay_message: config[`${prefix}delay_message`] ?? 1500,
    expire_minutes: config[`${prefix}expire_minutes`] ?? 60,
    keyword_finish: config[`${prefix}keyword_finish`] ?? '#sair',
    stop_from_me: config[`${prefix}stop_from_me`] ?? true,
    listening_from_me: config[`${prefix}listening_from_me`] ?? false,
    keep_open: config[`${prefix}keep_open`] ?? false,
    debounce_time: config[`${prefix}debounce_time`] ?? 3,
    split_messages: config[`${prefix}split_messages`] ?? true,
    time_per_char: config[`${prefix}time_per_char`] ?? 50,
    unknown_message: config[`${prefix}unknown_message`] ?? 'Desculpe, não entendi. Pode reformular?',
  };
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

    const { configId, botType } = await req.json();
    
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

    if (!evolutionConfig.openai_api_key) {
      throw new Error('Chave OpenAI não configurada na Evolution Config');
    }

    const evolutionUrl = evolutionConfig.api_url.replace(/\/$/, '');
    const openaiApiKey = evolutionConfig.openai_api_key;

    // ========================================
    // FUNÇÃO: Garantir credenciais OpenAI na Evolution
    // ========================================
    async function ensureOpenAiCreds(instanceName: string): Promise<string | null> {
      console.log('🔑 Verificando credenciais OpenAI para instância:', instanceName);

      // 1) Listar credenciais existentes (SOMENTE desta instância)
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

        console.log('📋 Credenciais encontradas:', existingCreds.length);
      } catch (e) {
        console.log('⚠️ Erro ao listar credenciais:', e);
      }

      // 2) Se temos ID salvo, ele precisa existir NESTA instância
      if (evolutionConfig.openai_creds_id) {
        const found = existingCreds.find((c) => c.id === evolutionConfig.openai_creds_id);
        if (found) {
          console.log('✅ Credencial salva é válida nesta instância:', evolutionConfig.openai_creds_id);
          return evolutionConfig.openai_creds_id;
        }

        console.log('⚠️ ID salvo não é válido nesta instância, limpando no banco...');
        await supabase
          .from('evolution_config')
          .update({ openai_creds_id: null, updated_at: new Date().toISOString() })
          .eq('id', evolutionConfig.id);
      }

      // 3) Reutilizar credencial "mostralo-openai" (se existir nesta instância)
      const mostraloCredential = existingCreds.find((c) => c.name === 'mostralo-openai');
      if (mostraloCredential?.id) {
        console.log('♻️ Reutilizando credencial existente:', mostraloCredential.id);

        await supabase
          .from('evolution_config')
          .update({ openai_creds_id: mostraloCredential.id, updated_at: new Date().toISOString() })
          .eq('id', evolutionConfig.id);

        return mostraloCredential.id;
      }

      // 4) Criar nova credencial nesta instância
      if (!openaiApiKey) {
        console.error('❌ openai_api_key ausente na evolution_config; não dá para criar credencial.');
        return null;
      }

      console.log('🆕 Criando nova credencial OpenAI na instância:', instanceName);

      try {
        const createResp = await fetch(`${evolutionUrl}/openai/creds/${instanceName}`, {
          method: 'POST',
          headers: {
            'apikey': evolutionConfig.api_key,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'mostralo-openai',
            apiKey: openaiApiKey,
          }),
        });

        const createText = await createResp.text();
        console.log('📥 Resposta criação credencial:', createResp.status, createText);

        if (!createResp.ok) {
          console.error('❌ Falha ao criar credencial:', createText);
          return null;
        }

        let createdId: string | null = null;
        try {
          const data = JSON.parse(createText);
          createdId = data?.id || data?.openaiCredsId || data?.creds?.id || null;
        } catch {
          createdId = null;
        }

        if (!createdId) {
          console.error('❌ ID da credencial não retornado pela Evolution:', createText);
          return null;
        }

        await supabase
          .from('evolution_config')
          .update({ openai_creds_id: createdId, updated_at: new Date().toISOString() })
          .eq('id', evolutionConfig.id);

        console.log('✅ Nova credencial criada:', createdId);
        return createdId;
      } catch (e) {
        console.error('❌ Erro ao criar credencial:', e);
        return null;
      }
    }

    // ========================================
    // FUNÇÃO: Buscar bots existentes na Evolution
    // ========================================
    async function findExistingBots(instanceName: string): Promise<any[]> {
      console.log('🔍 Consultando bots existentes para instância:', instanceName);
      
      try {
        const findResp = await fetch(`${evolutionUrl}/openai/find/${instanceName}`, {
          method: 'GET',
          headers: { 'apikey': evolutionConfig.api_key },
        });

        if (findResp.ok) {
          const data = await findResp.json();
          const bots = Array.isArray(data) ? data : (data?.bots || data?.data || []);
          console.log('📋 Bots encontrados:', bots.length);
          return bots;
        }
        
        console.log('⚠️ Falha ao buscar bots:', findResp.status);
        return [];
      } catch (e) {
        console.log('⚠️ Erro ao buscar bots:', e);
        return [];
      }
    }

    // ========================================
    // FUNÇÃO: Deletar bot existente na Evolution
    // ========================================
    async function deleteExistingBot(instanceName: string, botId: string): Promise<boolean> {
      try {
        console.log('🗑️ Deletando bot:', botId, 'da instância:', instanceName);
        const deleteResp = await fetch(`${evolutionUrl}/openai/delete/${botId}/${instanceName}`, {
          method: 'DELETE',
          headers: { 'apikey': evolutionConfig.api_key },
        });
        
        const deleteText = await deleteResp.text();
        console.log('📥 Resposta delete bot:', deleteResp.status, deleteText);
        
        return deleteResp.ok || deleteResp.status === 404;
      } catch (e) {
        console.log('⚠️ Erro ao deletar bot:', e);
        return false;
      }
    }


    // 🔥 BUSCAR DADOS REAIS DO BANCO
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

    const results: Record<string, { success: boolean; error?: string; botId?: string }> = {};

    // Sincronizar bots conforme solicitado
    const botsToSync = botType ? [botType] : ['sales', 'recruitment', 'support'];

    // 1. Garantir credenciais OpenAI ANTES de qualquer criação de bot
    const openaiCredsId = await ensureOpenAiCreds(config.instance_name);
    if (!openaiCredsId) {
      throw new Error('Não foi possível obter/criar credenciais OpenAI na Evolution');
    }
    console.log('🔑 Usando openaiCredsId:', openaiCredsId);

    // 2. Buscar e deletar TODOS os bots existentes para recriar com configurações atualizadas
    // 🔥 NOTA: Removido ensureOpenAiSettings - openai-bot-sync NÃO usa isso e funciona!
    const existingBots = await findExistingBots(config.instance_name);
    if (existingBots.length > 0) {
      console.log(`🗑️ Removendo ${existingBots.length} bot(s) existente(s)...`);
      for (const bot of existingBots) {
        if (bot.id) {
          await deleteExistingBot(config.instance_name, bot.id);
        }
      }
    }

    for (const bt of botsToSync) {
      try {
        let prompt: string;
        let botName: string;
        let triggerKeywords: string[];
        let behaviorConfig: BotBehaviorConfig;

        switch (bt) {
          case 'sales':
            if (!config.sales_bot_enabled) {
              results[bt] = { success: true, error: 'Bot disabled' };
              continue;
            }
            // 🔥 USAR GERADOR COM DADOS REAIS
            prompt = generateSalesPrompt(config.sales_bot_approach, plansForPrompt);
            botName = 'Mostralo Vendas';
            triggerKeywords = config.sales_bot_keywords || [];
            behaviorConfig = getBotBehaviorConfig(config, 'sales');
            break;

          case 'recruitment':
            if (!config.recruitment_bot_enabled) {
              results[bt] = { success: true, error: 'Bot disabled' };
              continue;
            }
            // 🔥 USAR GERADOR COM DADOS REAIS
            prompt = generateRecruitmentPrompt(config.recruitment_bot_approach, plansForPrompt, bonusTiers);
            botName = 'Mostralo Recrutamento';
            triggerKeywords = config.recruitment_bot_keywords || [];
            behaviorConfig = getBotBehaviorConfig(config, 'recruitment');
            break;

          case 'support':
            if (!config.support_bot_enabled) {
              results[bt] = { success: true, error: 'Bot disabled' };
              continue;
            }
            prompt = getSupportPrompt(config.support_bot_custom_prompt);
            botName = 'Mostralo Suporte';
            triggerKeywords = config.support_bot_keywords || [];
            behaviorConfig = getBotBehaviorConfig(config, 'support');
            break;

          default:
            continue;
        }

        // 🔥 REPLICANDO EXATAMENTE O PAYLOAD DO openai-bot-sync QUE FUNCIONA!
        const createPayload = {
          enabled: true,
          openaiCredsId: openaiCredsId,
          botType: 'chatCompletion',
          model: evolutionConfig.openai_default_model || 'gpt-4o-mini',
          maxTokens: evolutionConfig.openai_max_tokens || 1000,
          systemMessages: [prompt],
          assistantMessages: [
            `Olá! 👋 Sou o ${botName}, assistente virtual da Mostralo. Como posso ajudar você hoje?`
          ],
          userMessages: ['Oi', 'Olá', 'Boa tarde', 'Boa noite', 'Bom dia'],
          // 🔥 IGUAL AO openai-bot-sync: triggerType 'all' e triggerValue vazio
          triggerType: 'all',
          triggerOperator: 'contains',
          triggerValue: '',
          // 🔥 NÃO ENVIAR description - openai-bot-sync não envia
          expire: behaviorConfig.expire_minutes || 20,
          keywordFinish: behaviorConfig.keyword_finish || '#SAIR',
          delayMessage: behaviorConfig.delay_message || 4000,
          unknownMessage: behaviorConfig.unknown_message || 'Desculpe, não entendi.',
          listeningFromMe: behaviorConfig.listening_from_me || false,
          stopBotFromMe: behaviorConfig.stop_from_me !== undefined ? behaviorConfig.stop_from_me : true,
          keepOpen: behaviorConfig.keep_open || false,
          debounceTime: behaviorConfig.debounce_time || 10,
          ignoreJids: [],
          splitMessages: behaviorConfig.split_messages !== undefined ? behaviorConfig.split_messages : true,
          timePerChar: behaviorConfig.time_per_char || 0,
        };

        console.log(`📤 Criando bot ${bt} com ${prompt.length} caracteres de prompt`);
        console.log(`⚙️ Payload:`, JSON.stringify(createPayload, null, 2));

        const createResponse = await fetch(
          `${evolutionUrl}/openai/create/${config.instance_name}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionConfig.api_key
            },
            body: JSON.stringify(createPayload)
          }
        );

        const createText = await createResponse.text();
        console.log(`📥 Resposta criação ${bt}:`, createResponse.status, createText);

        if (!createResponse.ok) {
          // Tentar recuperar de "already exists"
          if (createText.includes('already exists') || createText.includes('already')) {
            console.log(`⚠️ Bot ${bt} já existe, deletando e recriando...`);
            
            const botsAfter = await findExistingBots(config.instance_name);
            for (const bot of botsAfter) {
              if (bot.id) {
                await deleteExistingBot(config.instance_name, bot.id);
              }
            }
            
            // Retry
            const retryResponse = await fetch(
              `${evolutionUrl}/openai/create/${config.instance_name}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': evolutionConfig.api_key
                },
                body: JSON.stringify(createPayload)
              }
            );
            
            const retryText = await retryResponse.text();
            if (retryResponse.ok) {
              let retryData: any = {};
              try { retryData = JSON.parse(retryText); } catch { retryData = {}; }
              const retryBotId = retryData.id || retryData.openaiBot?.id || retryData.openai?.id || null;
              
              if (retryBotId) {
                const updateField = `${bt}_bot_evolution_id`;
                await supabase
                  .from('master_whatsapp_config')
                  .update({ [updateField]: retryBotId })
                  .eq('id', configId);
                
                results[bt] = { success: true, botId: retryBotId };
                console.log(`✅ Bot ${bt} recriado com ID: ${retryBotId}`);
                continue;
              }
            }
          }
          
          throw new Error(`Falha ao criar bot: ${createText}`);
        }

        let createData: any = {};
        try { createData = JSON.parse(createText); } catch { createData = {}; }

        // Atualizar ID do bot no banco
        const newBotId = createData.id || createData.openaiBot?.id || createData.openai?.id;
        const updateField = `${bt}_bot_evolution_id`;
        
        await supabase
          .from('master_whatsapp_config')
          .update({ [updateField]: newBotId })
          .eq('id', configId);

        results[bt] = { success: true, botId: newBotId };
        console.log(`✅ Bot ${bt} sincronizado com ID: ${newBotId}`);

      } catch (botError) {
        console.error(`❌ Erro no bot ${bt}:`, botError);
        results[bt] = { 
          success: false, 
          error: botError instanceof Error ? botError.message : 'Unknown error' 
        };
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
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
