import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type SourceType = "subscription_invoice" | "external_invoice" | "payment_approval";
type TxType = "income" | "expense";

interface SourcesSelection {
  subscription_invoices?: boolean;
  external_invoices?: boolean;
  payment_approvals?: boolean;
}

interface ImportPayload {
  action: "import";
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  dryRun?: boolean;
  sources?: SourcesSelection;
}

type RequestPayload = ImportPayload;

async function requireMasterAdmin(authHeader: string) {
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false as const, status: 401 as const, error: "Unauthorized" };
  }

  const token = authHeader.replace("Bearer ", "");

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: authHeader } },
    }
  );

  // Passar o token explicitamente para getUser
  const {
    data: { user },
    error: authError,
  } = await supabaseClient.auth.getUser(token);

  if (authError || !user) {
    return { ok: false as const, status: 401 as const, error: "Unauthorized" };
  }

  // Usar service role para verificar roles (bypass RLS)
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

function toIsoStart(date: string) {
  return `${date}T00:00:00.000Z`;
}

function toIsoEnd(date: string) {
  return `${date}T23:59:59.999Z`;
}

function toDateOnly(input: string) {
  // input is ISO timestamp
  return input.slice(0, 10);
}

// NOTE: Em Edge Functions (Deno), evitamos tipagem forte do Supabase Client aqui para
// não quebrar o typecheck por incompatibilidade de generics/Database types.
async function ensureCategoryId(supabaseAdmin: any, name: string, type: TxType): Promise<string> {
  const { data: existing, error: findError } = await supabaseAdmin
    .from("system_financial_categories")
    .select("id")
    .eq("name", name)
    .eq("type", type)
    .maybeSingle();

  if (findError) throw findError;
  if (existing?.id) return existing.id as string;

  const { data: created, error: createError } = await supabaseAdmin
    .from("system_financial_categories")
    .insert({
      name,
      type,
      // cor default neutra (se o front quiser, pode editar depois)
      color: null,
      description: "Criada automaticamente pela importação de receitas",
      is_active: true,
    })
    .select("id")
    .single();

  if (createError) throw createError;
  return created.id as string;
}

type SubscriptionInvoiceRow = {
  id: string;
  store_id: string;
  plan_id: string;
  amount: number;
  paid_at: string;
  payment_method: string | null;
  notes: string | null;
};

type ExternalInvoiceRow = {
  id: string;
  invoice_number: string;
  client_id: string;
  service_id: string;
  amount: number;
  paid_at: string;
  payment_method: string | null;
  notes: string | null;
};

type PaymentApprovalRow = {
  id: string;
  store_id: string;
  plan_id: string;
  status: string;
  payment_amount: number;
  approved_at: string;
  payment_method: string | null;
  notes: string | null;
};

function roughlySameAmount(a: number, b: number) {
  return Math.abs(Number(a) - Number(b)) < 0.01;
}

