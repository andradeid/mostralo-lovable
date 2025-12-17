import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  getRandomGreeting, 
  getPeriodFromHour, 
  getSimpleGreeting,
  getPeriodEmoji,
  getNextOpeningContextual,
  selectBestGreeting,
  type Period 
} from "./greeting-templates.ts";
import { 
  getHolidayInfo, 
  getSpecialWeekdayTemplates,
  getCurrentWeekday,
  getCurrentDateKey,
  type Weekday 
} from "./seasonal-templates.ts";
import { 
  detectNiche, 
  nicheTemplates,
  nicheInfo,
  type StoreNiche 
} from "./niche-templates.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para verificar se loja está aberta agora
function isStoreOpenNow(businessHours: any, timezone: string): boolean {
  if (!businessHours) return false;
  if (businessHours.service_paused === true || businessHours.service_paused === 'true') {
    return false;
  }

  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const weekdayEn = parts.find(p => p.type === 'weekday')?.value?.toLowerCase() || '';
  const hour = parts.find(p => p.type === 'hour')?.value || '00';
  const minute = parts.find(p => p.type === 'minute')?.value || '00';
  const currentTime = `${hour}:${minute}`;

  // Mapear dia inglês para chave do objeto
  const dayMap: Record<string, string> = {
    'sunday': 'sunday',
    'monday': 'monday',
    'tuesday': 'tuesday',
    'wednesday': 'wednesday',
    'thursday': 'thursday',
    'friday': 'friday',
    'saturday': 'saturday',
  };

  const dayKey = dayMap[weekdayEn];
  if (!dayKey) return false;

  const dayHours = businessHours[dayKey];
  if (!dayHours || dayHours.closed) return false;

  return currentTime >= dayHours.open && currentTime <= dayHours.close;
}

// Função para calcular próxima abertura
function getNextOpeningTime(businessHours: any, timezone: string): string | null {
  if (!businessHours) return null;

  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const weekdayEn = parts.find(p => p.type === 'weekday')?.value?.toLowerCase() || '';
  const hour = parts.find(p => p.type === 'hour')?.value || '00';
  const minute = parts.find(p => p.type === 'minute')?.value || '00';
  const currentTime = `${hour}:${minute}`;

  const dayNamesEn = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayNamesPt = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  const currentDayIndex = dayNamesEn.indexOf(weekdayEn);
  if (currentDayIndex === -1) return null;

  // Verificar se abre ainda hoje
  const todayHours = businessHours[dayNamesEn[currentDayIndex]];
  if (todayHours && !todayHours.closed && currentTime < todayHours.open) {
    return `hoje às ${todayHours.open}`;
  }

  // Procurar próximo dia aberto
  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (currentDayIndex + i) % 7;
    const nextDayHours = businessHours[dayNamesEn[nextDayIndex]];

    if (nextDayHours && !nextDayHours.closed) {
      if (i === 1) {
        return `amanhã às ${nextDayHours.open}`;
      }
      return `${dayNamesPt[nextDayIndex]} às ${nextDayHours.open}`;
    }
  }

  return null;
}

