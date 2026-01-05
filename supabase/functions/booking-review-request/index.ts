import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Gerar token único para avaliação
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Formatar data para exibição
function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

// Substituir variáveis do template
function replaceTemplateVariables(
  template: string,
  data: {
    customerName: string;
    professionalName: string;
    serviceName: string;
    date: string;
    link: string;
  }
): string {
  return template
    .replace(/{cliente}/gi, data.customerName)
    .replace(/{profissional}/gi, data.professionalName)
    .replace(/{servico}/gi, data.serviceName)
    .replace(/{data}/gi, formatDate(data.date))
    .replace(/{link}/gi, data.link);
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
      console.error('[booking-review-request] booking_id não fornecido');
      return new Response(JSON.stringify({ error: 'booking_id é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[booking-review-request] Processando solicitação de avaliação para: ${booking_id}`);

    // Buscar dados do agendamento
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
      console.error('[booking-review-request] Agendamento não encontrado:', bookingError);
      return new Response(JSON.stringify({ error: 'Agendamento não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar se já foi enviada uma solicitação de avaliação
    if (booking.review_sent) {
      console.log('[booking-review-request] Solicitação de avaliação já enviada');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Solicitação de avaliação já foi enviada anteriormente' 
      }), {
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
      console.log('[booking-review-request] Configurações não encontradas');
    }

    // Verificar se avaliações estão habilitadas
    if (!settings?.enable_professional_reviews) {
      console.log('[booking-review-request] Avaliações desabilitadas para esta loja');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Avaliações desabilitadas nas configurações' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar se já existe uma avaliação para este agendamento
    const { data: existingReview } = await supabase
      .from('booking_reviews')
      .select('id')
      .eq('booking_id', booking_id)
      .single();

    if (existingReview) {
      console.log('[booking-review-request] Avaliação já existe para este agendamento');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Avaliação já criada para este agendamento' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Gerar token único
    const token = generateToken();

    // Calcular data de expiração (padrão 7 dias)
    const expiryDays = settings?.review_expiry_days || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    // Criar registro de avaliação
    const { data: review, error: reviewError } = await supabase
      .from('booking_reviews')
      .insert({
        booking_id: booking.id,
        store_id: booking.store_id,
        professional_id: booking.professional_id,
        customer_id: booking.customer_id,
        token: token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (reviewError) {
      console.error('[booking-review-request] Erro ao criar registro de avaliação:', reviewError);
      throw reviewError;
    }

    // Buscar domínio da loja para montar o link
    const { data: store } = await supabase
      .from('stores')
      .select('custom_domain, slug')
      .eq('id', booking.store_id)
      .single();

    // Montar link de avaliação
    // Prioridade: custom_domain > slug > fallback
    let baseUrl = 'https://mostralo.com.br';
    if (store?.custom_domain) {
      baseUrl = `https://${store.custom_domain}`;
    } else if (store?.slug) {
      baseUrl = `https://${store.slug}.mostralo.com.br`;
    }
    
    const reviewLink = `${baseUrl}/avaliar/${token}`;

    // Template padrão
    const template = settings?.review_message_template || 
      'Olá {cliente}! Como foi seu atendimento com {profissional}?\n\nGostaríamos muito de ouvir sua opinião! Avalie em apenas 1 minuto:\n\n👉 {link}\n\nSua avaliação é muito importante para nós! ⭐';

    // Montar mensagem
    const message = replaceTemplateVariables(template, {
      customerName: booking.customer_name,
      professionalName: booking.professional?.name || 'Profissional',
      serviceName: booking.service?.name || 'Serviço',
      date: booking.booking_date,
      link: reviewLink,
    });

    console.log(`[booking-review-request] Enviando solicitação de avaliação para: ${booking.customer_phone}`);

    // Enviar via whatsapp-send
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
      console.error('[booking-review-request] Erro ao enviar WhatsApp:', sendError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Erro ao enviar mensagem WhatsApp',
        details: sendError.message,
        reviewId: review.id,
        reviewLink: reviewLink 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Marcar como enviada
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ review_sent: true })
      .eq('id', booking_id);

    if (updateError) {
      console.error('[booking-review-request] Erro ao atualizar status:', updateError);
    }

    console.log(`[booking-review-request] Solicitação de avaliação enviada com sucesso para: ${booking.customer_phone}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Solicitação de avaliação enviada com sucesso',
      reviewId: review.id,
      reviewLink: reviewLink
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[booking-review-request] Erro:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
