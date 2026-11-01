// Sinal da reserva — consultas da página pública de agendamento (service role; o navegador só manda o id).
// Ações:
//  - status: situação do sinal. No modo Mostralo consulta o Pix na EFI; se CONCLUIDA com valor
//            suficiente, marca pago (reserva confirmada) e dispara a confirmação no WhatsApp.
//            O webhook da EFI faz o mesmo se a tela fechar.
//  - cancel: o cliente desiste antes de pagar (só reserva aguardando o Pix do Mostralo): libera o horário.
import { createClient } from "npm:@supabase/supabase-js@2";
import { getPixCharge, openEfiSession } from "../_shared/efi-pix.ts";
import { depositPaidEnough, DEPOSIT_EXPIRED_REASON } from "../_shared/booking-deposit.ts";
import { applyBookingDepositPayment } from "../_shared/booking-deposit-paid.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// deno-lint-ignore no-explicit-any
type Any = any;

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

const BOOKING_FIELDS =
  "id, status, deposit_mode, deposit_amount, deposit_paid, deposit_pix_txid, deposit_expires_at, deposit_payment_details, confirmation_sent, cancellation_reason";

function view(b: Any, extra: Record<string, unknown> = {}) {
  return {
    mode: b.deposit_mode,
    amount: Number(b.deposit_amount || 0),
    paid: !!b.deposit_paid,
    cancelled: b.status === "cancelled",
    status: b.status,
    expires_at: b.deposit_expires_at ?? null,
    confirmation_sent: !!b.confirmation_sent,
    expired: b.status === "cancelled" && b.cancellation_reason === DEPOSIT_EXPIRED_REASON,
    pix_copia_e_cola: b.deposit_payment_details?.pix_copia_e_cola ?? null,
    ...extra,
  };
}

async function loadBooking(admin: Any, id: string) {
  const { data } = await admin.from("bookings").select(BOOKING_FIELDS).eq("id", id).maybeSingle();
  return data && data.deposit_mode ? data : null;
}

async function depositStatus(admin: Any, body: Any) {
  const id = String(body?.booking_id ?? "");
  if (!UUID_RE.test(id)) return json({ error: "Reserva inválida" }, 400);
  const booking = await loadBooking(admin, id);
  if (!booking) return json({ error: "Reserva não encontrada" }, 404);

  if (booking.deposit_paid || booking.status === "cancelled" || booking.deposit_mode !== "mostralo" || !booking.deposit_pix_txid) {
    return json(view(booking));
  }

  const efi = await openEfiSession(admin);
  let cob: Any = null;
  try {
    cob = await getPixCharge(efi, booking.deposit_pix_txid);
  } finally {
    efi.client.close();
  }

  if (cob?.status === "CONCLUIDA" && Array.isArray(cob.pix) && cob.pix.length) {
    const received = cob.pix.reduce((s: number, p: Any) => s + Number(p?.valor || 0), 0);
    if (depositPaidEnough(received, booking.deposit_amount)) {
      const first = cob.pix[0];
      const result = await applyBookingDepositPayment(admin, booking.id, {
        pix_txid: booking.deposit_pix_txid,
        endToEndId: first?.endToEndId ?? null,
        valor: received.toFixed(2),
        pago_em: first?.horario ?? null,
        confirmado_por: "consulta",
      });
      const fresh = (await loadBooking(admin, booking.id)) ?? booking;
      return json(view(fresh, { result }));
    }
    console.warn(`[booking-deposit] Pix ${booking.deposit_pix_txid}: recebido ${received}, esperado ${booking.deposit_amount}`);
  }

  const expired = !!booking.deposit_expires_at && new Date(booking.deposit_expires_at).getTime() < Date.now();
  return json(view(booking, { expired, pix_status: cob?.status ?? null }));
}

async function cancelDeposit(admin: Any, body: Any) {
  const id = String(body?.booking_id ?? "");
  if (!UUID_RE.test(id)) return json({ error: "Reserva inválida" }, 400);
  const { data } = await admin
    .from("bookings")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancellation_reason: "Cliente desistiu antes de pagar o sinal" })
    .eq("id", id)
    .eq("deposit_mode", "mostralo")
    .eq("deposit_paid", false)
    .eq("status", "pending")
    .select("id");
  return json({ cancelled: (data ?? []).length > 0 });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json().catch(() => ({}));
    switch (body?.action) {
      case "status":
        return await depositStatus(admin, body);
      case "cancel":
        return await cancelDeposit(admin, body);
      default:
        return json({ error: "Ação inválida" }, 400);
    }
  } catch (e) {
    console.error("[booking-deposit]", e);
    return json({ error: "Erro interno" }, 500);
  }
});
