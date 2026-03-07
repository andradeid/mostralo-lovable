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

    // 1. Ticket médio: WhatsApp vs Manual
    const { data: whatsappOrders } = await supabase
      .from('orders')
      .select('total')
      .eq('store_id', store_id)
      .eq('source', 'whatsapp_chat')
      .neq('status', 'cancelado')
      .gte('created_at', date_from)
      .lte('created_at', date_to);

    const { data: manualOrders } = await supabase
      .from('orders')
      .select('total')
      .eq('store_id', store_id)
      .eq('source', 'manual')
      .neq('status', 'cancelado')
      .gte('created_at', date_from)
      .lte('created_at', date_to);

    const whatsappTicket = whatsappOrders && whatsappOrders.length > 0
      ? Math.round((whatsappOrders.reduce((s, o) => s + (o.total || 0), 0) / whatsappOrders.length) * 100) / 100
      : 0;
    const manualTicket = manualOrders && manualOrders.length > 0
      ? Math.round((manualOrders.reduce((s, o) => s + (o.total || 0), 0) / manualOrders.length) * 100) / 100
      : 0;

    // 2. Volume por dia da semana
    const { data: messages } = await supabase
      .from('whatsapp_chat_messages')
      .select('timestamp')
      .eq('store_id', store_id)
      .eq('direction', 'in')
      .gte('timestamp', date_from)
      .lte('timestamp', date_to);

    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const volumeByDayOfWeek = dayNames.map(name => ({ day: name, count: 0 }));
    messages?.forEach(m => {
      const dayIndex = new Date(m.timestamp).getDay();
      volumeByDayOfWeek[dayIndex].count++;
    });

    // 3. Horários de pico
    const hourlyVolume = new Array(24).fill(0);
    messages?.forEach(m => {
      const hour = new Date(m.timestamp).getHours();
      hourlyVolume[hour]++;
    });
    const peakHours = hourlyVolume.map((count, hour) => ({
      hour: `${String(hour).padStart(2, '0')}:00`,
      messages: count,
    }));

    // 4. Top contatos
    const { data: allMessages } = await supabase
      .from('whatsapp_chat_messages')
      .select('remote_jid')
      .eq('store_id', store_id)
      .eq('direction', 'in')
      .gte('timestamp', date_from)
      .lte('timestamp', date_to);

    const contactCounts = new Map<string, number>();
    allMessages?.forEach(m => {
      contactCounts.set(m.remote_jid, (contactCounts.get(m.remote_jid) || 0) + 1);
    });

    // Buscar nomes dos top contatos
    const topContactJids = Array.from(contactCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const topContacts = [];
    for (const [jid, count] of topContactJids) {
      const { data: conv } = await supabase
        .from('whatsapp_conversations')
        .select('contact_name, phone_number')
        .eq('store_id', store_id)
        .eq('remote_jid', jid)
        .limit(1)
        .maybeSingle();

      topContacts.push({
        name: conv?.contact_name || jid.split('@')[0],
        phone: conv?.phone_number || jid.split('@')[0],
        messages: count,
      });
    }

    return new Response(JSON.stringify({
      ticketComparison: {
        whatsapp: { ticket: whatsappTicket, orders: whatsappOrders?.length || 0 },
        manual: { ticket: manualTicket, orders: manualOrders?.length || 0 },
      },
      volumeByDayOfWeek,
      peakHours,
      topContacts,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in whatsapp-reports-market:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
