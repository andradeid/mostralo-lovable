import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const payload = await req.json();
    
    const eventType = payload.event || payload.type || 'unknown';
    const instanceId = payload.instanceId || payload.instance?.id || payload.id || 'unknown';
    const instanceName = payload.instance?.name || payload.instanceName || 'unknown';
    
    console.log(`[uazapi-webhook] 📥 Evento: ${eventType} | Instância: ${instanceName} (${instanceId})`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Helper: gerar variantes de telefone para busca de cliente
    const getPhoneVariants = (phone: string): string[] => {
      const clean = phone.replace(/\D/g, '');
      const variants: string[] = [clean];
      // Com/sem prefixo 55
      if (clean.startsWith('55')) {
        variants.push(clean.substring(2));
      } else {
        variants.push('55' + clean);
      }
      // Com/sem nono dígito
      for (const v of [...variants]) {
        const local = v.startsWith('55') ? v.substring(2) : v;
        const ddd = local.substring(0, 2);
        const rest = local.substring(2);
        if (rest.length === 9 && rest.startsWith('9')) {
          variants.push('55' + ddd + rest.substring(1));
          variants.push(ddd + rest.substring(1));
        } else if (rest.length === 8) {
          variants.push('55' + ddd + '9' + rest);
          variants.push(ddd + '9' + rest);
        }
      }
      return [...new Set(variants)];
    };

    switch (eventType) {
      case 'messages': {
        const message = payload.data || payload;
        const remoteJid = message.key?.remoteJid || message.remoteJid || '';
        const fromMe = message.key?.fromMe || false;
        const messageType = message.messageType || 'conversation';
        const content = message.message?.conversation 
          || message.message?.extendedTextMessage?.text 
          || message.body
          || '';
        const messageId = message.key?.id || message.id || '';

        // Ignorar grupos e broadcast
        if (remoteJid.includes('@g.us') || remoteJid === 'status@broadcast') {
          console.log(`[uazapi-webhook] 🚫 Grupo/broadcast ignorado: ${remoteJid}`);
          break;
        }

        const phoneNumber = remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '');
        const senderName = message.pushName || message.senderName || 'Cliente';

        console.log(`[uazapi-webhook] 💬 Mensagem ${fromMe ? 'enviada' : 'recebida'}: ${phoneNumber} | Tipo: ${messageType} | Conteúdo: ${(content || '').substring(0, 100)}`);

        // Buscar instância para obter store_id
        const { data: instance } = await supabase
          .from('whatsapp_instances')
          .select('id, store_id, instance_name')
          .eq('provider', 'uazapi')
          .eq('instance_id', instanceId)
          .maybeSingle();

        if (!instance) {
          // Tentar buscar por nome da instância
          const { data: instanceByName } = await supabase
            .from('whatsapp_instances')
            .select('id, store_id, instance_name')
            .eq('provider', 'uazapi')
            .eq('instance_name', instanceName)
            .maybeSingle();

          if (!instanceByName) {
            console.log(`[uazapi-webhook] ⚠️ Instância não encontrada: ${instanceId} / ${instanceName}`);
            // Logar mesmo assim
            await supabase.from('webhook_logs').insert({
              webhook_type: 'uazapi',
              source: `uazapi-${instanceName}`,
              status: 'error',
              payload,
              event_type: eventType,
            });
            break;
          }
          // Continuar com instanceByName
          await processMessage(supabase, instanceByName, message, remoteJid, phoneNumber, senderName, fromMe, messageId, content, payload, instanceName, eventType);
          break;
        }

        await processMessage(supabase, instance, message, remoteJid, phoneNumber, senderName, fromMe, messageId, content, payload, instanceName, eventType);
        break;
      }

      case 'messages_update': {
        const updates = Array.isArray(payload.data) ? payload.data : [payload.data || payload];
        
        for (const update of updates) {
          const status = update.status || update.update?.status;
          const msgId = update.key?.id || update.id;
          console.log(`[uazapi-webhook] 📩 Status atualizado: ${msgId} → ${status}`);

          // Atualizar status da mensagem no chat se existir
          if (msgId && status) {
            const mappedStatus = status === 3 || status === 'READ' ? 'read' : 
                                 status === 2 || status === 'DELIVERY_ACK' ? 'delivered' : null;
            if (mappedStatus) {
              await supabase
                .from('whatsapp_chat_messages')
                .update({ status: mappedStatus })
                .eq('evolution_message_id', msgId);
            }
          }
        }

        await supabase.from('webhook_logs').insert({
          webhook_type: 'uazapi',
          source: `uazapi-${instanceName}`,
          status: 'success',
          payload,
          event_type: 'messages_update',
        });
        break;
      }

      case 'connection': {
        const state = payload.data?.state || payload.state || 'unknown';
        const statusReason = payload.data?.statusReason || '';
        
        console.log(`[uazapi-webhook] 🔌 Conexão: ${instanceName} → ${state} (${statusReason})`);

        // Atualizar status da instância
        const newStatus = state === 'open' ? 'connected' : 
                          state === 'close' ? 'disconnected' : 'connecting';
        
        await supabase
          .from('whatsapp_instances')
          .update({ 
            status: newStatus,
            ...(newStatus === 'connected' ? { last_connected_at: new Date().toISOString() } : {})
          })
          .eq('provider', 'uazapi')
          .or(`instance_id.eq.${instanceId},instance_name.eq.${instanceName}`);

        await supabase.from('webhook_logs').insert({
          webhook_type: 'uazapi',
          source: `uazapi-${instanceName}`,
          status: 'success',
          payload,
          event_type: 'connection',
        });
        break;
      }

      default: {
        console.log(`[uazapi-webhook] ℹ️ Evento não processado: ${eventType}`);
        await supabase.from('webhook_logs').insert({
          webhook_type: 'uazapi',
          source: `uazapi-${instanceName}`,
          status: 'received',
          payload,
          event_type: eventType,
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[uazapi-webhook] ❌ Erro:', error);
    return new Response(JSON.stringify({ received: true, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Processar e salvar mensagem no chat
async function processMessage(
  supabase: any,
  instance: { id: string; store_id: string; instance_name: string },
  message: any,
  remoteJid: string,
  phoneNumber: string,
  senderName: string,
  fromMe: boolean,
  messageId: string,
  content: string,
  payload: any,
  instanceName: string,
  eventType: string
) {
  const storeId = instance.store_id;

  // Buscar nome do cliente cadastrado
  const getPhoneVariants = (phone: string): string[] => {
    const clean = phone.replace(/\D/g, '');
    const variants: string[] = [clean];
    if (clean.startsWith('55')) {
      variants.push(clean.substring(2));
    } else {
      variants.push('55' + clean);
    }
    for (const v of [...variants]) {
      const local = v.startsWith('55') ? v.substring(2) : v;
      const ddd = local.substring(0, 2);
      const rest = local.substring(2);
      if (rest.length === 9 && rest.startsWith('9')) {
        variants.push('55' + ddd + rest.substring(1));
        variants.push(ddd + rest.substring(1));
      } else if (rest.length === 8) {
        variants.push('55' + ddd + '9' + rest);
        variants.push(ddd + '9' + rest);
      }
    }
    return [...new Set(variants)];
  };

  let contactName = senderName;
  const phoneVariants = getPhoneVariants(phoneNumber);

  // Se mensagem recebida (não fromMe), buscar nome do cliente
  if (!fromMe) {
    const { data: registeredCustomer } = await supabase
      .from('customers')
      .select('name')
      .in('phone', phoneVariants)
      .limit(1)
      .maybeSingle();
    
    if (registeredCustomer?.name) {
      contactName = registeredCustomer.name;
      console.log(`[uazapi-webhook] 📇 Cliente cadastrado: ${contactName}`);
    }
  }

  // Determinar tipo de conteúdo
  const incomingContent = message.message?.conversation || 
    message.message?.extendedTextMessage?.text || 
    message.message?.imageMessage?.caption ||
    message.message?.videoMessage?.caption ||
    message.body || content || '';

  const incomingType = message.message?.imageMessage ? 'image' : 
    message.message?.audioMessage ? 'audio' :
    message.message?.videoMessage ? 'video' :
    message.message?.documentMessage ? 'document' :
    message.message?.stickerMessage ? 'sticker' :
    message.message?.locationMessage ? 'location' : 'text';

  // Extrair URL de mídia
  const mediaUrl = message.message?.imageMessage?.url ||
    message.message?.videoMessage?.url ||
    message.message?.audioMessage?.url ||
    message.message?.documentMessage?.url || null;
  const mediaFilename = message.message?.documentMessage?.fileName || null;
  const mediaMimetype = message.message?.imageMessage?.mimetype ||
    message.message?.videoMessage?.mimetype ||
    message.message?.audioMessage?.mimetype ||
    message.message?.documentMessage?.mimetype || null;

  // Extrair informações de citação/resposta
  const contextInfo = message.message?.extendedTextMessage?.contextInfo ||
    message.message?.imageMessage?.contextInfo ||
    message.message?.videoMessage?.contextInfo || null;
  
  let quotedMessageDbId: string | null = null;
  let quotedContentData: any = null;

  if (contextInfo?.quotedMessage) {
    const quotedEvolutionId = contextInfo.stanzaId || null;
    const quotedText = contextInfo.quotedMessage?.conversation ||
      contextInfo.quotedMessage?.extendedTextMessage?.text || '';
    const quotedType = contextInfo.quotedMessage?.imageMessage ? 'image' :
      contextInfo.quotedMessage?.audioMessage ? 'audio' : 'text';

    quotedContentData = {
      content: quotedText || null,
      message_type: quotedType,
    };

    if (quotedEvolutionId) {
      const { data: quotedMsg } = await supabase
        .from('whatsapp_chat_messages')
        .select('id, sender_name')
        .eq('store_id', storeId)
        .eq('evolution_message_id', quotedEvolutionId)
        .maybeSingle();

      if (quotedMsg) {
        quotedMessageDbId = quotedMsg.id;
        if (quotedMsg.sender_name) {
          quotedContentData.sender_name = quotedMsg.sender_name;
        }
      }
    }
  }

  // Deduplicação pelo evolution_message_id
  if (messageId) {
    const { data: existingMsg } = await supabase
      .from('whatsapp_chat_messages')
      .select('id')
      .eq('evolution_message_id', messageId)
      .maybeSingle();
    if (existingMsg) {
      console.log(`[uazapi-webhook] ⏭️ Msg duplicada ignorada: ${messageId}`);
      return;
    }
  }

  // Salvar mensagem no chat
  const direction = fromMe ? 'outgoing' : 'incoming';
  const insertData: any = {
    store_id: storeId,
    remote_jid: remoteJid,
    phone_number: phoneNumber,
    direction,
    sender_name: fromMe ? null : contactName,
    content: incomingContent || null,
    message_type: incomingType,
    media_url: mediaUrl,
    media_filename: mediaFilename,
    media_mimetype: mediaMimetype,
    evolution_message_id: messageId || null,
    is_from_bot: false,
    is_read_by_attendant: fromMe, // Mensagens enviadas já são "lidas"
    timestamp: new Date().toISOString(),
  };

  if (quotedMessageDbId) insertData.quoted_message_id = quotedMessageDbId;
  if (quotedContentData) insertData.quoted_content = quotedContentData;

  const { error: msgError } = await supabase.from('whatsapp_chat_messages').insert(insertData);
  if (msgError) {
    console.error(`[uazapi-webhook] ❌ Erro ao salvar mensagem:`, msgError.message);
  } else {
    console.log(`[uazapi-webhook] ✅ Msg ${direction} salva no chat`);
  }

  // Upsert conversa
  const { data: existingConv } = await supabase
    .from('whatsapp_conversations')
    .select('id, unread_count, status, is_bot_active')
    .eq('store_id', storeId)
    .eq('remote_jid', remoteJid)
    .maybeSingle();

  const lastMsgPreview = (incomingContent || '[mídia]').slice(0, 200);

  if (existingConv) {
    const convUpdateData: any = {
      last_message: lastMsgPreview,
      last_message_at: new Date().toISOString(),
      last_message_direction: direction,
    };

    if (!fromMe) {
      // Mensagem recebida: incrementar unread
      convUpdateData.unread_count = (existingConv.unread_count || 0) + 1;
      if (contactName !== 'Cliente') {
        convUpdateData.contact_name = contactName;
      }

      // Se conversa fechada, reabrir
      if (existingConv.status === 'closed') {
        convUpdateData.status = 'active';
        convUpdateData.is_bot_active = true;
        convUpdateData.assigned_to = null;
        console.log(`[uazapi-webhook] 🔄 Conversa reaberta para ${remoteJid}`);
      }
    }

    await supabase.from('whatsapp_conversations')
      .update(convUpdateData)
      .eq('id', existingConv.id);
  } else {
    // Criar nova conversa
    await supabase.from('whatsapp_conversations').insert({
      store_id: storeId,
      remote_jid: remoteJid,
      phone_number: phoneNumber,
      contact_name: contactName !== 'Cliente' ? contactName : null,
      last_message: lastMsgPreview,
      last_message_at: new Date().toISOString(),
      last_message_direction: direction,
      unread_count: fromMe ? 0 : 1,
    });
  }

  // Captura automática do contato
  if (!fromMe) {
    const phoneNormalized = phoneNumber.replace(/\D/g, '');
    if (phoneNormalized.length >= 10 && phoneNormalized.length <= 15) {
      await supabase
        .from('whatsapp_contacts')
        .upsert({
          store_id: storeId,
          phone_number: phoneNormalized,
          push_name: senderName,
          name: contactName,
          is_whatsapp_valid: true,
          source: 'chat',
          last_synced_at: new Date().toISOString(),
        }, {
          onConflict: 'store_id,phone_number',
          ignoreDuplicates: false,
        }).then(({ error }) => {
          if (error) console.log('[uazapi-webhook] ⚠️ Erro ao salvar contato:', error.message);
          else console.log(`[uazapi-webhook] 📇 Contato capturado: ${phoneNormalized}`);
        });
    }
  }

  // Log de sucesso
  await supabase.from('webhook_logs').insert({
    webhook_type: 'uazapi',
    source: `uazapi-${instanceName}`,
    status: 'success',
    payload,
    event_type: eventType,
  });
}
