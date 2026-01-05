import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ManualTriggerRequest {
  action: 'check' | 'send';
  storeId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { action, storeId }: ManualTriggerRequest = await req.json();

    if (!action || !storeId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'action e storeId são obrigatórios' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[SENTINELA-MANUAL] Iniciando ação ${action} para loja ${storeId}`);

    // Verificar se a loja existe e tem SENTINELA ativado
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name, slug, sentinela_enabled, sentinela_default_template')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Loja não encontrada' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!store.sentinela_enabled) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'SENTINELA não está ativado para esta loja' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'check') {
      const result = await runCheck(supabase, store);
      
      // Registrar log de execução
      await supabase
        .from('sentinela_logs')
        .insert({
          store_id: storeId,
          action: 'check',
          result: result,
          triggered_by: 'manual'
        });

      return new Response(JSON.stringify({
        success: true,
        action: 'check',
        ...result
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } else if (action === 'send') {
      const result = await runSend(supabase, storeId);
      
      // Registrar log de execução
      await supabase
        .from('sentinela_logs')
        .insert({
          store_id: storeId,
          action: 'send',
          result: result,
          triggered_by: 'manual'
        });

      return new Response(JSON.stringify({
        success: true,
        action: 'send',
        ...result
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } else {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Ação inválida. Use "check" ou "send"' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[SENTINELA-MANUAL] Erro:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Função para verificar e criar lembretes
async function runCheck(supabase: any, store: any): Promise<{ reminders_created: number; message: string }> {
  console.log(`[SENTINELA-MANUAL] Executando CHECK para loja ${store.name}`);

  let totalRemindersCreated = 0;

  // Buscar regras ativas da loja
  const { data: rules, error: rulesError } = await supabase
    .from('sentinela_rules')
    .select('*')
    .eq('store_id', store.id)
    .eq('is_active', true);

  if (rulesError) {
    console.error(`[SENTINELA-MANUAL] Erro ao buscar regras:`, rulesError);
    throw rulesError;
  }

  if (!rules || rules.length === 0) {
    // Se não tem regras específicas, usar recurrence_days dos produtos
    const { data: productsWithRecurrence } = await supabase
      .from('products')
      .select('id, name, category_id, recurrence_days')
      .eq('store_id', store.id)
      .not('recurrence_days', 'is', null);

    if (!productsWithRecurrence?.length) {
      return { 
        reminders_created: 0, 
        message: 'Nenhuma regra ativa ou produto com recorrência configurada' 
      };
    }

    for (const product of productsWithRecurrence) {
      const count = await processProductRecurrence(supabase, store, product, 3);
      totalRemindersCreated += count;
    }
  } else {
    for (const rule of rules) {
      const count = await processRule(supabase, store, rule);
      totalRemindersCreated += count;
    }
  }

  return { 
    reminders_created: totalRemindersCreated,
    message: totalRemindersCreated > 0 
      ? `${totalRemindersCreated} lembrete(s) criado(s)` 
      : 'Nenhum novo lembrete necessário'
  };
}

// Função para enviar lembretes pendentes
async function runSend(supabase: any, storeId: string): Promise<{ sent: number; failed: number; message: string }> {
  console.log(`[SENTINELA-MANUAL] Executando SEND para loja ${storeId}`);

  const today = new Date().toISOString().split('T')[0];

  // Buscar lembretes pendentes da loja
  const { data: reminders, error: remindersError } = await supabase
    .from('sentinela_reminders')
    .select('*')
    .eq('store_id', storeId)
    .eq('status', 'pending')
    .lte('scheduled_for', today)
    .limit(50);

  if (remindersError) {
    console.error(`[SENTINELA-MANUAL] Erro ao buscar lembretes:`, remindersError);
    throw remindersError;
  }

  if (!reminders || reminders.length === 0) {
    return { sent: 0, failed: 0, message: 'Nenhum lembrete pendente para enviar' };
  }

  let sent = 0;
  let failed = 0;

  for (const reminder of reminders) {
    try {
      const result = await sendReminder(supabase, reminder, storeId);
      if (result) {
        sent++;
      } else {
        failed++;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error(`[SENTINELA-MANUAL] Erro ao enviar lembrete ${reminder.id}:`, error);
      failed++;
      
      await supabase
        .from('sentinela_reminders')
        .update({ 
          status: 'failed',
          error_message: errorMessage
        })
        .eq('id', reminder.id);
    }
  }

  return { 
    sent, 
    failed, 
    message: `${sent} enviado(s), ${failed} falha(s)` 
  };
}

// Processar regra específica
async function processRule(supabase: any, store: any, rule: any): Promise<number> {
  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setDate(targetDate.getDate() - (rule.recurrence_days - rule.reminder_days_before));

  console.log(`[SENTINELA-MANUAL] Processando regra ${rule.id}, buscando pedidos de ${targetDate.toISOString().split('T')[0]}`);

  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, store_id, customer_id, created_at, items')
    .eq('store_id', store.id)
    .gte('created_at', targetDate.toISOString().split('T')[0])
    .lt('created_at', new Date(targetDate.getTime() + 86400000).toISOString().split('T')[0])
    .in('status', ['concluido', 'entregue']);

  if (ordersError || !orders || orders.length === 0) {
    return 0;
  }

  let remindersCreated = 0;

  for (const order of orders) {
    const items = order.items || [];
    let matchingProductId: string | null = null;

    if (rule.product_id) {
      const match = items.find((item: any) => item.product_id === rule.product_id);
      if (match) matchingProductId = rule.product_id;
    } else if (rule.category_id) {
      const productIds = items.map((item: any) => item.product_id);
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from('products')
          .select('id')
          .in('id', productIds)
          .eq('category_id', rule.category_id);
        
        if (products && products.length > 0) {
          matchingProductId = products[0].id;
        }
      }
    }

    if (!matchingProductId) continue;

    // Verificar se já existe lembrete pendente
    const { data: existingReminder } = await supabase
      .from('sentinela_reminders')
      .select('id')
      .eq('customer_id', order.customer_id)
      .eq('product_id', matchingProductId)
      .eq('status', 'pending')
      .single();

    if (existingReminder) continue;

    // Criar lembrete
    const scheduledFor = new Date();
    scheduledFor.setHours(0, 0, 0, 0);

    const { error: insertError } = await supabase
      .from('sentinela_reminders')
      .insert({
        store_id: store.id,
        customer_id: order.customer_id,
        product_id: matchingProductId,
        order_id: order.id,
        rule_id: rule.id,
        scheduled_for: scheduledFor.toISOString().split('T')[0],
        status: 'pending'
      });

    if (!insertError) {
      remindersCreated++;
    }
  }

  return remindersCreated;
}

// Processar recorrência do produto
async function processProductRecurrence(supabase: any, store: any, product: any, reminderDaysBefore: number): Promise<number> {
  if (!product.recurrence_days) return 0;

  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setDate(targetDate.getDate() - (product.recurrence_days - reminderDaysBefore));

  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, store_id, customer_id, created_at, items')
    .eq('store_id', store.id)
    .gte('created_at', targetDate.toISOString().split('T')[0])
    .lt('created_at', new Date(targetDate.getTime() + 86400000).toISOString().split('T')[0])
    .in('status', ['concluido', 'entregue']);

  if (ordersError || !orders || orders.length === 0) {
    return 0;
  }

  let remindersCreated = 0;

  for (const order of orders) {
    const items = order.items || [];
    const hasProduct = items.some((item: any) => item.product_id === product.id);

    if (!hasProduct) continue;

    const { data: existingReminder } = await supabase
      .from('sentinela_reminders')
      .select('id')
      .eq('customer_id', order.customer_id)
      .eq('product_id', product.id)
      .eq('status', 'pending')
      .single();

    if (existingReminder) continue;

    const scheduledFor = new Date();
    scheduledFor.setHours(0, 0, 0, 0);

    const { error: insertError } = await supabase
      .from('sentinela_reminders')
      .insert({
        store_id: store.id,
        customer_id: order.customer_id,
        product_id: product.id,
        order_id: order.id,
        scheduled_for: scheduledFor.toISOString().split('T')[0],
        status: 'pending'
      });

    if (!insertError) {
      remindersCreated++;
    }
  }

  return remindersCreated;
}

// Enviar lembrete individual
async function sendReminder(supabase: any, reminder: any, storeId: string): Promise<boolean> {
  console.log(`[SENTINELA-MANUAL] Enviando lembrete ${reminder.id}`);

  // Buscar dados da loja
  const { data: store } = await supabase
    .from('stores')
    .select('id, name, slug, sentinela_default_template')
    .eq('id', storeId)
    .single();

  if (!store) return false;

  // Buscar dados do cliente
  const { data: customer } = await supabase
    .from('customers')
    .select('id, name, phone')
    .eq('id', reminder.customer_id)
    .single();

  if (!customer || !customer.phone) return false;

  // Buscar dados do produto
  const { data: product } = await supabase
    .from('products')
    .select('id, name')
    .eq('id', reminder.product_id)
    .single();

  if (!product) return false;

  // Buscar template
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

  // Buscar instância WhatsApp
  const { data: instance } = await supabase
    .from('whatsapp_instances')
    .select('id, phone_number, instance_name, status')
    .eq('store_id', storeId)
    .eq('status', 'connected')
    .single();

  if (!instance) {
    console.error(`[SENTINELA-MANUAL] Instância WhatsApp não encontrada`);
    return false;
  }

  // Buscar config Evolution API
  const { data: evolutionConfig } = await supabase
    .from('evolution_config')
    .select('api_url, api_key')
    .eq('is_active', true)
    .single();

  if (!evolutionConfig) {
    console.error(`[SENTINELA-MANUAL] Configuração Evolution não encontrada`);
    return false;
  }

  // Normalizar telefone
  let phone = customer.phone.replace(/\D/g, '');
  if (!phone.startsWith('55')) phone = '55' + phone;

  // Enviar mensagem
  const evolutionUrl = `${evolutionConfig.api_url}/message/sendText/${instance.instance_name}`;
  
  const response = await fetch(evolutionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': evolutionConfig.api_key
    },
    body: JSON.stringify({
      number: phone,
      text: message
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[SENTINELA-MANUAL] Erro Evolution:`, errorText);
    
    await supabase
      .from('sentinela_reminders')
      .update({ 
        status: 'failed',
        error_message: `Evolution API error: ${errorText}`
      })
      .eq('id', reminder.id);
    
    return false;
  }

  // Atualizar lembrete
  await supabase
    .from('sentinela_reminders')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      message_sent: message
    })
    .eq('id', reminder.id);

  console.log(`[SENTINELA-MANUAL] Lembrete ${reminder.id} enviado com sucesso`);
  return true;
}
