import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Formatar data para exibição
function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

// Formatar horário para exibição
function formatTime(timeStr: string): string {
  return timeStr.substring(0, 5);
}

// Formatar valor monetário
function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Substituir variáveis do template
function replaceTemplateVariables(
  template: string,
  booking: {
    customerName: string;
    professionalName: string;
    serviceName: string;
    date: string;
    time: string;
    price: number;
  }
): string {
  return template
    .replace(/{cliente}/gi, booking.customerName)
    .replace(/{profissional}/gi, booking.professionalName)
    .replace(/{servico}/gi, booking.serviceName)
    .replace(/{data}/gi, formatDate(booking.date))
    .replace(/{horario}/gi, formatTime(booking.time))
    .replace(/{valor}/gi, formatCurrency(booking.price));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { booking_id } = await req.json();

    if (!booking_id) {
      console.error('[booking-confirmation] booking_id não fornecido');
      return new Response(JSON.stringify({ error: 'booking_id é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[booking-confirmation] Processando agendamento: ${booking_id}`);

    // Buscar dados do agendamento com joins
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        professional:professionals(id, name),
        service:booking_services(id, name)
      `)
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      console.error('[booking-confirmation] Agendamento não encontrado:', bookingError);
      return new Response(JSON.stringify({ error: 'Agendamento não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar configurações da loja
    const { data: settings, error: settingsError } = await supabase
      .from('booking_settings')
      .select('*')
      .eq('store_id', booking.store_id)
      .single();

    if (settingsError || !settings) {
      console.log('[booking-confirmation] Configurações não encontradas, usando padrões');
    }

    // Verificar se deve enviar confirmação
    if (!settings?.send_confirmation_message) {
      console.log('[booking-confirmation] Envio de confirmação desabilitado');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Envio de confirmação desabilitado nas configurações' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar se já foi enviada
    if (booking.confirmation_sent) {
      console.log('[booking-confirmation] Confirmação já enviada anteriormente');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Confirmação já foi enviada anteriormente' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Template padrão caso não exista
    const template = settings?.confirmation_message_template || 
      'Olá {cliente}! Seu agendamento com {profissional} para {servico} foi confirmado para {data} às {horario}. Valor: {valor}. Qualquer dúvida, entre em contato!';

    // Montar mensagem
    const message = replaceTemplateVariables(template, {
      customerName: booking.customer_name,
      professionalName: booking.professional?.name || 'Profissional',
      serviceName: booking.service?.name || 'Serviço',
      date: booking.booking_date,
      time: booking.start_time,
      price: booking.price || 0,
    });

    console.log(`[booking-confirmation] Enviando mensagem para: ${booking.customer_phone}`);

    // Chamar função whatsapp-send
    const { error: sendError } = await supabase.functions.invoke('whatsapp-send', {
      body: {
        storeId: booking.store_id,
        phoneNumber: booking.customer_phone,
        messageType: 'text',
        content: message,
        customerId: booking.customer_id,
      },
    });

    if (sendError) {
      console.error('[booking-confirmation] Erro ao enviar WhatsApp:', sendError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Erro ao enviar mensagem WhatsApp',
        details: sendError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Marcar como enviada
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ confirmation_sent: true })
      .eq('id', booking_id);

    if (updateError) {
      console.error('[booking-confirmation] Erro ao atualizar status:', updateError);
    }

    console.log(`[booking-confirmation] Confirmação enviada com sucesso para: ${booking.customer_phone}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Confirmação enviada com sucesso' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[booking-confirmation] Erro:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
