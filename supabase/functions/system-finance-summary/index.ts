import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type TxType = "income" | "expense";

interface SummaryPayload {
  action: "summary";
  months?: number; // default 6
  startDate?: string;
  endDate?: string;
}

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

  return { ok: true as const };
}

function monthKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthLabel(date: Date) {
  const months = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  return `${months[date.getMonth()]} ${String(date.getFullYear()).slice(-2)}`;
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

    let payload: SummaryPayload;
    try {
      payload = (await req.json()) as SummaryPayload;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payload.action !== "summary") {
      return new Response(JSON.stringify({ error: "Ação inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const months = Math.min(Math.max(payload.months ?? 6, 1), 24);
    const today = new Date();
    const startDefault = new Date(today);
    startDefault.setMonth(today.getMonth() - (months - 1));
    startDefault.setDate(1);
    startDefault.setHours(0, 0, 0, 0);

    const endDefault = new Date(today);
    endDefault.setHours(23, 59, 59, 999);

    const startDate = payload.startDate ? new Date(payload.startDate) : startDefault;
    const endDate = payload.endDate ? new Date(payload.endDate) : endDefault;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: rows, error } = await supabaseAdmin
      .from("system_financial_transactions")
      .select("type, amount, transaction_date")
      .gte("transaction_date", startDate.toISOString().slice(0, 10))
      .lte("transaction_date", endDate.toISOString().slice(0, 10));

    if (error) throw error;

    const totalIncome = (rows ?? [])
      .filter((r) => r.type === "income")
      .reduce((sum, r) => sum + Number(r.amount ?? 0), 0);

    const totalExpense = (rows ?? [])
      .filter((r) => r.type === "expense")
      .reduce((sum, r) => sum + Number(r.amount ?? 0), 0);

    const balance = totalIncome - totalExpense;

    // Construir months buckets (últimos N meses)
    const buckets = new Map<
      string,
      { month: string; income: number; expense: number; balance: number }
    >();

    for (let i = 0; i < months; i++) {
      const d = new Date(startDefault);
      d.setMonth(startDefault.getMonth() + i);
      const key = monthKey(d);
      buckets.set(key, { month: monthLabel(d), income: 0, expense: 0, balance: 0 });
    }

    for (const r of rows ?? []) {
      const d = new Date(r.transaction_date);
      const key = monthKey(new Date(d.getFullYear(), d.getMonth(), 1));
      const b = buckets.get(key);
      if (!b) continue;
      if (r.type === "income") b.income += Number(r.amount ?? 0);
      if (r.type === "expense") b.expense += Number(r.amount ?? 0);
    }

    for (const b of buckets.values()) {
      b.balance = b.income - b.expense;
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          totalIncome,
          totalExpense,
          balance,
          monthlyData: Array.from(buckets.values()),
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e: any) {
    console.error("❌ system-finance-summary error:", e);
    return new Response(
      JSON.stringify({ error: "Erro inesperado", details: e?.message ?? String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
