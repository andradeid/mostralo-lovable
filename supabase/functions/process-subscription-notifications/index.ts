import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('🔔 [process-subscription-notifications] Iniciando processamento...');

    // Buscar configuração global padrão
    const { data: globalConfig } = await supabase
      .from('subscription_billing_config')
      .select('*')
      .is('store_id', null)
      .single();

    if (!globalConfig) {
      console.log('⚠️ Nenhuma configuração global encontrada');
      return new Response(JSON.stringify({ success: true, message: 'No global config' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar configs individuais por loja
    const { data: storeConfigs } = await supabase
      .from('subscription_billing_config')
      .select('*')
      .not('store_id', 'is', null)
      .eq('auto_send_enabled', true);

    // Buscar todas as faturas pendentes
    const { data: pendingInvoices, error: invoicesError } = await supabase
      .from('subscription_invoices')
      .select(`
        id,
        store_id,
        amount,
        due_date,
        payment_status,
        public_token,
        contact_phone,
        contact_name,
        stores (
          name,
          billing_contact_phone,
          billing_contact_name
        )
      `)
      .eq('payment_status', 'pending');

    if (invoicesError) {
      console.error('❌ Erro ao buscar faturas:', invoicesError);
      throw invoicesError;
    }

    if (!pendingInvoices || pendingInvoices.length === 0) {
      console.log('✅ Nenhuma fatura pendente');
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar WhatsApp Master e UaZapi
    const { data: masterConfig } = await supabase
      .from('master_whatsapp_config')
      .select('id, evolution_instance_id')
      .eq('instance_status', 'connected')
      .limit(1)
      .single();

    const { data: uazapiConfig } = await supabase
      .from('uazapi_config')
      .select('api_url')
      .order('is_active', { ascending: false })
      .limit(1)
      .single();

    const { data: paymentConfig } = await supabase
      .from('subscription_payment_config')
      .select('efi_pix_key, efi_pix_key_name')
      .eq('is_active', true)
      .single();

    if (!masterConfig?.evolution_instance_id || !uazapiConfig?.api_url) {
      console.log('⚠️ WhatsApp Master não conectado, pulando notificações');
      return new Response(JSON.stringify({ success: true, sent: 0, reason: 'whatsapp_not_connected' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiUrl = uazapiConfig.api_url.replace(/\/$/, '');
    const whatsappToken = masterConfig.evolution_instance_id;
    const pixKey = paymentConfig?.efi_pix_key || '';
    const pixName = paymentConfig?.efi_pix_key_name || 'Mostralo';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let sent = 0;

    for (const invoice of pendingInvoices) {
      const store = invoice.stores as any;
      const storeConfig = storeConfigs?.find(c => c.store_id === invoice.store_id);
      const config = storeConfig || globalConfig;

      if (!config.auto_send_enabled) continue;

      const phone = invoice.contact_phone || store?.billing_contact_phone;
      if (!phone) {
        console.log(`⚠️ Fatura ${invoice.id} sem telefone de contato`);
        continue;
      }

      const dueDate = new Date(invoice.due_date);
      dueDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      let notificationType: string | null = null;
      let overdueSequence = 0;

      // Verificar se deve notificar ANTES do vencimento
      if (diffDays > 0 && diffDays === config.notify_days_before) {
        notificationType = 'before_due';
      }
      // No dia do vencimento
      else if (diffDays === 0 && config.notify_on_due_date) {
        notificationType = 'on_due';
      }
      // Após vencimento
      else if (diffDays < 0) {
        const daysOverdue = Math.abs(diffDays);
        const interval = config.overdue_notify_interval_days || 3;
        const maxNotifications = config.overdue_notify_count || 3;

        if (daysOverdue % interval === 0) {
          overdueSequence = Math.floor(daysOverdue / interval);
          if (overdueSequence <= maxNotifications) {
            notificationType = 'overdue';
          }
        }
      }

      if (!notificationType) continue;

      // Verificar se já foi enviada
      const { data: existing } = await supabase
        .from('subscription_invoice_notifications')
        .select('id')
        .eq('invoice_id', invoice.id)
        .eq('notification_type', notificationType)
        .eq('overdue_sequence', overdueSequence)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`⏭️ Notificação já enviada: ${invoice.id} ${notificationType} seq=${overdueSequence}`);
        continue;
      }

      // Enviar notificação
      let normalizedPhone = phone.replace(/\D/g, '');
      if (!normalizedPhone.startsWith('55')) {
        normalizedPhone = '55' + normalizedPhone;
      }

      const contactName = invoice.contact_name || store?.billing_contact_name || 'Cliente';
      const firstName = contactName.split(' ')[0];
      const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.amount);
      const paymentUrl = `https://mostralo.com.br/pagar/${invoice.public_token}`;
      const formattedDueDate = new Date(invoice.due_date).toLocaleDateString('pt-BR');

      let messageText = '';
      if (notificationType === 'before_due') {
        messageText = `⏰ *Lembrete de Vencimento*\n\nOlá ${firstName}! 👋\n\nSua fatura de *${formattedAmount}* vence em *${diffDays} dia(s)* (${formattedDueDate}).\n\n🏪 *Loja:* ${store?.name || 'Mostralo'}\n\n💳 Pague pelo link:\n${paymentUrl}\n\nEvite a suspensão do serviço! 🔄`;
      } else if (notificationType === 'on_due') {
        messageText = `📅 *Fatura Vence Hoje!*\n\nOlá ${firstName}! 👋\n\nSua fatura de *${formattedAmount}* vence *hoje* (${formattedDueDate}).\n\n🏪 *Loja:* ${store?.name || 'Mostralo'}\n\n💳 Pague agora:\n${paymentUrl}\n\nMantenha sua loja ativa! ✅`;
      } else if (notificationType === 'overdue') {
        messageText = `🔴 *Fatura Vencida - ${overdueSequence}º Aviso*\n\nOlá ${firstName}! 👋\n\nSua fatura de *${formattedAmount}* está vencida desde *${formattedDueDate}*.\n\n🏪 *Loja:* ${store?.name || 'Mostralo'}\n\n⚠️ Regularize para evitar suspensão:\n${paymentUrl}\n\nDúvidas? Responda esta mensagem.`;
      }

      try {
        // Enviar mensagem de texto
        console.log(`📤 Enviando ${notificationType} para ${normalizedPhone} (fatura ${invoice.id})`);
        await fetch(`${apiUrl}/send/text`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'token': whatsappToken },
          body: JSON.stringify({ number: normalizedPhone, text: messageText }),
        });

        await new Promise(r => setTimeout(r, 1000));

        // Enviar PIX nativo se overdue ou on_due
        if (pixKey && (notificationType === 'on_due' || notificationType === 'overdue')) {
          await fetch(`${apiUrl}/send/request-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'token': whatsappToken },
            body: JSON.stringify({
              number: normalizedPhone,
              amount: invoice.amount,
              pixKey,
              pixType: 'EVP',
              pixName,
              title: `Assinatura ${store?.name || 'Mostralo'}`,
              text: 'Pagamento da assinatura',
              footer: 'Mostralo - Sua loja digital',
              itemName: `Assinatura - ${store?.name}`,
            }),
          });
        }

        // Registrar notificação
        await supabase.from('subscription_invoice_notifications').insert({
          invoice_id: invoice.id,
          store_id: invoice.store_id,
          notification_type: notificationType,
          overdue_sequence: overdueSequence,
          channel: 'whatsapp',
        });

        // Persistir no chat master
        const remoteJid = `${normalizedPhone}@s.whatsapp.net`;
        await supabase.from('master_whatsapp_chat_messages').insert({
          config_id: masterConfig.id,
          remote_jid: remoteJid,
          phone_number: normalizedPhone,
          direction: 'outgoing',
          sender_name: 'Sistema',
          content: `[Auto] ${notificationType === 'before_due' ? 'Lembrete' : notificationType === 'on_due' ? 'Cobrança no vencimento' : `Cobrança vencida #${overdueSequence}`} - ${formattedAmount}`,
          message_type: 'text',
          is_from_bot: true,
          is_read_by_admin: true,
          timestamp: new Date().toISOString(),
          metadata: {
            type: 'auto_billing_notification',
            notification_type: notificationType,
            overdue_sequence: overdueSequence,
            invoice_id: invoice.id,
            store_id: invoice.store_id,
            amount: invoice.amount,
          },
          message_source: 'system',
        });

        sent++;
        console.log(`✅ Notificação ${notificationType} enviada para fatura ${invoice.id}`);
      } catch (sendError) {
        console.error(`❌ Erro ao enviar notificação para fatura ${invoice.id}:`, sendError);
      }
    }

    console.log(`🔔 Processamento concluído. ${sent} notificações enviadas.`);

    return new Response(JSON.stringify({ success: true, sent, total_pending: pendingInvoices.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ [process-subscription-notifications] Erro:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
