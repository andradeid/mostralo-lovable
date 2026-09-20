import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type TxType = "income" | "expense";
type SourceType = "subscription_invoice" | "external_invoice";

interface ImportPayload {
  action?: "import";
  dryRun?: boolean;
  /** YYYY-MM-DD — considera apenas pagamentos com paid_at a partir desta data */
  since?: string;
}

/** Valida o JWT e exige role master_admin */
async function requireMasterAdmin(authHeader: string) {
  const [scheme, maybeToken] = authHeader?.split(" ") ?? [];
  if (!scheme || scheme.toLowerCase() !== "bearer" || !maybeToken) {
    return { ok: false as const, status: 401 as const, error: "Unauthorized" };
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: authHeader } },
    }
  );

  const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(maybeToken);
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) {
    return { ok: false as const, status: 401 as const, error: "Unauthorized" };
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const { data: roleData, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "master_admin")
    .maybeSingle();

  if (roleError) {
    return { ok: false as const, status: 500 as const, error: "Erro ao verificar permissões" };
  }
  if (!roleData) {
    return {
      ok: false as const,
      status: 403 as const,
      error: "Forbidden: Only master admins can access system finance",
    };
  }

  return { ok: true as const, userId: userId as string };
}

/** Garante a existência da categoria e devolve o id */
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
      description: "Criada automaticamente pela importação de receitas",
      is_active: true,
    })
    .select("id")
    .single();
  if (createError) throw createError;
  return created.id as string;
}

/** ISO timestamp -> YYYY-MM-DD (regime de caixa: data do pagamento) */
function toDateOnly(iso: string) {
  return iso.slice(0, 10);
}

