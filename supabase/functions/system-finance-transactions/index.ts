import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type TxType = "income" | "expense";

interface ListPayload {
  action: "list";
  filters?: {
    type?: TxType;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    origin?: "all" | "manual" | "auto";
  };
  limit?: number;
}

interface CreatePayload {
  action: "create";
  category_id: string;
  type: TxType;
  amount: number;
  description: string;
  notes?: string | null;
  transaction_date?: string;
  payment_method?: string | null;
  reference_number?: string | null;
  vendor?: string | null;
}

interface UpdatePayload {
  action: "update";
  id: string;
  category_id?: string;
  type?: TxType;
  amount?: number;
  description?: string;
  notes?: string | null;
  transaction_date?: string;
  payment_method?: string | null;
  reference_number?: string | null;
  vendor?: string | null;
}

interface DeletePayload {
  action: "delete";
  id: string;
}

type RequestPayload = ListPayload | CreatePayload | UpdatePayload | DeletePayload;

async function requireMasterAdmin(authHeader: string) {
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: authHeader } },
    }
  );

  const {
    data: { user },
    error: authError,
  } = await supabaseClient.auth.getUser();

  if (authError || !user) {
    return { ok: false as const, status: 401 as const, error: "Unauthorized" };
  }

  const { data: roleData, error: roleError } = await supabaseClient
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "master_admin")
    .maybeSingle();

  if (roleError) {
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
      const limit = Math.min(Math.max(payload.limit ?? 50, 1), 200);
      const f = payload.filters ?? {};

      let query = supabaseAdmin
        .from("system_financial_transactions")
        .select(
          `
            *,
            category:system_financial_categories(*)
          `
        )
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);

      if (f.type) query = query.eq("type", f.type);
      if (f.categoryId) query = query.eq("category_id", f.categoryId);
      if (f.startDate) query = query.gte("transaction_date", f.startDate);
      if (f.endDate) query = query.lte("transaction_date", f.endDate);
      if (f.origin === "auto") query = query.eq("is_auto", true);
      if (f.origin === "manual") query = query.eq("is_auto", false);
      if (f.search) {
        const q = `%${f.search}%`;
        query = query.or(
          `description.ilike.${q},notes.ilike.${q},vendor.ilike.${q},reference_number.ilike.${q}`
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      return new Response(JSON.stringify({ success: true, transactions: data ?? [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payload.action === "create") {
      if (!payload.category_id || !payload.type || !payload.description) {
        return new Response(
          JSON.stringify({ error: "Campos obrigatórios: category_id, type, description" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data, error } = await supabaseAdmin
        .from("system_financial_transactions")
        .insert({
          category_id: payload.category_id,
          type: payload.type,
          amount: payload.amount,
          description: payload.description,
          notes: payload.notes ?? null,
          transaction_date: payload.transaction_date ?? undefined,
          payment_method: payload.payment_method ?? null,
          reference_number: payload.reference_number ?? null,
          vendor: payload.vendor ?? null,
          created_by: gate.userId,
        })
        .select(
          `
            *,
            category:system_financial_categories(*)
          `
        )
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, transaction: data }), {
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

      // Bloqueia alteração de lançamentos automáticos
      const { data: existing, error: existingError } = await supabaseAdmin
        .from("system_financial_transactions")
        .select("id,is_auto")
        .eq("id", payload.id)
        .maybeSingle();

      if (existingError) throw existingError;
      if (!existing) {
        return new Response(JSON.stringify({ error: "Transação não encontrada" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (existing.is_auto) {
        return new Response(
          JSON.stringify({
            error:
              "Esta transação é automática e não pode ser editada. Refaça a importação ou ajuste na fonte (invoice/approval).",
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { id, ...updates } = payload;
      const { data, error } = await supabaseAdmin
        .from("system_financial_transactions")
        .update({ ...updates })
        .eq("id", id)
        .select(
          `
            *,
            category:system_financial_categories(*)
          `
        )
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, transaction: data }), {
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

      // Bloqueia exclusão de lançamentos automáticos
      const { data: existing, error: existingError } = await supabaseAdmin
        .from("system_financial_transactions")
        .select("id,is_auto")
        .eq("id", payload.id)
        .maybeSingle();

      if (existingError) throw existingError;
      if (!existing) {
        return new Response(JSON.stringify({ error: "Transação não encontrada" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (existing.is_auto) {
        return new Response(
          JSON.stringify({
            error:
              "Esta transação é automática e não pode ser excluída. Refaça a importação ou ajuste na fonte (invoice/approval).",
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { error } = await supabaseAdmin
        .from("system_financial_transactions")
        .delete()
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
    console.error("❌ system-finance-transactions error:", e);
    return new Response(
      JSON.stringify({ error: "Erro inesperado", details: e?.message ?? String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
