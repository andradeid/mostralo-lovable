// E-mails da plataforma para o lojista: boas-vindas, avisos de fatura (vai vencer, vence hoje, vencida)
// e pagamento confirmado. Roda a cada 15 min (cron). Não depende do WhatsApp master.
// - Avisos de fatura seguem a mesma configuração do WhatsApp (subscription_billing_config: envio
//   automático ligado, dias antes, no dia, intervalo e quantidade de avisos de atraso) e só saem das 8h às 20h.
// - Boas-vindas e pagamento confirmado: só para fatos a partir do lançamento (não manda para o passado).
// - Cada aviso vai uma vez só por destinatário (platform_email_notifications).
// Modo prévia: {"preview": true} manda os 5 modelos, com dados de exemplo, só para PREVIEW_TO.
import { createClient } from "npm:@supabase/supabase-js@2";
import { notifyStore, storeRecipients, supportContact, sendEmail } from "../_shared/platform-mail/send.ts";
import { buildPlatformMail, SITE, type PlatformMailKind } from "../_shared/platform-mail/messages.ts";
import { hourSP, invoiceNotice, ymdSP } from "../_shared/platform-mail/schedule.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Data do lançamento: boas-vindas e confirmação de pagamento só para o que acontecer a partir daqui. */
const LAUNCH_AT = "2026-11-01T03:30:00Z";
const PREVIEW_TO = "andradeid@gmail.com";

// deno-lint-ignore no-explicit-any
type Any = any;

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

async function preview(admin: Any) {
  // No máximo uma prévia a cada 10 minutos (a função é pública; evita gastar a cota do Resend)
  const bucket = Math.floor(Date.now() / 600000);
  const { error: lockErr } = await admin.from("platform_email_notifications")
    .insert({ kind: "preview", ref: String(bucket), recipient: PREVIEW_TO, status: "sent", sent_at: new Date().toISOString() });
  if (lockErr) return { preview: true, skipped: "já enviada nos últimos 10 minutos" };
  const support = await supportContact(admin);
  const sample = {
    name: "Marcos Andrade", storeName: "Casa Brasa Hamburgueria", planName: "Plano Mensal", amount: 97, cycle: "monthly",
    dueDate: ymdSP(new Date(Date.now() + 86400000)), daysBefore: 1, overdueSeq: 1,
    payLink: `${SITE}/pagar/exemplo`, storeLink: `${SITE}/loja/casa-brasa`, support,
  };
  const kinds: PlatformMailKind[] = ["welcome", "invoice_before", "invoice_due", "invoice_overdue", "payment_approved"];
  const sent: string[] = [];
  for (const k of kinds) {
    const m = buildPlatformMail(k, sample);
    await sendEmail(PREVIEW_TO, `[TESTE] ${m.subject}`, m.html, m.text, { tipo: `preview_${k}` }, support.email);
    sent.push(k);
    await new Promise((r) => setTimeout(r, 600));
  }
  return { preview: true, to: PREVIEW_TO, sent };
}

