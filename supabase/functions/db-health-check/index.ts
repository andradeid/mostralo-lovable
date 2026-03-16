import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const start = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Teste simples de conectividade — SELECT 1
    const { error: pingError } = await supabase
      .from("company_settings")
      .select("id")
      .limit(1);

    const latencyMs = Date.now() - start;

    if (pingError) {
      return new Response(
        JSON.stringify({
          status: "down",
          latency_ms: latencyMs,
          error: pingError.message,
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Classificar saúde baseado na latência
    let status: "healthy" | "degraded" | "down" = "healthy";
    if (latencyMs > 3000) {
      status = "degraded";
    } else if (latencyMs > 8000) {
      status = "down";
    }

    return new Response(
      JSON.stringify({
        status,
        latency_ms: latencyMs,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    const latencyMs = Date.now() - start;
    return new Response(
      JSON.stringify({
        status: "down",
        latency_ms: latencyMs,
        error: err.message,
      }),
      {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
