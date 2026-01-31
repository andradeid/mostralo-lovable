import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Type alias for Supabase client
type SupabaseClientType = SupabaseClient<Record<string, unknown>>;

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

    // Extract function name and arguments from OpenAI Assistant tool call
    const { function: functionName, arguments: args } = body;

    if (!functionName) {
      return new Response(
        JSON.stringify({ error: 'Function name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result: unknown;

    switch (functionName) {
      case 'identify_intent':
        result = await identifyIntent(args?.message || '');
        break;

      case 'check_recruitment_keywords':
        result = await checkRecruitmentKeywords(supabase, args?.message || '');
        break;

      case 'search_faq':
        result = await searchFaq(supabase, args?.query || '', args?.category);
        break;

      case 'get_modules':
        result = await getModules(supabase, args?.category);
        break;

      case 'get_module_details':
        result = await getModuleDetails(supabase, args?.key || '');
        break;

      case 'get_plans':
        result = await getPlans(supabase);
        break;

      case 'calculate_savings':
        result = calculateSavings(args?.monthly_revenue || 0);
        break;

      case 'get_recruitment_link':
        result = getRecruitmentLink();
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown function: ${functionName}` }),
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
  
  // Sales indicators
  const salesKeywords = ['conhecer', 'saber', 'preco', 'custo', 'quanto', 'plano', 'funciona', 'teste', 'negocio', 'delivery', '1'];
  // Support indicators
  const supportKeywords = ['problema', 'erro', 'nao funciona', 'ajuda', 'como', 'configurar', 'duvida', '2'];
  // Recruitment indicators (hidden)
  const recruitmentKeywords = ['trabalhar', 'vendedor', 'parceiro', 'comissao', 'ganhar', 'renda', 'afiliado', 'oportunidade', 'emprego'];
  
  const salesScore = salesKeywords.filter(k => lowerMessage.includes(k)).length;
  const supportScore = supportKeywords.filter(k => lowerMessage.includes(k)).length;
  const recruitmentScore = recruitmentKeywords.filter(k => lowerMessage.includes(k)).length;
  
  // Recruitment has priority if detected
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

  let dbQuery = supabase
    .from('master_faq')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false });

  if (category) {
    dbQuery = dbQuery.eq('category', category);
  }

  const { data: faqs, error } = await dbQuery;

  if (error) {
    console.error('[searchFaq] Error:', error);
    return { found: false, results: [] };
  }

  const faqList = (faqs || []) as FaqItem[];

  // Score each FAQ by keyword matching
  const scoredFaqs = faqList.map(faq => {
    let score = 0;
    const keywords = faq.keywords || [];
    
    // Check keywords array
    for (const keyword of keywords) {
      if (lowerQuery.includes(keyword.toLowerCase())) {
        score += 2;
      }
    }
    
    // Check question text
    for (const word of queryWords) {
      if (faq.question.toLowerCase().includes(word)) {
        score += 1;
      }
    }
    
    // Priority boost
    score += (faq.priority || 5) * 0.1;
    
    return { ...faq, score };
  });

  // Filter and sort by score
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
    // Return hardcoded popular modules as fallback
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
  description: string;
  features: string[];
  is_popular: boolean;
  max_products: number;
  max_orders: number;
}

/**
 * Get available plans
 */
async function getPlans(
  supabase: SupabaseClientType
): Promise<{ plans: unknown[] }> {
  const { data: plans, error } = await supabase
    .from('plans')
    .select('id, name, price, description, features, is_popular, max_products, max_orders')
    .eq('is_active', true)
    .order('price', { ascending: true });

  if (error) {
    console.error('[getPlans] Error:', error);
    // Return hardcoded plans as fallback
    return {
      plans: [
        { name: 'Básico', price: 197.90, description: 'Para começar', is_popular: false },
        { name: 'Avançado', price: 397.90, description: 'Mais escolhido', is_popular: true },
        { name: 'Premium', price: 597.90, description: 'Para quem quer tudo', is_popular: false },
      ],
    };
  }

  return { plans: (plans || []) as PlanItem[] };
}

/**
 * Calculate savings compared to marketplace fees (25%)
 */
function calculateSavings(monthlyRevenue: number): {
  monthly_revenue: number;
  marketplace_fee_percentage: number;
  marketplace_fee_amount: number;
  mostralo_average_plan: number;
  monthly_savings: number;
  yearly_savings: number;
  savings_percentage: number;
} {
  const marketplaceFeePercentage = 0.25; // 25%
  const marketplaceFeeAmount = monthlyRevenue * marketplaceFeePercentage;
  const mostraloAveragePlan = 397.90; // Plano Avançado
  const monthlySavings = marketplaceFeeAmount - mostraloAveragePlan;
  const yearlySavings = monthlySavings * 12;
  const savingsPercentage = monthlyRevenue > 0 
    ? ((marketplaceFeeAmount - mostraloAveragePlan) / marketplaceFeeAmount) * 100 
    : 0;

  return {
    monthly_revenue: monthlyRevenue,
    marketplace_fee_percentage: marketplaceFeePercentage * 100,
    marketplace_fee_amount: Math.round(marketplaceFeeAmount * 100) / 100,
    mostralo_average_plan: mostraloAveragePlan,
    monthly_savings: Math.round(monthlySavings * 100) / 100,
    yearly_savings: Math.round(yearlySavings * 100) / 100,
    savings_percentage: Math.round(savingsPercentage * 10) / 10,
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
