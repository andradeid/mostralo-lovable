import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ========================================
// VERSÃO DA FUNÇÃO - Para debug de deploy
// ========================================
const FUNCTION_VERSION = "2026-01-10-v2";
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

  console.log(`[update-bots-greeting] version: ${FUNCTION_VERSION}`);

  // ========================================
  // Sanitizar texto para remover "cardápio"
  // ========================================
  function sanitizeText(text: string): string {
    if (!text) return text;
    return text.replace(/cardápio/giu, 'loja').replace(/cardapio/giu, 'loja');
  }

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

    // =====================================================
    // Helper: garantir credencial OpenAI por LOJA (não usar evolution_config.openai_creds_id)
    // Motivo: openai_creds_id no banco pode ser placeholder e quebrar o bot no CRON.
    // =====================================================
    async function ensureStoreOpenAiCreds(
      instanceName: string,
      storeSlug: string,
      storeOpenAiApiKey: string | null
    ): Promise<string | null> {
      if (!storeOpenAiApiKey) return null;

      const credsName = `store_${storeSlug}_openai`;

      try {
        // 1) Tentar localizar credencial existente
        const listResp = await fetch(`${evolutionUrl}/openai/creds/${instanceName}`, {
          method: 'GET',
          headers: { 'apikey': evolutionConfig.api_key },
        });

        const listText = await listResp.text();
        if (listResp.ok) {
          let listData: any = null;
          try {
            listData = JSON.parse(listText);
          } catch {
            listData = null;
          }

          const creds = Array.isArray(listData)
            ? listData
            : (listData?.creds || listData?.data || []);

          const found = creds.find((c: any) => c?.name === credsName && c?.id);
          if (found?.id) return found.id as string;
        } else {
          console.error('❌ [CRON] Falha ao listar credenciais:', listResp.status, listText.slice(0, 200));
        }

        // 2) Criar credencial se não existe
        const createResp = await fetch(`${evolutionUrl}/openai/creds/${instanceName}`, {
          method: 'POST',
          headers: {
            'apikey': evolutionConfig.api_key,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: credsName,
            apiKey: storeOpenAiApiKey,
          }),
        });

        const createText = await createResp.text();
        if (!createResp.ok) {
          console.error('❌ [CRON] Falha ao criar credencial:', createResp.status, createText.slice(0, 200));
          return null;
        }

        let created: any = {};
        try {
          created = JSON.parse(createText);
        } catch {
          created = {};
        }

        const createdId = created?.id || created?.openaiCredsId || created?.creds?.id || null;
        if (!createdId) {
          console.error('❌ [CRON] ID da credencial não retornado:', createText.slice(0, 200));
          return null;
        }

        return createdId as string;
      } catch (e) {
        console.error('❌ [CRON] Erro ao garantir credencial:', e);
        return null;
      }
    }

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
          segment,
          openai_api_key
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

        // Garantir credencial OpenAI correta para esta loja/instância
        const storeOpenAiCredsId = await ensureStoreOpenAiCreds(
          instanceName,
          store.slug,
          store.openai_api_key
        );

        if (!storeOpenAiCredsId) {
          console.error(`❌ [${store.name}] Sem credencial OpenAI válida para o CRON (verifique stores.openai_api_key)`);
          results.push({
            store: store.name,
            success: false,
            error: 'OpenAI credencial ausente/ inválida (stores.openai_api_key)'
          });
          continue;
        }
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
- Seja acolhedor e convide para acessar a loja online`
  : `- Quando perguntarem se está aberto: Informe de forma gentil que está fechado${nextOpening ? ` e mencione que abrirá ${nextOpening}` : ''}