async function run(admin: Any) {
  const now = new Date();
  const today = ymdSP(now);
  const support = await supportContact(admin);
  const report: Any = { today, reminders: [], payments: [], welcome: [], errors: [] };

  const { data: plans } = await admin.from("plans").select("id, name, billing_cycle");
  const planById = new Map((plans ?? []).map((p: Any) => [p.id, p]));

  // 1. Avisos de fatura (8h às 20h)
  if (hourSP(now) >= 8 && hourSP(now) < 20) {
    const { data: configs } = await admin.from("subscription_billing_config").select("*");
    const global = (configs ?? []).find((c: Any) => !c.store_id);
    const byStore = new Map((configs ?? []).filter((c: Any) => c.store_id).map((c: Any) => [c.store_id, c]));
    const { data: invoices } = await admin.from("subscription_invoices")
      .select("id, store_id, plan_id, amount, due_date, public_token, contact_name, stores(name, slug, owner_id, billing_contact_email, billing_contact_name, responsible_name)")
      .eq("payment_status", "pending");
    for (const inv of invoices ?? []) {
      try {
        const cfg = byStore.get(inv.store_id) ?? global;
        const notice = invoiceNotice(cfg, today, String(inv.due_date).slice(0, 10));
        if (!notice) continue;
        const store = inv.stores ?? {};
        const to = await storeRecipients(admin, store);
        if (!to.length) continue;
        const plan: Any = planById.get(inv.plan_id);
        const r = await notifyStore(admin, {
          storeId: inv.store_id, kind: notice.kind, ref: `${inv.id}:${notice.kind}:${notice.seq}`, recipients: to, support,
          data: {
            name: inv.contact_name || store.billing_contact_name || store.responsible_name, storeName: store.name,
            planName: plan?.name ?? null, amount: Number(inv.amount), cycle: plan?.billing_cycle ?? null,
            dueDate: String(inv.due_date).slice(0, 10), daysBefore: notice.daysBefore, overdueSeq: notice.seq,
            payLink: inv.public_token ? `${SITE}/pagar/${inv.public_token}` : null,
          },
        });
        report.reminders.push({ invoice: inv.id, kind: notice.kind, sent: r.sent.length, errors: r.errors });
      } catch (e) { report.errors.push(String((e as Error)?.message ?? e)); }
    }
  }

  // 2. Pagamento confirmado (pagas a partir do lançamento, nos últimos 3 dias)
  const since = new Date(Math.max(Date.parse(LAUNCH_AT), now.getTime() - 3 * 86400000)).toISOString();
  const { data: paid } = await admin.from("subscription_invoices")
    .select("id, store_id, plan_id, amount, due_date, paid_at, approved_at, contact_name, stores(name, owner_id, billing_contact_email, billing_contact_name, responsible_name)")
    .eq("payment_status", "paid")
    .or(`paid_at.gte.${since},approved_at.gte.${since}`);
  for (const inv of paid ?? []) {
    try {
      const store = inv.stores ?? {};
      const to = await storeRecipients(admin, store);
      if (!to.length) continue;
      const plan: Any = planById.get(inv.plan_id);
      const r = await notifyStore(admin, {
        storeId: inv.store_id, kind: "payment_approved", ref: inv.id, recipients: to, support,
        data: {
          name: inv.contact_name || store.billing_contact_name || store.responsible_name, storeName: store.name,
          planName: plan?.name ?? null, amount: Number(inv.amount), cycle: plan?.billing_cycle ?? null, dueDate: String(inv.due_date).slice(0, 10),
        },
      });
      if (r.sent.length || r.errors.length) report.payments.push({ invoice: inv.id, sent: r.sent.length, errors: r.errors });
    } catch (e) { report.errors.push(String((e as Error)?.message ?? e)); }
  }

  // 3. Boas-vindas (lojas criadas a partir do lançamento, nos últimos 3 dias)
  const { data: stores } = await admin.from("stores")
    .select("id, name, slug, owner_id, billing_contact_email, responsible_name, created_at")
    .gte("created_at", since);
  for (const s of stores ?? []) {
    try {
      const to = await storeRecipients(admin, { owner_id: s.owner_id });
      if (!to.length) continue;
      const r = await notifyStore(admin, {
        storeId: s.id, kind: "welcome", ref: s.id, recipients: to, support,
        data: { name: s.responsible_name, storeName: s.name, storeLink: s.slug ? `${SITE}/loja/${s.slug}` : null },
      });
      if (r.sent.length || r.errors.length) report.welcome.push({ store: s.id, sent: r.sent.length, errors: r.errors });
    } catch (e) { report.errors.push(String((e as Error)?.message ?? e)); }
  }

  return report;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json().catch(() => ({}));
    if (body?.preview === true) return json(await preview(admin));
    return json(await run(admin));
  } catch (e) {
    console.error("[platform-billing-emails]", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
