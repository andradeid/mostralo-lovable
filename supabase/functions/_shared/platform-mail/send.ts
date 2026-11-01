// Envio dos e-mails da plataforma para o lojista (Resend), uma vez só por fato e destinatário.
// Registro em platform_email_notifications (chave única kind+ref+recipient). Nunca derruba quem chamou.
import { buildPlatformMail, DEFAULT_SUPPORT, type PlatformMailData, type PlatformMailKind, type SupportContact } from "./messages.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

const FROM = "Mostralo <nao-responda@mostralo.com.br>";

export interface MailResult { kind: PlatformMailKind; ref: string; sent: string[]; skipped: string[]; errors: string[] }

/** E-mails da loja: dono (login) + contato de cobrança. */
export async function storeRecipients(admin: Any, store: { owner_id?: string | null; billing_contact_email?: string | null }): Promise<string[]> {
  const set = new Set<string>();
  if (store.owner_id) {
    const { data } = await admin.auth.admin.getUserById(store.owner_id);
    const email = data?.user?.email as string | undefined;
    if (email) set.add(email.toLowerCase());
  }
  if (store.billing_contact_email) set.add(String(store.billing_contact_email).trim().toLowerCase());
  return [...set].filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) && !e.endsWith(".invalid"));
}

/** Contato do suporte salvo em subscription_payment_config; sem ele, o padrão. */
export async function supportContact(admin: Any): Promise<SupportContact> {
  const { data } = await admin.from("subscription_payment_config")
    .select("support_whatsapp, support_email").eq("is_active", true).limit(1).maybeSingle();
  const digits = String(data?.support_whatsapp ?? "").replace(/\D/g, "");
  if (!digits) return { ...DEFAULT_SUPPORT, email: data?.support_email || DEFAULT_SUPPORT.email };
  const full = digits.startsWith("55") ? digits : `55${digits}`;
  const local = full.slice(2);
  const display = local.length === 11 ? `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
    : local.length === 10 ? `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}` : local;
  return { whatsappDisplay: display, whatsappLink: `https://wa.me/${full}`, email: data?.support_email || DEFAULT_SUPPORT.email };
}

export async function sendEmail(to: string, subject: string, html: string, text: string, tags: Record<string, string>, replyTo?: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) throw new Error("RESEND_API_KEY não configurada");
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM, to: [to], subject, html, text,
      ...(replyTo ? { reply_to: replyTo } : {}),
      tags: Object.entries(tags).map(([name, value]) => ({ name, value: value.replace(/[^a-zA-Z0-9_-]/g, "_") })),
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${(await r.text()).slice(0, 200)}`);
}

/** Reserva o envio; null = já enviado (ou em envio). */
async function claim(admin: Any, storeId: string | null, kind: string, ref: string, recipient: string): Promise<string | null> {
  const { data, error } = await admin.from("platform_email_notifications")
    .insert({ store_id: storeId, kind, ref, recipient, status: "sending" }).select("id").maybeSingle();
  if (error) return null; // 23505 = já existe
  return data?.id ?? null;
}

async function finish(admin: Any, id: string, ok: boolean, error?: string) {
  await admin.from("platform_email_notifications")
    .update({ status: ok ? "sent" : "failed", error: error?.slice(0, 300) ?? null, sent_at: ok ? new Date().toISOString() : null }).eq("id", id);
}

/** Envia o aviso para cada destinatário uma vez só (por kind + ref). */
export async function notifyStore(admin: Any, opts: {
  storeId: string | null; kind: PlatformMailKind; ref: string; recipients: string[]; data: PlatformMailData; support: SupportContact;
}): Promise<MailResult> {
  const out: MailResult = { kind: opts.kind, ref: opts.ref, sent: [], skipped: [], errors: [] };
  const msg = buildPlatformMail(opts.kind, { ...opts.data, support: opts.support });
  for (const to of opts.recipients) {
    const id = await claim(admin, opts.storeId, opts.kind, opts.ref, to);
    if (!id) { out.skipped.push(to); continue; }
    try {
      await sendEmail(to, msg.subject, msg.html, msg.text, { tipo: opts.kind }, opts.support.email);
      out.sent.push(to);
      await finish(admin, id, true);
    } catch (e) {
      const err = String((e as Error)?.message ?? e);
      out.errors.push(err);
      await finish(admin, id, false, err);
    }
  }
  return out;
}
