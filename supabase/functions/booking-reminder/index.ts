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

    console.log('[booking-reminder] Iniciando verificação de lembretes...');

    // Buscar todas as lojas com configurações de lembrete ativo
    const { data: storeSettings, error: settingsError } = await supabase
      .from('booking_settings')
      .select('*')
      .eq('send_reminder_message', true);

    if (settingsError) {
      console.error('[booking-reminder] Erro ao buscar configurações:', settingsError);
      throw settingsError;
    }

    if (!storeSettings || storeSettings.length === 0) {
      console.log('[booking-reminder] Nenhuma loja com lembrete ativo');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Nenhuma loja com lembrete ativo',
        processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[booking-reminder] Processando ${storeSettings.length} lojas com lembretes ativos`);

    let totalSent = 0;
    let totalErrors = 0;

    for (const settings of storeSettings) {
      const reminderHours = settings.reminder_hours_before || 2;
      
      // Calcular janela de tempo para lembretes
      // Agendamentos que acontecem em X horas (+/- 15 minutos de margem)
      const now = new Date();
      const targetTime = new Date(now.getTime() + (reminderHours * 60 * 60 * 1000));
      
      // Buscar data e horário alvo
      const targetDate = targetTime.toISOString().split('T')[0];
      const targetHour = targetTime.getHours().toString().padStart(2, '0');
      const targetMinute = targetTime.getMinutes().toString().padStart(2, '0');
      const targetTimeStr = `${targetHour}:${targetMinute}:00`;
      
      // Margem de 30 minutos (15 antes e 15 depois)
      const marginMinutes = 15;
      const minTime = new Date(targetTime.getTime() - (marginMinutes * 60 * 1000));
      const maxTime = new Date(targetTime.getTime() + (marginMinutes * 60 * 1000));
      
      const minTimeStr = `${minTime.getHours().toString().padStart(2, '0')}:${minTime.getMinutes().toString().padStart(2, '0')}:00`;
      const maxTimeStr = `${maxTime.getHours().toString().padStart(2, '0')}:${maxTime.getMinutes().toString().padStart(2, '0')}:00`;

      console.log(`[booking-reminder] Loja ${settings.store_id}: Buscando agendamentos para ${targetDate} entre ${minTimeStr} e ${maxTimeStr}`);

      // Buscar agendamentos que precisam de lembrete
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          professional:professionals(id, name),
          service:booking_services(id, name)
        `)
        .eq('store_id', settings.store_id)
        .eq('booking_date', targetDate)
        .gte('start_time', minTimeStr)
        .lte('start_time', maxTimeStr)
        .eq('reminder_sent', false)
        .not('status', 'in', '("cancelled","completed","no_show")');

      if (bookingsError) {
        console.error(`[booking-reminder] Erro ao buscar agendamentos da loja ${settings.store_id}:`, bookingsError);
        continue;
      }

      if (!bookings || bookings.length === 0) {
        console.log(`[booking-reminder] Nenhum agendamento para lembrar na loja ${settings.store_id}`);
        continue;
      }

      console.log(`[booking-reminder] Encontrados ${bookings.length} agendamentos para enviar lembrete`);

      // Template padrão
      const template = settings.reminder_message_template || 
        'Olá {cliente}! Lembrando do seu agendamento hoje às {horario} com {profissional}. Te esperamos! 🙂';

      for (const booking of bookings) {
        try {
          // Montar mensagem
          const message = replaceTemplateVariables(template, {
            customerName: booking.customer_name,
            professionalName: booking.professional?.name || 'Profissional',
            serviceName: booking.service?.name || 'Serviço',
            date: booking.booking_date,
            time: booking.start_time,
            price: booking.price || 0,
          });

          console.log(`[booking-reminder] Enviando lembrete para: ${booking.customer_phone}`);

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
            console.error(`[booking-reminder] Erro ao enviar lembrete para ${booking.customer_phone}:`, sendError);
            totalErrors++;
            continue;
          }

          // Marcar como enviado
          await supabase
            .from('bookings')
            .update({ reminder_sent: true })
            .eq('id', booking.id);

          totalSent++;
          console.log(`[booking-reminder] Lembrete enviado com sucesso para: ${booking.customer_phone}`);

        } catch (error) {
          console.error(`[booking-reminder] Erro ao processar agendamento ${booking.id}:`, error);
          totalErrors++;
        }
      }
    }

    console.log(`[booking-reminder] Finalizado. Enviados: ${totalSent}, Erros: ${totalErrors}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Lembretes processados`,
      sent: totalSent,
      errors: totalErrors
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[booking-reminder] Erro geral:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
