import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DailyStats {
  leads: number;
  salespeople: number;
  newStores: number;
  revenue: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse period from request body
    let period: 'morning' | 'evening' = 'morning';
    try {
      const body = await req.json();
      period = body.period || 'morning';
    } catch {
      // Default to morning if no body
    }

    console.log(`📊 Gerando resumo diário - Período: ${period}`);

    // Fetch master WhatsApp config
    const { data: config, error: configError } = await supabase
      .from('master_whatsapp_config')
      .select('*')
      .limit(1)
      .single();

    if (configError || !config) {
      console.log('❌ Configuração master não encontrada');
      return new Response(
        JSON.stringify({ error: 'Master config not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if daily summary notifications are enabled
    if (!config.notify_daily_summary) {
      console.log('📵 Resumo diário desabilitado nas configurações');
      return new Response(
        JSON.stringify({ message: 'Daily summary disabled' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate phone number
    const phone = config.notification_phone;
    const countryCode = config.notification_country_code || '55';
    
    if (!phone) {
      console.log('❌ Número de telefone não configurado');
      return new Response(
        JSON.stringify({ error: 'Phone number not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate date ranges based on period
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let periodStart: Date;
    let periodEnd: Date;
    let periodLabel: string;

    if (period === 'morning') {
      // Morning: yesterday's stats
      periodStart = yesterdayStart;
      periodEnd = todayStart;
      periodLabel = 'ontem';
    } else {
      // Evening: today's stats
      periodStart = todayStart;
      periodEnd = now;
      periodLabel = 'hoje';
    }

    // Fetch statistics
    const [leadsResult, sellersResult, storesResult, revenueResult, monthlyRevenueResult] = await Promise.all([
      // Leads count
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', periodStart.toISOString())
        .lt('created_at', periodEnd.toISOString()),
      
      // New salespeople count
      supabase
        .from('salespeople')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', periodStart.toISOString())
        .lt('created_at', periodEnd.toISOString()),
      
      // New subscriptions (approved payments in period)
      supabase
        .from('payment_approvals')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved')
        .gte('approved_at', periodStart.toISOString())
        .lt('approved_at', periodEnd.toISOString()),
      
      // Revenue from approved payments in period
      supabase
        .from('payment_approvals')
        .select('payment_amount')
        .eq('status', 'approved')
        .gte('approved_at', periodStart.toISOString())
        .lt('approved_at', periodEnd.toISOString()),
      
      // Monthly accumulated revenue
      supabase
        .from('payment_approvals')
        .select('payment_amount')
        .eq('status', 'approved')
        .gte('approved_at', monthStart.toISOString())
    ]);

    const periodStats: DailyStats = {
      leads: leadsResult.count || 0,
      salespeople: sellersResult.count || 0,
      newStores: storesResult.count || 0,
      revenue: (revenueResult.data || []).reduce((sum, p) => sum + (p.payment_amount || 0), 0)
    };

    const monthlyRevenue = (monthlyRevenueResult.data || []).reduce((sum, p) => sum + (p.payment_amount || 0), 0);

    console.log(`📈 Estatísticas do período:`, periodStats);
    console.log(`💰 Receita mensal acumulada: R$ ${monthlyRevenue}`);

    // Format message based on period
    const formatCurrency = (value: number) => 
      value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    let message: string;

    if (period === 'morning') {
      message = `☀️ *Bom dia! Resumo de ${periodLabel}:*

📊 *Estatísticas do dia anterior:*
• 🎯 Novos leads: ${periodStats.leads}
• 👥 Novos vendedores: ${periodStats.salespeople}
• 🏪 Novas assinaturas: ${periodStats.newStores}
• 💰 Receita: ${formatCurrency(periodStats.revenue)}

📈 *Acumulado do mês:*
• 💵 Receita total: ${formatCurrency(monthlyRevenue)}

Tenha um ótimo dia de trabalho! 🚀`;
    } else {
      message = `🌙 *Boa noite! Resumo de ${periodLabel}:*

📊 *Estatísticas do dia:*
• 🎯 Novos leads: ${periodStats.leads}
• 👥 Novos vendedores: ${periodStats.salespeople}
• 🏪 Novas assinaturas: ${periodStats.newStores}
• 💰 Receita: ${formatCurrency(periodStats.revenue)}

📈 *Acumulado do mês:*
• 💵 Receita total: ${formatCurrency(monthlyRevenue)}

${periodStats.leads > 0 || periodStats.newStores > 0 ? '✨ Excelente progresso hoje!' : 'Amanhã será melhor! 💪'}

Descanse bem! 😴`;
    }

    // Fetch Evolution API config
    const { data: evolutionConfig, error: evoError } = await supabase
      .from('evolution_config')
      .select('api_url, api_key')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (evoError || !evolutionConfig) {
      console.log('❌ Evolution API não configurada');
      return new Response(
        JSON.stringify({ error: 'Evolution API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send message via Evolution API
    const instanceName = config.instance_name || 'mostralo-master';
    const formattedPhone = `${countryCode}${phone.replace(/\D/g, '')}`;

    const sendUrl = `${evolutionConfig.api_url}/message/sendText/${instanceName}`;
    
    console.log(`📤 Enviando resumo para ${formattedPhone}`);

    const sendResponse = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionConfig.api_key
      },
      body: JSON.stringify({
        number: formattedPhone,
        text: message
      })
    });

    const sendResult = await sendResponse.json();

    if (!sendResponse.ok) {
      console.error('❌ Erro ao enviar mensagem:', sendResult);
      return new Response(
        JSON.stringify({ error: 'Failed to send message', details: sendResult }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Resumo diário enviado com sucesso!`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        period,
        stats: periodStats,
        monthlyRevenue
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro no send-daily-summary:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
