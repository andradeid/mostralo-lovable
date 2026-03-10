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

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const payload = await req.json();

    // UaZapi usa EventType (capital E) e instanceName
    const eventType = payload.EventType || payload.event || payload.type || 'unknown';
    const instanceName = payload.instanceName || payload.instance?.name || 'unknown';

    console.log(`[uazapi-webhook] 📥 Evento: ${eventType} | Instância: ${instanceName}`);
    console.log(`[uazapi-webhook] 📦 Payload keys: ${Object.keys(payload).join(', ')}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Helper: gerar variantes de telefone para busca de cliente
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

    switch (eventType) {
      case 'messages': {
        // UaZapi payload: message object at payload.message
        const msg = payload.message || {};
        const chat = payload.chat || {};

        const remoteJid = msg.chatid || msg.sender_pn || '';
        const fromMe = msg.fromMe === true;
        const messageId = msg.messageid || msg.id || '';
        const messageType = msg.messageType || 'conversation';
        const textContent = msg.text || '';
        const senderName = msg.senderName || chat.name || chat.wa_contactName || 'Cliente';
        const isGroup = msg.isGroup === true || chat.wa_isGroup === true;

        // Ignorar grupos e broadcast
        if (isGroup || remoteJid.includes('@g.us') || remoteJid === 'status@broadcast') {
          console.log(`[uazapi-webhook] 🚫 Grupo/broadcast ignorado: ${remoteJid}`);
          await logWebhook(supabase, instanceName, 'received', payload, 'messages_group');
          break;
        }

        // Extrair phone number do chatid ou sender_pn
        const phoneNumber = (msg.sender_pn || msg.chatid || '')
          .replace('@s.whatsapp.net', '')
          .replace('@c.us', '')
          .replace(/\D/g, '');

        if (!phoneNumber) {
          console.log(`[uazapi-webhook] ⚠️ Sem número de telefone no payload`);
          await logWebhook(supabase, instanceName, 'error', payload, 'messages_no_phone');
          break;
        }

        console.log(`[uazapi-webhook] 💬 Msg ${fromMe ? 'enviada' : 'recebida'}: ${phoneNumber} | Tipo: ${messageType} | Texto: ${(textContent || '').substring(0, 100)}`);

        // Buscar instância para obter store_id
        const instance = await findInstance(supabase, instanceName);
        if (!instance) {
          console.log(`[uazapi-webhook] ⚠️ Instância não encontrada: ${instanceName}`);
          await logWebhook(supabase, instanceName, 'error', payload, 'messages');
          break;
        }

        const storeId = instance.store_id;

        // Buscar nome do cliente cadastrado (se mensagem recebida)
        let contactName = senderName;
        if (!fromMe) {
          const phoneVariants = getPhoneVariants(phoneNumber);
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

        // Determinar tipo de conteúdo baseado no messageType da UaZapi
        const uaMsgType = (messageType || '').toLowerCase();
        const incomingType = uaMsgType.includes('image') ? 'image' :
          uaMsgType.includes('audio') || uaMsgType.includes('ptt') ? 'audio' :
          uaMsgType.includes('video') ? 'video' :
          uaMsgType.includes('document') ? 'document' :
          uaMsgType.includes('sticker') ? 'sticker' :
          uaMsgType.includes('location') ? 'location' : 'text';

        // Extrair URL de mídia do content da UaZapi
        const content = msg.content || {};
        const mediaUrl = (typeof content === 'object' ? content.URL : null) || null;
        const mediaFilename = (typeof content === 'object' ? content.fileName : null) || null;
        const mediaMimetype = (typeof content === 'object' ? content.mimetype : null) || null;

        // Normalizar o remoteJid para ter o formato correto
        const normalizedJid = remoteJid.includes('@') ? remoteJid : `${phoneNumber}@s.whatsapp.net`;

        // Deduplicação
        if (messageId) {
          const { data: existingMsg } = await supabase
            .from('whatsapp_chat_messages')
            .select('id')
            .eq('evolution_message_id', messageId)
            .maybeSingle();
          if (existingMsg) {
            console.log(`[uazapi-webhook] ⏭️ Msg duplicada ignorada: ${messageId}`);
            break;
          }
        }

        // Extrair informações de citação/resposta
        let quotedMessageDbId: string | null = null;
        let quotedContentData: any = null;
        const contextInfo = typeof content === 'object' ? content.contextInfo : null;

        if (contextInfo?.quotedMessage || msg.quoted) {
          const quotedText = msg.quoted || '';
          quotedContentData = { content: quotedText || null, message_type: 'text' };

          if (contextInfo?.stanzaId) {
            const { data: quotedMsg } = await supabase
              .from('whatsapp_chat_messages')
              .select('id, sender_name')
              .eq('store_id', storeId)
              .eq('evolution_message_id', contextInfo.stanzaId)
              .maybeSingle();
            if (quotedMsg) {
              quotedMessageDbId = quotedMsg.id;
              if (quotedMsg.sender_name) quotedContentData.sender_name = quotedMsg.sender_name;
            }
          }
        }

        // Salvar mensagem no chat
        const direction = fromMe ? 'outgoing' : 'incoming';
        const insertData: any = {
          store_id: storeId,
          remote_jid: normalizedJid,
          phone_number: phoneNumber,
          direction,
          sender_name: fromMe ? null : contactName,
          content: textContent || null,
          message_type: incomingType,
          media_url: mediaUrl,
          media_filename: mediaFilename,
          media_mimetype: mediaMimetype,
          evolution_message_id: messageId || null,
          is_from_bot: false,
          is_read_by_attendant: fromMe,
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
          .eq('remote_jid', normalizedJid)
          .maybeSingle();

        const lastMsgPreview = (textContent || '[mídia]').slice(0, 200);

        if (existingConv) {
          const convUpdateData: any = {
            last_message: lastMsgPreview,
            last_message_at: new Date().toISOString(),
            last_message_direction: direction,
          };
          if (!fromMe) {
            convUpdateData.unread_count = (existingConv.unread_count || 0) + 1;
            if (contactName !== 'Cliente') convUpdateData.contact_name = contactName;
            if (existingConv.status === 'closed') {
              convUpdateData.status = 'active';
              convUpdateData.is_bot_active = true;
              convUpdateData.assigned_to = null;
              console.log(`[uazapi-webhook] 🔄 Conversa reaberta para ${normalizedJid}`);
            }
          }
          await supabase.from('whatsapp_conversations').update(convUpdateData).eq('id', existingConv.id);
        } else {
          await supabase.from('whatsapp_conversations').insert({
            store_id: storeId,
            remote_jid: normalizedJid,
            phone_number: phoneNumber,
            contact_name: contactName !== 'Cliente' ? contactName : null,
            last_message: lastMsgPreview,
            last_message_at: new Date().toISOString(),
            last_message_direction: direction,
            unread_count: fromMe ? 0 : 1,
          });
          console.log(`[uazapi-webhook] 🆕 Nova conversa criada: ${phoneNumber}`);
        }

        // Captura automática do contato
        if (!fromMe && phoneNumber.length >= 10 && phoneNumber.length <= 15) {
          await supabase
            .from('whatsapp_contacts')
            .upsert({
              store_id: storeId,
              phone_number: phoneNumber,
              push_name: senderName,
              name: contactName,
              is_whatsapp_valid: true,
              source: 'chat',
              last_synced_at: new Date().toISOString(),
            }, {
              onConflict: 'store_id,phone_number',
              ignoreDuplicates: false,
            });
        }

        await logWebhook(supabase, instanceName, 'success', payload, 'messages');
        break;
      }

      case 'messages_update':
      case 'messagesUpdate': {
        const updates = Array.isArray(payload.data) ? payload.data : [payload.data || payload.message || payload];
        for (const update of updates) {
          const status = update.status || update.update?.status;
          const msgId = update.key?.id || update.messageid || update.id;
          if (msgId && status) {
            const mappedStatus = status === 3 || status === 'READ' ? 'read' :
              status === 2 || status === 'DELIVERY_ACK' ? 'delivered' : null;
            if (mappedStatus) {
              await supabase.from('whatsapp_chat_messages')
                .update({ status: mappedStatus })
                .eq('evolution_message_id', msgId);
            }
          }
        }
        await logWebhook(supabase, instanceName, 'success', payload, 'messages_update');
        break;
      }

      case 'connection': {
        const state = payload.data?.state || payload.state || payload.status || 'unknown';
        console.log(`[uazapi-webhook] 🔌 Conexão: ${instanceName} → ${state}`);

        const newStatus = state === 'open' || state === 'connected' ? 'connected' :
          state === 'close' || state === 'disconnected' ? 'disconnected' : 'connecting';

        await supabase
          .from('whatsapp_instances')
          .update({
            status: newStatus,
            ...(newStatus === 'connected' ? { last_connected_at: new Date().toISOString() } : {})
          })
          .eq('provider', 'uazapi')
          .eq('instance_name', instanceName);

        await logWebhook(supabase, instanceName, 'success', payload, 'connection');
        break;
      }

      default: {
        console.log(`[uazapi-webhook] ℹ️ Evento não processado: ${eventType}`);
        await logWebhook(supabase, instanceName, 'received', payload, eventType);
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

// Buscar instância por nome
async function findInstance(supabase: any, instanceName: string) {
  const { data } = await supabase
    .from('whatsapp_instances')
    .select('id, store_id, instance_name')
    .eq('provider', 'uazapi')
    .eq('instance_name', instanceName)
    .maybeSingle();
  return data;
}

// Log helper
async function logWebhook(supabase: any, instanceName: string, status: string, payload: any, eventType: string) {
  await supabase.from('webhook_logs').insert({
    webhook_type: 'uazapi',
    source: `uazapi-${instanceName}`,
    status,
    payload,
    event_type: eventType,
  });
}
