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

// Normalizar telefone para WhatsApp
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('55') && cleaned.length <= 11) {
    cleaned = '55' + cleaned;
  }
  return cleaned;
}

// Enviar WhatsApp diretamente via Evolution API
async function sendWhatsAppDirect(
  supabase: any,
  storeId: string,
  phoneNumber: string,
  message: string,
  customerId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Buscar configuração Evolution API
    const { data: evolutionConfig, error: configError } = await supabase
      .from('evolution_config')
      .select('api_url, api_key')
      .eq('is_active', true)
      .single();

    if (configError || !evolutionConfig) {
      console.error('[sendWhatsAppDirect] Evolution API não configurada:', configError);
      return { success: false, error: 'Evolution API não configurada' };
    }

    // Buscar instância da loja
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('instance_name, status')
      .eq('store_id', storeId)
      .single();

    if (instanceError || !instance) {
      console.error('[sendWhatsAppDirect] Instância WhatsApp não encontrada:', instanceError);
      return { success: false, error: 'Instância WhatsApp não configurada' };
    }

    if (instance.status !== 'connected') {
      console.error('[sendWhatsAppDirect] WhatsApp não conectado. Status:', instance.status);
      return { success: false, error: 'WhatsApp não conectado' };
    }

    const phone = normalizePhone(phoneNumber);
    console.log(`[sendWhatsAppDirect] Enviando para ${phone} via ${instance.instance_name}`);

    // Enviar mensagem via Evolution API
    const response = await fetch(
      `${evolutionConfig.api_url}/message/sendText/${instance.instance_name}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionConfig.api_key,
        },
        body: JSON.stringify({
          number: phone,
          text: message,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[sendWhatsAppDirect] Erro Evolution API:', errorText);
      return { success: false, error: errorText };
    }

    const result = await response.json();
    console.log('[sendWhatsAppDirect] Resposta Evolution:', JSON.stringify(result));

    // Registrar no log de mensagens
    await supabase.from('whatsapp_messages').insert({
      store_id: storeId,
      customer_id: customerId || null,
      phone_number: phone,
      message_type: 'text',
      content: message,
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error('[sendWhatsAppDirect] Erro:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
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
    const { data: settings } = await supabase
      .from('booking_settings')
      .select('*')
      .eq('store_id', booking.store_id)
      .single();

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

    // Enviar WhatsApp diretamente via Evolution API
    const { success, error: sendError } = await sendWhatsAppDirect(
      supabase,
      booking.store_id,
      booking.customer_phone,
      message,
      booking.customer_id
    );

    if (!success) {
      console.error('[booking-confirmation] Erro ao enviar WhatsApp:', sendError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Erro ao enviar mensagem WhatsApp',
        details: sendError 
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
