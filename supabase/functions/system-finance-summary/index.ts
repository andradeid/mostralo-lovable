import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SummaryPayload {
  action: "summary";
  months?: number; // default 6 (usado quando não vem startDate/endDate)
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

async function requireMasterAdmin(authHeader: string) {
  const token = authHeader.replace("Bearer ", "");

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
  } = await supabaseClient.auth.getUser(token);

  if (authError || !user) {
    console.error("Auth error:", authError);
    return { ok: false as const, status: 401 as const, error: "Unauthorized" };
  }

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
    return { ok: false as const, status: 500 as const, error: "Erro ao verificar permissões" };
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

const MONTH_LABELS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

function monthKeyFromDateStr(dateStr: string) {
  return dateStr.slice(0, 7); // YYYY-MM
}

function monthLabelFromKey(key: string) {
  const [y, m] = key.split("-");
  return `${MONTH_LABELS[Number(m) - 1]} ${y.slice(-2)}`;
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

    // Janela de datas
    const today = new Date();
    const months = Math.min(Math.max(payload.months ?? 6, 1), 36);

    let startStr: string;
    let endStr: string;

    if (payload.startDate && payload.endDate) {
      startStr = payload.startDate;
      endStr = payload.endDate;
    } else {
      const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - (months - 1), 1));
      startStr = start.toISOString().slice(0, 10);
      endStr = today.toISOString().slice(0, 10);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: rows, error } = await supabaseAdmin
      .from("system_financial_transactions")
      .select("type, amount, transaction_date, source_type, category:system_financial_categories(name)")
      .gte("transaction_date", startStr)
      .lte("transaction_date", endStr)
      .limit(20000);

    if (error) throw error;

    type Bucket = {
      month: string;
      key: string;
      income: number;
      expense: number;
      balance: number;
      incomeSubscriptions: number;
      incomeExternal: number;
      incomeOther: number;
      productBalance: number;
    };

    // Buckets de todos os meses da janela
    const buckets = new Map<string, Bucket>();
    const startKey = startStr.slice(0, 7);
    const endKey = endStr.slice(0, 7);
    let cursor = new Date(`${startKey}-01T00:00:00.000Z`);
    const endCursor = new Date(`${endKey}-01T00:00:00.000Z`);
    while (cursor <= endCursor) {
      const key = cursor.toISOString().slice(0, 7);
      buckets.set(key, {
        key,
        month: monthLabelFromKey(key),
        income: 0,
        expense: 0,
        balance: 0,
        incomeSubscriptions: 0,
        incomeExternal: 0,
        incomeOther: 0,
        productBalance: 0,
      });
      cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
    }

    let totalIncome = 0;
    let totalExpense = 0;
    let subscriptionsIncome = 0;
    let externalIncome = 0;
    let otherIncome = 0;

    const classify = (row: any): "subscriptions" | "external" | "other" => {
      const categoryName: string = row.category?.name ?? "";
      if (row.source_type === "subscription_invoice") return "subscriptions";
      if (row.source_type === "external_invoice") return "external";
      if (categoryName.toLowerCase().startsWith("assinatura")) return "subscriptions";
      if (
        categoryName === "Serviços Externos" ||
        categoryName.toLowerCase().startsWith("faturamento externo")
      ) {
        return "external";
      }
      return "other";
    };

    for (const row of (rows ?? []) as any[]) {
      const amount = Number(row.amount ?? 0);
      const bucket = buckets.get(monthKeyFromDateStr(row.transaction_date));

      if (row.type === "expense") {
        totalExpense += amount;
        if (bucket) bucket.expense += amount;
        continue;
      }

      totalIncome += amount;
      if (bucket) bucket.income += amount;

      const group = classify(row);
      if (group === "subscriptions") {
        subscriptionsIncome += amount;
        if (bucket) bucket.incomeSubscriptions += amount;
      } else if (group === "external") {
        externalIncome += amount;
        if (bucket) bucket.incomeExternal += amount;
      } else {
        otherIncome += amount;
        if (bucket) bucket.incomeOther += amount;
      }
    }

    for (const b of buckets.values()) {
      b.balance = b.income - b.expense;
      b.productBalance = b.incomeSubscriptions - b.expense;
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          range: { startDate: startStr, endDate: endStr },
          totalIncome,
          totalExpense,
          balance: totalIncome - totalExpense,
          subscriptionsIncome,
          externalIncome,
          otherIncome,
          productBalance: subscriptionsIncome - totalExpense,
          monthlyData: Array.from(buckets.values()),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("❌ system-finance-summary error:", e);
    return new Response(
      JSON.stringify({ error: "Erro inesperado", details: e?.message ?? String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
