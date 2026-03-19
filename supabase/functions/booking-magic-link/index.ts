import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Gerar token seguro de 32 caracteres
function generateToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(array[i] % chars.length);
  }
  return result;
}

// Normalizar telefone para WhatsApp
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('55') && cleaned.length <= 11) {
    cleaned = '55' + cleaned;
  }
  return cleaned;
}

// Formatar data para exibição
function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

// Formatar horário para exibição
function formatTime(timeStr: string): string {
  return timeStr.substring(0, 5);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { action, booking_id, token, reason } = body;

    // === ACTION: create — Gera token e envia link via WhatsApp ===
    if (action === 'create') {
      if (!booking_id) {
        return new Response(JSON.stringify({ error: 'booking_id é obrigatório' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verificar se já existe token para este booking
      const { data: existingToken } = await supabase
        .from('booking_tokens')
        .select('token')
        .eq('booking_id', booking_id)
        .maybeSingle();

      if (existingToken) {
        console.log('[booking-magic-link] Token já existe para booking:', booking_id);
        
        // Mesmo com token existente, reenviar via WhatsApp
        const baseUrl = 'https://mostralo.com.br';
        const magicLink = `${baseUrl}/meu-agendamento/${existingToken.token}`;

        // Buscar dados do booking para mensagem
        const { data: booking } = await supabase
          .from('bookings')
          .select(`
            *,
            professional:professionals(name),
            service:booking_services(name),
            store:stores(id, name, slug, logo_url)
          `)
          .eq('id', booking_id)
          .single();

        let whatsappSent = false;

        if (booking) {
          const message = `📋 *Gerencie seu Agendamento*\n\n` +
            `Olá *${booking.customer_name}*! 👋\n\n` +
            `Aqui está o link para visualizar e gerenciar seu agendamento:\n\n` +
            `👤 Profissional: ${booking.professional?.name || 'Profissional'}\n` +
            `💇 Serviço: ${booking.service?.name || 'Serviço'}\n` +
            `📅 Data: ${formatDate(booking.booking_date)}\n` +
            `🕐 Horário: ${formatTime(booking.start_time)}\n\n` +
            `🔗 Acesse aqui: ${magicLink}\n\n` +
            `_Este link é pessoal e válido por 30 dias._`;

          const storeLogoUrl = booking.store?.logo_url || null;

          // Buscar config WhatsApp
          const { data: uazapiConfig } = await supabase
            .from('uazapi_config')
            .select('api_url')
            .order('is_active', { ascending: false })
            .limit(1)
            .single();

          const { data: instance } = await supabase
            .from('whatsapp_instances')
            .select('instance_name, status, api_token')
            .eq('store_id', booking.store_id)
            .eq('provider', 'uazapi')
            .limit(1)
            .single();

          if (uazapiConfig?.api_url && instance?.status === 'connected' && instance?.api_token) {
            const phone = normalizePhone(booking.customer_phone);
            const apiUrl = uazapiConfig.api_url.replace(/\/$/, '');

            try {
              let response: Response;
              if (storeLogoUrl) {
                response = await fetch(`${apiUrl}/send/media`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'token': instance.api_token },
                  body: JSON.stringify({ number: phone, file: storeLogoUrl, caption: message, type: 'image' }),
                });
              } else {
                response = await fetch(`${apiUrl}/send/text`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'token': instance.api_token },
                  body: JSON.stringify({ number: phone, text: message }),
                });
              }
              if (response.ok) {
                whatsappSent = true;
                console.log('[booking-magic-link] Link mágico reenviado via WhatsApp');
              } else {
                console.error('[booking-magic-link] Erro WhatsApp reenvio:', await response.text());
              }
            } catch (err) {
              console.error('[booking-magic-link] Erro ao reenviar WhatsApp:', err);
            }
          }
        }

        return new Response(JSON.stringify({ success: true, token: existingToken.token, whatsapp_sent: whatsappSent }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Buscar dados do booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          professional:professionals(name),
          service:booking_services(name),
          store:stores(id, name, slug, logo_url)
        `)
        .eq('id', booking_id)
        .single();

      if (bookingError || !booking) {
        console.error('[booking-magic-link] Booking não encontrado:', bookingError);
        return new Response(JSON.stringify({ error: 'Agendamento não encontrado' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Gerar token único
      const newToken = generateToken();

      // Salvar token no banco
      const { error: insertError } = await supabase
        .from('booking_tokens')
        .insert({
          booking_id: booking.id,
          token: newToken,
          store_id: booking.store_id,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
        });

      if (insertError) {
        console.error('[booking-magic-link] Erro ao criar token:', insertError);
        return new Response(JSON.stringify({ error: 'Erro ao gerar link' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Montar link público
      const baseUrl = 'https://mostralo.com.br';
      const magicLink = `${baseUrl}/meu-agendamento/${newToken}`;

      // Montar mensagem com link
      const message = `📋 *Gerencie seu Agendamento*\n\n` +
        `Olá *${booking.customer_name}*! 👋\n\n` +
        `Aqui está o link para visualizar e gerenciar seu agendamento:\n\n` +
        `👤 Profissional: ${booking.professional?.name || 'Profissional'}\n` +
        `💇 Serviço: ${booking.service?.name || 'Serviço'}\n` +
        `📅 Data: ${formatDate(booking.booking_date)}\n` +
        `🕐 Horário: ${formatTime(booking.start_time)}\n\n` +
        `🔗 Acesse aqui: ${magicLink}\n\n` +
        `_Este link é pessoal e válido por 30 dias._`;

      // Buscar logo da loja
      const storeLogoUrl = booking.store?.logo_url || null;

      // Buscar configuração UaZapi
      const { data: uazapiConfig } = await supabase
        .from('uazapi_config')
        .select('api_url')
        .order('is_active', { ascending: false })
        .limit(1)
        .single();

      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('instance_name, status, api_token')
        .eq('store_id', booking.store_id)
        .eq('provider', 'uazapi')
        .limit(1)
        .single();

      let whatsappSent = false;

      if (uazapiConfig?.api_url && instance?.status === 'connected' && instance?.api_token) {
        const phone = normalizePhone(booking.customer_phone);
        const apiUrl = uazapiConfig.api_url.replace(/\/$/, '');

        try {
          let response: Response;

          // Se a loja tem logo, enviar como mídia (imagem + legenda) para branding
          if (storeLogoUrl) {
            console.log(`[booking-magic-link] Enviando como mídia com logo da loja: ${storeLogoUrl}`);
            response = await fetch(`${apiUrl}/send/media`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'token': instance.api_token,
              },
              body: JSON.stringify({
                number: phone,
                file: storeLogoUrl,
                caption: message,
                type: 'image',
              }),
            });
          } else {
            // Fallback: enviar como texto simples
            response = await fetch(`${apiUrl}/send/text`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'token': instance.api_token,
              },
              body: JSON.stringify({
                number: phone,
                text: message,
              }),
            });
          }

          if (response.ok) {
            whatsappSent = true;
            console.log('[booking-magic-link] Link mágico enviado via WhatsApp para:', phone);
          } else {
            console.error('[booking-magic-link] Erro WhatsApp:', await response.text());
          }
        } catch (err) {
          console.error('[booking-magic-link] Erro ao enviar WhatsApp:', err);
        }
      } else {
        console.log('[booking-magic-link] WhatsApp não disponível para loja:', booking.store_id);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        token: newToken, 
        whatsapp_sent: whatsappSent,
        link: magicLink,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === ACTION: resolve — Busca agendamento pelo token ===
    if (action === 'resolve') {
      if (!token) {
        return new Response(JSON.stringify({ error: 'token é obrigatório' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Buscar token
      const { data: tokenData, error: tokenError } = await supabase
        .from('booking_tokens')
        .select('*')
        .eq('token', token)
        .single();

      if (tokenError || !tokenData) {
        return new Response(JSON.stringify({ error: 'Link inválido ou não encontrado' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verificar expiração
      if (new Date(tokenData.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: 'Este link expirou' }), {
          status: 410,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Buscar booking completo
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          id, booking_date, start_time, end_time, status, price,
          customer_name, customer_phone, notes,
          professional:professionals(id, name),
          service:booking_services(id, name, duration_minutes),
          store:stores(id, name, slug, logo_url)
        `)
        .eq('id', tokenData.booking_id)
        .single();

      if (bookingError || !booking) {
        return new Response(JSON.stringify({ error: 'Agendamento não encontrado' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Buscar settings para cancellation_hours_limit
      const { data: settings } = await supabase
        .from('booking_settings')
        .select('cancellation_hours_limit')
        .eq('store_id', tokenData.store_id)
        .single();

      // Atualizar last_accessed_at
      await supabase
        .from('booking_tokens')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('id', tokenData.id);

      return new Response(JSON.stringify({ 
        success: true, 
        booking,
        cancellation_hours_limit: settings?.cancellation_hours_limit || 24,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === ACTION: cancel — Cancela o agendamento via token ===
    if (action === 'cancel') {
      if (!token) {
        return new Response(JSON.stringify({ success: false, error: 'token é obrigatório' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: tokenData, error: tokenError } = await supabase
        .from('booking_tokens')
        .select('*')
        .eq('token', token)
        .single();

      if (tokenError || !tokenData) {
        return new Response(JSON.stringify({ success: false, error: 'Link inválido' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (new Date(tokenData.expires_at) < new Date()) {
        return new Response(JSON.stringify({ success: false, error: 'Este link expirou' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Buscar booking com dados completos para mensagem de confirmação
      const { data: booking, error: bookingErr } = await supabase
        .from('bookings')
        .select(`
          id, booking_date, start_time, status, store_id,
          customer_name, customer_phone,
          professional:professionals(name),
          service:booking_services(name),
          store:stores(id, name, slug, logo_url)
        `)
        .eq('id', tokenData.booking_id)
        .single();

      if (bookingErr || !booking) {
        console.error('[booking-magic-link] Booking não encontrado para cancel:', bookingErr);
        return new Response(JSON.stringify({ success: false, error: 'Agendamento não encontrado' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (booking.status === 'cancelled') {
        return new Response(JSON.stringify({ success: false, error: 'Agendamento já foi cancelado' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verificar cancellation_hours_limit
      const { data: settings } = await supabase
        .from('booking_settings')
        .select('cancellation_hours_limit')
        .eq('store_id', booking.store_id)
        .single();

      const hoursLimit = settings?.cancellation_hours_limit || 24;
      const bookingDateTime = new Date(`${booking.booking_date}T${booking.start_time}`);
      const hoursUntilBooking = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60);

      console.log(`[booking-magic-link] Cancel check: hoursUntil=${hoursUntilBooking.toFixed(1)}, limit=${hoursLimit}`);

      if (hoursUntilBooking < hoursLimit) {
        return new Response(JSON.stringify({ 
          success: false,
          error: `Cancelamento permitido até ${hoursLimit}h antes do agendamento` 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Cancelar
      const { error: cancelError } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: null,
          cancellation_reason: reason || 'Cancelado pelo cliente via link mágico',
        })
        .eq('id', booking.id);

      if (cancelError) {
        console.error('[booking-magic-link] Erro ao cancelar:', cancelError);
        return new Response(JSON.stringify({ success: false, error: 'Erro interno ao cancelar' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('[booking-magic-link] ✅ Agendamento cancelado:', booking.id);

      // === Enviar mensagem de confirmação de cancelamento via WhatsApp ===
      try {
        const { data: uazapiConfig } = await supabase
          .from('uazapi_config')
          .select('api_url')
          .order('is_active', { ascending: false })
          .limit(1)
          .single();

        const { data: instance } = await supabase
          .from('whatsapp_instances')
          .select('instance_name, status, api_token')
          .eq('store_id', booking.store_id)
          .eq('provider', 'uazapi')
          .limit(1)
          .single();

        if (uazapiConfig?.api_url && instance?.status === 'connected' && instance?.api_token) {
          const phone = normalizePhone(booking.customer_phone);
          const apiUrl = uazapiConfig.api_url.replace(/\/$/, '');
          const storeSlug = booking.store?.slug || '';
          const bookingPageLink = `https://mostralo.com.br/loja/${storeSlug}/agendar`;
          const storeLogoUrl = booking.store?.logo_url || null;

          const cancelMessage = `❌ *Agendamento Cancelado*\n\n` +
            `Olá *${booking.customer_name}*,\n\n` +
            `Seu agendamento foi cancelado com sucesso:\n\n` +
            `👤 Profissional: ${booking.professional?.name || 'Profissional'}\n` +
            `💇 Serviço: ${booking.service?.name || 'Serviço'}\n` +
            `📅 Data: ${formatDate(booking.booking_date)}\n` +
            `🕐 Horário: ${formatTime(booking.start_time)}\n\n` +
            `${reason ? `📝 Motivo: ${reason}\n\n` : ''}` +
            `Deseja agendar novamente? Acesse o link abaixo:\n` +
            `🔗 ${bookingPageLink}\n\n` +
            `_${booking.store?.name || 'Equipe'} agradece a preferência! 💙_`;

          let response: Response;

          if (storeLogoUrl) {
            response = await fetch(`${apiUrl}/send/media`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'token': instance.api_token },
              body: JSON.stringify({
                number: phone,
                url: storeLogoUrl,
                caption: cancelMessage,
                type: 'image',
              }),
            });
          } else {
            response = await fetch(`${apiUrl}/send/text`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'token': instance.api_token },
              body: JSON.stringify({ number: phone, text: cancelMessage }),
            });
          }

          if (response.ok) {
            console.log('[booking-magic-link] ✅ Confirmação de cancelamento enviada via WhatsApp');
          } else {
            console.error('[booking-magic-link] Erro ao enviar confirmação:', await response.text());
          }
        }
      } catch (whatsErr) {
        console.error('[booking-magic-link] Erro ao enviar confirmação de cancelamento:', whatsErr);
      }

      return new Response(JSON.stringify({ success: true, message: 'Agendamento cancelado com sucesso' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[booking-magic-link] Erro:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
