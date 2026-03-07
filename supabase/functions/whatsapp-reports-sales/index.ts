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

    // 1. Pedidos WhatsApp com detalhes
    const { data: whatsappOrders } = await supabase
      .from('orders')
      .select('id, total, status, created_at, payment_method, payment_status')
      .eq('store_id', store_id)
      .eq('source', 'whatsapp_chat')
      .gte('created_at', date_from)
      .lte('created_at', date_to)
      .order('created_at', { ascending: true });

    // 2. Todos os pedidos (para comparativo)
    const { data: allOrders } = await supabase
      .from('orders')
      .select('id, total, status, source, created_at')
      .eq('store_id', store_id)
      .gte('created_at', date_from)
      .lte('created_at', date_to);

    // 3. Itens dos pedidos WhatsApp (top produtos)
    const whatsappOrderIds = whatsappOrders?.map(o => o.id) || [];
    let topProducts: { name: string; quantity: number; revenue: number }[] = [];

    if (whatsappOrderIds.length > 0) {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_name, quantity, subtotal')
        .in('order_id', whatsappOrderIds);

      if (orderItems) {
        const productMap = new Map<string, { quantity: number; revenue: number }>();
        orderItems.forEach(item => {
          const existing = productMap.get(item.product_name) || { quantity: 0, revenue: 0 };
          productMap.set(item.product_name, {
            quantity: existing.quantity + item.quantity,
            revenue: existing.revenue + (item.subtotal || 0),
          });
        });
        topProducts = Array.from(productMap.entries())
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10);
      }
    }

    // 4. Faturamento por dia
    const revenueByDay: Record<string, number> = {};
    whatsappOrders?.filter(o => o.status !== 'cancelado').forEach(order => {
      const day = order.created_at.split('T')[0];
      revenueByDay[day] = (revenueByDay[day] || 0) + (order.total || 0);
    });

    // 5. Pedidos por status
    const ordersByStatus: Record<string, number> = {};
    whatsappOrders?.forEach(order => {
      ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
    });

    // 6. Comparativo canais
    const channelComparison = {
      whatsapp: whatsappOrders?.filter(o => o.status !== 'cancelado').reduce((s, o) => s + (o.total || 0), 0) || 0,
      manual: allOrders?.filter(o => o.source === 'manual' && o.status !== 'cancelado').reduce((s, o) => s + (o.total || 0), 0) || 0,
      whatsapp_bot: allOrders?.filter(o => o.source === 'whatsapp_bot' && o.status !== 'cancelado').reduce((s, o) => s + (o.total || 0), 0) || 0,
      website: allOrders?.filter(o => o.source === 'website' && o.status !== 'cancelado').reduce((s, o) => s + (o.total || 0), 0) || 0,
    };

    // 7. Ticket médio WhatsApp
    const validOrders = whatsappOrders?.filter(o => o.status !== 'cancelado') || [];
    const ticketMedio = validOrders.length > 0
      ? validOrders.reduce((s, o) => s + (o.total || 0), 0) / validOrders.length
      : 0;

    return new Response(JSON.stringify({
      totalOrders: whatsappOrders?.length || 0,
      totalRevenue: validOrders.reduce((s, o) => s + (o.total || 0), 0),
      ticketMedio: Math.round(ticketMedio * 100) / 100,
      revenueByDay,
      ordersByStatus,
      topProducts,
      channelComparison,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in whatsapp-reports-sales:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