// Função para calcular saudação e período baseado no horário
function getGreetingContext(timezone: string): { 
  greeting: string; 
  currentTime: string; 
  hour: number; 
  period: Period;
  emoji: string;
} {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const currentTime = formatter.format(now);
  const hour = parseInt(currentTime.split(':')[0]);
  const period = getPeriodFromHour(hour);
  const greeting = getSimpleGreeting(hour);
  const emoji = getPeriodEmoji(period);

  return { greeting, currentTime, hour, period, emoji };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const results: any[] = [];

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔄 CRON: Iniciando atualização de saudações dos bots...');

    // Buscar Evolution config
    const { data: evolutionConfig, error: configError } = await supabaseClient
      .from('evolution_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !evolutionConfig) {
      console.error('❌ Evolution API não configurada');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Evolution API não configurada',
        processed: 0,
        results: []
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const evolutionUrl = evolutionConfig.api_url.replace(/\/$/, '');

    // Buscar todos os bots ativos
    const { data: activeBots, error: botsError } = await supabaseClient
      .from('store_bot_config')
      .select(`
        *,
        stores!inner (
          id, name, slug, description, address, whatsapp, 
          business_hours, timezone, delivery_fee, min_order_value,
          accepts_cash, accepts_card, accepts_pix, city, state,
          google_maps_link, custom_domain, custom_domain_verified,
          segment
        )
      `)
      .eq('enabled', true)
      .not('evolution_bot_id', 'is', null);

    if (botsError) {
      console.error('❌ Erro ao buscar bots:', botsError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: botsError.message,
        processed: 0,
        results: []
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📊 Encontrados ${activeBots?.length || 0} bots ativos para atualizar`);

    if (!activeBots || activeBots.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Nenhum bot ativo encontrado',
        processed: 0,
        results: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar instâncias WhatsApp
    const { data: instances } = await supabaseClient
      .from('whatsapp_instances')
      .select('id, instance_name, store_id');

    const instanceMap = new Map(instances?.map(i => [i.store_id, i.instance_name]) || []);

    // Processar cada bot
    for (const botConfig of activeBots) {
      const store = botConfig.stores;
      const instanceName = instanceMap.get(store.id);

      if (!instanceName) {
        console.log(`⚠️ Instância não encontrada para loja: ${store.name}`);
        results.push({
          store: store.name,
          success: false,
          error: 'Instância WhatsApp não encontrada'
        });
        continue;
      }

      try {
        const timezone = store.timezone || 'America/Sao_Paulo';
        const { greeting, currentTime, hour, period, emoji } = getGreetingContext(timezone);
        const isOpen = isStoreOpenNow(store.business_hours, timezone);
        const nextOpening = !isOpen ? getNextOpeningTime(store.business_hours, timezone) : null;

        // Determinar domínio da loja
        let baseUrl = 'https://mostralo.com.br';
        if (store.custom_domain && store.custom_domain_verified) {
          baseUrl = `https://${store.custom_domain}`;
        }
        const storeLink = `${baseUrl}/loja/${store.slug}`;

        // Buscar produtos e categorias
        const { data: products } = await supabaseClient
          .from('products')
          .select('name, price, description, slug, is_available')
          .eq('store_id', store.id)
          .eq('is_available', true)
          .limit(50);

        const { data: categories } = await supabaseClient
          .from('categories')
          .select('name, is_active')
          .eq('store_id', store.id)
          .eq('is_active', true);

        // Gerar contexto de status atual com instruções humanizadas
        const statusContext = `
[CONTEXTO ATUAL - ${currentTime} (${timezone})]
- Horário da loja: ${currentTime}
- Período do dia: ${period} ${emoji}
- Saudação apropriada: "${greeting}"
- STATUS: ${isOpen ? '✅ ABERTO AGORA' : `❌ FECHADO${nextOpening ? ` - Abre ${nextOpening}` : ''}`}
${!isOpen && nextOpening ? `- Próxima abertura: ${nextOpening}` : ''}

INSTRUÇÕES DE STATUS (responda de forma natural e acolhedora):
${isOpen 
  ? `- Quando perguntarem se está aberto: Confirme de forma amigável que está funcionando, sem usar frases robóticas como "Sim, estamos abertos!"
- Seja acolhedor e convide para ver o cardápio`
  : `- Quando perguntarem se está aberto: Informe de forma gentil que está fechado${nextOpening ? ` e mencione que abrirá ${nextOpening}` : ''}
- Ofereça o cardápio para o cliente já ir escolhendo: ${storeLink}`}
- NUNCA diga que está aberto se o STATUS mostrar FECHADO
- Use a saudação "${greeting}" nas interações
- ${period === 'madrugada' ? 'De madrugada, seja especialmente acolhedor com quem está acordado nesse horário!' : ''}`;

        // Montar systemPrompt atualizado (simplificado para o CRON)
        const productList = (products || [])
          .map(p => `- ${p.name}: R$ ${p.price?.toFixed(2)} | Ver: ${storeLink}/produto/${p.slug || ''}`)
          .join('\n');

        const categoryList = (categories || []).map(c => c.name).join(', ');

        // Atualizar bot na Evolution API
        const botId = botConfig.evolution_bot_id;
        
        // Usar sistema unificado de templates inteligentes (141+ variações)
        const dynamicGreeting = selectBestGreeting({
          period,
          isOpen,
          storeName: store.name,
          storeLink,
          nextOpening,
          timezone,
          storeSegment: store.segment
        });

        // Payload de atualização
        const updatePayload = {
          enabled: true,
          openaiCredsId: evolutionConfig.openai_creds_id,
          botType: 'chatCompletion',
          model: evolutionConfig.openai_default_model || 'gpt-4o-mini',
          maxTokens: evolutionConfig.openai_max_tokens || 1000,
          systemMessages: [`Você é ${botConfig.bot_name || 'Assistente'}, o assistente virtual da ${store.name}.

${statusContext}

INFORMAÇÕES DA LOJA:
- Nome: ${store.name}
- Descrição: ${store.description || 'Delivery de qualidade'}
- Endereço: ${store.address || 'Não informado'}
- WhatsApp: ${store.whatsapp || 'Não informado'}
- Link do cardápio: ${storeLink}
- Taxa de entrega: ${store.delivery_fee ? `R$ ${store.delivery_fee.toFixed(2)}` : 'Consulte'}
- Pedido mínimo: ${store.min_order_value ? `R$ ${store.min_order_value.toFixed(2)}` : 'Sem mínimo'}

CATEGORIAS: ${categoryList || 'Não informado'}

PRODUTOS:
${productList || 'Não há produtos'}

INSTRUÇÕES:
1. Apresente produtos quando perguntado
2. Informe preços corretamente
3. SEMPRE inclua links dos produtos
4. Direcione ao cardápio: ${storeLink}
5. Se cliente perguntar se está aberto, use o STATUS acima
6. Responda em português brasileiro`],
          assistantMessages: [dynamicGreeting],
          userMessages: ['Oi', 'Olá', 'Boa tarde', 'Boa noite', 'Bom dia', 'Vocês estão abertos?'],
          triggerType: botConfig.trigger_type || 'all',
          triggerOperator: botConfig.trigger_operator || 'contains',
          triggerValue: botConfig.trigger_value || '',
          expire: botConfig.expire_minutes || 20,
          keywordFinish: botConfig.keyword_finish || '#SAIR',
          delayMessage: botConfig.delay_message || 4000,
          unknownMessage: botConfig.unknown_message || 'Desculpe, não entendi.',
          listeningFromMe: botConfig.listening_from_me || false,
          stopBotFromMe: botConfig.stop_bot_from_me !== undefined ? botConfig.stop_bot_from_me : true,
          keepOpen: botConfig.keep_open || false,
          debounceTime: botConfig.debounce_time || 10,
          ignoreJids: botConfig.ignore_jids || [],
          splitMessages: botConfig.bot_split_messages !== undefined ? botConfig.bot_split_messages : true,
          timePerChar: botConfig.bot_time_per_char || 0,
          description: `Bot Mostralo - ${store.name}`,
        };

        // Deletar e recriar (estratégia mais confiável)
        try {
          await fetch(`${evolutionUrl}/openai/delete/${botId}/${instanceName}`, {
            method: 'DELETE',
            headers: { 'apikey': evolutionConfig.api_key },
          });
        } catch (e) {
          console.log(`⚠️ Erro ao deletar bot antigo (ignorando): ${e}`);
        }

        // Criar novo bot com contexto atualizado
        const createResp = await fetch(`${evolutionUrl}/openai/create/${instanceName}`, {
          method: 'POST',
          headers: {
            'apikey': evolutionConfig.api_key,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatePayload),
        });

        const createText = await createResp.text();

        if (createResp.ok) {
          let newBotId = null;
          try {
            const data = JSON.parse(createText);
            newBotId = data?.id || data?.openaiBot?.id || null;
          } catch { /* ignore */ }

          // Atualizar ID no banco se mudou
          if (newBotId && newBotId !== botId) {
            await supabaseClient
              .from('store_bot_config')
              .update({ 
                evolution_bot_id: newBotId,
                updated_at: new Date().toISOString()
              })
              .eq('id', botConfig.id);
          }

          console.log(`✅ Bot atualizado: ${store.name} | ${period} ${emoji} | ${greeting} | ${isOpen ? 'ABERTO' : 'FECHADO'}`);
          results.push({
            store: store.name,
            success: true,
            greeting,
            period,
            isOpen,
            currentTime,
            nextOpening
          });
        } else {
          console.error(`❌ Erro ao atualizar bot ${store.name}:`, createText.slice(0, 200));
          results.push({
            store: store.name,
            success: false,
            error: createText.slice(0, 100)
          });
        }

      } catch (botError) {
        console.error(`❌ Erro ao processar bot ${store.name}:`, botError);
        results.push({
          store: store.name,
          success: false,
          error: String(botError)
        });
      }
    }

    const duration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;

    console.log(`🏁 CRON finalizado em ${duration}ms | ${successCount}/${results.length} bots atualizados`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `${successCount}/${results.length} bots atualizados`,
      processed: results.length,
      successful: successCount,
      duration: `${duration}ms`,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro geral no CRON:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      processed: 0,
      results
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
