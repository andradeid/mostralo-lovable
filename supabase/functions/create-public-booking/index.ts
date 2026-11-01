import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import {
  calculateBookingDeposit,
  normalizeDepositMode,
  normalizeDepositTimeout,
  type BookingDepositMode,
} from "../_shared/booking-deposit.ts";

const url = Deno.env.get("SUPABASE_URL")!;
const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(url, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const respond = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const normalizePhone = (phone: string) => phone.replace(/\D/g, "").trim();

const addMinutesToTime = (startTime: string, durationMinutes: number) => {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;

  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}:00`;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      store_id,
      professional_id,
      service_id,
      customer_name,
      customer_phone,
      customer_email,
      booking_date,
      start_time,
      notes,
      reschedule_token,
    } = body;

    if (!store_id || !professional_id || !service_id || !customer_name || !customer_phone || !booking_date || !start_time) {
      return respond({ error: "Campos obrigatórios ausentes." }, 400);
    }

    const trimmedName = String(customer_name).trim();
    const trimmedPhone = String(customer_phone).trim();
    const trimmedEmail = customer_email ? String(customer_email).trim() : null;
    const trimmedNotes = notes ? String(notes).trim() : null;
    const normalizedPhone = normalizePhone(trimmedPhone);

    if (trimmedName.length < 2 || normalizedPhone.length < 10) {
      return respond({ error: "Dados do cliente inválidos." }, 400);
    }

    const [storeResult, serviceResult, professionalResult, settingsResult] = await Promise.all([
      admin
        .from("public_stores")
        .select("id, name, business_hours")
        .eq("id", store_id)
        .maybeSingle(),
      admin
        .from("booking_services")
        .select("id, store_id, name, duration_minutes, price, requires_deposit, deposit_amount, deposit_percentage")
        .eq("id", service_id)
        .eq("store_id", store_id)
        .eq("is_active", true)
        .maybeSingle(),
      admin
        .from("professionals")
        .select("id, store_id")
        .eq("id", professional_id)
        .eq("store_id", store_id)
        .eq("is_active", true)
        .maybeSingle(),
      admin
        .from("booking_settings")
        .select("require_deposit, default_deposit_percentage, deposit_payment_mode, deposit_payment_timeout_minutes, pix_key, pix_key_type, pix_recipient_name")
        .eq("store_id", store_id)
        .maybeSingle(),
    ]);

    if (storeResult.error || !storeResult.data) {
      return respond({ error: "Estabelecimento não disponível." }, 400);
    }

    if (serviceResult.error || !serviceResult.data) {
      return respond({ error: "Serviço inválido ou inativo." }, 400);
    }

    if (professionalResult.error || !professionalResult.data) {
      return respond({ error: "Profissional inválido ou inativo." }, 400);
    }

    // Dia especial da loja (feriado / horário reduzido) — gravado em business_hours.special_days
    const specialDays = Array.isArray((storeResult.data as any).business_hours?.special_days)
      ? (storeResult.data as any).business_hours.special_days
      : [];
    const special = specialDays.find((d: any) => d?.date === String(booking_date).slice(0, 10));
    if (special) {
      if (special.closed) {
        return respond({ error: `Fechado nesta data${special.name ? ` (${special.name})` : ""}.` }, 400);
      }
      const toMin = (t: string) => {
        const [h, m] = String(t).split(":").map(Number);
        return h * 60 + (m || 0);
      };
      const startMin = toMin(String(start_time));
      const endMin = startMin + Number(serviceResult.data.duration_minutes || 0);
      if (special.open && special.close && (startMin < toMin(special.open) || endMin > toMin(special.close))) {
        return respond({ error: `Nesta data o horário é das ${special.open} às ${special.close}.` }, 400);
      }
    }

    let customerId: string | null = null;

    const { data: existingCustomer, error: existingCustomerError } = await admin
      .from("customers")
      .select("id")
      .or(`phone.eq.${normalizedPhone},phone.eq.${trimmedPhone}`)
      .limit(1)
      .maybeSingle();

    if (existingCustomerError) {
      console.error("[create-public-booking] Error fetching customer:", existingCustomerError);
    }

    if (existingCustomer?.id) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer, error: customerError } = await admin
        .from("customers")
        .insert({
          name: trimmedName,
          phone: normalizedPhone,
          email: trimmedEmail,
          notes: trimmedNotes,
        })
        .select("id")
        .single();

      if (customerError) {
        console.error("[create-public-booking] Error creating customer:", customerError);
      } else {
        customerId = newCustomer?.id ?? null;
      }
    }

    if (customerId) {
      try {
        const { data: originLabel } = await admin
          .from("customer_labels")
          .select("id")
          .eq("store_id", store_id)
          .eq("name", "Agendamento Online")
          .maybeSingle();

        if (originLabel?.id) {
          const { data: existingAssignment } = await admin
            .from("customer_label_assignments")
            .select("id")
            .eq("customer_id", customerId)
            .eq("label_id", originLabel.id)
            .maybeSingle();

          if (!existingAssignment) {
            const { error: assignmentError } = await admin
              .from("customer_label_assignments")
              .insert({
                customer_id: customerId,
                label_id: originLabel.id,
                store_id,
              });

            if (assignmentError) {
              console.error("[create-public-booking] Error assigning label:", assignmentError);
            }
          }
        }
      } catch (labelError) {
        console.error("[create-public-booking] Non-critical label error:", labelError);
      }
    }

    const endTime = addMinutesToTime(String(start_time), Number(serviceResult.data.duration_minutes || 0));
    const price = Number(serviceResult.data.price || 0);

    // ── Sinal (opcional): valor calculado aqui, sobre o preço do catálogo ──
    const settings = settingsResult.data as Record<string, unknown> | null;
    let depositAmount = calculateBookingDeposit(settings as any, serviceResult.data as any);
    let depositMode: BookingDepositMode | null = depositAmount > 0 ? normalizeDepositMode(settings?.deposit_payment_mode) : null;
    const pixKey = String(settings?.pix_key ?? "").trim();

    if (depositMode === "mostralo") {
      // Pix pelo Mostralo só com a conta EFI da loja ativa (senão o dinheiro não teria repasse)
      const { data: efiStore } = await admin
        .from("stores")
        .select("efi_account_number, efi_account_status")
        .eq("id", store_id)
        .maybeSingle();
      if (!efiStore?.efi_account_number || efiStore?.efi_account_status !== "active") {
        console.warn(`[create-public-booking] Loja ${store_id} com sinal pelo Mostralo sem conta EFI ativa`);
        depositMode = pixKey ? "store" : null;
      }
    }
    if (depositMode === "store" && !pixKey) {
      console.warn(`[create-public-booking] Loja ${store_id} com sinal pela loja sem chave Pix: reserva sem sinal`);
      depositMode = null;
    }
    if (!depositMode) depositAmount = 0;

    // Remarcação de reserva com sinal já pago: o sinal acompanha o novo horário
    let carriedDeposit: { amount: number; paid_at: string | null; mode: BookingDepositMode } | null = null;
    if (depositMode && typeof reschedule_token === "string" && reschedule_token.length >= 16) {
      const { data: tokenRow } = await admin
        .from("booking_tokens")
        .select("booking_id, store_id")
        .eq("token", reschedule_token)
        .maybeSingle();
      if (tokenRow?.booking_id && tokenRow.store_id === store_id) {
        const { data: oldBooking } = await admin
          .from("bookings")
          .select("id, status, customer_phone, deposit_mode, deposit_amount, deposit_paid, deposit_paid_at")
          .eq("id", tokenRow.booking_id)
          .maybeSingle();
        if (
          oldBooking?.deposit_paid && Number(oldBooking.deposit_amount) > 0 && oldBooking.status !== "cancelled" &&
          normalizePhone(String(oldBooking.customer_phone ?? "")).endsWith(normalizedPhone.slice(-8))
        ) {
          carriedDeposit = {
            amount: Number(oldBooking.deposit_amount),
            paid_at: oldBooking.deposit_paid_at ?? new Date().toISOString(),
            mode: normalizeDepositMode(oldBooking.deposit_mode),
          };
        }
      }
    }

    const timeoutMinutes = normalizeDepositTimeout(settings?.deposit_payment_timeout_minutes);
    const waitingDeposit = !!depositMode && !carriedDeposit;
    const depositFields = carriedDeposit
      ? {
        deposit_mode: carriedDeposit.mode,
        deposit_amount: carriedDeposit.amount,
        deposit_paid: true,
        deposit_paid_at: carriedDeposit.paid_at,
        deposit_payment_details: { carried_from_reschedule: true },
      }
      : depositMode
      ? {
        deposit_mode: depositMode,
        deposit_amount: depositAmount,
        deposit_paid: false,
        deposit_expires_at: depositMode === "mostralo" ? new Date(Date.now() + timeoutMinutes * 60_000).toISOString() : null,
      }
      : {};

    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .insert({
        store_id,
        professional_id,
        service_id,
        customer_id: customerId,
        customer_name: trimmedName,
        customer_phone: trimmedPhone,
        customer_email: trimmedEmail,
        booking_date,
        start_time: String(start_time),
        end_time: endTime,
        price,
        notes: trimmedNotes,
        // Aguardando sinal = pending (ocupa o horário; o gatilho de conflito conta pending)
        status: waitingDeposit ? "pending" : "confirmed",
        ...depositFields,
      })
      .select("*")
      .single();

    if (bookingError) {
      console.error("[create-public-booking] Error creating booking:", bookingError);
      return respond({ error: "Erro ao criar agendamento.", details: bookingError.message }, 500);
    }

    if (!waitingDeposit) {
      return respond({
        booking,
        deposit: carriedDeposit ? { mode: carriedDeposit.mode, amount: carriedDeposit.amount, paid: true } : null,
      });
    }

    if (depositMode === "store") {
      return respond({
        booking,
        deposit: {
          mode: "store",
          amount: depositAmount,
          paid: false,
          pix_key: pixKey,
          pix_key_type: settings?.pix_key_type ?? "random",
          pix_recipient_name: settings?.pix_recipient_name ?? null,
        },
      });
    }

    // Pix pelo Mostralo: cobrança do valor do sinal (a função lê o sinal da própria reserva e aplica o split da loja)
    const storeName = String((storeResult.data as any)?.name ?? "").trim();
    const pixRes = await fetch(`${url}/functions/v1/efi-create-pix-charge`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        booking_id: booking.id,
        descricao: `Sinal ${String(serviceResult.data.name ?? "agendamento")}${storeName ? ` - ${storeName}` : ""}`.slice(0, 140),
        expiracao_segundos: timeoutMinutes * 60,
      }),
    });
    const pix = await pixRes.json().catch(() => ({}));
    if (!pixRes.ok || !pix?.success || !pix?.txid) {
      console.error("[create-public-booking] Erro ao gerar Pix do sinal", pixRes.status, pix?.error);
      await admin
        .from("bookings")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancellation_reason: "Erro ao gerar o Pix do sinal" })
        .eq("id", booking.id)
        .eq("deposit_paid", false);
      return respond({ error: "Não foi possível gerar o Pix do sinal. Tente novamente." }, 502);
    }

    return respond({
      booking,
      deposit: {
        mode: "mostralo",
        amount: depositAmount,
        paid: false,
        expires_at: booking.deposit_expires_at,
        txid: pix.txid,
        qrcode: pix.qrCodeBase64 ?? null,
        pix_copia_e_cola: pix.pixCopiaECola ?? null,
      },
    });
  } catch (error) {
    console.error("[create-public-booking] Fatal error:", error);
    return respond(
      {
        error: "Erro interno ao criar agendamento.",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      500,
    );
  }
});
