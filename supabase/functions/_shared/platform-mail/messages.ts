// Textos dos e-mails da plataforma Mostralo para o lojista (conta e cobrança da assinatura).
// Só monta o texto: quem envia é platform-mail/send.ts. Mesmo visual dos e-mails de login (Supabase Auth).

export type PlatformMailKind =
  | "welcome"          // loja criada
  | "invoice_before"   // fatura vai vencer
  | "invoice_due"      // fatura vence hoje
  | "invoice_overdue"  // fatura vencida
  | "payment_approved"; // pagamento confirmado

export interface PlatformMailData {
  name?: string | null;        // nome do responsável (usa o primeiro)
  storeName?: string | null;
  planName?: string | null;
  amount?: number | null;
  cycle?: string | null;       // monthly | yearly | ...
  dueDate?: string | null;     // AAAA-MM-DD
  daysBefore?: number | null;  // faltam N dias
  overdueSeq?: number | null;  // nº do aviso de atraso
  payLink?: string | null;     // https://mostralo.com.br/pagar/<token>
  storeLink?: string | null;   // https://mostralo.com.br/loja/<slug>
  support?: SupportContact;
}

export interface SupportContact { whatsappDisplay: string; whatsappLink: string; email: string }
export interface BuiltMail { subject: string; html: string; text: string }

export const SITE = "https://mostralo.com.br";
export const DEFAULT_SUPPORT: SupportContact = {
  whatsappDisplay: "(61) 99400-9368",
  whatsappLink: "https://wa.me/5561994009368",
  email: "suporte@mostralo.com.br",
};

const LARANJA = "#D96F26";
const LARANJA_ESCURO = "#B85A1B";

export function brl(v: number | null | undefined): string {
  return Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace(/\s/g, " ");
}

