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
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const method = req.method;

    if (method === "GET") {
      const url = new URL(req.url);
      const storeId = url.searchParams.get("store_id");

      if (!storeId) {
        return new Response(JSON.stringify({ error: "store_id obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: hasRole, error: roleError } = await supabaseAdmin.rpc("is_store_admin_of", {
        _store_id: storeId,
      });

      if (roleError || !hasRole) {
        return new Response(JSON.stringify({ error: "Você não tem permissão para acessar esta loja" }), {
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
        console.error("Erro ao buscar gateway:", error);
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
    }

    if (method === "POST") {
      const body = await req.json();
      const store_id = typeof body.store_id === "string" ? body.store_id : "";
      const access_token = typeof body.access_token === "string" ? body.access_token.trim() : "";
      const public_key = typeof body.public_key === "string" ? body.public_key.trim() : "";
      const environment = typeof body.environment === "string" ? body.environment : "sandbox";

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

      const { data: store, error: storeError } = await supabaseAdmin
        .from("stores")
        .select("id")
        .eq("id", store_id)
        .maybeSingle();

      if (storeError || !store) {
        return new Response(JSON.stringify({ error: "Loja não encontrada" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: hasRole, error: roleError } = await supabaseAdmin.rpc("is_store_admin_of", {
        _store_id: store_id,
      });

      if (roleError || !hasRole) {
        return new Response(JSON.stringify({ error: "Você não tem permissão para alterar esta loja" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let isValid = false;
      let validationError = "";
      let mpAccount: { id?: string | number; nickname?: string; site_id?: string } | null = null;

      try {
        const mpResponse = await fetch("https://api.mercadolibre.com/users/me", {
          headers: {
            Authorization: `Bearer ${access_token}`,
            Accept: "application/json",
          },
        });

        const mpData = await mpResponse.json();
        console.log("[manage-payment-gateway] MP validation status:", mpResponse.status);
        console.log("[manage-payment-gateway] MP validation body:", JSON.stringify(mpData).substring(0, 500));

        if (mpResponse.ok && mpData?.id) {
          isValid = true;
          mpAccount = {
            id: mpData.id,
            nickname: mpData.nickname,
            site_id: mpData.site_id,
          };
        } else {
          validationError =
            mpData?.message ||
            mpData?.error_description ||
            mpData?.error ||
            "Não foi possível validar as credenciais no Mercado Pago";
        }
      } catch (e) {
        console.error("[manage-payment-gateway] Erro validação MP:", e);
        validationError = "Erro ao conectar com Mercado Pago";
      }

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
          },
          {
            onConflict: "store_id,gateway",
          },
        )
        .select("id, store_id, gateway, environment, is_active, is_validated, validated_at")
        .single();

      if (saveError) {
        console.error("Erro ao salvar gateway:", saveError);
        return new Response(
          JSON.stringify({
            error: "Erro ao salvar configuração",
            details: saveError.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      return new Response(
        JSON.stringify({
          data: saved,
          validated: isValid,
          validation_error: validationError || undefined,
          account: mpAccount,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (method === "DELETE") {
      const body = await req.json();
      const { store_id } = body;

      if (!store_id) {
        return new Response(JSON.stringify({ error: "store_id obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: hasRole, error: roleError } = await supabaseAdmin.rpc("is_store_admin_of", {
        _store_id: store_id,
      });

      if (roleError || !hasRole) {
        return new Response(JSON.stringify({ error: "Você não tem permissão para remover esta configuração" }), {
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
        console.error("Erro ao deletar gateway:", deleteError);
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
    console.error("Erro no manage-payment-gateway:", error);
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
