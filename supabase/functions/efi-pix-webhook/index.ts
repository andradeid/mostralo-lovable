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
    console.log('📥 Webhook EFI PIX recebido');

    // Parse webhook payload
    const payload = await req.json();
    console.log('📋 Payload:', JSON.stringify(payload, null, 2));

    // EFI sends an array of pix events
    const pixEvents = payload.pix || [];

    if (!Array.isArray(pixEvents) || pixEvents.length === 0) {
      console.log('⚠️ Nenhum evento PIX no payload');
      return new Response(
        JSON.stringify({ success: true, message: 'No events to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const processedEvents = [];

    for (const pixEvent of pixEvents) {
      const { txid, endToEndId, valor, horario } = pixEvent;

      console.log(`💰 Processando pagamento - txid: ${txid}, valor: ${valor}`);

      // Find payment_approval by pix_txid
      const { data: approval, error: approvalError } = await supabase
        .from('payment_approvals')
        .select('*')
        .eq('pix_txid', txid)
        .single();

      if (approvalError || !approval) {
        console.log(`⚠️ Aprovação não encontrada para txid: ${txid}`);
        processedEvents.push({ txid, status: 'not_found' });
        continue;
      }

      // Check if already approved
      if (approval.status === 'approved') {
        console.log(`ℹ️ Pagamento já processado: ${txid}`);
        processedEvents.push({ txid, status: 'already_processed' });
        continue;
      }

      // Update payment_approval status to approved (constraint doesn't allow 'paid')
      const { error: updateError } = await supabase
        .from('payment_approvals')
        .update({
          status: 'approved',
          payment_proof_url: `PIX confirmado via webhook - EndToEndId: ${endToEndId}`,
          admin_notes: `Pagamento PIX confirmado automaticamente em ${horario}. Valor: R$ ${valor}. EndToEndId: ${endToEndId}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', approval.id);

      if (updateError) {
        console.error(`❌ Erro ao atualizar aprovação ${approval.id}:`, updateError);
        processedEvents.push({ txid, status: 'update_error', error: updateError.message });
        continue;
      }

      console.log(`✅ Pagamento ${txid} marcado como pago`);

      // Optional: Auto-approve subscription if store_id exists
      if (approval.store_id) {
        // Get plan billing cycle to calculate expiration
        const { data: plan } = await supabase
          .from('plans')
          .select('billing_cycle')
          .eq('id', approval.plan_id)
          .single();

        let expirationDays = 30; // Default monthly
        if (plan?.billing_cycle === 'quarterly') expirationDays = 90;
        else if (plan?.billing_cycle === 'biannual') expirationDays = 180;
        else if (plan?.billing_cycle === 'annual') expirationDays = 365;

        // Update store status and subscription expiration
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + expirationDays);

        await supabase
          .from('stores')
          .update({
            status: 'active',
            subscription_expires_at: expirationDate.toISOString(),
          })
          .eq('id', approval.store_id);

        // Update profile approval status
        await supabase
          .from('profiles')
          .update({ approval_status: 'approved' })
          .eq('id', approval.user_id);

        console.log(`🏪 Loja ${approval.store_id} ativada automaticamente`);

        // Criar invoice para registro financeiro
        const { error: invoiceError } = await supabase
          .from('subscription_invoices')
          .insert({
            store_id: approval.store_id,
            plan_id: approval.plan_id,
            amount: approval.payment_amount,
            due_date: new Date().toISOString(),
            paid_at: new Date().toISOString(),
            payment_status: 'paid',
            payment_method: 'pix',
            notes: `Pagamento PIX confirmado automaticamente - EndToEndId: ${endToEndId}`,
            approved_at: new Date().toISOString(),
          });

        if (invoiceError) {
          console.error(`⚠️ Erro ao criar invoice:`, invoiceError);
        } else {
          console.log(`📄 Invoice criada para loja ${approval.store_id}`);
        }
      }

      processedEvents.push({ txid, status: 'success' });
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedEvents.length,
        events: processedEvents,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ Erro no webhook:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro ao processar webhook',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
