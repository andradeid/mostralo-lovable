import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { 
      store_id, 
      module,        // 'order' | 'booking' | 'totem'
      reference_id,  // ID do pedido/agendamento/comanda
      amount, 
      description, 
      items,         // Array de itens (opcional)
      payer,         // { email, name, phone }
      payment_methods, // ['pix', 'credit_card', etc]
      back_urls,     // { success, failure, pending }
    } = body;

    // Validação
    if (!store_id || !module || !reference_id || !amount) {
      return new Response(JSON.stringify({ error: "store_id, module, reference_id e amount são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["order", "booking", "totem", "subscription"].includes(module)) {
      return new Response(JSON.stringify({ error: "module deve ser order, booking, totem ou subscription" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Buscar credenciais da loja
    const { data: gateway, error: gwError } = await supabaseAdmin
      .from("store_payment_gateways")
      .select("*")
      .eq("store_id", store_id)
      .eq("gateway", "mercado_pago")
      .eq("is_active", true)
      .single();

    if (gwError || !gateway) {
      console.error("[create-mercadopago-payment] Gateway not found:", gwError?.message);
      return new Response(JSON.stringify({ error: "Gateway de pagamento não configurado ou inativo" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = gateway.access_token;
    const isSandbox = gateway.environment === "sandbox";
    console.log("[create-mercadopago-payment] Gateway found. Environment:", gateway.environment, "Token length:", accessToken?.length);
    const externalReference = `${module}_${reference_id}`;

    // Criar preferência no Mercado Pago (Checkout Pro)
    const preferenceBody: any = {
      external_reference: externalReference,
      items: items?.length ? items.map((item: any) => ({
        title: item.title || description || "Pagamento",
        quantity: item.quantity || 1,
        unit_price: item.unit_price || amount,
        currency_id: "BRL",
      })) : [{
        title: description || `Pagamento - ${module}`,
        quantity: 1,
        unit_price: Number(amount),
        currency_id: "BRL",
      }],
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook?store_id=${store_id}`,
    };

    // Payer info
    if (payer) {
      preferenceBody.payer = {};
      if (payer.email) preferenceBody.payer.email = payer.email;
      if (payer.name) preferenceBody.payer.name = payer.name;
      if (payer.phone) preferenceBody.payer.phone = { number: payer.phone };
    }

    // Back URLs
    if (back_urls) {
      preferenceBody.back_urls = back_urls;
      preferenceBody.auto_return = "approved";
    }

    // Payment methods filter
    if (payment_methods?.length) {
      preferenceBody.payment_methods = {};
      const excluded: string[] = [];
      if (!payment_methods.includes("credit_card")) excluded.push("credit_card");
      if (!payment_methods.includes("debit_card")) excluded.push("debit_card");
      if (!payment_methods.includes("boleto")) excluded.push("ticket");
      if (excluded.length) {
        preferenceBody.payment_methods.excluded_payment_types = excluded.map(id => ({ id }));
      }
    }

    // Expiração (30 min para totem/PIX, 24h para outros)
    const expirationMinutes = module === "totem" ? 30 : 1440;
    const expirationDate = new Date(Date.now() + expirationMinutes * 60000).toISOString();
    preferenceBody.expires = true;
    preferenceBody.expiration_date_to = expirationDate;

    console.log("Criando preferência MP:", JSON.stringify(preferenceBody));

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferenceBody),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("Erro MP:", JSON.stringify(mpData));
      return new Response(JSON.stringify({ error: "Erro ao criar pagamento", details: mpData }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Se é PIX/Totem, criar também pagamento direto para QR Code
    let pixData = null;
    if (module === "totem" || (payment_methods?.length === 1 && payment_methods[0] === "pix")) {
      try {
        const pixBody = {
          transaction_amount: Number(amount),
          description: description || `Pagamento - ${module}`,
          payment_method_id: "pix",
          payer: {
            email: payer?.email || "cliente@loja.com",
          },
          external_reference: externalReference,
          notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook?store_id=${store_id}`,
        };

        console.log("[create-mercadopago-payment] Criando PIX direto:", JSON.stringify(pixBody));

        const pixResponse = await fetch("https://api.mercadopago.com/v1/payments", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Idempotency-Key": `${store_id}_${reference_id}_${Date.now()}`,
          },
          body: JSON.stringify(pixBody),
        });

        const pixResult = await pixResponse.json();
        console.log("[create-mercadopago-payment] PIX response status:", pixResponse.status, "ok:", pixResponse.ok);
        
        if (!pixResponse.ok) {
          console.error("[create-mercadopago-payment] PIX error:", JSON.stringify(pixResult));
        }
        
        if (pixResponse.ok && pixResult.point_of_interaction?.transaction_data) {
          pixData = {
            qr_code: pixResult.point_of_interaction.transaction_data.qr_code,
            qr_code_base64: pixResult.point_of_interaction.transaction_data.qr_code_base64,
            payment_id: pixResult.id,
          };
        }
      } catch (e) {
        console.error("Erro ao criar PIX direto:", e);
      }
    }

    // Salvar transação no banco
    const { data: transaction, error: txError } = await supabaseAdmin
      .from("store_payment_transactions")
      .insert({
        store_id,
        gateway: "mercado_pago",
        gateway_payment_id: pixData?.payment_id?.toString() || mpData.id,
        module,
        reference_id,
        amount: Number(amount),
        currency: "BRL",
        status: "pending",
        payment_method: pixData ? "pix" : null,
        payer_email: payer?.email || null,
        payer_name: payer?.name || null,
        external_reference: externalReference,
        checkout_url: mpData.init_point || mpData.sandbox_init_point,
        qr_code: pixData?.qr_code || null,
        qr_code_base64: pixData?.qr_code_base64 || null,
        gateway_response: mpData,
        expires_at: expirationDate,
      })
      .select()
      .single();

    if (txError) {
      console.error("Erro ao salvar transação:", txError);
    }

    return new Response(JSON.stringify({
      transaction_id: transaction?.id,
      checkout_url: gateway.environment === "sandbox" 
        ? mpData.sandbox_init_point 
        : mpData.init_point,
      preference_id: mpData.id,
      qr_code: pixData?.qr_code,
      qr_code_base64: pixData?.qr_code_base64,
      pix_payment_id: pixData?.payment_id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Erro no create-mercadopago-payment:", error);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
