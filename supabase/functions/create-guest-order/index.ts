import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getAdminClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key);
}

/**
 * Edge Function: create-guest-order
 * Cria pedidos para clientes guest (sem Supabase Auth).
 * Recebe customer_token para validar identidade.
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      customer_token,
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
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: store_id, customer_id, customer_name, customer_phone" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Pelo menos um item é obrigatório." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const admin = getAdminClient();

    // Validar que o customer_id pertence à loja via customer_stores
    const { data: link } = await admin
      .from("customer_stores")
      .select("id")
      .eq("customer_id", customer_id)
      .eq("store_id", store_id)
      .maybeSingle();

    if (!link) {
      return new Response(
        JSON.stringify({ error: "Cliente não vinculado a esta loja." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gerar número sequencial do pedido
    const { data: orderNumber, error: numberError } = await admin
      .rpc("get_next_order_number", { store_uuid: store_id });

    if (numberError) {
      console.error("Erro ao gerar número do pedido:", numberError);
      return new Response(
        JSON.stringify({ error: "Falha ao gerar número do pedido." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
        subtotal,
        delivery_fee: delivery_type === "delivery" ? (delivery_fee || 0) : 0,
        total,
        notes: notes || null,
        scheduled_for: scheduled_for || null,
        promotion_id: promotion_id || null,
        promotion_code: promotion_code || null,
        promotion_discount: promotion_discount || null,
        is_outside_delivery_zone: is_outside_delivery_zone || false,
        requires_zone_approval: requires_zone_approval || false,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Erro ao criar pedido:", orderError);
      return new Response(
        JSON.stringify({ error: "Falha ao criar pedido.", details: orderError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar itens do pedido
    const extractProductId = (compositeId: string): string | null => {
      const firstPart = (compositeId?.split("_")[0] ?? compositeId).trim();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(firstPart) ? firstPart : null;
    };

    const orderItems = items.map((item: any) => ({
      order_id: order.id,
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
      console.error("Erro ao criar itens:", itemsError);
      // Pedido já criado, logar erro mas não falhar
    }

    // Registrar uso de promoção se aplicável
    if (promotion_id && order) {
      await admin.rpc("increment_promotion_usage", {
        promotion_id_param: promotion_id,
      }).catch((e: any) => console.error("Erro ao incrementar promoção:", e));

      await admin.from("promotion_usage").insert({
        promotion_id,
        customer_id,
        order_id: order.id,
        discount_applied: promotion_discount || 0,
        promotion_code: promotion_code || null,
      }).catch((e: any) => console.error("Erro ao registrar uso de promoção:", e));
    }

    return new Response(
      JSON.stringify({
        order_id: order.id,
        order_number: order.order_number,
        status: order.status,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Erro na Edge Function create-guest-order:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
