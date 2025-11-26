import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting monthly invoice generation...');

    // Buscar lojas com plano ativo
    const { data: stores, error: storesError } = await supabaseClient
      .from('stores')
      .select(`
        id,
        plan_id,
        subscription_expires_at,
        plans (
          price,
          billing_cycle
        )
      `)
      .not('plan_id', 'is', null)
      .eq('status', 'active');

    if (storesError) {
      console.error('Error fetching stores:', storesError);
      throw storesError;
    }

    if (!stores || stores.length === 0) {
      console.log('No active stores found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          invoicesCreated: 0,
          message: 'No active stores to generate invoices for' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    console.log(`Found ${stores.length} active stores`);
    let created = 0;

    for (const store of stores) {
      if (!store.subscription_expires_at) {
        console.log(`Store ${store.id} has no expiration date, skipping`);
        continue;
      }

      // Verificar se já existe invoice para essa data
      const { data: existingInvoice } = await supabaseClient
        .from('subscription_invoices')
        .select('id')
        .eq('store_id', store.id)
        .eq('due_date', store.subscription_expires_at)
        .single();

      if (!existingInvoice) {
        // Criar nova invoice com o valor correto do plano
        const { error: insertError } = await supabaseClient
          .from('subscription_invoices')
          .insert({
            store_id: store.id,
            plan_id: store.plan_id,
            amount: Number(store.plans.price), // Garantir que é número
            due_date: store.subscription_expires_at,
            payment_status: 'pending'
          });

        if (insertError) {
          console.error(`Error creating invoice for store ${store.id}:`, insertError);
        } else {
          console.log(`Created invoice for store ${store.id}`);
          created++;
        }
      } else {
        console.log(`Invoice already exists for store ${store.id}`);
      }
    }

    console.log(`Invoice generation completed. Created: ${created}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        invoicesCreated: created,
        totalStores: stores.length,
        message: `${created} invoices created successfully out of ${stores.length} stores` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in generate-monthly-invoices:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
