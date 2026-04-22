import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Edge Function: guest-order-tracking
 * Permite que clientes guest acessem seus pedidos via customer_token.
 * Valida que o pedido pertence ao cliente do token.
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id, customer_token, store_id } = await req.json();

    if (!order_id || !store_id) {
      return new Response(
        JSON.stringify({ error: "order_id e store_id são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, key);

    // Se tem token, validar que pertence ao cliente
    let validCustomerId: string | null = null;

    if (customer_token) {
      const { data: tokenData } = await admin
        .from("customer_tokens")
        .select("customer_id")
        .eq("token", customer_token)
        .eq("store_id", store_id)
        .maybeSingle();

      if (tokenData) {
        validCustomerId = tokenData.customer_id;
      }
    }

    // Buscar pedido
    const { data: order, error: orderError } = await admin
      .from("orders")
      .select(`
        *,
        order_items (*),
        stores:store_id (
          slug,
          name,
          logo_url
        )
      `)
      .eq("id", order_id)
      .maybeSingle();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Pedido não encontrado." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar acesso: pedido deve pertencer ao cliente do token OU à loja informada
    if (validCustomerId && order.customer_id !== validCustomerId) {
      return new Response(
        JSON.stringify({ error: "Acesso negado a este pedido." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Se não tem token válido, pelo menos validar que o store_id bate
    if (!validCustomerId && order.store_id !== store_id) {
      return new Response(
        JSON.stringify({ error: "Acesso negado a este pedido." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(order),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Erro na Edge Function guest-order-tracking:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