/** dd/mm/aaaa. Aceita "AAAA-MM-DD" sem mexer no fuso. */
export function dataBR(v: string | null | undefined): string {
  if (!v) return "";
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return new Date(v).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export function firstName(n: string | null | undefined): string {
  const t = String(n ?? "").trim();
  if (!t || t.includes("@")) return "";
  return t.split(/\s+/)[0];
}

export function cycleLabel(c: string | null | undefined): string {
  const m: Record<string, string> = { monthly: "mensal", quarterly: "trimestral", semiannual: "semestral", yearly: "anual", annual: "anual" };
  return c ? (m[c] ?? c) : "";
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const p = (t: string) => `<p style="margin:0 0 12px;font-size:16px;line-height:24px;color:#1F2937;">${t}</p>`;
const li = (items: string[]) =>
  `<ol style="margin:0 0 12px;padding-left:22px;font-size:15px;line-height:24px;color:#1F2937;">${items.map((i) => `<li style="margin-bottom:6px;">${i}</li>`).join("")}</ol>`;
const box = (rows: [string, string][]) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 18px;background:#FBF7F3;border:1px solid #F0E2D6;border-radius:12px;">${
    rows.map(([k, v]) => `<tr><td style="padding:10px 16px;font-size:13px;color:#6B7280;">${k}</td><td style="padding:10px 16px;font-size:15px;font-weight:bold;color:#1F2937;text-align:right;">${v}</td></tr>`).join("")
  }</table>`;

function layout(sup: SupportContact, preheader: string, title: string, body: string, button?: { label: string; url: string }, note?: string): string {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#F4F1EE;font-family:Arial,Helvetica,sans-serif;color:#1F2937">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#F4F1EE">
<tr><td align="center" style="padding:32px 16px">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:560px">
<tr><td align="center" style="padding:0 0 20px">
<a href="${SITE}" style="text-decoration:none"><img src="${SITE}/icon-192.png" width="48" height="48" alt="Mostralo" style="display:inline-block;vertical-align:middle;border:0;border-radius:12px">
<span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:24px;font-weight:800;color:${LARANJA};letter-spacing:-0.5px">Mostralo</span></a>
</td></tr>
<tr><td style="background:#ffffff;border-radius:16px;border-top:5px solid ${LARANJA};padding:36px 32px 32px">
<h1 style="margin:0 0 18px;font-size:22px;line-height:30px;color:#1F2937;">${esc(title)}</h1>
${body}
${button ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 8px"><tr><td align="center" bgcolor="${LARANJA}" style="border-radius:10px"><a href="${button.url}" target="_blank" style="display:inline-block;padding:15px 34px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;font-family:Arial,Helvetica,sans-serif">${esc(button.label)}</a></td></tr></table>
<p style="margin:14px 0 0;font-size:12px;line-height:18px;color:#6B7280;">Se o botão não funcionar, copie e cole no navegador:<br><a href="${button.url}" style="color:${LARANJA_ESCURO};word-break:break-all">${esc(button.url)}</a></p>` : ""}
${note ? `<p style="margin:18px 0 0;font-size:13px;line-height:20px;color:#6B7280;">${note}</p>` : ""}
</td></tr>
<tr><td align="center" style="padding:20px 8px 0;font-size:12px;line-height:18px;color:#6B7280">
Dúvidas? Fale com a gente no WhatsApp <a href="${sup.whatsappLink}" style="color:${LARANJA_ESCURO}">${esc(sup.whatsappDisplay)}</a> ou pelo e-mail <a href="mailto:${sup.email}" style="color:${LARANJA_ESCURO}">${esc(sup.email)}</a>.<br><br>
<strong style="color:${LARANJA}">Mostralo</strong> · Faz tudo para o seu negócio crescer<br>
<a href="${SITE}" style="color:#6B7280">mostralo.com.br</a> · Este é um e-mail automático.
</td></tr>
</table></td></tr></table></body></html>`;
}

function plain(sup: SupportContact, title: string, lines: string[], link?: { label: string; url: string }): string {
  return [title, "", ...lines, ...(link ? ["", `${link.label}: ${link.url}`] : []), "",
    `Dúvidas? WhatsApp ${sup.whatsappDisplay} (${sup.whatsappLink}) ou ${sup.email}.`, "Mostralo · mostralo.com.br"].join("\n");
}

const strip = (s: string) => s.replace(/<[^>]+>/g, "");
const ola = (d: PlatformMailData) => (firstName(d.name) ? `Olá, ${firstName(d.name)}!` : "Olá!");
const PAINEL = { label: "Abrir o painel", url: `${SITE}/auth` };

export function buildPlatformMail(kind: PlatformMailKind, d: PlatformMailData): BuiltMail {
  const sup = d.support ?? DEFAULT_SUPPORT;
  const loja = d.storeName ? `<strong>${esc(d.storeName)}</strong>` : "sua loja";
  const lojaTxt = d.storeName || "sua loja";

  switch (kind) {
    case "welcome": {
      const title = "Boas-vindas ao Mostralo";
      const passos = [
        "<strong>Cadastre seus produtos ou serviços</strong> com foto e preço (dá para importar do cardápio).",
        "<strong>Deixe a loja com a sua cara</strong>: logo, cores, horários e formas de entrega e pagamento.",
        "<strong>Compartilhe o link</strong> no WhatsApp, no Instagram e no Google para começar a receber pedidos.",
      ];
      const link = d.storeLink ? p(`O endereço da sua loja é <a href="${d.storeLink}" style="color:${LARANJA_ESCURO};">${esc(d.storeLink.replace(/^https?:\/\//, ""))}</a>.`) : "";
      return {
        subject: "Boas-vindas ao Mostralo",
        html: layout(sup, "Sua loja está criada. Veja os primeiros passos.", title,
          p(ola(d)) + p(`A loja ${loja} está criada no Mostralo.`) + link + p("Para começar a vender, são 3 passos:") + li(passos),
          PAINEL, "Se travar em alguma etapa, chame a gente no WhatsApp: a gente ajuda a configurar."),
        text: plain(sup, title, [ola(d), `A loja ${lojaTxt} está criada no Mostralo.`, ...(d.storeLink ? [`Endereço: ${d.storeLink}`] : []), "",
          "Primeiros passos:", "1. Cadastre seus produtos ou serviços com foto e preço.", "2. Deixe a loja com a sua cara: logo, cores, horários, entrega e pagamento.",
          "3. Compartilhe o link no WhatsApp, Instagram e Google."], PAINEL),
      };
    }

    case "payment_approved": {
      const title = "Pagamento confirmado";
      const rows: [string, string][] = [
        ["Plano", esc(d.planName || "Mostralo")],
        ["Valor", `${brl(d.amount)}${d.cycle ? ` (${cycleLabel(d.cycle)})` : ""}`],
        ...(d.dueDate ? [["Fatura com vencimento", dataBR(d.dueDate)] as [string, string]] : []),
      ];
      const intro = `Recebemos o pagamento da assinatura de ${loja}. Está tudo certo e a loja segue funcionando normalmente.`;
      return {
        subject: "Mostralo: pagamento confirmado",
        html: layout(sup, "Recebemos o seu pagamento. Obrigado!", title, p(ola(d)) + p(intro) + box(rows), PAINEL,
          "O comprovante fica no painel, em Assinatura. Obrigado por usar o Mostralo!"),
        text: plain(sup, title, [ola(d), strip(intro), "", `Plano: ${d.planName || "Mostralo"}`, `Valor: ${brl(d.amount)}`,
          ...(d.dueDate ? [`Fatura com vencimento: ${dataBR(d.dueDate)}`] : [])], PAINEL),
      };
    }

    case "invoice_before":
    case "invoice_due":
    case "invoice_overdue": {
      const hoje = kind === "invoice_due";
      const atraso = kind === "invoice_overdue";
      const title = atraso ? "Fatura em atraso" : hoje ? "Sua fatura vence hoje" : "Sua fatura vence em breve";
      const faltam = d.daysBefore && d.daysBefore > 1 ? `em ${d.daysBefore} dias` : "amanhã";
      const intro = atraso
        ? `A fatura da assinatura de ${loja} venceu em <strong>${dataBR(d.dueDate)}</strong> e ainda não identificamos o pagamento. Regularize para a loja continuar no ar sem interrupção.`
        : hoje
          ? `A fatura da assinatura de ${loja} vence <strong>hoje</strong>. Pague pelo Pix para a loja continuar no ar sem interrupção.`
          : `A fatura da assinatura de ${loja} vence <strong>${faltam}</strong> (${dataBR(d.dueDate)}). Você já pode pagar pelo Pix.`;
      const rows: [string, string][] = [
        ...(d.planName ? [["Plano", esc(d.planName)] as [string, string]] : []),
        ["Valor", brl(d.amount)],
        ["Vencimento", dataBR(d.dueDate)],
      ];
      const pagar = d.payLink ? { label: "Pagar fatura", url: d.payLink } : PAINEL;
      const subject = atraso
        ? `Mostralo: fatura em atraso${d.overdueSeq && d.overdueSeq > 1 ? ` (${d.overdueSeq}º aviso)` : ""}`
        : hoje ? "Mostralo: sua fatura vence hoje" : `Mostralo: sua fatura vence ${dataBR(d.dueDate)}`;
      return {
        subject,
        html: layout(sup, atraso ? "Sua fatura venceu. Veja como pagar." : "Pague pelo Pix em poucos segundos.", title,
          p(ola(d)) + p(intro) + box(rows), pagar, "No botão Pagar fatura aparece o Pix (QR Code e copia e cola). Se já pagou, pode desconsiderar este aviso."),
        text: plain(sup, title, [ola(d), strip(intro), "", ...(d.planName ? [`Plano: ${d.planName}`] : []), `Valor: ${brl(d.amount)}`,
          `Vencimento: ${dataBR(d.dueDate)}`, "", "Se já pagou, pode desconsiderar."], pagar),
      };
    }
  }
}
