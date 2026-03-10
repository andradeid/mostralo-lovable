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
    const ownerPhone = payload.owner || payload.chat?.owner || '';
    const payloadToken = payload.token || '';

    console.log(`[uazapi-webhook] 📥 Evento: ${eventType} | Instância: ${instanceName} | Owner: ${ownerPhone}`);
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
        const instance = await findInstance(supabase, instanceName, ownerPhone, payloadToken);
        if (!instance) {
          console.log(`[uazapi-webhook] ⚠️ Instância não encontrada: name=${instanceName}, owner=${ownerPhone}, token=${payloadToken?.substring(0, 8)}...`);
          await logWebhook(supabase, instanceName, 'error', payload, 'messages');
          break;
        }

        const storeId = instance.store_id;

        // Auto-atualizar phone_number da instância com o owner do payload
        if (ownerPhone && instance.phone_number !== ownerPhone) {
          await supabase.from('whatsapp_instances')
            .update({ phone_number: ownerPhone })
            .eq('id', instance.id);
          console.log(`[uazapi-webhook] 📱 Phone atualizado: ${instance.phone_number} → ${ownerPhone}`);
        }

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
          // Extrair texto da mensagem citada corretamente
          // UaZapi: contextInfo.quotedMessage pode ser objeto com conversation, extendedTextMessage, imageMessage, etc.
          const quotedMsg = contextInfo?.quotedMessage;
          let quotedText = '';
          
          if (typeof quotedMsg === 'string') {
            quotedText = quotedMsg;
          } else if (typeof quotedMsg === 'object' && quotedMsg) {
            quotedText = quotedMsg.conversation 
              || quotedMsg.extendedTextMessage?.text 
              || quotedMsg.imageMessage?.caption 
              || quotedMsg.videoMessage?.caption 
              || quotedMsg.documentMessage?.caption
              || '';
          }
          
          // Fallback: msg.quoted pode ser o texto ou pode ser o ID
          // Se quotedText ainda está vazio e msg.quoted parece texto (não parece um ID hex)
          if (!quotedText && msg.quoted && typeof msg.quoted === 'string') {
            const looksLikeId = /^[0-9A-F]{20,}$/i.test(msg.quoted);
            if (!looksLikeId) {
              quotedText = msg.quoted;
            }
          }
          
          // Determinar tipo da mensagem citada
          let quotedType = 'text';
          if (quotedMsg?.imageMessage) quotedType = 'image';
          else if (quotedMsg?.videoMessage) quotedType = 'video';
          else if (quotedMsg?.audioMessage) quotedType = 'audio';
          else if (quotedMsg?.documentMessage) quotedType = 'document';
          
          quotedContentData = { content: quotedText || null, message_type: quotedType };

          console.log(`[uazapi-webhook] 📝 Quote detectada - stanzaId: ${contextInfo?.stanzaId}, texto: "${(quotedText || '').substring(0, 80)}", tipo: ${quotedType}`);

          if (contextInfo?.stanzaId) {
            const { data: quotedDbMsg } = await supabase
              .from('whatsapp_chat_messages')
              .select('id, sender_name, content')
              .eq('store_id', storeId)
              .eq('evolution_message_id', contextInfo.stanzaId)
              .maybeSingle();
            if (quotedDbMsg) {
              quotedMessageDbId = quotedDbMsg.id;
              if (quotedDbMsg.sender_name) quotedContentData.sender_name = quotedDbMsg.sender_name;
              // Se não conseguiu extrair texto do payload, usar do banco
              if (!quotedContentData.content && quotedDbMsg.content) {
                quotedContentData.content = quotedDbMsg.content;
              }
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
          const status = update.status || update.update?.status || update.ack;
          const msgId = update.key?.id || update.messageid || update.id;
          if (msgId && status !== undefined) {
            // Mapear status: UaZapi usa números (1=sent,2=delivered,3=read) ou strings
            const mappedStatus = 
              status === 3 || status === 'READ' || status === 'read' ? 'read' :
              status === 2 || status === 'DELIVERY_ACK' || status === 'delivered' ? 'delivered' :
              status === 1 || status === 'SENT' || status === 'sent' || status === 'SERVER_ACK' ? 'sent' :
              status === -1 || status === 'ERROR' || status === 'failed' ? 'failed' : null;
            if (mappedStatus) {
              const { error: updErr } = await supabase.from('whatsapp_chat_messages')
                .update({ status: mappedStatus })
                .eq('evolution_message_id', msgId);
              if (!updErr) {
                console.log(`[uazapi-webhook] ✅ Status atualizado: ${msgId} → ${mappedStatus}`);
              }
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

      case 'presence': {
        // Client typing/recording/paused presence events
        const presenceType = payload.data?.presence || payload.presence || payload.type || '';
        const presenceJid = payload.data?.id || payload.data?.remoteJid || payload.chat?.jid || payload.from || '';
        
        console.log(`[uazapi-webhook] 📝 Presença: ${presenceType} de ${presenceJid}`);
        
        if (presenceJid && (presenceType === 'composing' || presenceType === 'recording' || presenceType === 'paused')) {
          // Find instance to get store_id
          const presInstance = await findInstance(supabase, instanceName, ownerPhone, payloadToken);
          if (presInstance) {
            // Find conversation by remote_jid
            const normalizedPresJid = presenceJid.includes('@') ? presenceJid : `${presenceJid}@s.whatsapp.net`;
            const { data: conv } = await supabase
              .from('whatsapp_conversations')
              .select('id')
              .eq('store_id', presInstance.store_id)
              .eq('remote_jid', normalizedPresJid)
              .maybeSingle();

            if (conv) {
              const isTyping = presenceType === 'composing' || presenceType === 'recording';
              // Broadcast to frontend via Supabase Realtime REST API
              const channelName = `typing-presence:${presInstance.store_id}`;
              try {
                const broadcastRes = await fetch(`${supabaseUrl}/realtime/v1/api/broadcast`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                  },
                  body: JSON.stringify({
                    messages: [{
                      topic: `realtime:${channelName}`,
                      event: 'client-typing',
                      payload: { conversationId: conv.id, isTyping },
                    }],
                  }),
                });
                console.log(`[uazapi-webhook] ✅ Presença broadcast (${broadcastRes.status}): ${presenceType} → conv ${conv.id}`);
              } catch (broadcastErr) {
                console.error(`[uazapi-webhook] ❌ Erro broadcast presença:`, broadcastErr);
              }
            }
          }
        }
        
        await logWebhook(supabase, instanceName, 'success', payload, 'presence');
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

// Buscar instância por múltiplas estratégias (SEM fallback genérico)
async function findInstance(supabase: any, instanceName: string, ownerPhone?: string, token?: string) {
  // 1. Tentar por instance_name (match exato)
  const { data: byName } = await supabase
    .from('whatsapp_instances')
    .select('id, store_id, instance_name, phone_number')
    .eq('provider', 'uazapi')
    .eq('instance_name', instanceName)
    .maybeSingle();
  if (byName) return byName;

  // 2. Tentar por api_token
  if (token) {
    const { data: byToken } = await supabase
      .from('whatsapp_instances')
      .select('id, store_id, instance_name, phone_number')
      .eq('provider', 'uazapi')
      .eq('api_token', token)
      .maybeSingle();
    if (byToken) {
      console.log(`[uazapi-webhook] 🔍 Instância encontrada por token: ${byToken.instance_name}`);
      return byToken;
    }
  }

  // 3. Tentar por owner phone (número do WhatsApp conectado na instância)
  if (ownerPhone) {
    const cleanOwner = ownerPhone.replace(/\D/g, '');
    const { data: allInstances } = await supabase
      .from('whatsapp_instances')
      .select('id, store_id, instance_name, phone_number')
      .eq('provider', 'uazapi');
    
    if (allInstances?.length) {
      const match = allInstances.find((i: any) => {
        const iPhone = (i.phone_number || '').replace(/\D/g, '');
        return iPhone === cleanOwner || cleanOwner.endsWith(iPhone) || iPhone.endsWith(cleanOwner);
      });
      if (match) {
        console.log(`[uazapi-webhook] 🔍 Instância encontrada por owner phone: ${match.instance_name}`);
        return match;
      }
    }
  }

  // Não retornar fallback - instância desconhecida será ignorada
  return null;
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
