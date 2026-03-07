import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TYPING_SPEED_CHARS_PER_MIN = 150;

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

    // 1. Economia de digitação - chars das mensagens do bot
    const { data: botMessages } = await supabase
      .from('whatsapp_chat_messages')
      .select('content')
      .eq('store_id', store_id)
      .eq('is_from_bot', true)
      .eq('direction', 'out')
      .gte('timestamp', date_from)
      .lte('timestamp', date_to);

    const totalBotChars = botMessages?.reduce((sum, m) => sum + (m.content?.length || 0), 0) || 0;
    const typingMinutesSaved = Math.round(totalBotChars / TYPING_SPEED_CHARS_PER_MIN);
    const typingHoursSaved = Math.round((typingMinutesSaved / 60) * 10) / 10;

    // 2. Economia de escuta (áudios transcritos)
    const { data: audioMessages } = await supabase
      .from('whatsapp_chat_messages')
      .select('metadata')
      .eq('store_id', store_id)
      .eq('direction', 'in')
      .eq('message_type', 'audio')
      .gte('timestamp', date_from)
      .lte('timestamp', date_to);

    let totalAudioSeconds = 0;
    let transcribedAudios = 0;
    audioMessages?.forEach(m => {
      const meta = m.metadata as any;
      if (meta?.duration) {
        totalAudioSeconds += meta.duration;
      }
      if (meta?.transcription || meta?.transcript) {
        transcribedAudios++;
      }
    });
    const audioMinutesSaved = Math.round(totalAudioSeconds / 60);

    // 3. Velocidade IA vs Humano (tempo de resposta)
    const { data: allMessages } = await supabase
      .from('whatsapp_chat_messages')
      .select('direction, is_from_bot, timestamp, remote_jid')
      .eq('store_id', store_id)
      .gte('timestamp', date_from)
      .lte('timestamp', date_to)
      .order('timestamp', { ascending: true });

    let botResponseTimes: number[] = [];
    let humanResponseTimes: number[] = [];

    if (allMessages && allMessages.length > 1) {
      // Agrupar por contato
      const byContact = new Map<string, typeof allMessages>();
      allMessages.forEach(m => {
        const list = byContact.get(m.remote_jid) || [];
        list.push(m);
        byContact.set(m.remote_jid, list);
      });

      byContact.forEach(msgs => {
        for (let i = 1; i < msgs.length; i++) {
          const prev = msgs[i - 1];
          const curr = msgs[i];
          // Mensagem in seguida de out = resposta
          if (prev.direction === 'in' && curr.direction === 'out') {
            const diffSeconds = (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 1000;
            if (diffSeconds > 0 && diffSeconds < 3600) { // Ignorar gaps > 1h
              if (curr.is_from_bot) {
                botResponseTimes.push(diffSeconds);
              } else {
                humanResponseTimes.push(diffSeconds);
              }
            }
          }
        }
      });
    }

    const avgBotResponseSeconds = botResponseTimes.length > 0
      ? Math.round(botResponseTimes.reduce((a, b) => a + b, 0) / botResponseTimes.length)
      : 0;
    const avgHumanResponseSeconds = humanResponseTimes.length > 0
      ? Math.round(humanResponseTimes.reduce((a, b) => a + b, 0) / humanResponseTimes.length)
      : 0;

    // 4. Custo por atendimento
    const { data: storeData } = await supabase
      .from('stores')
      .select('plan_id, custom_monthly_price')
      .eq('id', store_id)
      .single();

    let monthlyPrice = 0;
    if (storeData?.custom_monthly_price) {
      monthlyPrice = storeData.custom_monthly_price;
    } else if (storeData?.plan_id) {
      const { data: plan } = await supabase
        .from('plans')
        .select('price')
        .eq('id', storeData.plan_id)
        .single();
      monthlyPrice = plan?.price || 0;
    }

    const { count: botConversations } = await supabase
      .from('whatsapp_conversation_cycles')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', store_id)
      .gte('opened_at', date_from)
      .lte('opened_at', date_to);

    const costPerService = botConversations && botConversations > 0
      ? Math.round((monthlyPrice / botConversations) * 100) / 100
      : 0;

    return new Response(JSON.stringify({
      typingEconomy: {
        totalChars: totalBotChars,
        minutesSaved: typingMinutesSaved,
        hoursSaved: typingHoursSaved,
        messagesCount: botMessages?.length || 0,
      },
      audioEconomy: {
        totalAudios: audioMessages?.length || 0,
        transcribedAudios,
        totalSeconds: totalAudioSeconds,
        minutesSaved: audioMinutesSaved,
      },
      responseSpeed: {
        avgBotSeconds: avgBotResponseSeconds,
        avgHumanSeconds: avgHumanResponseSeconds,
        botSamples: botResponseTimes.length,
        humanSamples: humanResponseTimes.length,
      },
      costPerService: {
        monthlyPrice,
        totalConversations: botConversations || 0,
        costPerService,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in whatsapp-reports-roi:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
