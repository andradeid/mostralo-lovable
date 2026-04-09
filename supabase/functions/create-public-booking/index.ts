import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

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

    const [storeResult, serviceResult, professionalResult] = await Promise.all([
      admin
        .from("public_stores")
        .select("id")
        .eq("id", store_id)
        .maybeSingle(),
      admin
        .from("booking_services")
        .select("id, store_id, duration_minutes, price")
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
        price: Number(serviceResult.data.price || 0),
        notes: trimmedNotes,
        status: "confirmed",
      })
      .select("*")
      .single();

    if (bookingError) {
      console.error("[create-public-booking] Error creating booking:", bookingError);
      return respond({ error: "Erro ao criar agendamento.", details: bookingError.message }, 500);
    }

    return respond({ booking });
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
