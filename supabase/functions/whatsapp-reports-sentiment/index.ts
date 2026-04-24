import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

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

    // 1. Buscar ciclos de conversa finalizados no período
    const { data: cycles } = await supabase
      .from('whatsapp_conversation_cycles')
      .select('id, conversation_id, opened_at, closed_at, remote_jid, phone_number')
      .eq('store_id', store_id)
      .gte('opened_at', date_from)
      .lte('opened_at', date_to)
      .not('closed_at', 'is', null)
      .order('opened_at', { ascending: false })
      .limit(500);

    if (!cycles || cycles.length === 0) {
      return new Response(JSON.stringify({
        summary: { positive: 0, neutral: 0, negative: 0, total: 0, avgScore: 0 },
        conversations: [],
        dailyTrend: [],
        sourceBreakdown: { ia_only: 0, human_intervened: 0, cellphone_only: 0 },
        responseTimeImpact: { fast: 0, medium: 0, slow: 0 },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Buscar mensagens de todas as conversas
    const remoteJids = [...new Set(cycles.map(c => c.remote_jid))];

    // Buscar mensagens por lotes de remote_jid (máx 500 por query)
    const { data: allMessages } = await supabase
      .from('whatsapp_chat_messages')
      .select('remote_jid, direction, is_from_bot, message_source, timestamp, message_type, content')
      .eq('store_id', store_id)
      .gte('timestamp', date_from)
      .lte('timestamp', date_to)
      .in('remote_jid', remoteJids)
      .order('timestamp', { ascending: true })
      .limit(5000);

    // 3. Buscar pedidos WhatsApp no período
    const { data: orders } = await supabase
      .from('orders')
      .select('customer_id, created_at, total')
      .eq('store_id', store_id)
      .eq('source', 'whatsapp_chat')
      .gte('created_at', date_from)
      .lte('created_at', date_to);

    // 4. Buscar pausas de IA no período
    const { data: pauses } = await supabase
      .from('whatsapp_paused_contacts')
      .select('remote_jid, paused_at')
      .eq('store_id', store_id)
      .gte('paused_at', date_from)
      .lte('paused_at', date_to);

    const pausedJids = new Set(pauses?.map(p => p.remote_jid) || []);

    // 5. Agrupar mensagens por remote_jid
    const messagesByJid: Record<string, typeof allMessages> = {};
    allMessages?.forEach(m => {
      if (!messagesByJid[m.remote_jid]) messagesByJid[m.remote_jid] = [];
      messagesByJid[m.remote_jid]!.push(m);
    });

    // 6. Calcular score de sentimento para cada ciclo
    const conversations: Array<{
      remoteJid: string;
      phoneNumber: string;
      openedAt: string;
      closedAt: string;
      score: number;
      sentiment: 'positive' | 'neutral' | 'negative';
      factors: string[];
      messageCount: number;
      durationMinutes: number;
      source: string;
      hadOrder: boolean;
      avgResponseTimeSec: number;
    }> = [];

    for (const cycle of cycles) {
      const msgs = messagesByJid[cycle.remote_jid] || [];
      // Filtrar mensagens dentro do período do ciclo
      const cycleMsgs = msgs.filter(m => {
        const t = new Date(m.timestamp).getTime();
        return t >= new Date(cycle.opened_at).getTime() &&
               t <= new Date(cycle.closed_at!).getTime();
      });

      const inMsgs = cycleMsgs.filter(m => m.direction === 'in' || m.direction === 'incoming');
      const outMsgs = cycleMsgs.filter(m => m.direction === 'out' || m.direction === 'outgoing');
      const botMsgs = outMsgs.filter(m => m.is_from_bot);
      const cellMsgs = outMsgs.filter(m => m.message_source === 'cellphone');
      const systemMsgs = outMsgs.filter(m => m.message_source === 'system' && !m.is_from_bot);

      // Duração em minutos
      const durationMs = new Date(cycle.closed_at!).getTime() - new Date(cycle.opened_at).getTime();
      const durationMinutes = Math.round(durationMs / 60000);

      // Tempo médio de resposta (cliente -> resposta)
      let totalResponseTime = 0;
      let responseCount = 0;
      for (let i = 0; i < cycleMsgs.length; i++) {
        const msg = cycleMsgs[i];
        if (msg.direction === 'in' || msg.direction === 'incoming') {
          // Buscar próxima resposta
          const nextOut = cycleMsgs.slice(i + 1).find(m => m.direction === 'out' || m.direction === 'outgoing');
          if (nextOut) {
            const diff = (new Date(nextOut.timestamp).getTime() - new Date(msg.timestamp).getTime()) / 1000;
            if (diff > 0 && diff < 3600) { // Ignorar gaps > 1h
              totalResponseTime += diff;
              responseCount++;
            }
          }
        }
      }
      const avgResponseTimeSec = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0;

      // Verificar se houve pedido
      const hadOrder = orders?.some(o => {
        const orderTime = new Date(o.created_at).getTime();
        return orderTime >= new Date(cycle.opened_at).getTime() &&
               orderTime <= new Date(cycle.closed_at!).getTime() + 300000; // 5min margem
      }) || false;

      // Determinar origem principal
      const wasPaused = pausedJids.has(cycle.remote_jid);
      let source = 'ia_only';
      if (cellMsgs.length > 0 && botMsgs.length === 0) {
        source = 'cellphone_only';
      } else if (wasPaused || systemMsgs.length > 0) {
        source = 'human_intervened';
      }

      // Calcular score (0-100)
      let score = 50; // Base neutra
      const factors: string[] = [];

      // Fator 1: Tempo de resposta (peso alto)
      if (avgResponseTimeSec > 0 && avgResponseTimeSec <= 30) {
        score += 15;
        factors.push('Resposta rápida (<30s)');
      } else if (avgResponseTimeSec > 0 && avgResponseTimeSec <= 120) {
        score += 5;
        factors.push('Resposta moderada (<2min)');
      } else if (avgResponseTimeSec > 300) {
        score -= 15;
        factors.push('Resposta lenta (>5min)');
      }

      // Fator 2: Resolução (venda ou não)
      if (hadOrder) {
        score += 20;
        factors.push('Gerou pedido');
      }

      // Fator 3: Autonomia da IA
      if (source === 'ia_only' && botMsgs.length > 0) {
        score += 10;
        factors.push('IA resolveu sozinha');
      } else if (source === 'human_intervened') {
        score -= 5;
        factors.push('Precisou intervenção humana');
      }

      // Fator 4: Duração do atendimento
      if (durationMinutes <= 10) {
        score += 5;
        factors.push('Atendimento rápido');
      } else if (durationMinutes > 60) {
        score -= 10;
        factors.push('Atendimento muito longo');
      }

      // Fator 5: Volume de mensagens (muitas msgs do cliente pode indicar insatisfação)
      if (inMsgs.length > 15) {
        score -= 10;
        factors.push('Muitas mensagens do cliente');
      } else if (inMsgs.length <= 5 && outMsgs.length > 0) {
        score += 5;
        factors.push('Conversa objetiva');
      }

      // Normalizar score entre 0-100
      score = Math.max(0, Math.min(100, score));

      const sentiment = score >= 65 ? 'positive' : score >= 40 ? 'neutral' : 'negative';

      conversations.push({
        remoteJid: cycle.remote_jid,
        phoneNumber: cycle.phone_number,
        openedAt: cycle.opened_at,
        closedAt: cycle.closed_at!,
        score,
        sentiment,
        factors,
        messageCount: cycleMsgs.length,
        durationMinutes,
        source,
        hadOrder,
        avgResponseTimeSec,
      });
    }

    // 7. Calcular resumo
    const positive = conversations.filter(c => c.sentiment === 'positive').length;
    const neutral = conversations.filter(c => c.sentiment === 'neutral').length;
    const negative = conversations.filter(c => c.sentiment === 'negative').length;
    const total = conversations.length;
    const avgScore = total > 0 ? Math.round(conversations.reduce((s, c) => s + c.score, 0) / total) : 0;

    // 8. Tendência diária
    const dailyMap: Record<string, { scores: number[]; count: number }> = {};
    conversations.forEach(c => {
      const day = c.openedAt.substring(0, 10);
      if (!dailyMap[day]) dailyMap[day] = { scores: [], count: 0 };
      dailyMap[day].scores.push(c.score);
      dailyMap[day].count++;
    });

    const dailyTrend = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        avgScore: Math.round(data.scores.reduce((s, v) => s + v, 0) / data.scores.length),
        count: data.count,
        positive: data.scores.filter(s => s >= 65).length,
        neutral: data.scores.filter(s => s >= 40 && s < 65).length,
        negative: data.scores.filter(s => s < 40).length,
      }));

    // 9. Breakdown por origem
    const sourceBreakdown = {
      ia_only: conversations.filter(c => c.source === 'ia_only').length,
      human_intervened: conversations.filter(c => c.source === 'human_intervened').length,
      cellphone_only: conversations.filter(c => c.source === 'cellphone_only').length,
    };

    // 10. Impacto do tempo de resposta
    const responseTimeImpact = {
      fast: conversations.filter(c => c.avgResponseTimeSec > 0 && c.avgResponseTimeSec <= 60).length,
      medium: conversations.filter(c => c.avgResponseTimeSec > 60 && c.avgResponseTimeSec <= 300).length,
      slow: conversations.filter(c => c.avgResponseTimeSec > 300).length,
    };

    return new Response(JSON.stringify({
      summary: { positive, neutral, negative, total, avgScore },
      conversations: conversations.slice(0, 50), // Limitar para performance
      dailyTrend,
      sourceBreakdown,
      responseTimeImpact,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in whatsapp-reports-sentiment:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
