import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Cutoff: 48 hours ago
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    // 1. Normal orders (no scheduled_for): check created_at
    const { data: normalOrders, error: err1 } = await supabase
      .from('orders')
      .update({ status: 'concluido', updated_at: new Date().toISOString() })
      .not('status', 'in', '("concluido","cancelado")')
      .is('scheduled_for', null)
      .lt('created_at', cutoff)
      .select('id');

    // 2. Scheduled orders: check scheduled_for
    const { data: scheduledOrders, error: err2 } = await supabase
      .from('orders')
      .update({ status: 'concluido', updated_at: new Date().toISOString() })
      .not('status', 'in', '("concluido","cancelado")')
      .not('scheduled_for', 'is', null)
      .lt('scheduled_for', cutoff)
      .select('id');

    if (err1) console.error('Erro pedidos normais:', err1);
    if (err2) console.error('Erro pedidos agendados:', err2);

    const totalUpdated = (normalOrders?.length || 0) + (scheduledOrders?.length || 0);

    console.log(`Auto-complete: ${totalUpdated} pedidos marcados como concluído`);

    return new Response(
      JSON.stringify({ success: true, updated: totalUpdated }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro auto-complete-orders:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
