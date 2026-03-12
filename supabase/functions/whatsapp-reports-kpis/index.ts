import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar autenticação
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { store_id, date_from, date_to } = await req.json();
    if (!store_id || !date_from || !date_to) {
      return new Response(JSON.stringify({ error: 'Parâmetros obrigatórios: store_id, date_from, date_to' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Total de conversas no período
    const { count: totalConversations } = await supabase
      .from('whatsapp_conversation_cycles')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', store_id)
      .gte('opened_at', date_from)
      .lte('opened_at', date_to);

    // 2. Mensagens com campos extras (message_source, message_type, metadata)
    const { data: messages } = await supabase
      .from('whatsapp_chat_messages')
      .select('is_from_bot, direction, content, message_source, message_type, metadata')
      .eq('store_id', store_id)
      .gte('timestamp', date_from)
      .lte('timestamp', date_to);

    const totalMessages = messages?.length || 0;
    const botMessages = messages?.filter(m => m.is_from_bot && m.direction === 'out').length || 0;
    const humanMessages = messages?.filter(m => !m.is_from_bot && m.direction === 'out').length || 0;
    const incomingMessages = messages?.filter(m => m.direction === 'in').length || 0;

    // Métricas de origem (apenas mensagens enviadas/out)
    const outMessages = messages?.filter(m => m.direction === 'out') || [];
    const cellphoneMessages = outMessages.filter(m => m.message_source === 'cellphone').length;
    const systemMessages = outMessages.filter(m => m.message_source === 'system' && !m.is_from_bot).length;
    const totalOutMessages = outMessages.length;
    const panelAdoptionRate = totalOutMessages > 0
      ? Math.round(((systemMessages + botMessages) / totalOutMessages) * 100)
      : 0;

    // Métricas de cobranças PIX
    const pixPayments = messages?.filter(m => m.message_type === 'payment_request') || [];
    const pixPaymentsCount = pixPayments.length;
    let pixTotalAmount = 0;
    pixPayments.forEach(m => {
      try {
        const meta = typeof m.metadata === 'string' ? JSON.parse(m.metadata) : m.metadata;
        if (meta?.amount) pixTotalAmount += Number(meta.amount);
      } catch {}
    });
    const pixAvgAmount = pixPaymentsCount > 0 ? pixTotalAmount / pixPaymentsCount : 0;

    // 3. Tempo médio de atendimento (ciclos completos)
    const { data: cycles } = await supabase
      .from('whatsapp_conversation_cycles')
      .select('opened_at, closed_at')
      .eq('store_id', store_id)
      .gte('opened_at', date_from)
      .lte('opened_at', date_to)
      .not('closed_at', 'is', null);

    let avgDurationMinutes = 0;
    if (cycles && cycles.length > 0) {
      const totalMinutes = cycles.reduce((sum, c) => {
        const diff = new Date(c.closed_at).getTime() - new Date(c.opened_at).getTime();
        return sum + (diff / 60000);
      }, 0);
      avgDurationMinutes = Math.round(totalMinutes / cycles.length);
    }

    // 4. Taxa de autonomia da IA
    const { count: totalConvs } = await supabase
      .from('whatsapp_conversation_cycles')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', store_id)
      .gte('opened_at', date_from)
      .lte('opened_at', date_to);

    const { count: pausedConvs } = await supabase
      .from('whatsapp_paused_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', store_id)
      .gte('paused_at', date_from)
      .lte('paused_at', date_to);

    const autonomyRate = totalConvs && totalConvs > 0
      ? Math.round(((totalConvs - (pausedConvs || 0)) / totalConvs) * 100)
      : 0;

    // 5. Faturamento WhatsApp (pedidos com source = 'whatsapp_chat')
    const { data: whatsappOrders } = await supabase
      .from('orders')
      .select('total, status')
      .eq('store_id', store_id)
      .eq('source', 'whatsapp_chat')
      .gte('created_at', date_from)
      .lte('created_at', date_to);

    const whatsappRevenue = whatsappOrders
      ?.filter(o => o.status !== 'cancelado')
      .reduce((sum, o) => sum + (o.total || 0), 0) || 0;

    const whatsappOrdersCount = whatsappOrders?.length || 0;

    return new Response(JSON.stringify({
      totalConversations: totalConversations || 0,
      totalMessages,
      botMessages,
      humanMessages,
      incomingMessages,
      avgDurationMinutes,
      autonomyRate,
      whatsappRevenue,
      whatsappOrdersCount,
      completedCycles: cycles?.length || 0,
      // Novas métricas de origem
      cellphoneMessages,
      systemMessages,
      panelAdoptionRate,
      // Novas métricas de cobranças PIX
      pixPaymentsCount,
      pixTotalAmount,
      pixAvgAmount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in whatsapp-reports-kpis:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
