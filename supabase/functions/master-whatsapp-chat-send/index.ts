import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar master admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (profile?.user_type !== 'master_admin') {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const {
      remoteJid,
      content,
      messageType = 'text',
      mediaUrl,
      mediaFilename,
      mediaMimetype,
      // Presence
      presence,
      presenceDelay,
      // Reaction
      reactionEmoji,
      reactionMessageId,
      reactionEvolutionId,
      reactionFromMe,
      // Edit
      editMessageId,
      editEvolutionId,
      editNewText,
      // Delete
      deleteMessageId,
      deleteEvolutionId,
      // Quote
      quotedMessageId,
      quotedEvolutionId,
      quotedFromMe,
      quotedContent,
      // Location
      latitude,
      longitude,
      locationName,
      locationAddress,
      // Payment
      amount,
      pixKey,
      pixType,
      pixName,
      paymentText,
      paymentItemName,
      paymentInvoiceNumber,
      paymentFooter,
    } = body;

    // Buscar config master
    const { data: config, error: configError } = await supabase
      .from('master_whatsapp_config')
      .select('id, instance_name, evolution_instance_id, instance_phone')
      .eq('admin_user_id', user.id)
      .single();

    if (configError || !config) {
      return new Response(JSON.stringify({ error: 'Configuração master não encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar UaZapi URL
    const { data: uazapiConfig } = await supabase
      .from('uazapi_config')
      .select('api_url')
      .order('is_active', { ascending: false })
      .limit(1)
      .single();

    if (!uazapiConfig?.api_url || !config.evolution_instance_id) {
      return new Response(JSON.stringify({ error: 'UaZapi não configurado' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiUrl = uazapiConfig.api_url.replace(/\/$/, '');
    const token = config.evolution_instance_id;
    const phoneNumber = remoteJid?.replace('@s.whatsapp.net', '').replace(/\D/g, '') || '';

    // ========== Presence ==========
    if (messageType === 'presence') {
      const resp = await fetch(`${apiUrl}/message/presence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'token': token },
        body: JSON.stringify({
          number: phoneNumber,
          presence: presence || 'composing',
          delay: presenceDelay || 15000,
        }),
      });
      return new Response(JSON.stringify({ success: resp.ok }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========== Mark Read ==========
    if (messageType === 'markread') {
      // Buscar últimas mensagens não lidas
      const { data: unreadMsgs } = await supabase
        .from('master_whatsapp_chat_messages')
        .select('evolution_message_id')
        .eq('config_id', config.id)
        .eq('remote_jid', remoteJid)
        .eq('direction', 'incoming')
        .eq('is_read_by_admin', false)
        .not('evolution_message_id', 'is', null)
        .limit(50);

      if (unreadMsgs && unreadMsgs.length > 0) {
        const ids = unreadMsgs.map(m => m.evolution_message_id).filter(Boolean);
        if (ids.length > 0) {
          await fetch(`${apiUrl}/message/markread`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'token': token },
            body: JSON.stringify({ id: ids }),
          });
        }
      }

      // Marcar como lido no banco
      await supabase
        .from('master_whatsapp_chat_messages')
        .update({ is_read_by_admin: true })
        .eq('config_id', config.id)
        .eq('remote_jid', remoteJid)
        .eq('is_read_by_admin', false);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========== Reaction ==========
    if (messageType === 'reaction') {
      const resp = await fetch(`${apiUrl}/send/reaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'token': token },
        body: JSON.stringify({
          number: phoneNumber,
          text: reactionEmoji,
          messageid: reactionEvolutionId,
          fromMe: reactionFromMe || false,
        }),
      });
      return new Response(JSON.stringify({ success: resp.ok }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========== Edit Message ==========
    if (messageType === 'editMessage') {
      const resp = await fetch(`${apiUrl}/message/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'token': token },
        body: JSON.stringify({
          messageid: editEvolutionId,
          text: editNewText,
        }),
      });

      if (resp.ok && editMessageId) {
        await supabase
          .from('master_whatsapp_chat_messages')
          .update({
            content: editNewText,
            metadata: { edited: true, edited_at: new Date().toISOString() },
          })
          .eq('id', editMessageId);
      }

      return new Response(JSON.stringify({ success: resp.ok }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========== Delete Message ==========
    if (messageType === 'deleteMessage') {
      const resp = await fetch(`${apiUrl}/message/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'token': token },
        body: JSON.stringify({
          messageid: deleteEvolutionId,
          fromMe: true,
        }),
      });

      if (resp.ok && deleteMessageId) {
        await supabase
          .from('master_whatsapp_chat_messages')
          .update({
            content: '🚫 Mensagem apagada',
            message_type: 'text',
            media_url: null,
            media_filename: null,
            media_mimetype: null,
            metadata: { deleted: true, deleted_at: new Date().toISOString() },
          })
          .eq('id', deleteMessageId);
      }

      return new Response(JSON.stringify({ success: resp.ok }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========== Location ==========
    if (messageType === 'location') {
      const resp = await fetch(`${apiUrl}/send/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'token': token },
        body: JSON.stringify({
          number: phoneNumber,
          lat: latitude,
          lng: longitude,
          title: locationName || '',
          address: locationAddress || '',
        }),
      });

      if (resp.ok) {
        await persistOutgoingMessage(supabase, config.id, remoteJid, phoneNumber, `📍 ${locationName || 'Localização'}`, 'location', user.id);
      }

      return new Response(JSON.stringify({ success: resp.ok }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========== Payment Request ==========
    if (messageType === 'payment_request' && amount && pixKey) {
      const uaPayload: Record<string, unknown> = {
        number: phoneNumber,
        amount: Number(amount),
        pixKey: pixKey,
        pixType: pixType || 'EVP',
        readmessages: true,
      };
      if (pixName) uaPayload.pixName = pixName;
      if (paymentText) uaPayload.text = paymentText;
      if (paymentItemName) uaPayload.itemName = paymentItemName;
      if (paymentInvoiceNumber) uaPayload.invoiceNumber = paymentInvoiceNumber;
      if (paymentFooter) uaPayload.footer = paymentFooter;

      console.log(`[master-chat-send] 💰 Payment request: R$${amount} | PIX: ${pixKey} (${pixType})`);

      const resp = await fetch(`${apiUrl}/send/request-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'token': token },
        body: JSON.stringify(uaPayload),
      });

      const respBody = await resp.text();
      let evolutionId: string | null = null;
      try {
        const parsed = JSON.parse(respBody);
        evolutionId = parsed?.id || parsed?.key?.id || null;
      } catch { /* ignore */ }

      if (resp.ok) {
        const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(amount));
        const msgContent = `💰 Solicitação de pagamento: ${formattedAmount}`;
        await persistOutgoingMessage(
          supabase, config.id, remoteJid, phoneNumber, msgContent, 'payment_request', user.id,
          evolutionId, undefined, undefined, undefined, undefined,
          { amount: Number(amount), pix_key: pixKey, pix_type: pixType || 'EVP', pix_name: pixName, item_name: paymentItemName, invoice_number: paymentInvoiceNumber }
        );
      }

      return new Response(JSON.stringify({ success: resp.ok, messageId: evolutionId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========== Send Text ==========
    if (messageType === 'text') {
      let sendBody: Record<string, unknown> = {
        number: phoneNumber,
        text: content,
      };

      // Quoted message
      if (quotedEvolutionId) {
        sendBody = {
          ...sendBody,
          quoted: {
            messageid: quotedEvolutionId,
            fromMe: quotedFromMe || false,
          },
        };
      }

      const resp = await fetch(`${apiUrl}/send/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'token': token },
        body: JSON.stringify(sendBody),
      });

      const respBody = await resp.text();
      let evolutionId: string | null = null;
      try {
        const parsed = JSON.parse(respBody);
        evolutionId = parsed?.id || parsed?.key?.id || null;
      } catch { /* ignore */ }

      if (resp.ok) {
        await persistOutgoingMessage(
          supabase, config.id, remoteJid, phoneNumber, content, 'text', user.id,
          evolutionId, quotedMessageId ? { quoted_message_id: quotedMessageId, quoted_content: quotedContent } : undefined
        );
      }

      return new Response(JSON.stringify({ success: resp.ok, messageId: evolutionId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========== Send Media ==========
    if (['image', 'video', 'audio', 'document'].includes(messageType)) {
      const endpoint = messageType === 'document' ? 'document' : messageType === 'audio' ? 'audio' : 'media';
      
      const mediaBody: Record<string, unknown> = {
        number: phoneNumber,
        url: mediaUrl,
        caption: content || '',
        fileName: mediaFilename || 'file',
        mimetype: mediaMimetype || 'application/octet-stream',
      };

      if (quotedEvolutionId) {
        (mediaBody as any).quoted = {
          messageid: quotedEvolutionId,
          fromMe: quotedFromMe || false,
        };
      }

      const resp = await fetch(`${apiUrl}/send/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'token': token },
        body: JSON.stringify(mediaBody),
      });

      const respBody = await resp.text();
      let evolutionId: string | null = null;
      try {
        const parsed = JSON.parse(respBody);
        evolutionId = parsed?.id || parsed?.key?.id || null;
      } catch { /* ignore */ }

      if (resp.ok) {
        await persistOutgoingMessage(
          supabase, config.id, remoteJid, phoneNumber, content || mediaFilename || 'Mídia', messageType, user.id,
          evolutionId, undefined, mediaUrl, mediaFilename, mediaMimetype
        );
      }

      return new Response(JSON.stringify({ success: resp.ok, messageId: evolutionId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: `Tipo de mensagem não suportado: ${messageType}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[master-chat-send] Erro:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper para persistir mensagem enviada
async function persistOutgoingMessage(
  supabase: any,
  configId: string,
  remoteJid: string,
  phoneNumber: string,
  content: string,
  messageType: string,
  userId: string,
  evolutionId?: string | null,
  quoteData?: { quoted_message_id: string; quoted_content: any },
  mediaUrl?: string | null,
  mediaFilename?: string | null,
  mediaMimetype?: string | null,
  extraMetadata?: Record<string, unknown>,
) {
  const now = new Date().toISOString();

  // Inserir mensagem
  await supabase.from('master_whatsapp_chat_messages').insert({
    config_id: configId,
    remote_jid: remoteJid,
    phone_number: phoneNumber,
    direction: 'outgoing',
    sender_name: 'Admin',
    content,
    message_type: messageType,
    media_url: mediaUrl || null,
    media_filename: mediaFilename || null,
    media_mimetype: mediaMimetype || null,
    is_from_bot: false,
    is_read_by_admin: true,
    timestamp: now,
    evolution_message_id: evolutionId || null,
    metadata: {},
    quoted_message_id: quoteData?.quoted_message_id || null,
    quoted_content: quoteData?.quoted_content || null,
    message_source: 'admin_chat',
  });

  // Atualizar conversa
  await supabase
    .from('master_whatsapp_conversations')
    .upsert({
      config_id: configId,
      remote_jid: remoteJid,
      phone_number: phoneNumber,
      last_message: content?.substring(0, 200) || 'Mídia',
      last_message_at: now,
      last_message_direction: 'outgoing',
      last_message_source: 'admin_chat',
      status: 'active',
    }, {
      onConflict: 'config_id,remote_jid',
    });

  // Pausar bot quando admin envia mensagem manualmente
  await supabase
    .from('master_whatsapp_sessions')
    .update({
      bot_paused: true,
      paused_at: now,
      paused_reason: 'admin_chat_reply',
    })
    .eq('config_id', configId)
    .eq('phone_number', phoneNumber)
    .eq('bot_paused', false);
}