function withinHours(aIso: string, bIso: string, hours: number) {
  const a = new Date(aIso).getTime();
  const b = new Date(bIso).getTime();
  return Math.abs(a - b) <= hours * 60 * 60 * 1000;
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

    if (payload.action !== "import") {
      return new Response(JSON.stringify({ error: "Ação inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin: any = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date();
    const defaultEnd = now.toISOString().slice(0, 10);
    const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const startDate = payload.startDate ?? defaultStart;
    const endDate = payload.endDate ?? defaultEnd;
    const dryRun = !!payload.dryRun;

    // Fontes selecionadas (default: todas habilitadas para retrocompatibilidade)
    const sources: SourcesSelection = payload.sources ?? {
      subscription_invoices: true,
      external_invoices: true,
      payment_approvals: true,
    };

    const startAt = toIsoStart(startDate);
    const endAt = toIsoEnd(endDate);

    const [subscriptionsCategoryId, externalCategoryId, approvalsCategoryId] =
      await Promise.all([
        ensureCategoryId(supabaseAdmin, "Assinaturas", "income"),
        ensureCategoryId(supabaseAdmin, "Faturamento externo", "income"),
        ensureCategoryId(supabaseAdmin, "Approvals", "income"),
      ]);

    // Buscar apenas as fontes selecionadas
    let subRows: SubscriptionInvoiceRow[] = [];
    let extRows: ExternalInvoiceRow[] = [];
    let appRows: PaymentApprovalRow[] = [];

    if (sources.subscription_invoices) {
      const { data: subscriptionInvoices, error: subError } = await supabaseAdmin
        .from("subscription_invoices")
        .select("id, store_id, plan_id, amount, paid_at, payment_method, notes")
        .eq("payment_status", "paid")
        .not("paid_at", "is", null)
        .gte("paid_at", startAt)
        .lte("paid_at", endAt)
        .limit(2000);
      if (subError) throw subError;
      subRows = (subscriptionInvoices ?? []) as SubscriptionInvoiceRow[];
    }

    if (sources.external_invoices) {
      const { data: externalInvoices, error: extError } = await supabaseAdmin
        .from("external_invoices")
        .select("id, invoice_number, client_id, service_id, amount, paid_at, payment_method, notes")
        .eq("payment_status", "paid")
        .not("paid_at", "is", null)
        .gte("paid_at", startAt)
        .lte("paid_at", endAt)
        .limit(2000);
      if (extError) throw extError;
      extRows = (externalInvoices ?? []) as ExternalInvoiceRow[];
    }

    if (sources.payment_approvals) {
      const { data: paymentApprovals, error: appError } = await supabaseAdmin
        .from("payment_approvals")
        .select("id, store_id, plan_id, status, payment_amount, approved_at, payment_method, notes")
        .eq("status", "approved")
        .not("approved_at", "is", null)
        .gte("approved_at", startAt)
        .lte("approved_at", endAt)
        .limit(2000);
      if (appError) throw appError;
      appRows = (paymentApprovals ?? []) as PaymentApprovalRow[];
    }

    // Anti-dupla-contabilização (heurística): se existir subscription_invoice pago muito próximo
    // com mesmo store_id/plan_id/valor, não importar o approval.
    const shouldSkipApproval = (a: PaymentApprovalRow) => {
      return subRows.some((s) =>
        s.store_id === a.store_id &&
        s.plan_id === a.plan_id &&
        roughlySameAmount(Number(s.amount), Number(a.payment_amount)) &&
        withinHours(s.paid_at, a.approved_at, 2)
      );
    };

    const inserts: Array<Record<string, unknown>> = [];

    for (const s of subRows) {
      if (!s.paid_at) continue;
      inserts.push({
        category_id: subscriptionsCategoryId,
        type: "income",
        amount: Number(s.amount),
        description: `Assinatura paga (invoice ${s.id})`,
        notes: s.notes ?? `store_id=${s.store_id} plan_id=${s.plan_id}`,
        vendor: null,
        payment_method: s.payment_method ?? null,
        reference_number: null,
        transaction_date: toDateOnly(s.paid_at),
        created_by: gate.userId,
        is_auto: true,
        source_type: "subscription_invoice" as SourceType,
        source_id: s.id,
        source_paid_at: s.paid_at,
      });
    }

    for (const e of extRows) {
      if (!e.paid_at) continue;
      inserts.push({
        category_id: externalCategoryId,
        type: "income",
        amount: Number(e.amount),
        description: `Fatura externa paga (${e.invoice_number})`,
        notes: e.notes ?? `client_id=${e.client_id} service_id=${e.service_id}`,
        vendor: null,
        payment_method: e.payment_method ?? null,
        reference_number: e.invoice_number,
        transaction_date: toDateOnly(e.paid_at),
        created_by: gate.userId,
        is_auto: true,
        source_type: "external_invoice" as SourceType,
        source_id: e.id,
        source_paid_at: e.paid_at,
      });
    }

    let skippedApprovals = 0;
    for (const a of appRows) {
      if (!a.approved_at) continue;
      if (shouldSkipApproval(a)) {
        skippedApprovals += 1;
        continue;
      }

      inserts.push({
        category_id: approvalsCategoryId,
        type: "income",
        amount: Number(a.payment_amount),
        description: `Approval aprovado (id ${a.id})`,
        notes: a.notes ?? `store_id=${a.store_id} plan_id=${a.plan_id}`,
        vendor: null,
        payment_method: a.payment_method ?? null,
        reference_number: null,
        transaction_date: toDateOnly(a.approved_at),
        created_by: gate.userId,
        is_auto: true,
        source_type: "payment_approval" as SourceType,
        source_id: a.id,
        source_paid_at: a.approved_at,
      });
    }

    let inserted = 0;
    let updatedOrExisting = 0;

    if (!dryRun && inserts.length > 0) {
      const { data: upserted, error: upsertError } = await supabaseAdmin
        .from("system_financial_transactions")
        // @ts-ignore: ignoreDuplicates é suportado pelo PostgREST, mas pode não estar tipado
        .upsert(inserts, { onConflict: "source_type,source_id", ignoreDuplicates: true })
        .select("id");

      if (upsertError) throw upsertError;
      inserted = (upserted ?? []).length;
      // Se ignoreDuplicates funcionar, os duplicados não voltam. Caso contrário, não conseguimos
      // distinguir aqui sem uma query extra; mantemos como "importados".
      updatedOrExisting = Math.max(inserts.length - inserted, 0);
    }

    return new Response(
      JSON.stringify({
        success: true,
        dryRun,
        range: { startDate, endDate },
        found: {
          subscription_invoices: subRows.length,
          external_invoices: extRows.length,
          payment_approvals: appRows.length,
        },
        approvalsSkippedDueToInvoices: skippedApprovals,
        preparedTransactions: inserts.length,
        inserted,
        skippedOrExisting: updatedOrExisting,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e: any) {
    console.error("❌ system-finance-import-revenue error:", e);
    return new Response(
      JSON.stringify({ error: "Erro inesperado", details: e?.message ?? String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
