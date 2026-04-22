import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Instância reutilizável entre invocações (reduz cold starts)
const url = Deno.env.get("SUPABASE_URL")!;
const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(url, key);

const respond = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/**
 * Edge Function: create-guest-order
 * Cria pedidos para clientes guest (sem Supabase Auth).
 * Otimizada para mínimo de queries sequenciais.
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    // Validação rápida (zero DB)
    if (!store_id || !customer_id || !customer_name || !customer_phone) {
      return respond({ error: "Campos obrigatórios: store_id, customer_id, customer_name, customer_phone" }, 400);
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return respond({ error: "Pelo menos um item é obrigatório." }, 400);
    }

    console.info("[create-guest-order] store:", store_id, "customer:", customer_id);

    // ── DEDUP: Verificar se já existe pedido do mesmo cliente nos últimos 30s ──
    const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();
    const { data: recentOrder } = await admin
      .from("orders")
      .select("id, order_number, status")
      .eq("store_id", store_id)
      .eq("customer_id", customer_id)
      .gte("created_at", thirtySecondsAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentOrder) {
      console.info("[create-guest-order] DEDUP: pedido recente encontrado:", recentOrder.id);
      return respond({
        success: true,
        order_id: recentOrder.id,
        order_number: recentOrder.order_number,
        status: recentOrder.status,
        deduplicated: true,
      }, 200);
    }

    // ── PASSO 1: Paralelizar vínculo + número do pedido ──
    const [linkResult, numberResult] = await Promise.all([
      admin
        .from("customer_stores")
        .select("id")
        .eq("customer_id", customer_id)
        .eq("store_id", store_id)
        .maybeSingle(),
      admin.rpc("get_next_order_number", { store_uuid: store_id }),
    ]);

    if (linkResult.error) {
      console.error("[create-guest-order] link error:", JSON.stringify(linkResult.error));
      return respond({ error: "Erro ao verificar vínculo.", details: linkResult.error.message }, 500);
    }
    if (!linkResult.data) {
      return respond({ error: "Cliente não vinculado a esta loja." }, 403);
    }
    if (numberResult.error) {
      console.error("[create-guest-order] number error:", JSON.stringify(numberResult.error));
      return respond({ error: "Falha ao gerar número do pedido.", details: numberResult.error.message }, 500);
    }

    const orderNumber = numberResult.data;

    // ── PASSO 2: INSERT do pedido (operação crítica) ──
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
      console.error("[create-guest-order] order insert error:", JSON.stringify(orderError));
      return respond({ error: "Falha ao criar pedido.", details: orderError.message }, 500);
    }

    console.info("[create-guest-order] success:", order.id);

    // ── PASSO 3: Retornar IMEDIATAMENTE ──
    // Items e promoção são processados em background (não bloqueiam o cliente)
    const response = respond({
      order_id: order.id,
      order_number: order.order_number,
      status: order.status,
    });

    // ── PASSO 4: Background tasks (fire-and-forget) ──
    const extractProductId = (compositeId: string): string | null => {
      const firstPart = (compositeId?.split("_")[0] ?? compositeId).trim();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(firstPart) ? firstPart : null;
    };

    // Items insert (não bloqueia resposta)
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

    void (async () => {
      try {
        const { error } = await admin.from("order_items").insert(orderItems);
        if (error) {
          console.error("[create-guest-order] items error:", JSON.stringify(error));
        }
      } catch (error) {
        console.error("[create-guest-order] items fatal:", error);
      }
    })();

    // Promoção (não bloqueia resposta)
    if (promotion_id) {
      void (async () => {
        try {
          const { error } = await admin.rpc("increment_promotion_usage", { promotion_id_param: promotion_id });
          if (error) {
            console.error("[create-guest-order] promo rpc error:", JSON.stringify(error));
          }
        } catch (error) {
          console.error("[create-guest-order] promo rpc fatal:", error);
        }
      })();

      void (async () => {
        try {
          const { error } = await admin.from("promotion_usage").insert({
            promotion_id,
            customer_id,
            order_id: order.id,
            discount_applied: promotion_discount || 0,
            promotion_code: promotion_code || null,
          });

          if (error) {
            console.error("[create-guest-order] promo insert error:", JSON.stringify(error));
          }
        } catch (error) {
          console.error("[create-guest-order] promo insert fatal:", error);
        }
      })();
    }

    return response;
  } catch (err: any) {
    console.error("[create-guest-order] fatal:", err?.message, err?.stack);
    return respond({ error: "Erro interno do servidor.", details: err?.message }, 500);
  }
});
