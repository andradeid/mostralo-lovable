import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoice_id, pix_txid, pix_copia_cola, pix_qrcode_base64, pix_expires_at } = await req.json();

    console.log('📝 Atualizando PIX para fatura:', invoice_id);
    console.log('📝 txid:', pix_txid);

    // Validações
    if (!invoice_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'invoice_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pix_txid) {
      return new Response(
        JSON.stringify({ success: false, error: 'pix_txid é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase com service_role para bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar se a fatura existe e está pendente
    const { data: invoice, error: fetchError } = await supabase
      .from('subscription_invoices')
      .select('id, payment_status')
      .eq('id', invoice_id)
      .single();

    if (fetchError || !invoice) {
      console.error('❌ Fatura não encontrada:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: 'Fatura não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (invoice.payment_status === 'paid') {
      console.log('⚠️ Fatura já paga, ignorando atualização');
      return new Response(
        JSON.stringify({ success: true, message: 'Fatura já está paga' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar campos PIX
    const updateData: Record<string, string | null> = {
      pix_txid,
    };

    if (pix_copia_cola) updateData.pix_copia_cola = pix_copia_cola;
    if (pix_qrcode_base64) updateData.pix_qrcode_base64 = pix_qrcode_base64;
    if (pix_expires_at) updateData.pix_expires_at = pix_expires_at;

    const { error: updateError } = await supabase
      .from('subscription_invoices')
      .update(updateData)
      .eq('id', invoice_id);

    if (updateError) {
      console.error('❌ Erro ao atualizar fatura:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao atualizar fatura' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Fatura atualizada com sucesso');

    return new Response(
      JSON.stringify({ success: true, message: 'Dados PIX atualizados com sucesso' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro geral:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
