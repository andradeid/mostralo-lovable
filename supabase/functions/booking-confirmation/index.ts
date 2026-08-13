import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
    locationLink?: string;
    magicLink?: string;
  }
): string {
  let result = template
    .replace(/{cliente}/gi, booking.customerName)
    .replace(/{profissional}/gi, booking.professionalName)
    .replace(/{servico}/gi, booking.serviceName)
    .replace(/{data}/gi, formatDate(booking.date))
    .replace(/{horario}/gi, formatTime(booking.time))
    .replace(/{valor}/gi, formatCurrency(booking.price))
    .replace(/{localizacao}/gi, booking.locationLink || '')
    .replace(/{link}/gi, booking.magicLink || '');

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

// Enviar WhatsApp diretamente via UaZapi (texto ou imagem com legenda)
async function sendWhatsAppDirect(
  supabase: any,
  storeId: string,
  phoneNumber: string,
  message: string,
  customerId?: string,
  options?: { mediaUrl?: string }
): Promise<{ success: boolean; error?: string; apiUrl?: string; apiToken?: string }> {
  try {
    // Buscar configuração UaZapi
    const { data: uazapiConfig, error: configError } = await supabase
      .from('uazapi_config')
      .select('api_url')
      .order('is_active', { ascending: false })
      .limit(1)
      .single();

    if (configError || !uazapiConfig?.api_url) {
      console.error('[sendWhatsAppDirect] UaZapi não configurada:', configError);
      return { success: false, error: 'UaZapi não configurada' };
    }

    // Buscar instância da loja com token UaZapi
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('instance_name, status, api_token')
      .eq('store_id', storeId)
      .eq('provider', 'uazapi')
      .limit(1)
      .single();

    if (instanceError || !instance) {
      console.error('[sendWhatsAppDirect] Instância UaZapi não encontrada:', instanceError);
      return { success: false, error: 'Instância WhatsApp não configurada' };
    }

    if (instance.status !== 'connected') {
      console.error('[sendWhatsAppDirect] WhatsApp não conectado. Status:', instance.status);
      return { success: false, error: 'WhatsApp não conectado' };
    }

    if (!instance.api_token) {
      console.error('[sendWhatsAppDirect] Token UaZapi não encontrado na instância');
      return { success: false, error: 'Token da instância não configurado' };
    }

    const phone = normalizePhone(phoneNumber);
    const apiUrl = uazapiConfig.api_url.replace(/\/$/, '');
    const useImage = !!options?.mediaUrl;
    console.log(`[sendWhatsAppDirect] Enviando ${useImage ? 'imagem' : 'texto'} para ${phone} via UaZapi (${instance.instance_name})`);

    const attempts = useImage
      ? [
          {
            label: 'media',
            endpoint: `${apiUrl}/send/media`,
            payload: { number: phone, file: options!.mediaUrl, text: message, type: 'image' },
          },
          {
            label: 'image',
            endpoint: `${apiUrl}/send/image`,
            payload: { number: phone, image: options!.mediaUrl, caption: message },
          },
          {
            label: 'text-fallback',
            endpoint: `${apiUrl}/send/text`,
            payload: { number: phone, text: message },
          },
        ]
      : [
          {
            label: 'text',
            endpoint: `${apiUrl}/send/text`,
            payload: { number: phone, text: message },
          },
        ];

    const attemptErrors: string[] = [];

    for (const attempt of attempts) {
      const response = await fetch(attempt.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': instance.api_token,
        },
        body: JSON.stringify(attempt.payload),
      });

      const responseText = await response.text();

      if (response.ok) {
        console.log(`[sendWhatsAppDirect] Envio bem-sucedido via ${attempt.label}: ${responseText}`);

        // Registrar no log de mensagens
        await supabase.from('whatsapp_messages').insert({
          store_id: storeId,
          customer_id: customerId || null,
          phone_number: phone,
          message_type: useImage && attempt.label !== 'text-fallback' ? 'image' : 'text',
          content: message,
          status: 'sent',
          sent_at: new Date().toISOString(),
        });

        return { success: true, apiUrl, apiToken: instance.api_token };
      }

      const errorMessage = `${attempt.label}: status=${response.status} body=${responseText}`;
      attemptErrors.push(errorMessage);
      console.warn(`[sendWhatsAppDirect] Falha via ${attempt.label}: ${errorMessage}`);
    }

    return { success: false, error: attemptErrors.join(' | ') };
    await supabase.from('whatsapp_messages').insert({
      store_id: storeId,
      customer_id: customerId || null,
      phone_number: phone,
      message_type: useImage ? 'image' : 'text',
      content: message,
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

    return { success: true, apiUrl, apiToken: instance.api_token };
  } catch (error) {
    console.error('[sendWhatsAppDirect] Erro:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

// Mapa de tipo de chave PIX para formato UaZapi
const PIX_TYPE_MAP: Record<string, string> = {
  cpf: 'CPF',
  cnpj: 'CNPJ',
  email: 'EMAIL',
  phone: 'PHONE',
  random: 'EVP',
};

// Enviar solicitação de pagamento PIX via UaZapi
async function sendPixPaymentRequest(
  supabase: any,
  storeId: string,
  phoneNumber: string,
  settings: any,
  booking: any,
  apiUrl: string,
  apiToken: string,
  customerId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Não enviar PIX para agendamentos com valor zero (ex: assinaturas)
    if (!booking.price || Number(booking.price) <= 0) {
      console.log('[booking-confirmation] ⏭️ PIX ignorado: valor do agendamento é R$ 0,00 (assinatura ou cortesia)');
      return { success: true };
    }

    const phone = normalizePhone(phoneNumber);
    const pixType = PIX_TYPE_MAP[settings.pix_key_type] || 'EVP';

    // Buscar nome da loja para footer
    const { data: store } = await supabase
      .from('stores')
      .select('name')
      .eq('id', storeId)
      .single();

    const storeName = store?.name || '';

    // Montar mensagem da cobrança com variáveis
    const paymentMessage = settings.pix_payment_message
      ? replaceTemplateVariables(settings.pix_payment_message, {
          customerName: booking.customer_name,
          professionalName: booking.professional?.name || 'Profissional',
          serviceName: booking.service?.name || 'Serviço',
          date: booking.booking_date,
          time: booking.start_time,
          price: booking.price || 0,
        })
      : `Pagamento referente ao agendamento de ${booking.service?.name || 'serviço'}`;

    const payload: any = {
      number: phone,
      amount: Number(booking.price || 0),
      pixKey: settings.pix_key,
      pixType: pixType,
      readmessages: true,
      text: paymentMessage,
      footer: storeName,
    };

    if (settings.pix_recipient_name) {
      payload.pixName = settings.pix_recipient_name;
    }

    // Nome do item = nome do serviço
    if (booking.service?.name) {
      payload.itemName = booking.service.name;
    }

    console.log(`[booking-confirmation] 💰 Enviando PIX payment request: R$${booking.price} | PIX: ${settings.pix_key} (${pixType})`);

    const response = await fetch(`${apiUrl}/send/request-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': apiToken,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[booking-confirmation] Erro ao enviar PIX:', errorText);
      return { success: false, error: errorText };
    }

    const result = await response.json();
    console.log('[booking-confirmation] PIX enviado:', JSON.stringify(result));

    // Registrar no log de notificações
    await supabase.from('booking_notification_logs').insert({
      booking_id: booking.id,
      store_id: storeId,
      notification_type: 'pix_payment',
      send_method: 'automatic',
      status: 'sent',
    });

    return { success: true };
  } catch (error) {
    console.error('[booking-confirmation] Erro PIX:', error);
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

    const { booking_id, manual = false, is_reschedule = false } = await req.json();

    if (!booking_id) {
      console.error('[booking-confirmation] booking_id não fornecido');
      return new Response(JSON.stringify({ error: 'booking_id é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[booking-confirmation] Processando agendamento: ${booking_id}, manual: ${manual}`);

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

    // Buscar dados da loja (localização, slug, logo)
    const { data: store } = await supabase
      .from('stores')
      .select('latitude, longitude, address, slug, logo_url')
      .eq('id', booking.store_id)
      .single();

    // Verificar se deve enviar confirmação (apenas para automático)
    if (!manual && !settings?.send_confirmation_message) {
      console.log('[booking-confirmation] Envio de confirmação desabilitado');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Envio de confirmação desabilitado nas configurações' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar se já foi enviada (apenas para automático)
    if (!manual && booking.confirmation_sent) {
      console.log('[booking-confirmation] Confirmação já enviada anteriormente');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Confirmação já foi enviada anteriormente' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Gerar link de navegação se configurado (com encurtador)
    let locationLink = '';
    const sendLocation = settings?.send_location_in_confirmation && store?.latitude && store?.longitude;
    if (sendLocation) {
      const params = new URLSearchParams({
        lat: String(store.latitude),
        lng: String(store.longitude),
        ...(store.slug ? { store: store.slug } : {}),
        ...(store.address ? { address: store.address } : {}),
      });
      const fullLocationLink = `https://mostralo.com.br/navegar?${params.toString()}`;
      console.log(`[booking-confirmation] 📍 Link de navegação completo: ${fullLocationLink}`);

      // Encurtar o link via short-link
      try {
        const { data: shortData, error: shortError } = await supabase.functions.invoke('short-link', {
          body: { action: 'create_url', targetUrl: fullLocationLink, storeSlug: store.slug || 'general' }
        });
        if (!shortError && shortData?.success && shortData?.id) {
          locationLink = `https://mostralo.com.br/r/${shortData.id}`;
          console.log(`[booking-confirmation] 📍 Link encurtado: ${locationLink}`);
        } else {
          locationLink = fullLocationLink;
          console.warn('[booking-confirmation] Falha ao encurtar, usando link completo');
        }
      } catch (e) {
        locationLink = fullLocationLink;
        console.warn('[booking-confirmation] Exceção ao encurtar link:', e);
      }
    }

    // Gerar link mágico do agendamento (variável {link})
    let magicLink = '';
    try {
      const { data: linkData, error: linkError } = await supabase.functions.invoke('booking-magic-link', {
        body: { action: 'create', booking_id: booking.id, skip_whatsapp: true }
      });
      if (!linkError && linkData?.link) {
        magicLink = linkData.link;
        console.log(`[booking-confirmation] 🔗 Link mágico gerado: ${magicLink}`);
      } else {
        console.warn('[booking-confirmation] Falha ao gerar link mágico:', linkError);
      }
    } catch (e) {
      console.warn('[booking-confirmation] Exceção ao gerar link mágico:', e);
    }

    // Template padrão caso não exista
    const template = settings?.confirmation_message_template ||
      '✅ *Agendamento Confirmado!*\n\nOlá *{cliente}*! 👋\n\n📋 *Detalhes do agendamento:*\n👤 Profissional: {profissional}\n💇 Serviço: {servico}\n📅 Data: {data}\n🕐 Horário: {horario}\n💰 Valor: {valor}\n\n🔗 *Gerencie seu agendamento:*\n{link}\n\nQualquer dúvida, entre em contato! 😊';

    // Montar mensagem
    let message = replaceTemplateVariables(template, {
      customerName: booking.customer_name,
      professionalName: booking.professional?.name || 'Profissional',
      serviceName: booking.service?.name || 'Serviço',
      date: booking.booking_date,
      time: booking.start_time,
      price: booking.price || 0,
      locationLink,
      magicLink,
    });

    // Anexar link mágico ao final se não estiver no template
    if (magicLink && !template.includes('{link}')) {
      message += `\n\n🔗 *Gerencie seu agendamento:*\n${magicLink}`;
    }

    // Adicionar link de navegação ao final se ativo e não foi usado no template
    if (sendLocation && locationLink && !template.includes('{localizacao}')) {
      message += `\n\n📍 *Como chegar:*\n${locationLink}`;
    }

    console.log(`[booking-confirmation] Enviando mensagem para: ${booking.customer_phone}`);

    // Enviar WhatsApp diretamente via UaZapi (com logo como imagem se disponível)
    const logoUrl = store?.logo_url || null;
    const { success, error: sendError, apiUrl: resolvedApiUrl, apiToken: resolvedToken } = await sendWhatsAppDirect(
      supabase,
      booking.store_id,
      booking.customer_phone,
      message,
      booking.customer_id,
      logoUrl ? { mediaUrl: logoUrl } : undefined
    );

    // Registrar no log de notificações
    await supabase.from('booking_notification_logs').insert({
      booking_id: booking.id,
      store_id: booking.store_id,
      notification_type: 'confirmation',
      send_method: manual ? 'manual' : 'automatic',
      status: success ? 'sent' : 'failed',
      error_message: success ? null : sendError,
    });

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

    // === Enviar cobrança PIX automática (se configurado) ===
    let pixSent = false;
    const shouldSendPix = settings?.send_pix_payment && settings?.pix_key && booking.price > 0 && resolvedApiUrl && resolvedToken;
    
    console.log(`[booking-confirmation] 🔍 PIX check: send_pix_payment=${settings?.send_pix_payment}, pix_key=${!!settings?.pix_key}, price=${booking.price}, hasApiUrl=${!!resolvedApiUrl}, hasToken=${!!resolvedToken}, shouldSend=${shouldSendPix}`);
    
    if (shouldSendPix) {
      console.log('[booking-confirmation] 💳 PIX automático habilitado, aguardando 1.5s antes de enviar...');
      
      // Aguardar 1.5s para não enviar junto com a confirmação
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      try {
        const pixResult = await sendPixPaymentRequest(
          supabase,
          booking.store_id,
          booking.customer_phone,
          settings,
          booking,
          resolvedApiUrl,
          resolvedToken,
          booking.customer_id
        );
        pixSent = pixResult.success;
        if (!pixResult.success) {
          console.error('[booking-confirmation] ❌ Falha ao enviar PIX:', pixResult.error);
        } else {
          console.log('[booking-confirmation] ✅ PIX enviado com sucesso!');
        }
      } catch (pixError) {
        console.error('[booking-confirmation] ❌ Exceção ao enviar PIX:', pixError);
      }
    }

    console.log(`[booking-confirmation] Confirmação enviada com sucesso para: ${booking.customer_phone}${pixSent ? ' + PIX enviado' : ''}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Confirmação enviada com sucesso',
      pix_sent: pixSent,
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
