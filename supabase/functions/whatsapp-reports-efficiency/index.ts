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
      return new Response(JSON.stringify({ error: 'Parâmetros obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Taxa de autonomia por horário
    const { data: cycles } = await supabase
      .from('whatsapp_conversation_cycles')
      .select('opened_at')
      .eq('store_id', store_id)
      .gte('opened_at', date_from)
      .lte('opened_at', date_to);

    const { data: pauses } = await supabase
      .from('whatsapp_paused_contacts')
      .select('paused_at')
      .eq('store_id', store_id)
      .gte('paused_at', date_from)
      .lte('paused_at', date_to);

    // Autonomia por hora do dia (0-23)
    const hourlyTotal: number[] = new Array(24).fill(0);
    const hourlyPaused: number[] = new Array(24).fill(0);

    cycles?.forEach(c => {
      const hour = new Date(c.opened_at).getHours();
      hourlyTotal[hour]++;
    });

    pauses?.forEach(p => {
      const hour = new Date(p.paused_at).getHours();
      hourlyPaused[hour]++;
    });

    const autonomyByHour = hourlyTotal.map((total, hour) => ({
      hour: `${String(hour).padStart(2, '0')}:00`,
      total,
      paused: hourlyPaused[hour],
      autonomous: total - hourlyPaused[hour],
      rate: total > 0 ? Math.round(((total - hourlyPaused[hour]) / total) * 100) : 0,
    }));

    // 2. SLA de resposta (IA vs humano por faixa)
    const { data: allMessages } = await supabase
      .from('whatsapp_chat_messages')
      .select('direction, is_from_bot, timestamp, remote_jid')
      .eq('store_id', store_id)
      .gte('timestamp', date_from)
      .lte('timestamp', date_to)
      .order('timestamp', { ascending: true });

    const slaData = { bot: { under30s: 0, under1m: 0, under5m: 0, over5m: 0 }, human: { under30s: 0, under1m: 0, under5m: 0, over5m: 0 } };

    if (allMessages && allMessages.length > 1) {
      const byContact = new Map<string, typeof allMessages>();
      allMessages.forEach(m => {
        const list = byContact.get(m.remote_jid) || [];
        list.push(m);
        byContact.set(m.remote_jid, list);
      });

      byContact.forEach(msgs => {
        for (let i = 1; i < msgs.length; i++) {
          if (msgs[i - 1].direction === 'in' && msgs[i].direction === 'out') {
            const diffSec = (new Date(msgs[i].timestamp).getTime() - new Date(msgs[i - 1].timestamp).getTime()) / 1000;
            if (diffSec <= 0 || diffSec > 3600) continue;
            const target = msgs[i].is_from_bot ? slaData.bot : slaData.human;
            if (diffSec <= 30) target.under30s++;
            else if (diffSec <= 60) target.under1m++;
            else if (diffSec <= 300) target.under5m++;
            else target.over5m++;
          }
        }
      });
    }

    // 3. Taxa de conversão (conversas com pedido vs total)
    const totalCycles = cycles?.length || 0;

    const { count: conversationsWithOrder } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', store_id)
      .eq('source', 'whatsapp_chat')
      .gte('created_at', date_from)
      .lte('created_at', date_to);

    const conversionRate = totalCycles > 0
      ? Math.round(((conversationsWithOrder || 0) / totalCycles) * 100)
      : 0;

    // 4. Conversas por status
    const { data: conversations } = await supabase
      .from('whatsapp_conversations')
      .select('status')
      .eq('store_id', store_id)
      .gte('created_at', date_from)
      .lte('created_at', date_to);

    const statusDistribution: Record<string, number> = {};
    conversations?.forEach(c => {
      statusDistribution[c.status] = (statusDistribution[c.status] || 0) + 1;
    });

    return new Response(JSON.stringify({
      autonomyByHour,
      slaData,
      conversion: {
        totalConversations: totalCycles,
        ordersCreated: conversationsWithOrder || 0,
        conversionRate,
      },
      statusDistribution,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in whatsapp-reports-efficiency:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
