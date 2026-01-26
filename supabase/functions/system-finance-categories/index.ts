import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type CategoryType = "income" | "expense";

interface ListPayload {
  action: "list";
  includeInactive?: boolean;
}

interface CreatePayload {
  action: "create";
  name: string;
  type: CategoryType;
  color?: string | null;
  description?: string | null;
}

interface UpdatePayload {
  action: "update";
  id: string;
  name?: string;
  type?: CategoryType;
  color?: string | null;
  description?: string | null;
  is_active?: boolean;
}

interface DeletePayload {
  action: "delete";
  id: string;
}

type RequestPayload = ListPayload | CreatePayload | UpdatePayload | DeletePayload;

async function requireMasterAdmin(authHeader: string) {
  // Extrair o token do header
  const token = authHeader.replace("Bearer ", "");
  
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: authHeader } },
    }
  );

  // CRÍTICO: passar o token explicitamente quando verify_jwt = false
  const {
    data: { user },
    error: authError,
  } = await supabaseClient.auth.getUser(token);

  if (authError || !user) {
    console.error("Auth error:", authError);
    return { ok: false as const, status: 401 as const, error: "Unauthorized" };
  }

  // Usar service role para verificar permissões (bypass RLS)
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const { data: roleData, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "master_admin")
    .maybeSingle();

  if (roleError) {
    console.error("Role check error:", roleError);
    return {
      ok: false as const,
      status: 500 as const,
      error: "Erro ao verificar permissões",
    };
  }

  if (!roleData) {
    return {
      ok: false as const,
      status: 403 as const,
      error: "Forbidden: Only master admins can access system finance",
    };
  }

  return { ok: true as const, userId: user.id };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: { ...corsHeaders, "Access-Control-Allow-Methods": "POST, OPTIONS" },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed. Use POST." }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const gate = await requireMasterAdmin(authHeader);
    if (!gate.ok) {
      return new Response(JSON.stringify({ error: gate.error }), {
        status: gate.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let payload: RequestPayload;
    try {
      payload = (await req.json()) as RequestPayload;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (payload.action === "list") {
      const { data, error } = await supabaseAdmin
        .from("system_financial_categories")
        .select("*")
        .order("type")
        .order("name")
        .eq("is_active", payload.includeInactive ? true : true);

      // Se includeInactive for true, precisamos remover o filtro acima.
      // Para manter simples e evitar query dinâmica complexa, fazemos 2 caminhos:
      if (payload.includeInactive) {
        const { data: allData, error: allError } = await supabaseAdmin
          .from("system_financial_categories")
          .select("*")
          .order("type")
          .order("name");
        if (allError) throw allError;
        return new Response(JSON.stringify({ success: true, categories: allData ?? [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, categories: data ?? [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payload.action === "create") {
      if (!payload.name || !payload.type) {
        return new Response(JSON.stringify({ error: "Campos obrigatórios: name, type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabaseAdmin
        .from("system_financial_categories")
        .insert({
          name: payload.name,
          type: payload.type,
          color: payload.color ?? null,
          description: payload.description ?? null,
          is_active: true,
        })
        .select("*")
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, category: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payload.action === "update") {
      if (!payload.id) {
        return new Response(JSON.stringify({ error: "Campo obrigatório: id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { id, ...updates } = payload;
      const { data, error } = await supabaseAdmin
        .from("system_financial_categories")
        .update({ ...updates })
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, category: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payload.action === "delete") {
      if (!payload.id) {
        return new Response(JSON.stringify({ error: "Campo obrigatório: id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Soft delete para preservar histórico
      const { error } = await supabaseAdmin
        .from("system_financial_categories")
        .update({ is_active: false })
        .eq("id", payload.id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("❌ system-finance-categories error:", e);
    return new Response(
      JSON.stringify({ error: "Erro inesperado", details: e?.message ?? String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
