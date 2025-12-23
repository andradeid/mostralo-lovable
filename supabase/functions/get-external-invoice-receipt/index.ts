import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GetExternalInvoiceReceiptRequest {
  invoice_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { invoice_id } = await req.json() as GetExternalInvoiceReceiptRequest;

    if (!invoice_id) {
      return new Response(
        JSON.stringify({ error: 'ID da fatura é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[get-external-invoice-receipt] Buscando fatura externa: ${invoice_id}`);

    // Buscar fatura com dados do cliente e serviço
    const { data: invoice, error: invoiceError } = await supabase
      .from('external_invoices')
      .select(`
        id,
        invoice_number,
        description,
        amount,
        due_date,
        paid_at,
        payment_status,
        payment_method,
        is_recurring,
        recurrence_type,
        recurrence_current,
        recurrence_count,
        pix_copia_cola,
        boleto_linha_digitavel,
        external_clients (
          id,
          name,
          email,
          phone,
          document
        ),
        external_services (
          id,
          name
        )
      `)
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoice) {
      console.error('[get-external-invoice-receipt] Fatura não encontrada:', invoiceError);
      return new Response(
        JSON.stringify({ error: 'Fatura não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se está paga
    if (invoice.payment_status !== 'paid') {
      console.log('[get-external-invoice-receipt] Fatura não está paga');
      return new Response(
        JSON.stringify({ error: 'Fatura ainda não foi paga', invoice: { id: invoice.id, payment_status: invoice.payment_status } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[get-external-invoice-receipt] Fatura encontrada e paga, retornando recibo');

    return new Response(
      JSON.stringify({ invoice }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[get-external-invoice-receipt] Erro:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
