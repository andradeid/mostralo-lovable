import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Instância reutilizável (reduz cold starts)
const url = Deno.env.get("SUPABASE_URL")!;
const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(url, key);

/**
 * Edge Function: create-guest-order
 * Cria pedidos para clientes guest (sem Supabase Auth).
 * Usa service_role para bypass de RLS.
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const respond = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const body = await req.json();
    const {
      store_id,
      customer_id,
      customer_name,
      customer_phone,
      customer_email,
      customer_address,
      delivery_type,
      payment_method,
      payment_details,
      subtotal,
      delivery_fee,
      total,
      notes,
      scheduled_for,
      promotion_id,
      promotion_code,
      promotion_discount,
      is_outside_delivery_zone,
      requires_zone_approval,
      items,
    } = body;

    // Validação básica
    if (!store_id || !customer_id || !customer_name || !customer_phone) {
      return respond({ error: "Campos obrigatórios: store_id, customer_id, customer_name, customer_phone" }, 400);
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return respond({ error: "Pelo menos um item é obrigatório." }, 400);
    }

    console.info("[create-guest-order] Iniciando para store:", store_id, "customer:", customer_id);

    // Validar vínculo cliente-loja
    const { data: link, error: linkError } = await admin
      .from("customer_stores")
      .select("id")
      .eq("customer_id", customer_id)
      .eq("store_id", store_id)
      .maybeSingle();

    if (linkError) {
      console.error("[create-guest-order] Erro ao verificar vínculo:", JSON.stringify(linkError));
      return respond({ error: "Erro ao verificar vínculo do cliente.", details: linkError.message }, 500);
    }

    if (!link) {
      console.error("[create-guest-order] Cliente não vinculado:", customer_id, "store:", store_id);
      return respond({ error: "Cliente não vinculado a esta loja." }, 403);
    }

    // Gerar número sequencial do pedido
    const { data: orderNumber, error: numberError } = await admin
      .rpc("get_next_order_number", { store_uuid: store_id });

    if (numberError) {
      console.error("[create-guest-order] Erro get_next_order_number:", JSON.stringify(numberError));
      return respond({ error: "Falha ao gerar número do pedido.", details: numberError.message }, 500);
    }

    console.info("[create-guest-order] order_number:", orderNumber);

    // Criar pedido
    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        order_number: orderNumber,
        store_id,
        customer_id,
        customer_name,
        customer_phone,
        customer_email: customer_email || null,
        customer_address: delivery_type === "delivery" ? customer_address : null,
        delivery_type,
        payment_method,
        payment_details: payment_details || null,
        payment_status: "pending",
        status: "entrada",
        source: "cardapio_digital",
        subtotal: subtotal || 0,
        delivery_fee: delivery_type === "delivery" ? (delivery_fee || 0) : 0,
        total: total || 0,
        notes: notes || null,
        scheduled_for: scheduled_for || null,
        promotion_id: promotion_id || null,
        promotion_code: promotion_code || null,
        promotion_discount: promotion_discount || null,
        is_outside_delivery_zone: is_outside_delivery_zone || false,
        requires_zone_approval: requires_zone_approval || false,
      })
      .select("id, order_number, status")
      .single();

    if (orderError) {
      console.error("[create-guest-order] Erro ao criar pedido:", JSON.stringify(orderError));
      return respond({ error: "Falha ao criar pedido.", details: orderError.message }, 500);
    }

    console.info("[create-guest-order] Pedido criado:", order.id);

    // Criar itens do pedido (fire-and-forget pattern — pedido já existe)
    const extractProductId = (compositeId: string): string | null => {
      const firstPart = (compositeId?.split("_")[0] ?? compositeId).trim();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(firstPart) ? firstPart : null;
    };

    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      store_id,
      product_id: extractProductId(item.id),
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: item.price * item.quantity,
      notes: item.notes ?? null,
    }));

    const { error: itemsError } = await admin
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("[create-guest-order] Erro ao criar itens:", JSON.stringify(itemsError));
      // Não falhar — pedido já foi criado
    }

    // Registrar uso de promoção (fire-and-forget)
    if (promotion_id) {
      admin.rpc("increment_promotion_usage", {
        promotion_id_param: promotion_id,
      }).catch((e: any) => console.error("[create-guest-order] Erro incrementar promoção:", e));

      admin.from("promotion_usage").insert({
        promotion_id,
        customer_id,
        order_id: order.id,
        discount_applied: promotion_discount || 0,
        promotion_code: promotion_code || null,
      }).catch((e: any) => console.error("[create-guest-order] Erro registrar promoção:", e));
    }

    console.info("[create-guest-order] success", order.id);

    return respond({
      order_id: order.id,
      order_number: order.order_number,
      status: order.status,
    });
  } catch (err: any) {
    console.error("[create-guest-order] Erro fatal:", err?.message, err?.stack);
    return respond({ error: "Erro interno do servidor.", details: err?.message }, 500);
  }
});
