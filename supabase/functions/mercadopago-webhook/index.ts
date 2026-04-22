import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const storeId = url.searchParams.get("store_id");

    // O Mercado Pago envia notificações IPN
    const body = await req.json();
    console.log("Webhook MP recebido:", JSON.stringify(body));

    // Tipo de notificação
    const topic = body.type || body.topic;
    const paymentId = body.data?.id || body.id;

    if (!paymentId) {
      console.log("Webhook sem payment ID, ignorando");
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    // Buscar credenciais da loja para consultar status real no MP
    if (!storeId) {
      console.error("store_id não informado no webhook");
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const { data: gateway } = await supabaseAdmin
      .from("store_payment_gateways")
      .select("access_token")
      .eq("store_id", storeId)
      .eq("gateway", "mercado_pago")
      .eq("is_active", true)
      .single();

    if (!gateway?.access_token) {
      console.error("Gateway não encontrado para store:", storeId);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    // Consultar status real do pagamento no Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        "Authorization": `Bearer ${gateway.access_token}`,
      },
    });

    if (!mpResponse.ok) {
      console.error("Erro ao consultar pagamento MP:", await mpResponse.text());
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const mpPayment = await mpResponse.json();
    console.log("Status do pagamento MP:", mpPayment.status, "External ref:", mpPayment.external_reference);

    const mpStatus = mpPayment.status; // approved, pending, rejected, cancelled, refunded, in_process
    const externalRef = mpPayment.external_reference;

    // Atualizar transação no banco
    const { data: transaction, error: txError } = await supabaseAdmin
      .from("store_payment_transactions")
      .update({
        status: mpStatus,
        gateway_payment_id: paymentId.toString(),
        payment_method: mpPayment.payment_method_id || null,
        payer_email: mpPayment.payer?.email || null,
        payer_name: mpPayment.payer?.first_name 
          ? `${mpPayment.payer.first_name} ${mpPayment.payer.last_name || ""}`.trim() 
          : null,
        gateway_response: mpPayment,
        webhook_received_at: new Date().toISOString(),
      })
      .eq("external_reference", externalRef)
      .eq("store_id", storeId)
      .select()
      .single();

    if (txError) {
      console.error("Erro ao atualizar transação:", txError);
      // Tentar por gateway_payment_id como fallback
      await supabaseAdmin
        .from("store_payment_transactions")
        .update({
          status: mpStatus,
          payment_method: mpPayment.payment_method_id || null,
          gateway_response: mpPayment,
          webhook_received_at: new Date().toISOString(),
        })
        .eq("gateway_payment_id", paymentId.toString())
        .eq("store_id", storeId);
    }

    // Se pagamento aprovado, disparar ações por módulo
    if (mpStatus === "approved" && externalRef) {
      const [module, referenceId] = externalRef.split("_");

      if (module === "order" && referenceId) {
        // Atualizar pedido
        await supabaseAdmin
          .from("orders")
          .update({ 
            payment_status: "paid",
            status: "confirmado",
          })
          .eq("id", referenceId)
          .eq("store_id", storeId);
        
        console.log(`Pedido ${referenceId} marcado como pago`);
      }

      if (module === "booking" && referenceId) {
        // Atualizar agendamento - depósito pago
        await supabaseAdmin
          .from("bookings")
          .update({ 
            deposit_paid: true,
            deposit_paid_at: new Date().toISOString(),
            deposit_amount: mpPayment.transaction_amount,
          })
          .eq("id", referenceId)
          .eq("store_id", storeId);
        
        console.log(`Agendamento ${referenceId} - depósito confirmado`);
      }

      if (module === "totem" && referenceId) {
        // Atualizar comanda do totem
        await supabaseAdmin
          .from("comandas")
          .update({
            payment_method: "pix_online",
            status: "closed",
            closed_at: new Date().toISOString(),
            payment_details: { 
              gateway: "mercado_pago",
              payment_id: paymentId,
              amount: mpPayment.transaction_amount,
            },
          })
          .eq("id", referenceId)
          .eq("store_id", storeId);
        
        console.log(`Comanda ${referenceId} - pagamento PIX confirmado`);
      }
    }

    return new Response("OK", { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error("Erro no mercadopago-webhook:", error);
    // Sempre retornar 200 para o MP não reenviar infinitamente
    return new Response("OK", { status: 200, headers: corsHeaders });
  }
});
