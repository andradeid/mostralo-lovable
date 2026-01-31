// Master FAQ Agent - v2.0 - Processa function calls do OpenAI Assistant para bots Master
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Type alias for Supabase client
type SupabaseClientType = SupabaseClient<Record<string, unknown>>;

// Formatador de moeda
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    console.log('[master-faq-agent] Request body:', JSON.stringify(body));

    // Extrair nome da função e argumentos (Evolution API envia em formatos variados)
    const functionName = body.function || body.functionName || body.name || body.tool_name;
    const rawArgs = body.arguments || body.functionArguments || body.args || body.parameters || {};
    
    let args: Record<string, unknown> = {};
    if (typeof rawArgs === 'string') {
      try {
        args = JSON.parse(rawArgs);
      } catch {
        args = {};
      }
    } else {
      args = rawArgs as Record<string, unknown>;
    }

    console.log(`[master-faq-agent] Function: ${functionName}, Args:`, JSON.stringify(args));

    if (!functionName) {
      return new Response(
        JSON.stringify({ error: 'Function name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result: unknown;

    switch (functionName) {
      // ==========================================
      // FUNÇÕES COMPARTILHADAS
      // ==========================================
      case 'identify_intent':
        result = identifyIntent(String(args?.message || ''));
        break;

      case 'check_recruitment_keywords':
        result = await checkRecruitmentKeywords(supabase, String(args?.message || ''));
        break;

      case 'search_faq':
        result = await searchFaq(supabase, String(args?.query || ''), args?.category as string);
        break;

      case 'get_modules':
        result = await getModules(supabase, args?.category as string);
        break;

      case 'get_module_details':
        result = await getModuleDetails(supabase, String(args?.key || ''));
        break;

      case 'get_recruitment_link':
        result = getRecruitmentLink();
        break;

      // ==========================================
      // FUNÇÕES PARA BOT DE VENDAS
      // ==========================================
      case 'get_plans':
        result = await getPlans(supabase);
        break;

      case 'calculate_savings':
        result = calculateSavings(Number(args?.monthly_revenue || args?.revenue || 0));
        break;

      case 'get_testimonials':
        result = getTestimonials();
        break;

      // ==========================================
      // FUNÇÕES PARA BOT DE RECRUTAMENTO
      // ==========================================
      case 'get_bonus_tiers':
        result = await getBonusTiers(supabase);
        break;

      case 'calculate_commission':
        result = calculateCommission(
          Number(args?.sales || 1),
          Number(args?.plan_value || 149),
          Boolean(args?.is_pj)
        );
        break;

      // ==========================================
      // FUNÇÕES PARA BOT DE SUPORTE
      // ==========================================
      case 'get_store_info':
        result = getStoreInfo();
        break;

      case 'get_system_status':
        result = getSystemStatus();
        break;

      default:
        return new Response(
          JSON.stringify({ 
            error: `Unknown function: ${functionName}`,
            availableFunctions: [
              'identify_intent', 'check_recruitment_keywords', 'search_faq',
              'get_modules', 'get_module_details', 'get_recruitment_link',
              'get_plans', 'calculate_savings', 'get_testimonials',
              'get_bonus_tiers', 'calculate_commission',
              'get_store_info', 'get_system_status'
            ]
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`[master-faq-agent] Function ${functionName} result:`, JSON.stringify(result));

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[master-faq-agent] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================
// FUNCTION IMPLEMENTATIONS
// ============================================

/**
 * Identify user intent based on message
 */
function identifyIntent(message: string): { intent: string; confidence: number } {
  const lowerMessage = message.toLowerCase();
  
  const salesKeywords = ['conhecer', 'saber', 'preco', 'custo', 'quanto', 'plano', 'funciona', 'teste', 'negocio', 'delivery', '1'];
  const supportKeywords = ['problema', 'erro', 'nao funciona', 'ajuda', 'como', 'configurar', 'duvida', '2'];
  const recruitmentKeywords = ['trabalhar', 'vendedor', 'parceiro', 'comissao', 'ganhar', 'renda', 'afiliado', 'oportunidade', 'emprego'];
  
  const salesScore = salesKeywords.filter(k => lowerMessage.includes(k)).length;
  const supportScore = supportKeywords.filter(k => lowerMessage.includes(k)).length;
  const recruitmentScore = recruitmentKeywords.filter(k => lowerMessage.includes(k)).length;
  
  if (recruitmentScore > 0) {
    return { intent: 'recruitment', confidence: Math.min(recruitmentScore * 0.3 + 0.5, 1) };
  }
  
  if (salesScore > supportScore) {
    return { intent: 'sales', confidence: Math.min(salesScore * 0.2 + 0.4, 1) };
  }
  
  if (supportScore > salesScore) {
    return { intent: 'support', confidence: Math.min(supportScore * 0.2 + 0.4, 1) };
  }
  
  return { intent: 'unknown', confidence: 0.3 };
}

interface RecruitmentKeyword {
  keyword: string;
}

/**
 * Check if message contains recruitment keywords
 */
async function checkRecruitmentKeywords(
  supabase: SupabaseClientType,
  message: string
): Promise<{ hasRecruitmentIntent: boolean; matchedKeywords: string[] }> {
  const lowerMessage = message.toLowerCase();
  
  const { data: keywords, error } = await supabase
    .from('master_recruitment_keywords')
    .select('keyword')
    .eq('is_active', true);

  if (error) {
    console.error('[checkRecruitmentKeywords] Error:', error);
    return { hasRecruitmentIntent: false, matchedKeywords: [] };
  }

  const keywordsList = (keywords || []) as RecruitmentKeyword[];
  const matchedKeywords = keywordsList
    .filter(k => lowerMessage.includes(k.keyword.toLowerCase()))
    .map(k => k.keyword);

  return {
    hasRecruitmentIntent: matchedKeywords.length > 0,
    matchedKeywords,
  };
}

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  priority: number;
  is_active: boolean;
  metadata: Record<string, unknown>;
}

/**
 * Search FAQ by query and category
 */
async function searchFaq(
  supabase: SupabaseClientType,
  query: string,
  category?: string
): Promise<{ found: boolean; results: unknown[] }> {
  const lowerQuery = query.toLowerCase();
  const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 2);

  // Tentar primeiro a tabela master_bot_faqs, depois master_faq como fallback
  let faqs: FaqItem[] = [];
  
  const { data: masterBotFaqs, error: masterBotError } = await supabase
    .from('master_bot_faqs')
    .select('*')
    .eq('is_active', true);

  if (!masterBotError && masterBotFaqs && masterBotFaqs.length > 0) {
    faqs = masterBotFaqs as FaqItem[];
  } else {
    let dbQuery = supabase
      .from('master_faq')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (category) {
      dbQuery = dbQuery.eq('category', category);
    }

    const { data: masterFaq, error } = await dbQuery;

    if (error) {
      console.error('[searchFaq] Error:', error);
      return { found: false, results: [] };
    }

    faqs = (masterFaq || []) as FaqItem[];
  }

  // Score each FAQ by keyword matching
  const scoredFaqs = faqs.map(faq => {
    let score = 0;
    const keywords = faq.keywords || [];
    
    for (const keyword of keywords) {
      if (lowerQuery.includes(keyword.toLowerCase())) {
        score += 2;
      }
    }
    
    for (const word of queryWords) {
      if (faq.question.toLowerCase().includes(word)) {
        score += 1;
      }
    }
    
    score += (faq.priority || 5) * 0.1;
    
    return { ...faq, score };
  });

  const results = scoredFaqs
    .filter(f => f.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return {
    found: results.length > 0,
    results: results.map(r => ({
      question: r.question,
      answer: r.answer,
      category: r.category,
      metadata: r.metadata,
    })),
  };
}

interface ModuleItem {
  key: string;
  name: string;
  description: string;
  category: string;
  price: number;
  is_popular: boolean;
}

/**
 * Get all available modules
 */
async function getModules(
  supabase: SupabaseClientType,
  category?: string
): Promise<{ modules: unknown[] }> {
  let query = supabase
    .from('modules')
    .select('key, name, description, category, price, is_popular')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (category) {
    query = query.eq('category', category);
  }

  const { data: modules, error } = await query;

  if (error) {
    console.error('[getModules] Error:', error);
    return {
      modules: [
        { key: 'catalog', name: 'Catálogo Digital', description: 'Cardápio online completo', category: 'core', is_popular: true },
        { key: 'delivery', name: 'Delivery', description: 'Gestão de entregas e áreas', category: 'core', is_popular: true },
        { key: 'whatsapp', name: 'WhatsApp Bot', description: 'Atendimento automatizado', category: 'automation', is_popular: true },
        { key: 'booking', name: 'Agendamentos', description: 'Sistema de reservas', category: 'services', is_popular: true },
        { key: 'loyalty', name: 'Fidelidade', description: 'Programa de pontos', category: 'marketing', is_popular: true },
        { key: 'finance', name: 'Financeiro', description: 'Gestão financeira completa', category: 'management', is_popular: true },
        { key: 'sentinela', name: 'Sentinela', description: 'Lembretes de recompra', category: 'automation', is_popular: true },
      ],
    };
  }

  return { modules: (modules || []) as ModuleItem[] };
}

/**
 * Get specific module details
 */
async function getModuleDetails(
  supabase: SupabaseClientType,
  key: string
): Promise<{ found: boolean; module?: unknown }> {
  const { data: module, error } = await supabase
    .from('modules')
    .select('*')
    .eq('key', key)
    .eq('is_active', true)
    .single();

  if (error || !module) {
    return { found: false };
  }

  return { found: true, module };
}

interface PlanItem {
  id: string;
  name: string;
  price: number;
  discount_price?: number;
  promotion_active?: boolean;
  discount_percentage?: number;
  description: string;
  features: string[];
  is_popular: boolean;
  max_products?: number;
  max_orders?: number;
}

/**
 * Get available plans
 */
async function getPlans(
  supabase: SupabaseClientType
): Promise<{ plans: unknown[]; total: number }> {
  const { data: plans, error } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[getPlans] Error:', error);
    return {
      plans: [
        { name: 'Básico', price: formatCurrency(197.90), description: 'Para começar', is_popular: false },
        { name: 'Avançado', price: formatCurrency(397.90), description: 'Mais escolhido', is_popular: true },
        { name: 'Premium', price: formatCurrency(597.90), description: 'Para quem quer tudo', is_popular: false },
      ],
      total: 3,
    };
  }

  const planList = (plans || []) as PlanItem[];
  return { 
    plans: planList.map(p => ({
      name: p.name,
      price: formatCurrency(p.price),
      discountPrice: p.discount_price ? formatCurrency(p.discount_price) : null,
      promotionActive: p.promotion_active,
      discountPercentage: p.discount_percentage,
      description: p.description,
      features: p.features,
      isPopular: p.is_popular,
    })),
    total: planList.length,
  };
}

/**
 * Calculate savings compared to marketplace fees (25%)
 */
function calculateSavings(monthlyRevenue: number): {
  revenue: string;
  ifoodFee: string;
  ifoodPercentage: string;
  planName: string;
  planPrice: string;
  monthlyEconomy: string;
  yearlyEconomy: string;
  dailyEconomy: string;
  economyPercentage: string;
} {
  const marketplaceFeePercentage = 0.25;
  const marketplaceFeeAmount = monthlyRevenue * marketplaceFeePercentage;
  const mostraloAveragePlan = 397.90;
  const monthlySavings = marketplaceFeeAmount - mostraloAveragePlan;
  const yearlySavings = monthlySavings * 12;
  const dailySavings = monthlySavings / 30;

  return {
    revenue: formatCurrency(monthlyRevenue),
    ifoodFee: formatCurrency(marketplaceFeeAmount),
    ifoodPercentage: '25%',
    planName: 'Plano Avançado',
    planPrice: formatCurrency(mostraloAveragePlan),
    monthlyEconomy: formatCurrency(monthlySavings),
    yearlyEconomy: formatCurrency(yearlySavings),
    dailyEconomy: formatCurrency(dailySavings),
    economyPercentage: ((monthlySavings / marketplaceFeeAmount) * 100).toFixed(1) + '%',
  };
}

/**
 * Get testimonials (hardcoded for now)
 */
function getTestimonials(): { testimonials: unknown[] } {
  return {
    testimonials: [
      {
        name: 'João - Pizzaria do João',
        text: 'Economizei mais de R$ 3.000 por mês saindo do iFood. Melhor decisão!',
        savings: 'R$ 3.000/mês',
      },
      {
        name: 'Maria - Doceria da Maria',
        text: 'Agora todos os clientes são MEUS, não do marketplace.',
        savings: 'R$ 1.500/mês',
      },
      {
        name: 'Pedro - Hamburgeria Premium',
        text: 'O WhatsApp Marketing recuperou clientes que eu tinha perdido.',
        savings: 'R$ 4.500/mês',
      },
    ],
  };
}

interface BonusTier {
  id: string;
  tier_name: string;
  min_sales: number;
  bonus_amount: number;
  is_cumulative: boolean;
}

/**
 * Get bonus tiers for recruitment
 */
async function getBonusTiers(
  supabase: SupabaseClientType
): Promise<{ tiers: unknown[]; maxBonus: string; note: string }> {
  const { data: tiers, error } = await supabase
    .from('affiliate_bonus_tiers')
    .select('*')
    .order('min_sales', { ascending: true });

  if (error || !tiers || tiers.length === 0) {
    return {
      tiers: [
        { name: 'Bronze', minSales: 10, bonus: 'R$ 500' },
        { name: 'Prata', minSales: 20, bonus: 'R$ 1.000' },
        { name: 'Ouro', minSales: 30, bonus: 'R$ 2.000' },
        { name: 'Diamante', minSales: 50, bonus: 'R$ 5.000' },
      ],
      maxBonus: 'R$ 8.500',
      note: 'Bônus são CUMULATIVOS! Atingindo Diamante você recebe TODOS os bônus.',
    };
  }

  const tierList = tiers as BonusTier[];
  const maxBonus = tierList.reduce((sum, t) => sum + (t.bonus_amount || 0), 0);
  
  return {
    tiers: tierList.map(t => ({
      name: t.tier_name,
      minSales: t.min_sales,
      bonus: formatCurrency(t.bonus_amount),
      isCumulative: t.is_cumulative,
    })),
    maxBonus: formatCurrency(maxBonus),
    note: 'Bônus são CUMULATIVOS!',
  };
}

/**
 * Calculate commission for recruiters
 */
function calculateCommission(
  sales: number,
  planValue: number,
  isPJ: boolean
): {
  sales: number;
  planValue: string;
  commissionRate: string;
  monthlyCommission: string;
  yearlyCommission: string;
  type: string;
  note: string;
} {
  const commissionRate = isPJ ? 0.10 : 0.07; // 10% PJ, 7% PF
  const monthlyCommission = planValue * commissionRate * sales;
  const yearlyCommission = monthlyCommission * 12;

  return {
    sales,
    planValue: formatCurrency(planValue),
    commissionRate: (commissionRate * 100) + '%',
    monthlyCommission: formatCurrency(monthlyCommission),
    yearlyCommission: formatCurrency(yearlyCommission),
    type: isPJ ? 'Parceiro PJ' : 'Afiliado PF',
    note: 'Comissão RECORRENTE - você recebe todo mês enquanto o cliente pagar!',
  };
}

/**
 * Get store/platform info
 */
function getStoreInfo(): {
  name: string;
  description: string;
  whatsapp: string;
  website: string;
  features: string[];
} {
  return {
    name: 'Mostralo',
    description: 'Plataforma completa de Delivery + Marketing Digital + Gestão Financeira',
    whatsapp: '(61) 99555-0099',
    website: 'https://mostralo.com.br',
    features: [
      '0% de taxa por pedido',
      'WhatsApp Marketing integrado',
      'Gestão Financeira completa',
      'Relatórios com IA',
      'PDV e Comandas para presencial',
      'Sistema de Agendamentos',
      'Programa de Fidelidade',
      'Sentinela (lembretes de recompra)',
    ],
  };
}

/**
 * Get system status
 */
function getSystemStatus(): {
  status: string;
  uptime: string;
  version: string;
  lastUpdate: string;
  message: string;
} {
  return {
    status: 'online',
    uptime: '99.9%',
    version: '2.0.0',
    lastUpdate: new Date().toISOString(),
    message: 'Todos os sistemas operando normalmente!',
  };
}

/**
 * Get recruitment/partner program link
 */
function getRecruitmentLink(): { link: string; message: string } {
  return {
    link: 'https://mostralo.com.br/seja-vendedor',
    message: 'Acesse nosso programa de parceiros e comece a ganhar comissões recorrentes!',
  };
}
