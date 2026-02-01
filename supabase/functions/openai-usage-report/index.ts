import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface UsageLog {
  id: string;
  store_id: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  usage_type: string;
  model: string;
  estimated_cost_cents: number;
  message_type: string;
  created_at: string;
  stores?: { name: string; slug: string };
}

interface StoreSummary {
  store_id: string;
  store_name: string;
  store_slug: string | null;
  total_tokens: number;
  cost_usd: number;
  interactions: number;
  text_count: number;
  image_count: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token não fornecido' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se é Master Admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.user_type !== 'master_admin') {
      return new Response(
        JSON.stringify({ error: 'Acesso restrito a Master Admin' }), 
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parâmetros de filtro (do body JSON)
    const body = await req.json().catch(() => ({}));
    const period = parseInt(body.period || '30');
    const storeId = body.store_id || null;
    const usageType = body.usage_type || null; // 'text' | 'image' | null

    // Calcular data de início
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    // Query principal
    let query = supabase
      .from('openai_usage_logs')
      .select('*, stores(name, slug)')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    if (usageType) {
      query = query.eq('usage_type', usageType);
    }

    const { data: logs, error: logsError } = await query;

    if (logsError) {
      console.error('Erro ao buscar logs:', logsError);
      return new Response(
        JSON.stringify({ error: logsError.message }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calcular sumário
    const summary = {
      total_tokens: 0,
      total_cost_usd: 0,
      total_cost_brl: 0,
      text_tokens: 0,
      image_tokens: 0,
      text_cost_usd: 0,
      image_cost_usd: 0,
      text_count: 0,
      image_count: 0,
      average_tokens_per_interaction: 0
    };

    const byStore: Record<string, StoreSummary> = {};
    const dailyUsage: Record<string, { date: string; tokens: number; cost: number; count: number }> = {};

    for (const log of (logs as UsageLog[]) || []) {
      const tokens = log.total_tokens || (log.prompt_tokens + log.completion_tokens);
      const costUsd = (log.estimated_cost_cents || 0) / 100;

      summary.total_tokens += tokens;
      summary.total_cost_usd += costUsd;

      if (log.usage_type === 'image') {
        summary.image_tokens += tokens;
        summary.image_cost_usd += costUsd;
        summary.image_count += 1;
      } else {
        summary.text_tokens += tokens;
        summary.text_cost_usd += costUsd;
        summary.text_count += 1;
      }

      // Agrupar por loja
      const sid = log.store_id;
      if (!byStore[sid]) {
        byStore[sid] = {
          store_id: sid,
          store_name: log.stores?.name || 'Desconhecida',
          store_slug: log.stores?.slug || null,
          total_tokens: 0,
          cost_usd: 0,
          interactions: 0,
          text_count: 0,
          image_count: 0
        };
      }
      byStore[sid].total_tokens += tokens;
      byStore[sid].cost_usd += costUsd;
      byStore[sid].interactions += 1;
      if (log.usage_type === 'image') {
        byStore[sid].image_count += 1;
      } else {
        byStore[sid].text_count += 1;
      }

      // Agrupar por dia
      const dateKey = log.created_at.split('T')[0];
      if (!dailyUsage[dateKey]) {
        dailyUsage[dateKey] = { date: dateKey, tokens: 0, cost: 0, count: 0 };
      }
      dailyUsage[dateKey].tokens += tokens;
      dailyUsage[dateKey].cost += costUsd;
      dailyUsage[dateKey].count += 1;
    }

    // Calcular médias e conversão BRL
    const totalInteractions = summary.text_count + summary.image_count;
    summary.average_tokens_per_interaction = totalInteractions > 0 
      ? Math.round(summary.total_tokens / totalInteractions) 
      : 0;
    summary.total_cost_brl = summary.total_cost_usd * 5; // Câmbio aproximado

    // Ordenar lojas por custo (maior primeiro)
    const storeRanking = Object.values(byStore).sort((a, b) => b.cost_usd - a.cost_usd);

    // Ordenar uso diário por data
    const dailyChart = Object.values(dailyUsage).sort((a, b) => a.date.localeCompare(b.date));

    return new Response(
      JSON.stringify({
        summary,
        by_store: storeRanking,
        daily_chart: dailyChart,
        period_days: period,
        total_records: logs?.length || 0,
        generated_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no relatório:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
