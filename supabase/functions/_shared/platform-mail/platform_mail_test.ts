import { deepStrictEqual as assertEquals, ok as assert } from "node:assert";
import { buildPlatformMail, dataBR, firstName } from "./messages.ts";
import { invoiceNotice, ymdSP } from "./schedule.ts";

const cfg = { auto_send_enabled: true, notify_days_before: 1, notify_on_due_date: true, overdue_notify_interval_days: 3, overdue_notify_count: 3 };

Deno.test("aviso de fatura: antes, no dia e atrasos (mesma regra do WhatsApp)", () => {
  assertEquals(invoiceNotice(cfg, "2026-11-01", "2026-11-02")?.kind, "invoice_before");
  assertEquals(invoiceNotice(cfg, "2026-11-01", "2026-11-03"), null);
  assertEquals(invoiceNotice(cfg, "2026-11-01", "2026-11-01")?.kind, "invoice_due");
  assertEquals(invoiceNotice(cfg, "2026-11-04", "2026-11-01"), { kind: "invoice_overdue", seq: 1, daysBefore: 0 });
  assertEquals(invoiceNotice(cfg, "2026-11-05", "2026-11-01"), null);
  assertEquals(invoiceNotice(cfg, "2026-11-10", "2026-11-01")?.seq, 3);
  assertEquals(invoiceNotice(cfg, "2026-11-13", "2026-11-01"), null); // passou do máximo de avisos
});

Deno.test("aviso de fatura: envio automático desligado não manda nada", () => {
  assertEquals(invoiceNotice({ ...cfg, auto_send_enabled: false }, "2026-11-01", "2026-11-01"), null);
  assertEquals(invoiceNotice(null, "2026-11-01", "2026-11-01"), null);
});

Deno.test("data em São Paulo (virada do dia)", () => {
  assertEquals(ymdSP(new Date("2026-11-01T02:30:00Z")), "2026-10-31");
  assertEquals(ymdSP(new Date("2026-11-01T03:30:00Z")), "2026-11-01");
});

Deno.test("textos: formatação e escape", () => {
  assertEquals(dataBR("2026-11-05"), "05/11/2026");
  assertEquals(firstName("Marcos Andrade"), "Marcos");
  assertEquals(firstName("x@y.com"), "");
  const m = buildPlatformMail("invoice_overdue", { name: "Ana", storeName: "Loja <b>", amount: 97, dueDate: "2026-11-01", overdueSeq: 2, payLink: "https://mostralo.com.br/pagar/abc" });
  assertEquals(m.subject, "Mostralo: fatura em atraso (2º aviso)");
  assert(m.html.includes("Loja &lt;b&gt;"));
  assert(m.html.includes("R$ 97,00"));
  assert(m.text.includes("https://mostralo.com.br/pagar/abc"));
  assert(!m.html.includes("undefined") && !m.text.includes("undefined"));
});

Deno.test("todos os modelos montam sem dados opcionais", () => {
  for (const k of ["welcome", "invoice_before", "invoice_due", "invoice_overdue", "payment_approved"] as const) {
    const m = buildPlatformMail(k, {});
    assert(m.subject.startsWith(k === "welcome" ? "Boas-vindas" : "Mostralo"));
    assert(!m.html.includes("undefined") && !m.html.includes("null"));
  }
});
