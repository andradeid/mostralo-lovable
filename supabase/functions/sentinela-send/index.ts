import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Reminder {
  id: string;
  store_id: string;
  customer_id: string;
  product_id: string;
  order_id: string;
  rule_id: string | null;
  scheduled_for: string;
  status: string;
}

interface StoreConfig {
  id: string;
  name: string;
  slug: string;
  sentinela_default_template: string;
  sentinela_send_hour: number | null;
  sentinela_send_days: string[] | null;
  sentinela_timezone: string | null;
  sentinela_paused: boolean | null;
  sentinela_pause_start: string | null;
  sentinela_pause_end: string | null;
  sentinela_interval_seconds: number | null;
  sentinela_pause_after_messages: number | null;
  sentinela_pause_duration_seconds: number | null;
}

// Função de delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Intervalo humanizado (varia entre 75% e 100% do valor base)
const getRandomInterval = (base: number): number => {
  const minPercent = 0.75;
  const maxPercent = 1.00;
  return Math.floor(base * (minPercent + Math.random() * (maxPercent - minPercent)));
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('[SENTINELA-SEND] Iniciando envio de lembretes...');

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    // 1. Buscar lembretes pendentes para hoje
    const { data: reminders, error: remindersError } = await supabase
      .from('sentinela_reminders')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', today)
      .limit(50);

    if (remindersError) {
      console.error('[SENTINELA-SEND] Erro ao buscar lembretes:', remindersError);
      throw remindersError;
    }

    if (!reminders || reminders.length === 0) {
      console.log('[SENTINELA-SEND] Nenhum lembrete pendente para hoje');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Nenhum lembrete pendente',
        sent: 0,
        failed: 0
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Agrupar lembretes por loja
    const remindersByStore: Record<string, Reminder[]> = {};
    for (const reminder of reminders as Reminder[]) {
      if (!remindersByStore[reminder.store_id]) {
        remindersByStore[reminder.store_id] = [];
      }
      remindersByStore[reminder.store_id].push(reminder);
    }

    // Verificar configurações de cada loja (agendamento + pausa)
    const storeConfigs: Record<string, StoreConfig & { shouldSend: boolean }> = {};
    
    for (const storeId of Object.keys(remindersByStore)) {
      const { data: storeData } = await supabase
        .from('stores')
        .select(`
          id, name, slug, sentinela_default_template,
          sentinela_send_hour, sentinela_send_days, sentinela_timezone,
          sentinela_paused, sentinela_pause_start, sentinela_pause_end,
          sentinela_interval_seconds, sentinela_pause_after_messages, sentinela_pause_duration_seconds
        `)
        .eq('id', storeId)
        .single();

      if (!storeData) {
        storeConfigs[storeId] = { shouldSend: false } as any;
        continue;
      }

      const config = storeData as StoreConfig;
      
      // Verificar se está pausado
      const isPaused = config.sentinela_paused || 
        (config.sentinela_pause_start && config.sentinela_pause_end &&
         now >= new Date(config.sentinela_pause_start) && 
         now <= new Date(config.sentinela_pause_end));

      if (isPaused) {
        console.log(`[SENTINELA-SEND] Loja ${storeId} está PAUSADA. Pulando...`);
        storeConfigs[storeId] = { ...config, shouldSend: false };
        continue;
      }

      // Verificar agendamento (dia/hora)
      const timezone = config.sentinela_timezone || 'America/Sao_Paulo';
      const sendHour = config.sentinela_send_hour ?? 10;
      const sendDays = config.sentinela_send_days ?? ['mon', 'tue', 'wed', 'thu', 'fri'];

      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        hour12: false,
        weekday: 'short'
      });
      const parts = formatter.formatToParts(now);
      const currentHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
      const currentDay = parts.find(p => p.type === 'weekday')?.value?.toLowerCase().slice(0, 3) || '';

      const shouldSend = sendDays.includes(currentDay) && currentHour === sendHour;
      storeConfigs[storeId] = { ...config, shouldSend };

      console.log(`[SENTINELA-SEND] Loja ${storeId}: Dia=${currentDay}, Hora=${currentHour}, Configurado=${sendHour}h nos dias [${sendDays.join(',')}], Enviar=${shouldSend}`);
    }

    // Filtrar lembretes apenas das lojas que devem enviar agora
    const remindersToSend = (reminders as Reminder[]).filter(r => storeConfigs[r.store_id]?.shouldSend !== false);

    console.log(`[SENTINELA-SEND] ${remindersToSend.length} lembretes para processar (de ${reminders.length} total)`);

    let sent = 0;
    let failed = 0;

    // Processar lembretes por loja (para aplicar anti-banimento por loja)
    for (const storeId of Object.keys(remindersByStore)) {
      const storeConfig = storeConfigs[storeId];
      if (!storeConfig?.shouldSend) continue;

      const storeReminders = remindersByStore[storeId];
      
      // Configurações anti-banimento
      const intervalSeconds = storeConfig.sentinela_interval_seconds ?? 60;
      const pauseAfter = storeConfig.sentinela_pause_after_messages ?? 10;
      const pauseDuration = storeConfig.sentinela_pause_duration_seconds ?? 120;

      console.log(`[SENTINELA-SEND] Loja ${storeId}: ${storeReminders.length} lembretes, intervalo=${intervalSeconds}s, pausa após ${pauseAfter} msgs por ${pauseDuration}s`);

      let messageCount = 0;

      for (const reminder of storeReminders) {
        messageCount++;

        // Aplicar pausa a cada X mensagens (exceto na primeira)
        if (pauseAfter > 0 && messageCount > 1 && (messageCount - 1) % pauseAfter === 0) {
          console.log(`[SENTINELA-SEND] Pausa de ${pauseDuration}s após ${messageCount - 1} mensagens da loja ${storeId}`);
          await delay(pauseDuration * 1000);
        }

        try {
          const result = await sendReminder(supabase, reminder, storeConfig);
          if (result) {
            sent++;
          } else {
            failed++;
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          console.error(`[SENTINELA-SEND] Erro ao enviar lembrete ${reminder.id}:`, error);
          failed++;
          
          // Atualizar status para failed
          await supabase
            .from('sentinela_reminders')
            .update({ 
              status: 'failed',
              error_message: errorMessage
            })
            .eq('id', reminder.id);
        }

        // Intervalo humanizado entre mensagens (não aplica após a última)
        if (messageCount < storeReminders.length) {
          const randomInterval = getRandomInterval(intervalSeconds);
          console.log(`[SENTINELA-SEND] Aguardando ${randomInterval}s antes da próxima mensagem`);
          await delay(randomInterval * 1000);
        }
      }
    }

    console.log(`[SENTINELA-SEND] Concluído. Enviados: ${sent}, Falhas: ${failed}`);

    return new Response(JSON.stringify({
      success: true,
      sent,
      failed
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[SENTINELA-SEND] Erro:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});

async function sendReminder(supabase: any, reminder: Reminder, storeConfig: StoreConfig): Promise<boolean> {
  console.log(`[SENTINELA-SEND] Processando lembrete ${reminder.id}`);

  // Buscar dados do cliente
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id, name, phone')
    .eq('id', reminder.customer_id)
    .single();

  if (customerError || !customer || !customer.phone) {
    console.error(`[SENTINELA-SEND] Cliente não encontrado ou sem telefone: ${reminder.customer_id}`);
    return false;
  }

  // Buscar dados do produto
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, name')
    .eq('id', reminder.product_id)
    .single();

  if (productError || !product) {
    console.error(`[SENTINELA-SEND] Produto não encontrado: ${reminder.product_id}`);
    return false;
  }

  // Buscar template da regra ou usar o padrão da loja
  let messageTemplate = storeConfig.sentinela_default_template;
  let imageUrl: string | null = null;

  if (reminder.rule_id) {
    const { data: rule } = await supabase
      .from('sentinela_rules')
      .select('message_template, image_url, template_id')
      .eq('id', reminder.rule_id)
      .single();

    if (rule?.message_template) {
      messageTemplate = rule.message_template;
    }
    
    if (rule?.image_url) {
      imageUrl = rule.image_url;
    }
    
    if (rule?.template_id) {
      const { data: template } = await supabase
        .from('sentinela_templates')
        .select('content, image_url')
        .eq('id', rule.template_id)
        .single();
      
      if (template?.content) {
        messageTemplate = template.content;
      }
      if (!imageUrl && template?.image_url) {
        imageUrl = template.image_url;
      }
    }
  }

  // Processar template
  const firstName = customer.name.split(' ')[0];
  const storeLink = `https://mostralo.com.br/loja/${storeConfig.slug}`;

  const message = messageTemplate
    .replace(/{nome}/g, customer.name)
    .replace(/{primeiro_nome}/g, firstName)
    .replace(/{produto}/g, product.name)
    .replace(/{loja}/g, storeConfig.name)
    .replace(/{link_loja}/g, storeLink);

  // Buscar instância WhatsApp da loja
  const { data: instance, error: instanceError } = await supabase
    .from('whatsapp_instances')
    .select('id, phone_number, instance_name, status')
    .eq('store_id', reminder.store_id)
    .eq('status', 'connected')
    .single();

  if (instanceError || !instance) {
    console.error(`[SENTINELA-SEND] Instância WhatsApp não encontrada para loja ${reminder.store_id}`);
    return false;
  }

  // Buscar config da Evolution API
  const { data: evolutionConfig, error: configError } = await supabase
    .from('evolution_config')
    .select('api_url, api_key')
    .eq('is_active', true)
    .single();

  if (configError || !evolutionConfig) {
    console.error('[SENTINELA-SEND] Configuração Evolution API não encontrada');
    return false;
  }

  // Normalizar número do telefone
  const phoneNumber = normalizePhone(customer.phone);

  // Enviar mensagem via Evolution API
  let evolutionUrl: string;
  let evolutionBody: any;

  if (imageUrl) {
    evolutionUrl = `${evolutionConfig.api_url}/message/sendMedia/${instance.instance_name}`;
    evolutionBody = {
      number: phoneNumber,
      mediatype: 'image',
      media: imageUrl,
      caption: message
    };
    console.log(`[SENTINELA-SEND] Enviando imagem para ${phoneNumber}`);
  } else {
    evolutionUrl = `${evolutionConfig.api_url}/message/sendText/${instance.instance_name}`;
    evolutionBody = {
      number: phoneNumber,
      text: message
    };
  }
  
  const evolutionResponse = await fetch(evolutionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': evolutionConfig.api_key
    },
    body: JSON.stringify(evolutionBody)
  });

  if (!evolutionResponse.ok) {
    const errorText = await evolutionResponse.text();
    console.error(`[SENTINELA-SEND] Erro Evolution API:`, errorText);
    
    await supabase
      .from('sentinela_reminders')
      .update({ 
        status: 'failed',
        error_message: `Evolution API error: ${errorText}`
      })
      .eq('id', reminder.id);
    
    return false;
  }

  // Atualizar lembrete como enviado
  await supabase
    .from('sentinela_reminders')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      message_sent: message
    })
    .eq('id', reminder.id);

  console.log(`[SENTINELA-SEND] Lembrete ${reminder.id} enviado com sucesso para ${phoneNumber}`);
  return true;
}

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  
  return cleaned;
}