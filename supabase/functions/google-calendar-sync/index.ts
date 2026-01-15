import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface BookingData {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  customer_name: string;
  customer_phone: string;
  notes?: string;
  professional_id: string;
  store_id: string;
  service?: {
    name: string;
    duration_minutes: number;
  };
  store?: {
    name: string;
    timezone?: string;
  };
}

async function refreshAccessToken(
  supabase: any,
  tokenRecord: any
): Promise<string | null> {
  const { data: oauthConfig } = await supabase
    .from("google_oauth_config")
    .select("client_id, client_secret")
    .single();

  if (!oauthConfig?.client_id || !oauthConfig?.client_secret) {
    console.error("OAuth config not found");
    return null;
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: oauthConfig.client_id,
      client_secret: oauthConfig.client_secret,
      refresh_token: tokenRecord.refresh_token,
      grant_type: "refresh_token"
    })
  });

  if (!response.ok) {
    console.error("Token refresh failed:", await response.text());
    return null;
  }

  const tokens = await response.json();
  
  // Calculate new expiration
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + (tokens.expires_in || 3600));

  // Update token in database
  await supabase
    .from("google_calendar_tokens")
    .update({
      access_token: tokens.access_token,
      token_expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", tokenRecord.id);

  return tokens.access_token;
}

async function getValidAccessToken(
  supabase: any,
  professionalId: string
): Promise<{ token: string; tokenRecord: any } | null> {
  const { data: tokenRecord, error } = await supabase
    .from("google_calendar_tokens")
    .select("*")
    .eq("professional_id", professionalId)
    .eq("is_active", true)
    .eq("sync_enabled", true)
    .single();

  if (error || !tokenRecord) {
    return null;
  }

  // Check if token is expired
  const now = new Date();
  const expiresAt = new Date(tokenRecord.token_expires_at);
  
  if (now >= expiresAt) {
    const newToken = await refreshAccessToken(supabase, tokenRecord);
    if (!newToken) {
      // Mark token as inactive if refresh fails
      await supabase
        .from("google_calendar_tokens")
        .update({ 
          is_active: false, 
          last_error: "Token refresh failed",
          updated_at: new Date().toISOString()
        })
        .eq("id", tokenRecord.id);
      return null;
    }
    return { token: newToken, tokenRecord };
  }

  return { token: tokenRecord.access_token, tokenRecord };
}

function buildGoogleEvent(booking: BookingData, timezone: string = "America/Sao_Paulo") {
  const serviceName = booking.service?.name || "Agendamento";
  
  // Build datetime strings
  const startDateTime = `${booking.booking_date}T${booking.start_time}:00`;
  const endDateTime = `${booking.booking_date}T${booking.end_time}:00`;

  return {
    summary: `${serviceName} - ${booking.customer_name}`,
    description: [
      `👤 Cliente: ${booking.customer_name}`,
      `📞 Telefone: ${booking.customer_phone}`,
      `✂️ Serviço: ${serviceName}`,
      booking.notes ? `📝 Observações: ${booking.notes}` : null,
      `\n---\nAgendamento via Mostralo`
    ].filter(Boolean).join("\n"),
    start: {
      dateTime: startDateTime,
      timeZone: timezone
    },
    end: {
      dateTime: endDateTime,
      timeZone: timezone
    },
    reminders: {
      useDefault: true
    }
  };
}

async function handleSyncAll(supabase: any, storeId: string): Promise<Response> {
  console.log(`Starting sync_all for store: ${storeId}`);
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Get all future bookings for this store that don't have a Google event yet
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select(`
      id,
      booking_date,
      start_time,
      end_time,
      customer_name,
      customer_phone,
      notes,
      professional_id,
      store_id,
      status,
      service:booking_services(name, duration_minutes),
      store:stores(name, timezone)
    `)
    .eq("store_id", storeId)
    .gte("booking_date", today)
    .in("status", ["pending", "confirmed"])
    .order("booking_date", { ascending: true });

  if (bookingsError) {
    console.error("Error fetching bookings:", bookingsError);
    return new Response(
      JSON.stringify({ error: "Erro ao buscar agendamentos" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!bookings || bookings.length === 0) {
    return new Response(
      JSON.stringify({ success: true, synced_count: 0, message: "Nenhum agendamento futuro encontrado" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log(`Found ${bookings.length} bookings to check`);

  let syncedCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  for (const booking of bookings) {
    try {
      // Check if already has Google event
      const { data: existingEvent } = await supabase
        .from("booking_google_events")
        .select("id")
        .eq("booking_id", booking.id)
        .single();

      if (existingEvent) {
        skippedCount++;
        continue;
      }

      // Get valid access token for the professional
      const tokenData = await getValidAccessToken(supabase, booking.professional_id);
      
      if (!tokenData) {
        // Professional doesn't have Google Calendar connected
        skippedCount++;
        continue;
      }

      const { token, tokenRecord } = tokenData;
      const calendarId = tokenRecord.calendar_id || "primary";
      const timezone = booking.store?.timezone || "America/Sao_Paulo";

      // Create the event
      const googleEvent = buildGoogleEvent(booking, timezone);
      
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(googleEvent)
        }
      );

      if (response.ok) {
        const eventData = await response.json();
        
        // Save the mapping
        await supabase
          .from("booking_google_events")
          .insert({
            booking_id: booking.id,
            google_event_id: eventData.id,
            google_calendar_id: calendarId,
            store_id: storeId,
            synced_at: new Date().toISOString()
          });

        syncedCount++;
        console.log(`Synced booking ${booking.id} -> Google Event ${eventData.id}`);
      } else {
        const errorText = await response.text();
        console.error(`Failed to create event for booking ${booking.id}:`, errorText);
        errors.push(`Booking ${booking.id}: ${errorText}`);
      }
    } catch (err: any) {
      console.error(`Error processing booking ${booking.id}:`, err);
      errors.push(`Booking ${booking.id}: ${err.message}`);
    }
  }

  console.log(`Sync completed: ${syncedCount} synced, ${skippedCount} skipped, ${errors.length} errors`);

  return new Response(
    JSON.stringify({ 
      success: true, 
      synced_count: syncedCount,
      skipped_count: skippedCount,
      total_checked: bookings.length,
      errors: errors.length > 0 ? errors : undefined,
      message: syncedCount > 0 
        ? `${syncedCount} agendamento(s) sincronizado(s) com sucesso` 
        : "Todos os agendamentos já estão sincronizados ou não têm Google Calendar conectado"
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { action, booking_id, store_id } = await req.json();

    // Handle sync_all action for store
    if (action === "sync_all" && store_id) {
      return await handleSyncAll(supabase, store_id);
    }

    if (!booking_id) {
      return new Response(
        JSON.stringify({ error: "booking_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get booking with service and store info
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        *,
        service:booking_services(name, duration_minutes),
        store:stores(name, timezone)
      `)
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: "Agendamento não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get valid access token for the professional
    const tokenData = await getValidAccessToken(supabase, booking.professional_id);
    
    if (!tokenData) {
      // No active Google Calendar integration for this professional
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Profissional não tem Google Calendar conectado" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { token, tokenRecord } = tokenData;
    const calendarId = tokenRecord.calendar_id || "primary";
    const timezone = booking.store?.timezone || "America/Sao_Paulo";

    // Check if there's an existing Google event for this booking
    const { data: existingEvent } = await supabase
      .from("booking_google_events")
      .select("google_event_id")
      .eq("booking_id", booking_id)
      .single();

    let result;

    switch (action) {
      case "create":
      case "update": {
        const googleEvent = buildGoogleEvent(booking, timezone);
        
        if (existingEvent?.google_event_id && action === "update") {
          // Update existing event
          const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${existingEvent.google_event_id}`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify(googleEvent)
            }
          );

          if (!response.ok) {
            const error = await response.text();
            console.error("Failed to update Google event:", error);
            
            await supabase
              .from("google_calendar_tokens")
              .update({ last_error: error, updated_at: new Date().toISOString() })
              .eq("id", tokenRecord.id);

            return new Response(
              JSON.stringify({ error: "Falha ao atualizar evento no Google Calendar" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          result = await response.json();

          // Update sync time
          await supabase
            .from("booking_google_events")
            .update({ synced_at: new Date().toISOString(), last_error: null })
            .eq("booking_id", booking_id);

        } else {
          // Create new event
          const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify(googleEvent)
            }
          );

          if (!response.ok) {
            const error = await response.text();
            console.error("Failed to create Google event:", error);
            
            await supabase
              .from("google_calendar_tokens")
              .update({ last_error: error, updated_at: new Date().toISOString() })
              .eq("id", tokenRecord.id);

            return new Response(
              JSON.stringify({ error: "Falha ao criar evento no Google Calendar" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          result = await response.json();

          // Save the event mapping
          await supabase
            .from("booking_google_events")
            .upsert({
              booking_id: booking_id,
              store_id: booking.store_id,
              google_event_id: result.id,
              google_calendar_id: calendarId,
              synced_at: new Date().toISOString()
            }, {
              onConflict: "booking_id"
            });
        }

        // Update last sync time on token
        await supabase
          .from("google_calendar_tokens")
          .update({ 
            last_sync_at: new Date().toISOString(), 
            last_error: null,
            updated_at: new Date().toISOString()
          })
          .eq("id", tokenRecord.id);

        break;
      }

      case "delete": {
        if (!existingEvent?.google_event_id) {
          return new Response(
            JSON.stringify({ success: true, message: "Nenhum evento para deletar" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${existingEvent.google_event_id}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        // 404 is OK - event might already be deleted
        if (!response.ok && response.status !== 404) {
          const error = await response.text();
          console.error("Failed to delete Google event:", error);
          
          return new Response(
            JSON.stringify({ error: "Falha ao deletar evento do Google Calendar" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Remove the mapping
        await supabase
          .from("booking_google_events")
          .delete()
          .eq("booking_id", booking_id);

        result = { deleted: true };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: "Ação inválida. Use: create, update ou delete" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in google-calendar-sync:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
