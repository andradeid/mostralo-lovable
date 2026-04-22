import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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

// Normalizar telefone para WhatsApp
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('55') && cleaned.length <= 11) {
    cleaned = '55' + cleaned;
  }
  return cleaned;
}

// Enviar WhatsApp diretamente via UaZapi (com suporte a imagem + legenda)
async function sendWhatsAppDirect(
  supabase: any,
  storeId: string,
  phoneNumber: string,
  message: string,
  customerId?: string,
  imageUrl?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    // Buscar configuração UaZapi
    const { data: uazapiConfig, error: configError } = await supabase
      .from('uazapi_config')
      .select('api_url')
      .eq('is_active', true)
      .single();

    if (configError || !uazapiConfig) {
      console.error('[sendWhatsAppDirect] UaZapi não configurada:', configError);
      return { success: false, error: 'UaZapi não configurada' };
    }

    // Buscar instância da loja com token UaZapi
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('instance_name, status, api_token, provider')
      .eq('store_id', storeId)
      .eq('provider', 'uazapi')
      .single();

    if (instanceError || !instance) {
      console.error('[sendWhatsAppDirect] Instância UaZapi não encontrada:', instanceError);
      return { success: false, error: 'Instância WhatsApp não configurada' };
    }

    if (instance.status !== 'connected') {
      console.error('[sendWhatsAppDirect] WhatsApp não conectado. Status:', instance.status);
      return { success: false, error: 'WhatsApp não conectado' };
    }

    const phone = normalizePhone(phoneNumber);
    console.log(`[sendWhatsAppDirect] Enviando para ${phone} via UaZapi${imageUrl ? ' (com imagem)' : ''}`);

    const apiUrl = uazapiConfig.api_url.replace(/\/$/, '');
    let response: Response;

    // Se tem imagem (logo da loja), enviar como mídia com legenda
    if (imageUrl) {
      response = await fetch(`${apiUrl}/send/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': instance.api_token || '',
        },
        body: JSON.stringify({
          number: phone,
          file: imageUrl,
          text: message,
          type: 'image',
        }),
      });
    } else {
      response = await fetch(`${apiUrl}/send/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': instance.api_token || '',
        },
        body: JSON.stringify({
          number: phone,
          text: message,
        }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[sendWhatsAppDirect] Erro UaZapi:', errorText);
      return { success: false, error: errorText };
    }

    const result = await response.json();
    console.log('[sendWhatsAppDirect] Resposta UaZapi:', JSON.stringify(result));

    // Registrar no log de mensagens
    await supabase.from('whatsapp_messages').insert({
      store_id: storeId,
      customer_id: customerId || null,
      phone_number: phone,
      message_type: imageUrl ? 'image' : 'text',
      content: message,
      media_url: imageUrl || null,
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

    console.log('[process-pending-reviews] Iniciando processamento de avaliações pendentes...');

    // Buscar todas as lojas com avaliações habilitadas
    const { data: storeSettings, error: settingsError } = await supabase
      .from('booking_settings')
      .select('*')
      .eq('enable_professional_reviews', true);

    if (settingsError) {
      console.error('[process-pending-reviews] Erro ao buscar configurações:', settingsError);
      throw settingsError;
    }

    if (!storeSettings || storeSettings.length === 0) {
      console.log('[process-pending-reviews] Nenhuma loja com avaliações habilitadas');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Nenhuma loja com avaliações habilitadas',
        processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[process-pending-reviews] Processando ${storeSettings.length} lojas com avaliações habilitadas`);

    let totalSent = 0;
    let totalErrors = 0;

    for (const settings of storeSettings) {
      const delayMinutes = settings.review_delay_minutes || 30;
      
      // Calcular o horário limite (agendamentos completados há X minutos)
      const now = new Date();
      const cutoffTime = new Date(now.getTime() - (delayMinutes * 60 * 1000));

      console.log(`[process-pending-reviews] Loja ${settings.store_id}: Buscando agendamentos completados antes de ${cutoffTime.toISOString()}`);

      // Buscar agendamentos completados que ainda não receberam solicitação de avaliação
      // Incluir dados da loja para pegar o logo
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          professional:professionals(id, name),
          service:booking_services(id, name),
          store:stores(id, logo_url)
        `)
        .eq('store_id', settings.store_id)
        .eq('status', 'completed')
        .eq('review_sent', false)
        .lt('updated_at', cutoffTime.toISOString());

      if (bookingsError) {
        console.error(`[process-pending-reviews] Erro ao buscar agendamentos da loja ${settings.store_id}:`, bookingsError);
        continue;
      }

      if (!bookings || bookings.length === 0) {
        console.log(`[process-pending-reviews] Nenhum agendamento pendente de avaliação na loja ${settings.store_id}`);
        continue;
      }

      console.log(`[process-pending-reviews] Encontrados ${bookings.length} agendamentos para enviar avaliação`);

      // URL base para links de avaliação - SEMPRE usar domínio principal do Mostralo
      const siteUrl = Deno.env.get('SITE_URL') || 'https://mostralo.com.br';

      for (const booking of bookings) {
        try {
          // Verificar se já existe uma avaliação para este agendamento
          const { data: existingReview } = await supabase
            .from('booking_reviews')
            .select('id')
            .eq('booking_id', booking.id)
            .single();

          if (existingReview) {
            console.log(`[process-pending-reviews] Avaliação já existe para agendamento ${booking.id}`);
            // Atualizar flag para evitar reprocessamento
            await supabase
              .from('bookings')
              .update({ review_sent: true })
              .eq('id', booking.id);
            continue;
          }

          // Gerar token único
          const token = generateToken();

          // Calcular data de expiração (padrão 7 dias)
          const expiryDays = settings.review_expiry_days || 7;
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
            console.error(`[process-pending-reviews] Erro ao criar registro de avaliação:`, reviewError);
            totalErrors++;
            continue;
          }

          // Montar link de avaliação - usar domínio principal
          const reviewLink = `${siteUrl}/avaliar/${token}`;

          // Template padrão
          const template = settings.review_message_template || 
            'Olá {cliente}! Como foi seu atendimento com {profissional}?\n\nGostaríamos muito de ouvir sua opinião! Avalie em apenas 1 minuto:\n\n👉 {link}\n\nSua avaliação é muito importante para nós! ⭐';

          // Montar mensagem
          const message = replaceTemplateVariables(template, {
            customerName: booking.customer_name,
            professionalName: booking.professional?.name || 'Profissional',
            serviceName: booking.service?.name || 'Serviço',
            date: booking.booking_date,
            link: reviewLink,
          });

          // Buscar logo da loja para enviar como imagem com legenda
          const storeLogoUrl = booking.store?.logo_url || null;

          console.log(`[process-pending-reviews] Enviando avaliação para: ${booking.customer_phone}${storeLogoUrl ? ' (com logo)' : ''}`);

          // Enviar WhatsApp diretamente via UaZapi (com logo se disponível)
          const { success, error: sendError } = await sendWhatsAppDirect(
            supabase,
            booking.store_id,
            booking.customer_phone,
            message,
            booking.customer_id,
            storeLogoUrl
          );

          if (!success) {
            console.error(`[process-pending-reviews] Erro ao enviar avaliação para ${booking.customer_phone}:`, sendError);
            
            // Registrar falha no log
            await supabase.from('booking_notification_logs').insert({
              booking_id: booking.id,
              store_id: booking.store_id,
              notification_type: 'review',
              send_method: 'automatic',
              status: 'failed',
              error_message: sendError,
            });
            
            totalErrors++;
            continue;
          }

          // Registrar sucesso no log
          await supabase.from('booking_notification_logs').insert({
            booking_id: booking.id,
            store_id: booking.store_id,
            notification_type: 'review',
            send_method: 'automatic',
            status: 'sent',
          });

          // Marcar como enviado
          await supabase
            .from('bookings')
            .update({ review_sent: true })
            .eq('id', booking.id);

          totalSent++;
          console.log(`[process-pending-reviews] Avaliação enviada com sucesso para: ${booking.customer_phone}`);

        } catch (error) {
          console.error(`[process-pending-reviews] Erro ao processar agendamento ${booking.id}:`, error);
          totalErrors++;
        }
      }
    }

    console.log(`[process-pending-reviews] Finalizado. Enviados: ${totalSent}, Erros: ${totalErrors}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Avaliações processadas`,
      sent: totalSent,
      errors: totalErrors
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[process-pending-reviews] Erro geral:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