/** Referência de período legível: MM/AAAA */
function periodRef(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
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

    let payload: ImportPayload = {};
    try {
      const raw = await req.text();
      payload = raw ? (JSON.parse(raw) as ImportPayload) : {};
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dryRun = !!payload.dryRun;
    const since = payload.since && /^\d{4}-\d{2}-\d{2}$/.test(payload.since) ? payload.since : null;
    const sinceAt = since ? `${since}T00:00:00.000Z` : null;

    const supabaseAdmin: any = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const [subscriptionsCategoryId, externalCategoryId] = await Promise.all([
      ensureCategoryId(supabaseAdmin, "Assinaturas", "income"),
      ensureCategoryId(supabaseAdmin, "Serviços Externos", "income"),
    ]);

    // ---------- Fonte A: faturas de assinatura pagas ----------
    let subQuery = supabaseAdmin
      .from("subscription_invoices")
      .select("id, store_id, amount, paid_at, due_date, payment_method, description")
      .eq("payment_status", "paid")
      .not("paid_at", "is", null)
      .limit(5000);
    if (sinceAt) subQuery = subQuery.gte("paid_at", sinceAt);

    const { data: subInvoices, error: subError } = await subQuery;
    if (subError) throw subError;

    const storeIds = Array.from(
      new Set(((subInvoices ?? []) as any[]).map((s) => s.store_id).filter(Boolean))
    );

    const storeMap = new Map<string, { name: string; billing_enabled: boolean }>();
    if (storeIds.length > 0) {
      const { data: stores, error: storesError } = await supabaseAdmin
        .from("stores")
        .select("id, name, billing_enabled")
        .in("id", storeIds);
      if (storesError) throw storesError;
      for (const st of (stores ?? []) as any[]) {
        storeMap.set(st.id, { name: st.name ?? "Loja", billing_enabled: !!st.billing_enabled });
      }
    }

    // Apenas lojas com cobrança habilitada entram na receita do produto
    const eligibleSubs = ((subInvoices ?? []) as any[]).filter((s) => {
      const store = storeMap.get(s.store_id);
      return !!store && store.billing_enabled;
    });

    // ---------- Fonte B: faturas de serviços externos pagas ----------
    let extQuery = supabaseAdmin
      .from("external_invoices")
      .select("id, invoice_number, client_id, amount, paid_at, due_date, payment_method, description")
      .eq("payment_status", "paid")
      .not("paid_at", "is", null)
      .limit(5000);
    if (sinceAt) extQuery = extQuery.gte("paid_at", sinceAt);

    const { data: extInvoices, error: extError } = await extQuery;
    if (extError) throw extError;

    const clientIds = Array.from(
      new Set(((extInvoices ?? []) as any[]).map((e) => e.client_id).filter(Boolean))
    );
    const clientMap = new Map<string, string>();
    if (clientIds.length > 0) {
      const { data: clients, error: clientsError } = await supabaseAdmin
        .from("external_clients")
        .select("id, name")
        .in("id", clientIds);
      if (clientsError) throw clientsError;
      for (const c of (clients ?? []) as any[]) clientMap.set(c.id, c.name ?? "Cliente externo");
    }

    // ---------- Deduplicação por source_type + source_id ----------
    const existingKeys = new Set<string>();
    const { data: existingRows, error: existingError } = await supabaseAdmin
      .from("system_financial_transactions")
      .select("source_type, source_id")
      .in("source_type", ["subscription_invoice", "external_invoice"])
      .not("source_id", "is", null)
      .limit(20000);
    if (existingError) throw existingError;
    for (const row of (existingRows ?? []) as any[]) {
      existingKeys.add(`${row.source_type}:${row.source_id}`);
    }

    const inserts: Array<Record<string, unknown>> = [];
    let skipped = 0;

    const pushIfNew = (sourceType: SourceType, sourceId: string, build: () => Record<string, unknown>) => {
      const key = `${sourceType}:${sourceId}`;
      if (existingKeys.has(key)) {
        skipped += 1;
        return;
      }
      existingKeys.add(key); // protege contra duplicidade dentro do mesmo lote
      inserts.push(build());
    };

    for (const s of eligibleSubs) {
      if (!s.paid_at) continue;
      const storeName = storeMap.get(s.store_id)?.name ?? "Loja";
      const ref = periodRef(s.due_date ?? s.paid_at);
      pushIfNew("subscription_invoice", s.id, () => ({
        category_id: subscriptionsCategoryId,
        type: "income",
        amount: Number(s.amount ?? 0),
        description: ref ? `Assinatura — ${storeName} (${ref})` : `Assinatura — ${storeName}`,
        notes: s.description ?? null,
        payment_method: s.payment_method ?? null,
        transaction_date: toDateOnly(s.paid_at),
        created_by: gate.userId,
        is_auto: true,
        source_type: "subscription_invoice",
        source_id: s.id,
        source_paid_at: s.paid_at,
      }));
    }

    for (const e of (extInvoices ?? []) as any[]) {
      if (!e.paid_at) continue;
      const clientName = clientMap.get(e.client_id) ?? "Cliente externo";
      const ref = periodRef(e.due_date ?? e.paid_at);
      pushIfNew("external_invoice", e.id, () => ({
        category_id: externalCategoryId,
        type: "income",
        amount: Number(e.amount ?? 0),
        description: ref
          ? `Serviço externo — ${clientName} (${ref})`
          : `Serviço externo — ${clientName}`,
        notes: e.description ?? null,
        payment_method: e.payment_method ?? null,
        reference_number: e.invoice_number ?? null,
        transaction_date: toDateOnly(e.paid_at),
        created_by: gate.userId,
        is_auto: true,
        source_type: "external_invoice",
        source_id: e.id,
        source_paid_at: e.paid_at,
      }));
    }

    let created = 0;
    if (!dryRun && inserts.length > 0) {
      // insere em lotes para evitar payloads grandes
      const chunkSize = 200;
      for (let i = 0; i < inserts.length; i += chunkSize) {
        const chunk = inserts.slice(i, i + chunkSize);
        const { data: insertedRows, error: insertError } = await supabaseAdmin
          .from("system_financial_transactions")
          .insert(chunk)
          .select("id");
        if (insertError) throw insertError;
        created += (insertedRows ?? []).length;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        dryRun,
        since,
        found: {
          subscription_invoices: eligibleSubs.length,
          external_invoices: (extInvoices ?? []).length,
        },
        toCreate: inserts.length,
        created: dryRun ? 0 : created,
        skipped,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("❌ system-finance-import-revenue error:", e);
    return new Response(
      JSON.stringify({ error: "Erro inesperado", details: e?.message ?? String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
