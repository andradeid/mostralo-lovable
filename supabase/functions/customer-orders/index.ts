import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Edge Function: customer-orders
 * Lista pedidos de um cliente guest via customer_token.
 * Usa índices idx_orders_store_status e idx_orders_store_created.
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customer_token, store_id, page = 1, limit = 20 } = await req.json();

    if (!customer_token || !store_id) {
      return new Response(
        JSON.stringify({ error: "customer_token e store_id são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
    const safePage = Math.max(Number(page) || 1, 1);
    const offset = (safePage - 1) * safeLimit;

    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, key);

    // Validar token → obter customer_id
    const { data: tokenData, error: tokenError } = await admin
      .from("customer_tokens")
      .select("id, customer_id, created_at, legacy")
      .eq("token", customer_token)
      .eq("store_id", store_id)
      .maybeSingle();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: "Token inválido ou expirado.", code: "INVALID_TOKEN" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const customerId = tokenData.customer_id;

    // Cada aparelho tem o seu token: mostra os pedidos feitos com ele. Pedidos sem token
    // (versão antiga do site) entram só para tokens antigos ou nos 5 min após o token nascer.
    const createdAt = new Date(tokenData.created_at as string);
    const nullWindowEnd = tokenData.legacy
      ? "9999-12-31T00:00:00Z"
      : new Date(createdAt.getTime() + 5 * 60 * 1000).toISOString();
    const ownOrders =
      `customer_token_id.eq.${tokenData.id},` +
      `and(customer_token_id.is.null,created_at.gte.${createdAt.toISOString()},created_at.lte.${nullWindowEnd})`;

    // Buscar total de pedidos (para paginação)
    const { count } = await admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("store_id", store_id)
      .eq("customer_id", customerId)
      .or(ownOrders);

    // Buscar pedidos ordenados por created_at DESC (usa idx_orders_store_created)
    const { data: orders, error: ordersError } = await admin
      .from("orders")
      .select(`
        id,
        order_number,
        status,
        total,
        delivery_type,
        payment_method,
        created_at,
        estimated_delivery_minutes,
        scheduled_for,
        customer_name,
        stores:store_id (
          slug,
          name,
          logo_url,
          timezone
        )
      `)
      .eq("store_id", store_id)
      .eq("customer_id", customerId)
      .or(ownOrders)
      .order("created_at", { ascending: false })
      .range(offset, offset + safeLimit - 1);

    if (ordersError) {
      console.error("Erro ao buscar pedidos:", ordersError);
      return new Response(
        JSON.stringify({ error: "Falha ao buscar pedidos." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        orders: orders || [],
        total: count || 0,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil((count || 0) / safeLimit),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Erro na Edge Function customer-orders:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
