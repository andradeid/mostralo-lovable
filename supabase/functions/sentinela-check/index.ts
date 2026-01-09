import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
}

interface Order {
  id: string;
  store_id: string;
  customer_id: string;
  created_at: string;
  items: OrderItem[] | null;
}

interface SentinelaRule {
  id: string;
  store_id: string;
  product_id: string | null;
  category_id: string | null;
  recurrence_days: number;
  reminder_days_before: number;
  message_template: string | null;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
  category_id: string | null;
  recurrence_days: number | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('[SENTINELA-CHECK] Iniciando verificação de lembretes...');

    // 1. Buscar lojas com SENTINELA ativado
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, name, slug, sentinela_default_template')
      .eq('sentinela_enabled', true)
      .eq('status', 'active');

    if (storesError) {
      console.error('[SENTINELA-CHECK] Erro ao buscar lojas:', storesError);
      throw storesError;
    }

    if (!stores || stores.length === 0) {
      console.log('[SENTINELA-CHECK] Nenhuma loja com SENTINELA ativado');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Nenhuma loja com SENTINELA ativado',
        stores_checked: 0,
        reminders_created: 0
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`[SENTINELA-CHECK] ${stores.length} lojas com SENTINELA ativado`);
    let totalRemindersCreated = 0;

    for (const store of stores) {
      console.log(`[SENTINELA-CHECK] Processando loja: ${store.name} (${store.id})`);

      // 2. Buscar regras ativas da loja
      const { data: rules, error: rulesError } = await supabase
        .from('sentinela_rules')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_active', true);

      if (rulesError) {
        console.error(`[SENTINELA-CHECK] Erro ao buscar regras da loja ${store.id}:`, rulesError);
        continue;
      }

      if (!rules || rules.length === 0) {
        // Se não tem regras específicas, usar recurrence_days dos produtos
        const { data: productsWithRecurrence, error: productsError } = await supabase
          .from('products')
          .select('id, name, category_id, recurrence_days')
          .eq('store_id', store.id)
          .not('recurrence_days', 'is', null);

        if (productsError || !productsWithRecurrence?.length) {
          console.log(`[SENTINELA-CHECK] Loja ${store.id} sem regras ou produtos com recorrência`);
          continue;
        }

        // Processar produtos com recurrence_days
        for (const product of productsWithRecurrence) {
          const remindersCreated = await processProductRecurrence(
            supabase, store, product, 3, store.sentinela_default_template
          );
          totalRemindersCreated += remindersCreated;
        }
      } else {
        // Processar regras específicas
        for (const rule of rules as SentinelaRule[]) {
          const remindersCreated = await processRule(supabase, store, rule);
          totalRemindersCreated += remindersCreated;
        }
      }
    }

    console.log(`[SENTINELA-CHECK] Concluído. ${totalRemindersCreated} lembretes criados.`);

    return new Response(JSON.stringify({
      success: true,
      stores_checked: stores.length,
      reminders_created: totalRemindersCreated
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[SENTINELA-CHECK] Erro:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});

async function processRule(supabase: any, store: any, rule: SentinelaRule): Promise<number> {
  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setDate(targetDate.getDate() - (rule.recurrence_days - rule.reminder_days_before));

  console.log(`[SENTINELA-CHECK] Processando regra ${rule.id}, buscando pedidos de ${targetDate.toISOString().split('T')[0]}`);

  // Buscar pedidos que contêm o produto/categoria da regra
  let ordersQuery = supabase
    .from('orders')
    .select(`
      id,
      store_id,
      customer_id,
      created_at,
      items
    `)
    .eq('store_id', store.id)
    .gte('created_at', targetDate.toISOString().split('T')[0])
    .lt('created_at', new Date(targetDate.getTime() + 86400000).toISOString().split('T')[0])
    .in('status', ['concluido']);

  const { data: orders, error: ordersError } = await ordersQuery;

  if (ordersError) {
    console.error(`[SENTINELA-CHECK] Erro ao buscar pedidos:`, ordersError);
    return 0;
  }

  if (!orders || orders.length === 0) {
    return 0;
  }

  let remindersCreated = 0;

  for (const order of orders as Order[]) {
    // Verificar se o pedido contém o produto da regra
    const items = order.items || [];
    let matchingProduct: OrderItem | undefined;

    if (rule.product_id) {
      matchingProduct = items.find((item: OrderItem) => item.product_id === rule.product_id);
    } else if (rule.category_id) {
      // Para categoria, precisamos verificar se algum produto do pedido pertence à categoria
      const productIds = items.map((item: OrderItem) => item.product_id);
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from('products')
          .select('id, name')
          .in('id', productIds)
          .eq('category_id', rule.category_id);
        
        if (products && products.length > 0) {
          matchingProduct = items.find((item: OrderItem) => 
            products.some((p: any) => p.id === item.product_id)
          );
        }
      }
    }

    if (!matchingProduct) continue;

    // Verificar se já existe lembrete pendente para este cliente/produto
    const { data: existingReminder } = await supabase
      .from('sentinela_reminders')
      .select('id')
      .eq('customer_id', order.customer_id)
      .eq('product_id', rule.product_id || matchingProduct.product_id)
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
        product_id: rule.product_id || matchingProduct.product_id,
        order_id: order.id,
        rule_id: rule.id,
        scheduled_for: scheduledFor.toISOString().split('T')[0],
        status: 'pending'
      });

    if (insertError) {
      console.error(`[SENTINELA-CHECK] Erro ao criar lembrete:`, insertError);
    } else {
      remindersCreated++;
      console.log(`[SENTINELA-CHECK] Lembrete criado para cliente ${order.customer_id}`);
    }
  }

  return remindersCreated;
}

async function processProductRecurrence(
  supabase: any, 
  store: any, 
  product: Product, 
  reminderDaysBefore: number,
  defaultTemplate: string | null
): Promise<number> {
  if (!product.recurrence_days) return 0;

  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setDate(targetDate.getDate() - (product.recurrence_days - reminderDaysBefore));

  console.log(`[SENTINELA-CHECK] Processando produto ${product.name}, buscando pedidos de ${targetDate.toISOString().split('T')[0]}`);

  // Buscar pedidos que contêm o produto
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(`
      id,
      store_id,
      customer_id,
      created_at,
      items
    `)
    .eq('store_id', store.id)
    .gte('created_at', targetDate.toISOString().split('T')[0])
    .lt('created_at', new Date(targetDate.getTime() + 86400000).toISOString().split('T')[0])
    .in('status', ['concluido']);

  if (ordersError || !orders || orders.length === 0) {
    return 0;
  }

  let remindersCreated = 0;

  for (const order of orders as Order[]) {
    const items = order.items || [];
    const hasProduct = items.some((item: OrderItem) => item.product_id === product.id);

    if (!hasProduct) continue;

    // Verificar se já existe lembrete pendente
    const { data: existingReminder } = await supabase
      .from('sentinela_reminders')
      .select('id')
      .eq('customer_id', order.customer_id)
      .eq('product_id', product.id)
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
        product_id: product.id,
        order_id: order.id,
        scheduled_for: scheduledFor.toISOString().split('T')[0],
        status: 'pending'
      });

    if (insertError) {
      console.error(`[SENTINELA-CHECK] Erro ao criar lembrete:`, insertError);
    } else {
      remindersCreated++;
    }
  }

  return remindersCreated;
}
