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

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Capturar IP do request
  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  
  let webhookLogId: string | null = null;
  let payload: any = null;

  try {
    console.log('📥 Webhook EFI PIX recebido');

    // Parse webhook payload
    payload = await req.json();
    console.log('📋 Payload:', JSON.stringify(payload, null, 2));

    // Inserir log inicial do webhook
    const { data: logEntry, error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        webhook_type: 'pix',
        source: 'efi-pix-webhook',
        event_type: 'payment_notification',
        payload,
        status: 'received',
        ip_address: ipAddress,
      })
      .select('id')
      .single();

    if (logEntry) {
      webhookLogId = logEntry.id;
      console.log(`📝 Log criado: ${webhookLogId}`);
    }

    // Atualizar para processing
    if (webhookLogId) {
      await supabase
        .from('webhook_logs')
        .update({ status: 'processing' })
        .eq('id', webhookLogId);
    }

    // EFI sends an array of pix events
    const pixEvents = payload.pix || [];

    if (!Array.isArray(pixEvents) || pixEvents.length === 0) {
      console.log('⚠️ Nenhum evento PIX no payload');
      
      // Atualizar log para success (vazio)
      if (webhookLogId) {
        await supabase
          .from('webhook_logs')
          .update({ 
            status: 'success', 
            processed_at: new Date().toISOString(),
            error_message: 'No events to process'
          })
          .eq('id', webhookLogId);
      }
      
      return new Response(
        JSON.stringify({ success: true, message: 'No events to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const processedEvents = [];

    for (const pixEvent of pixEvents) {
      const { txid, endToEndId, valor, horario } = pixEvent;

      console.log(`💰 Processando pagamento - txid: ${txid}, valor: ${valor}`);

      // 1. Primeiro, verificar se é um pedido (order)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, store_id, payment_status')
        .eq('payment_details->>pix_txid', txid)
        .maybeSingle();

      if (order && !orderError) {
        console.log(`🛒 Pedido encontrado: ${order.id}`);

        // Atualizar log com entidade relacionada
        if (webhookLogId) {
          await supabase
            .from('webhook_logs')
            .update({ 
              related_entity_type: 'order',
              related_entity_id: order.id
            })
            .eq('id', webhookLogId);
        }

        if (order.payment_status === 'paid') {
          console.log(`ℹ️ Pedido já pago: ${order.id}`);
          processedEvents.push({ txid, status: 'already_processed', type: 'order' });
          continue;
        }

        // Atualizar status do pedido
        const { error: updateOrderError } = await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            payment_details: {
              pix_txid: txid,
              endToEndId,
              valor,
              pago_em: horario,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);

        if (updateOrderError) {
          console.error(`❌ Erro ao atualizar pedido ${order.id}:`, updateOrderError);
          processedEvents.push({ txid, status: 'update_error', type: 'order', error: updateOrderError.message });
          continue;
        }

        console.log(`✅ Pedido ${order.id} marcado como pago`);
        processedEvents.push({ txid, status: 'success', type: 'order', orderId: order.id });
        continue;
      }

      // 2. Verificar se é uma fatura de assinatura (subscription_invoice)
      const { data: invoice, error: invoiceError } = await supabase
        .from('subscription_invoices')
        .select('id, store_id, plan_id, amount, payment_status')
        .eq('pix_txid', txid)
        .maybeSingle();

      if (invoice && !invoiceError) {
        console.log(`📄 Fatura encontrada: ${invoice.id}`);

        // Atualizar log com entidade relacionada
        if (webhookLogId) {
          await supabase
            .from('webhook_logs')
            .update({ 
              related_entity_type: 'invoice',
              related_entity_id: invoice.id
            })
            .eq('id', webhookLogId);
        }

        if (invoice.payment_status === 'paid') {
          console.log(`ℹ️ Fatura já paga: ${invoice.id}`);
          processedEvents.push({ txid, status: 'already_processed', type: 'invoice' });
          continue;
        }

        // Atualizar status da fatura
        const { error: updateInvoiceError } = await supabase
          .from('subscription_invoices')
          .update({
            payment_status: 'paid',
            paid_at: new Date().toISOString(),
            approved_at: new Date().toISOString(),
            payment_method: 'pix',
            notes: `Pagamento PIX confirmado via webhook - EndToEndId: ${endToEndId}`,
          })
          .eq('id', invoice.id);

        if (updateInvoiceError) {
          console.error(`❌ Erro ao atualizar fatura ${invoice.id}:`, updateInvoiceError);
          processedEvents.push({ txid, status: 'update_error', type: 'invoice', error: updateInvoiceError.message });
          continue;
        }

        console.log(`✅ Fatura ${invoice.id} marcada como paga`);

        // Estender assinatura da loja
        let newExpirationDate: Date | null = null;
        if (invoice.store_id && invoice.plan_id) {
          // Buscar billing_cycle do plano
          const { data: plan } = await supabase
            .from('plans')
            .select('billing_cycle')
            .eq('id', invoice.plan_id)
            .single();

          let expirationDays = 30; // Default monthly
          if (plan?.billing_cycle === 'quarterly') expirationDays = 90;
          else if (plan?.billing_cycle === 'biannual') expirationDays = 180;
          else if (plan?.billing_cycle === 'annual') expirationDays = 365;

          // Buscar data atual de expiração
          const { data: store } = await supabase
            .from('stores')
            .select('subscription_expires_at')
            .eq('id', invoice.store_id)
            .single();

          // Calcular nova data de expiração
          const currentExpiration = store?.subscription_expires_at 
            ? new Date(store.subscription_expires_at) 
            : null;

          if (currentExpiration && currentExpiration > new Date()) {
            // Se ainda não expirou, adicionar período à data existente
            newExpirationDate = new Date(currentExpiration);
          } else {
            // Se já expirou ou não existe, começar de hoje
            newExpirationDate = new Date();
          }

          newExpirationDate.setDate(newExpirationDate.getDate() + expirationDays);

          await supabase
            .from('stores')
            .update({
              status: 'active',
              subscription_expires_at: newExpirationDate.toISOString(),
            })
            .eq('id', invoice.store_id);

          console.log(`🏪 Loja ${invoice.store_id} - assinatura estendida até ${newExpirationDate.toISOString()}`);

          // 🔔 Enviar notificação por WhatsApp
          try {
            console.log(`📱 Enviando notificação de pagamento para loja ${invoice.store_id}...`);
            
            const notificationResponse = await fetch(`${supabaseUrl}/functions/v1/send-payment-notification`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                store_id: invoice.store_id,
                invoice_id: invoice.id,
                amount: invoice.amount,
                expiration_date: newExpirationDate.toISOString(),
                type: 'payment_confirmed',
              }),
            });

            const notificationResult = await notificationResponse.json();
            
            if (notificationResponse.ok) {
              console.log(`✅ Notificação WhatsApp enviada com sucesso:`, notificationResult);
            } else {
              console.log(`⚠️ Falha ao enviar notificação WhatsApp:`, notificationResult);
            }
          } catch (notifError) {
            console.error(`❌ Erro ao enviar notificação WhatsApp:`, notifError);
            // Não falhar o webhook por erro de notificação
          }
        }

        processedEvents.push({ txid, status: 'success', type: 'invoice', invoiceId: invoice.id });
        continue;
      }

      // 3. Verificar se é uma fatura externa (external_invoices)
      const { data: externalInvoice, error: externalInvoiceError } = await supabase
        .from('external_invoices')
        .select('id, payment_status')
        .eq('pix_txid', txid)
        .maybeSingle();

      if (externalInvoice && !externalInvoiceError) {
        console.log(`📄 Fatura externa encontrada: ${externalInvoice.id}`);

        // Atualizar log com entidade relacionada
        if (webhookLogId) {
          await supabase
            .from('webhook_logs')
            .update({ 
              related_entity_type: 'external_invoice',
              related_entity_id: externalInvoice.id
            })
            .eq('id', webhookLogId);
        }

        if (externalInvoice.payment_status === 'paid') {
          console.log(`ℹ️ Fatura externa já paga: ${externalInvoice.id}`);
          processedEvents.push({ txid, status: 'already_processed', type: 'external_invoice' });
          continue;
        }

        // Atualizar status da fatura externa
        const { error: updateExternalInvoiceError } = await supabase
          .from('external_invoices')
          .update({
            payment_status: 'paid',
            paid_at: new Date().toISOString(),
            payment_method: 'pix',
          })
          .eq('id', externalInvoice.id);

        if (updateExternalInvoiceError) {
          console.error(`❌ Erro ao atualizar fatura externa ${externalInvoice.id}:`, updateExternalInvoiceError);
          processedEvents.push({ txid, status: 'update_error', type: 'external_invoice', error: updateExternalInvoiceError.message });
          continue;
        }

        console.log(`✅ Fatura externa ${externalInvoice.id} marcada como paga`);
        processedEvents.push({ txid, status: 'success', type: 'external_invoice', invoiceId: externalInvoice.id });
        continue;
      }

      // 4. Se não for pedido, fatura de assinatura nem externa, verificar se é aprovação de assinatura
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

      // Atualizar log com entidade relacionada
      if (webhookLogId) {
        await supabase
          .from('webhook_logs')
          .update({ 
            related_entity_type: 'subscription',
            related_entity_id: approval.id
          })
          .eq('id', webhookLogId);
      }

      // Check if already approved
      if (approval.status === 'approved') {
        console.log(`ℹ️ Pagamento já processado: ${txid}`);
        processedEvents.push({ txid, status: 'already_processed', type: 'subscription' });
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
        processedEvents.push({ txid, status: 'update_error', type: 'subscription', error: updateError.message });
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

      processedEvents.push({ txid, status: 'success', type: 'subscription' });
    }

    // Atualizar log para success
    if (webhookLogId) {
      await supabase
        .from('webhook_logs')
        .update({ 
          status: 'success',
          processed_at: new Date().toISOString()
        })
        .eq('id', webhookLogId);
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
    
    // Atualizar log para error
    if (webhookLogId) {
      await supabase
        .from('webhook_logs')
        .update({ 
          status: 'error',
          processed_at: new Date().toISOString(),
          error_message: error.message || 'Erro desconhecido'
        })
        .eq('id', webhookLogId);
    } else {
      // Se não conseguiu criar o log inicial, criar agora com erro
      await supabase
        .from('webhook_logs')
        .insert({
          webhook_type: 'pix',
          source: 'efi-pix-webhook',
          event_type: 'payment_notification',
          payload,
          status: 'error',
          ip_address: ipAddress,
          processed_at: new Date().toISOString(),
          error_message: error.message || 'Erro desconhecido'
        });
    }
    
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