- Ofereça a loja online para o cliente já ir escolhendo: ${storeLink}`}
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
        const rawPayload = {
          enabled: true,
          openaiCredsId: storeOpenAiCredsId,
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
- Link da loja: ${storeLink}
- Taxa de entrega: ${store.delivery_fee ? `R$ ${store.delivery_fee.toFixed(2)}` : 'Consulte'}
- Pedido mínimo: ${store.min_order_value ? `R$ ${store.min_order_value.toFixed(2)}` : 'Sem mínimo'}

CATEGORIAS: ${categoryList || 'Não informado'}

PRODUTOS:
${productList || 'Não há produtos'}

INSTRUÇÕES:
1. Apresente produtos quando perguntado
2. Informe preços corretamente
3. SEMPRE inclua links dos produtos
4. Direcione à loja online: ${storeLink}
5. Se cliente perguntar se está aberto, use o STATUS acima
6. Responda em português brasileiro

SOBRE A PLATAFORMA:
- Gestão Financeira completa para o lojista
- Dashboard com KPIs de receitas, despesas e saldo
- Controle de entradas/saídas por categoria
- Gráficos de fluxo de caixa mensal

[CRON update-bots-greeting v${FUNCTION_VERSION} - ${new Date().toISOString()}]`],
          assistantMessages: [dynamicGreeting],
          userMessages: ['Oi', 'Olá', 'Boa tarde', 'Boa noite', 'Bom dia', 'Vocês estão abertos?'],
          triggerType: botConfig.trigger_type || 'all',
          triggerOperator: botConfig.trigger_operator || 'contains',
          triggerValue: botConfig.trigger_value || '',
          expire: botConfig.expire_minutes || 20,
          keywordFinish: botConfig.keyword_finish || '#SAIR',
          delayMessage: botConfig.delay_message || 4000,
          unknownMessage: sanitizeText(botConfig.unknown_message || 'Desculpe, não entendi.'),
          listeningFromMe: botConfig.listening_from_me || false,
          stopBotFromMe: botConfig.stop_bot_from_me !== undefined ? botConfig.stop_bot_from_me : true,
          keepOpen: botConfig.keep_open || false,
          debounceTime: botConfig.debounce_time || 10,
          ignoreJids: botConfig.ignore_jids || [],
          splitMessages: botConfig.bot_split_messages !== undefined ? botConfig.bot_split_messages : true,
          timePerChar: botConfig.bot_time_per_char || 0,
          description: `Bot Mostralo - ${store.name}`,
        };

        // Sanitizar todo o payload antes de enviar
        const updatePayload = {
          ...rawPayload,
          systemMessages: rawPayload.systemMessages.map(sanitizeText),
          assistantMessages: rawPayload.assistantMessages.map(sanitizeText),
        };

        // ESTRATÉGIA SEGURA: Tentar UPDATE primeiro, só CREATE se necessário
        // NUNCA deletar o bot - isso evita downtime se a recriação falhar
        
        let updateSuccess = false;
        let retryCount = 0;
        const maxRetries = 2;
        
        while (!updateSuccess && retryCount < maxRetries) {
          retryCount++;
          
          try {
            // Tentar ATUALIZAR o bot existente via PUT (sem deletar)
            console.log(`🔄 [${store.name}] Tentativa ${retryCount}/${maxRetries}: Atualizando bot ${botId}...`);
            
            const updateResp = await fetch(`${evolutionUrl}/openai/settings/${botId}/${instanceName}`, {
              method: 'PUT',
              headers: {
                'apikey': evolutionConfig.api_key,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(updatePayload),
            });

            const updateText = await updateResp.text();

            if (updateResp.ok) {
              // UPDATE bem-sucedido - bot continua funcionando!
              console.log(`✅ [${store.name}] Bot atualizado via PUT | ${period} ${emoji} | ${isOpen ? 'ABERTO' : 'FECHADO'}`);
              results.push({
                store: store.name,
                success: true,
                method: 'UPDATE',
                greeting,
                period,
                isOpen,
                currentTime,
                nextOpening
              });
              updateSuccess = true;
            } else if (updateResp.status === 404) {
              // Bot não existe mais na Evolution - precisa criar novo
              console.log(`⚠️ [${store.name}] Bot ${botId} não encontrado (404), criando novo...`);
              
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

                // Salvar novo ID no banco
                if (newBotId) {
                  await supabaseClient
                    .from('store_bot_config')
                    .update({ 
                      evolution_bot_id: newBotId,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', botConfig.id);
                  
                  console.log(`✅ [${store.name}] Novo bot criado com ID: ${newBotId}`);
                }

                results.push({
                  store: store.name,
                  success: true,
                  method: 'CREATE',
                  newBotId,
                  greeting,
                  period,
                  isOpen,
                  currentTime,
                  nextOpening
                });
                updateSuccess = true;
              } else {
                console.error(`❌ [${store.name}] Falha ao criar bot:`, createText.slice(0, 200));
                if (retryCount >= maxRetries) {
                  results.push({
                    store: store.name,
                    success: false,
                    error: `CREATE falhou: ${createText.slice(0, 100)}`
                  });
                }
              }
            } else {
              // Outro erro no UPDATE - logar e tentar novamente
              console.error(`⚠️ [${store.name}] UPDATE falhou (status ${updateResp.status}):`, updateText.slice(0, 200));
              if (retryCount >= maxRetries) {
                results.push({
                  store: store.name,
                  success: false,
                  error: `UPDATE falhou após ${maxRetries} tentativas: ${updateText.slice(0, 100)}`
                });
              }
            }
          } catch (fetchError) {
            console.error(`❌ [${store.name}] Erro de conexão (tentativa ${retryCount}):`, fetchError);
            if (retryCount >= maxRetries) {
              results.push({
                store: store.name,
                success: false,
                error: `Erro de conexão: ${String(fetchError)}`
              });
            }
          }

          // Aguardar antes de retry (se necessário)
          if (!updateSuccess && retryCount < maxRetries) {
            console.log(`⏳ [${store.name}] Aguardando 2s antes de retry...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
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
      results,
      responseMeta: {
        function: 'update-bots-greeting',
        version: FUNCTION_VERSION,
        timestamp: new Date().toISOString()
      }
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
