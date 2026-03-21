import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("[manage-payment-gateway] Missing auth header");
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Cliente com token do usuário para verificar auth e permissões (auth.uid() funciona)
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Cliente service_role para operações no banco (bypassa RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar autenticação via JWT claims (mais confiável em Edge Functions)
    const token = authHeader.replace("Bearer ", "").trim();
    const { data: claimsData, error: authError } = await supabaseUser.auth.getClaims(token);
    const userId = claimsData?.claims?.sub;

    if (authError || !userId) {
      console.error("[manage-payment-gateway] Auth failed:", authError?.message || "Invalid claims");
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[manage-payment-gateway] User:", userId, "| Method:", req.method);

    const method = req.method;

    // ==================== GET ====================
    const getGatewayConfig = async (storeId: string) => {
      if (!storeId) {
        return new Response(JSON.stringify({ error: "store_id obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: hasRole } = await supabaseUser.rpc("is_store_admin_of", {
        _store_id: storeId,
      });

      console.log("[manage-payment-gateway] GET hasRole:", hasRole, "store:", storeId);

      if (!hasRole) {
        return new Response(JSON.stringify({ error: "Sem permissão para acessar esta loja" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: gateway, error } = await supabaseAdmin
        .from("store_payment_gateways")
        .select("id, store_id, gateway, environment, is_active, is_validated, validated_at, created_at, updated_at, access_token, public_key")
        .eq("store_id", storeId)
        .eq("gateway", "mercado_pago")
        .maybeSingle();

      if (error) {
        console.error("[manage-payment-gateway] Erro buscar:", error);
        return new Response(JSON.stringify({ error: "Erro ao buscar configuração" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const safeGateway = gateway
        ? {
            ...gateway,
            access_token: gateway.access_token ? maskToken(gateway.access_token) : null,
            public_key: gateway.public_key ? maskToken(gateway.public_key) : null,
          }
        : null;

      return new Response(JSON.stringify({ data: safeGateway }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    };

    if (method === "GET") {
      const url = new URL(req.url);
      const storeId = url.searchParams.get("store_id");

      return await getGatewayConfig(storeId || "");
    }

    // ==================== POST ====================
    if (method === "POST") {
      const body = await req.json();
      const action = typeof body.action === "string" ? body.action : "save";
      const store_id = typeof body.store_id === "string" ? body.store_id.trim() : "";
      const access_token = typeof body.access_token === "string" ? body.access_token.trim() : "";
      const public_key = typeof body.public_key === "string" ? body.public_key.trim() : "";
      const environment = typeof body.environment === "string" ? body.environment : "sandbox";

      if (action === "get") {
        return await getGatewayConfig(store_id);
      }

      console.log("[manage-payment-gateway] POST store:", store_id, "env:", environment, "token_len:", access_token.length, "pk_len:", public_key.length);

      if (!store_id || !access_token || !public_key) {
        return new Response(JSON.stringify({ error: "store_id, access_token e public_key são obrigatórios" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!["sandbox", "production"].includes(environment)) {
        return new Response(JSON.stringify({ error: "environment deve ser 'sandbox' ou 'production'" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verificar permissão usando cliente do USUÁRIO
      const { data: hasRole } = await supabaseUser.rpc("is_store_admin_of", {
        _store_id: store_id,
      });

      console.log("[manage-payment-gateway] POST hasRole:", hasRole);

      if (!hasRole) {
        return new Response(JSON.stringify({ error: "Sem permissão para alterar esta loja" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validar credenciais no Mercado Pago
      let isValid = false;
      let validationError = "";

      try {
        // Endpoint oficial conforme documentação MP: GET /users/me com Bearer token
        const mpResponse = await fetch("https://api.mercadolibre.com/users/me", {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });

        const mpData = await mpResponse.json();
        console.log("[manage-payment-gateway] MP /users/me status:", mpResponse.status);
        console.log("[manage-payment-gateway] MP response:", JSON.stringify(mpData).substring(0, 300));

        if (mpResponse.ok && mpData?.id) {
          isValid = true;
          console.log("[manage-payment-gateway] ✅ Credenciais válidas! MP user:", mpData.id, mpData.nickname);
        } else {
          validationError = mpData?.message || mpData?.error || "Credenciais inválidas";
          console.log("[manage-payment-gateway] ❌ Credenciais inválidas:", validationError);
        }
      } catch (e) {
        console.error("[manage-payment-gateway] Erro validação MP:", e);
        validationError = "Erro ao conectar com Mercado Pago";
      }

      // Salvar no banco via service_role (upsert)
      const { data: saved, error: saveError } = await supabaseAdmin
        .from("store_payment_gateways")
        .upsert(
          {
            store_id,
            gateway: "mercado_pago",
            environment,
            access_token,
            public_key,
            is_active: isValid,
            is_validated: isValid,
            validated_at: isValid ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "store_id,gateway" },
        )
        .select("id, store_id, gateway, environment, is_active, is_validated, validated_at")
        .single();

      if (saveError) {
        console.error("[manage-payment-gateway] Erro salvar:", JSON.stringify(saveError));
        return new Response(
          JSON.stringify({ error: "Erro ao salvar configuração", details: saveError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      console.log("[manage-payment-gateway] ✅ Salvo com sucesso. validated:", isValid);

      return new Response(
        JSON.stringify({
          data: saved,
          validated: isValid,
          validation_error: validationError || undefined,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ==================== DELETE ====================
    if (method === "DELETE") {
      const body = await req.json();
      const { store_id } = body;

      if (!store_id) {
        return new Response(JSON.stringify({ error: "store_id obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verificar permissão usando cliente do USUÁRIO
      const { data: hasRole } = await supabaseUser.rpc("is_store_admin_of", {
        _store_id: store_id,
      });

      if (!hasRole) {
        return new Response(JSON.stringify({ error: "Sem permissão" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: deleteError } = await supabaseAdmin
        .from("store_payment_gateways")
        .delete()
        .eq("store_id", store_id)
        .eq("gateway", "mercado_pago");

      if (deleteError) {
        console.error("[manage-payment-gateway] Erro deletar:", deleteError);
        return new Response(JSON.stringify({ error: "Erro ao remover configuração" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[manage-payment-gateway] Erro geral:", error);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function maskToken(token: string): string {
  if (token.length <= 8) return "****";
  return token.substring(0, 4) + "****" + token.substring(token.length - 4);
}
