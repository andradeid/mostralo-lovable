import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GetInvoiceReceiptRequest {
  invoice_id: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { invoice_id }: GetInvoiceReceiptRequest = await req.json();

    if (!invoice_id) {
      return new Response(
        JSON.stringify({ error: 'invoice_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🧾 Buscando recibo público da fatura ${invoice_id}`);

    const { data: invoice, error } = await supabase
      .from('subscription_invoices')
      .select(`
        id,
        store_id,
        plan_id,
        amount,
        due_date,
        paid_at,
        payment_status,
        stores:store_id(name),
        plans:plan_id(name)
      `)
      .eq('id', invoice_id)
      .single();

    if (error || !invoice) {
      console.error('❌ Fatura não encontrada:', error);
      return new Response(
        JSON.stringify({ error: 'Fatura não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (invoice.payment_status !== 'paid') {
      console.warn(`⚠️ Fatura ${invoice_id} não está paga: ${invoice.payment_status}`);
      return new Response(
        JSON.stringify({
          error: 'Fatura não está paga',
          payment_status: invoice.payment_status,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, invoice }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Erro interno:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
