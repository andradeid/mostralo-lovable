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

interface Store {
  id: string;
  name: string;
  slug: string;
  sentinela_default_template: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface Product {
  id: string;
  name: string;
}

interface WhatsAppInstance {
  id: string;
  phone_number: string;
  instance_name: string;
  status: string;
}

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

    console.log(`[SENTINELA-SEND] ${reminders.length} lembretes para processar`);

    let sent = 0;
    let failed = 0;

    for (const reminder of reminders as Reminder[]) {
      try {
        const result = await sendReminder(supabase, reminder);
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

async function sendReminder(supabase: any, reminder: Reminder): Promise<boolean> {
  console.log(`[SENTINELA-SEND] Processando lembrete ${reminder.id}`);

  // Buscar dados da loja
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('id, name, slug, sentinela_default_template')
    .eq('id', reminder.store_id)
    .single();

  if (storeError || !store) {
    console.error(`[SENTINELA-SEND] Loja não encontrada: ${reminder.store_id}`);
    return false;
  }

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
  let messageTemplate = store.sentinela_default_template;

  if (reminder.rule_id) {
    const { data: rule } = await supabase
      .from('sentinela_rules')
      .select('message_template')
      .eq('id', reminder.rule_id)
      .single();

    if (rule?.message_template) {
      messageTemplate = rule.message_template;
    }
  }

  // Processar template
  const firstName = customer.name.split(' ')[0];
  const storeLink = `https://mostralo.com.br/${store.slug}`;

  const message = messageTemplate
    .replace(/{nome}/g, customer.name)
    .replace(/{primeiro_nome}/g, firstName)
    .replace(/{produto}/g, product.name)
    .replace(/{loja}/g, store.name)
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
  const evolutionUrl = `${evolutionConfig.api_url}/message/sendText/${instance.instance_name}`;
  
  const evolutionResponse = await fetch(evolutionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': evolutionConfig.api_key
    },
    body: JSON.stringify({
      number: phoneNumber,
      text: message
    })
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
  // Remove caracteres não numéricos
  let cleaned = phone.replace(/\D/g, '');
  
  // Adiciona código do país se não tiver
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  
  return cleaned;
}
