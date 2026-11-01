// create-guest-order-v2 — DESLIGADA em 01/11/2026.
// O site usa a create-guest-order-v3 desde 31/10. Esta versão só responde para quem ainda
// tem o cardápio antigo em cache, pedindo para atualizar a página. Nada é gravado.
// O código antigo está no histórico do git (commit eadd877 e anteriores).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve((req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  console.warn("[create-guest-order-v2] chamada recebida depois do desligamento (cliente com cardápio antigo)");
  return new Response(
    JSON.stringify({
      error: "Seu cardápio está desatualizado. Atualize a página para fazer o pedido.",
      code: "outdated_client",
    }),
    { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
