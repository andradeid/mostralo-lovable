import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateStatusRequest {
  invoice_id: string;
  payment_status: 'pending' | 'paid' | 'cancelled' | 'overdue';
  payment_method?: 'pix' | 'boleto' | 'manual';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📝 Atualizando status de fatura externa...');

    const { invoice_id, payment_status, payment_method } = await req.json() as UpdateStatusRequest;

    // Validação
    if (!invoice_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'invoice_id é obrigatório' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const validStatuses = ['pending', 'paid', 'cancelled', 'overdue'];
    if (!validStatuses.includes(payment_status)) {
      return new Response(
        JSON.stringify({ success: false, error: `Status inválido. Use: ${validStatuses.join(', ')}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Initialize Supabase client with service role key (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar se a fatura existe
    const { data: existingInvoice, error: fetchError } = await supabase
      .from('external_invoices')
      .select('id, payment_status')
      .eq('id', invoice_id)
      .single();

    if (fetchError || !existingInvoice) {
      console.error('❌ Fatura não encontrada:', invoice_id);
      return new Response(
        JSON.stringify({ success: false, error: 'Fatura não encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Se já está no status desejado, retornar sucesso
    if (existingInvoice.payment_status === payment_status) {
      console.log(`ℹ️ Fatura ${invoice_id} já está com status: ${payment_status}`);
      return new Response(
        JSON.stringify({ success: true, message: 'Status já atualizado', invoice_id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Preparar dados de atualização
    const updateData: Record<string, any> = {
      payment_status,
      updated_at: new Date().toISOString(),
    };

    // Se marcando como pago, adicionar data de pagamento
    if (payment_status === 'paid') {
      updateData.paid_at = new Date().toISOString();
      if (payment_method) {
        updateData.payment_method = payment_method;
      }
    }

    // Atualizar fatura
    const { error: updateError } = await supabase
      .from('external_invoices')
      .update(updateData)
      .eq('id', invoice_id);

    if (updateError) {
      console.error('❌ Erro ao atualizar fatura:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log(`✅ Fatura ${invoice_id} atualizada para status: ${payment_status}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Status atualizado com sucesso',
        invoice_id,
        payment_status,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('❌ Erro:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Erro interno' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
