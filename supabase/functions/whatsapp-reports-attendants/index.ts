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

    // 1. Buscar conversas com assigned_to no período
    const { data: conversations } = await supabase
      .from('whatsapp_conversations')
      .select('id, assigned_to, remote_jid, status')
      .eq('store_id', store_id)
      .not('assigned_to', 'is', null)
      .gte('created_at', date_from)
      .lte('created_at', date_to);

    // 2. Buscar mensagens humanas (outgoing, não bot) no período
    const { data: humanMessages } = await supabase
      .from('whatsapp_chat_messages')
      .select('sender_name, remote_jid, timestamp, direction, is_from_bot, content')
      .eq('store_id', store_id)
      .eq('is_from_bot', false)
      .in('direction', ['out', 'outgoing'])
      .gte('timestamp', date_from)
      .lte('timestamp', date_to)
      .order('timestamp', { ascending: true });

    // 3. Buscar todas as mensagens para calcular tempo de resposta
    const { data: allMessages } = await supabase
      .from('whatsapp_chat_messages')
      .select('remote_jid, direction, is_from_bot, timestamp, sender_name')
      .eq('store_id', store_id)
      .gte('timestamp', date_from)
      .lte('timestamp', date_to)
      .order('timestamp', { ascending: true });

    // 4. Buscar pedidos via WhatsApp para conversões
    const { data: whatsappOrders } = await supabase
      .from('orders')
      .select('id, customer_phone, created_at, total')
      .eq('store_id', store_id)
      .eq('source', 'whatsapp_chat')
      .gte('created_at', date_from)
      .lte('created_at', date_to);

    // 5. Buscar perfis dos atendentes
    const attendantIds = [...new Set(conversations?.map(c => c.assigned_to).filter(Boolean) || [])];
    
    // Também buscar nomes únicos das mensagens humanas
    const attendantNames = [...new Set(humanMessages?.map(m => m.sender_name).filter(Boolean) || [])];

    let profilesMap: Record<string, string> = {};
    if (attendantIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', attendantIds);
      
      profiles?.forEach(p => {
        profilesMap[p.id] = p.full_name || 'Sem nome';
      });
    }

    // Mapear remote_jid -> assigned_to (atendente do conversa)
    const conversationAttendant: Record<string, string> = {};
    conversations?.forEach(c => {
      if (c.assigned_to && c.remote_jid) {
        conversationAttendant[c.remote_jid] = c.assigned_to;
      }
    });

    // Agrupar mensagens por contato
    const messagesByContact = new Map<string, typeof allMessages>();
    allMessages?.forEach(m => {
      const list = messagesByContact.get(m.remote_jid) || [];
      list.push(m);
      messagesByContact.set(m.remote_jid, list);
    });

    // Calcular métricas por atendente
    interface AttendantMetrics {
      name: string;
      totalMessages: number;
      totalConversations: number;
      responseTimes: number[];
      ordersCount: number;
      revenue: number;
    }

    const metricsMap = new Map<string, AttendantMetrics>();

    const getOrCreate = (key: string, name: string): AttendantMetrics => {
      if (!metricsMap.has(key)) {
        metricsMap.set(key, {
          name,
          totalMessages: 0,
          totalConversations: 0,
          responseTimes: [],
          ordersCount: 0,
          revenue: 0,
        });
      }
      return metricsMap.get(key)!;
    };

    // Contar mensagens por atendente (via sender_name)
    humanMessages?.forEach(m => {
      if (m.sender_name) {
        const metrics = getOrCreate(m.sender_name, m.sender_name);
        metrics.totalMessages++;
      }
    });

    // Contar conversas por atendente (via assigned_to)
    conversations?.forEach(c => {
      if (c.assigned_to) {
        const name = profilesMap[c.assigned_to] || 'Atendente';
        const metrics = getOrCreate(name, name);
        metrics.totalConversations++;
      }
    });

    // Calcular tempos de resposta por atendente
    messagesByContact.forEach((msgs, remoteJid) => {
      for (let i = 1; i < msgs.length; i++) {
        const prev = msgs[i - 1];
        const curr = msgs[i];
        
        // Mensagem de entrada seguida de resposta humana
        if (
          (prev.direction === 'in' || prev.direction === 'incoming') &&
          (curr.direction === 'out' || curr.direction === 'outgoing') &&
          !curr.is_from_bot &&
          curr.sender_name
        ) {
          const diffSec = (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 1000;
          if (diffSec > 0 && diffSec < 3600) {
            const metrics = getOrCreate(curr.sender_name, curr.sender_name);
            metrics.responseTimes.push(diffSec);
          }
        }
      }
    });

    // Atribuir pedidos aos atendentes (via remote_jid da conversa)
    // Mapear telefone do pedido para o remote_jid
    whatsappOrders?.forEach(order => {
      if (order.customer_phone) {
        // Tentar encontrar o atendente pela conversa
        const phone = order.customer_phone.replace(/\D/g, '');
        const matchingJid = [...(messagesByContact.keys())].find(jid => 
          jid.includes(phone) || phone.includes(jid.replace('@s.whatsapp.net', '').replace(/\D/g, ''))
        );
        
        if (matchingJid && conversationAttendant[matchingJid]) {
          const attendantId = conversationAttendant[matchingJid];
          const name = profilesMap[attendantId] || 'Atendente';
          const metrics = getOrCreate(name, name);
          metrics.ordersCount++;
          metrics.revenue += order.total || 0;
        }
      }
    });

    // Montar ranking
    const ranking = [...metricsMap.entries()].map(([key, m]) => {
      const avgResponseTime = m.responseTimes.length > 0
        ? Math.round(m.responseTimes.reduce((a, b) => a + b, 0) / m.responseTimes.length)
        : 0;
      
      const conversionRate = m.totalConversations > 0
        ? Math.round((m.ordersCount / m.totalConversations) * 100)
        : 0;

      return {
        name: m.name,
        totalMessages: m.totalMessages,
        totalConversations: m.totalConversations,
        avgResponseTimeSec: avgResponseTime,
        ordersCount: m.ordersCount,
        revenue: m.revenue,
        conversionRate,
        responseSamples: m.responseTimes.length,
      };
    })
    .filter(a => a.totalMessages > 0 || a.totalConversations > 0)
    .sort((a, b) => b.totalMessages - a.totalMessages);

    return new Response(JSON.stringify({ ranking }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in whatsapp-reports-attendants:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
