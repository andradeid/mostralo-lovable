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
    const transactionId = url.searchParams.get("transaction_id");
    const externalReference = url.searchParams.get("external_reference");

    if (!transactionId && !externalReference) {
      return new Response(JSON.stringify({ error: "transaction_id ou external_reference obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Buscar transação
    let query = supabaseAdmin
      .from("store_payment_transactions")
      .select("*");

    if (transactionId) {
      query = query.eq("id", transactionId);
    } else if (externalReference) {
      query = query.eq("external_reference", externalReference);
    }

    const { data: transaction, error } = await query.single();

    if (error || !transaction) {
      return new Response(JSON.stringify({ error: "Transação não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Se ainda está pendente e tem payment_id, consultar no MP
    if (transaction.status === "pending" && transaction.gateway_payment_id) {
      const { data: gateway } = await supabaseAdmin
        .from("store_payment_gateways")
        .select("access_token")
        .eq("store_id", transaction.store_id)
        .eq("gateway", "mercado_pago")
        .eq("is_active", true)
        .single();

      if (gateway?.access_token) {
        const mpResponse = await fetch(
          `https://api.mercadopago.com/v1/payments/${transaction.gateway_payment_id}`,
          {
            headers: { "Authorization": `Bearer ${gateway.access_token}` },
          }
        );

        if (mpResponse.ok) {
          const mpPayment = await mpResponse.json();
          
          if (mpPayment.status !== transaction.status) {
            // Atualizar status no banco
            await supabaseAdmin
              .from("store_payment_transactions")
              .update({
                status: mpPayment.status,
                payment_method: mpPayment.payment_method_id,
                gateway_response: mpPayment,
              })
              .eq("id", transaction.id);

            transaction.status = mpPayment.status;
          }
        }
      }
    }

    return new Response(JSON.stringify({
      transaction_id: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      module: transaction.module,
      reference_id: transaction.reference_id,
      payment_method: transaction.payment_method,
      checkout_url: transaction.checkout_url,
      qr_code: transaction.qr_code,
      qr_code_base64: transaction.qr_code_base64,
      created_at: transaction.created_at,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Erro no check-payment-status:", error);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
