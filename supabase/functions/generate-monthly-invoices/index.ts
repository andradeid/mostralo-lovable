import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** Intervalo em meses por ciclo de cobrança. Ciclo nulo/desconhecido => 1 mês. */
const CYCLE_MONTHS: Record<string, number> = {
  monthly: 1,
  quarterly: 3,
  biannual: 6,
  annual: 12,
};

interface RequestBody {
  dryRun?: boolean;
  maxCatchUp?: number;
  storeId?: string;
  leadDays?: number;
}

interface CreatedInvoiceDetail {
  store_id: string;
  store_name: string;
  due_date: string;
  amount: number;
}

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function sanitizeStoreName(storeName?: string | null): string {
  const normalizedName = storeName?.trim().replace(/\s+/g, ' ');
  return normalizedName && normalizedName.length > 0 ? normalizedName : 'Mostralo';
}

/** Soma meses preservando o dia quando possível (31/01 + 1 mês => 28/02). */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  const targetDay = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDayOfMonth = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)
  ).getUTCDate();
  result.setUTCDate(Math.min(targetDay, lastDayOfMonth));
  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/** Chave de comparação por dia (ignora hora), para deduplicar faturas. */
function dayKey(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Body é opcional: sem body => execução de cron.
    let body: RequestBody = {};
    let hasBody = false;
    try {
      const raw = await req.text();
      if (raw && raw.trim().length > 0) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          body = parsed as RequestBody;
          hasBody = true;
        }
      }
    } catch (_parseError) {
      // Body inválido é tratado como ausente (mantém comportamento de cron).
      body = {};
      hasBody = false;
    }

    const dryRun = body.dryRun === true;
    const maxCatchUp =
      typeof body.maxCatchUp === 'number' && body.maxCatchUp > 0
        ? Math.floor(body.maxCatchUp)
        : 1;
    const leadDays =
      typeof body.leadDays === 'number' && body.leadDays >= 0
        ? Math.floor(body.leadDays)
        : 5;
    const storeIdFilter =
      typeof body.storeId === 'string' && body.storeId.trim().length > 0
        ? body.storeId.trim()
        : undefined;
    const executionSource = hasBody ? 'manual' : 'cron';

    const now = new Date();
    const cutoff = addDays(now, leadDays);

    console.log(
      `[generate-monthly-invoices] source=${executionSource} dryRun=${dryRun} maxCatchUp=${maxCatchUp} leadDays=${leadDays} storeId=${storeIdFilter ?? 'all'}`
    );

    let storesQuery = supabase
      .from('stores')
      .select(`
        id,
        name,
        plan_id,
        created_at,
        custom_monthly_price,
        billing_contact_phone,
        billing_contact_name,
        plans (
          price,
          billing_cycle
        )
      `)
      .eq('status', 'active')
      .not('plan_id', 'is', null);

    if (storeIdFilter) {
      storesQuery = storesQuery.eq('id', storeIdFilter);
    }

    const { data: stores, error: storesError } = await storesQuery;
    if (storesError) throw storesError;

    const createdDetails: CreatedInvoiceDetail[] = [];
    const errors: string[] = [];
    const storeResults: Array<Record<string, unknown>> = [];
    let totalProcessed = 0;

    for (const store of stores ?? []) {
      totalProcessed++;
      const storeName = sanitizeStoreName(store.name);

      try {
        const plan = Array.isArray((store as any).plans)
          ? (store as any).plans[0]
          : (store as any).plans;

        const intervalMonths = CYCLE_MONTHS[plan?.billing_cycle as string] ?? 1;
        const amount = Number(store.custom_monthly_price ?? plan?.price ?? 0);

        if (!(amount > 0)) {
          errors.push(`${storeName}: valor de cobrança inválido (${amount})`);
          storeResults.push({
            store_id: store.id,
            store_name: storeName,
            skipped: 'invalid_amount',
          });
          continue;
        }

        // Faturas existentes da loja (para base de cálculo e deduplicação).
        const { data: existingInvoices, error: invoicesError } = await supabase
          .from('subscription_invoices')
          .select('id, due_date')
          .eq('store_id', store.id)
          .order('due_date', { ascending: false });

        if (invoicesError) throw invoicesError;

        const existingDays = new Set(
          (existingInvoices ?? []).map((invoice) => dayKey(invoice.due_date))
        );

        // Base: última fatura + intervalo. Sem faturas => data de criação da loja.
        let nextDue: Date;
        if (existingInvoices && existingInvoices.length > 0) {
          nextDue = addMonths(new Date(existingInvoices[0].due_date), intervalMonths);
        } else {
          nextDue = new Date(store.created_at);
        }

        const createdForStore: CreatedInvoiceDetail[] = [];
        let guard = 0;

        while (nextDue.getTime() <= cutoff.getTime() && createdForStore.length < maxCatchUp) {
          // Proteção contra loop infinito em dados inconsistentes.
          if (++guard > 240) break;

          const key = dayKey(nextDue);
          if (existingDays.has(key)) {
            nextDue = addMonths(nextDue, intervalMonths);
            continue;
          }

          const detail: CreatedInvoiceDetail = {
            store_id: store.id,
            store_name: storeName,
            due_date: nextDue.toISOString(),
            amount,
          };

          if (!dryRun) {
            const monthLabel = String(nextDue.getUTCMonth() + 1).padStart(2, '0');
            const yearLabel = nextDue.getUTCFullYear();

            const { error: insertError } = await supabase
              .from('subscription_invoices')
              .insert({
                store_id: store.id,
                plan_id: store.plan_id,
                amount,
                due_date: nextDue.toISOString(),
                payment_status: 'pending',
                public_token: generateToken(),
                description: `Assinatura Mostralo - ${storeName} (${monthLabel}/${yearLabel})`,
                contact_phone: store.billing_contact_phone ?? null,
                contact_name: store.billing_contact_name ?? null,
              });

            if (insertError) throw insertError;
          }

          existingDays.add(key);
          createdForStore.push(detail);
          createdDetails.push(detail);

          nextDue = addMonths(nextDue, intervalMonths);
        }

        storeResults.push({
          store_id: store.id,
          store_name: storeName,
          billing_cycle: plan?.billing_cycle ?? 'monthly',
          interval_months: intervalMonths,
          amount,
          invoices_created: createdForStore.length,
          invoices: createdForStore,
          next_due_date: nextDue.toISOString(),
        });
      } catch (storeError: any) {
        // Erro em uma loja não aborta as demais.
        const message = storeError?.message ?? String(storeError);
        console.error(`[generate-monthly-invoices] erro na loja ${storeName}:`, message);
        errors.push(`${storeName}: ${message}`);
        storeResults.push({
          store_id: store.id,
          store_name: storeName,
          error: message,
        });
      }
    }

    // Registro da execução (nunca em dry run, para não poluir o histórico).
    if (!dryRun) {
      const { error: logError } = await supabase.from('recurring_invoice_logs').insert({
        executed_at: new Date().toISOString(),
        total_processed: totalProcessed,
        invoices_created: createdDetails.length,
        whatsapp_sent: 0,
        errors_count: errors.length,
        execution_details: {
          invoices: createdDetails,
          errors,
        },
        execution_source: executionSource,
      });

      if (logError) {
        console.error('[generate-monthly-invoices] falha ao gravar log:', logError.message);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        dryRun,
        invoicesCreated: createdDetails.length,
        stores: storeResults,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('[generate-monthly-invoices] erro fatal:', error?.message ?? error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message ?? 'Erro interno' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
