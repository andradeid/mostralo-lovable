import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Set global para deduplicação em memória contra webhooks simultâneos
const globalProcessingSet = new Set<string>();

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

    const eventType = payload.EventType || payload.event || payload.type || 'unknown';
    const instanceName = payload.instanceName || payload.instance?.name || 'unknown';
    const ownerPhone = payload.owner || payload.chat?.owner || '';
    const payloadToken = payload.token || '';

    console.log(`[uazapi-webhook] 📥 Evento: ${eventType} | Instância: ${instanceName} | Owner: ${ownerPhone}`);

    // FILTRO RÁPIDO: rejeitar instâncias não registradas no sistema (ex: "minha-instancia" padrão da API)
    if (instanceName === 'minha-instancia' || instanceName === 'minha_instancia') {
      console.log(`[uazapi-webhook] 🚫 Instância padrão "${instanceName}" ignorada (não registrada no sistema)`);
      return new Response(JSON.stringify({ success: true, ignored: true, reason: 'default_instance' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[uazapi-webhook] 📦 Payload keys: ${Object.keys(payload).join(', ')}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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
        const msg = payload.message || {};
        const chat = payload.chat || {};

        const remoteJid = msg.chatid || msg.sender_pn || '';
        const fromMe = msg.fromMe === true;
        const messageId = msg.messageid || msg.id || '';
        const messageType = msg.messageType || 'conversation';
        const textContent = msg.text || '';
        const senderName = msg.senderName || chat.name || chat.wa_contactName || 'Cliente';
        const isGroup = msg.isGroup === true || chat.wa_isGroup === true;

        if (isGroup || remoteJid.includes('@g.us') || remoteJid === 'status@broadcast') {
          console.log(`[uazapi-webhook] 🚫 Grupo/broadcast ignorado: ${remoteJid}`);
          await logWebhook(supabase, instanceName, 'received', payload, 'messages_group');
          break;
        }

        // Verificar se é uma reação dentro do evento messages
        const uaMsgTypeLower = (messageType || '').toLowerCase();
        if (uaMsgTypeLower === 'reactionmessage' || uaMsgTypeLower === 'reaction') {
          const reactionContent = msg.content || {};
          const targetMsgId = reactionContent.key?.id || reactionContent.id || msg.reactionId || msg.reaction_id || msg.quoted_message_id || msg.quotedMsgId || '';
          const reactionEmojiText = reactionContent.text || msg.text || '';
          const reactionPhoneNum = (msg.chatid || msg.sender_pn || '').replace('@s.whatsapp.net', '').replace('@c.us', '').replace(/\D/g, '');

          if (targetMsgId) {
            const rInstance = await findInstance(supabase, instanceName, ownerPhone, payloadToken);
            if (rInstance) {
              const { data: rTargetMsg } = await supabase
                .from('whatsapp_chat_messages')
                .select('id, reactions')
                .eq('store_id', rInstance.store_id)
                .eq('evolution_message_id', targetMsgId)
                .maybeSingle();

              if (rTargetMsg) {
                const rExisting = (rTargetMsg.reactions as any[]) || [];
                if (reactionEmojiText === '') {
                  const rFiltered = rExisting.filter((r: any) => !(r.from === reactionPhoneNum || (fromMe && r.from_me)));
                  await supabase.from('whatsapp_chat_messages').update({ reactions: rFiltered }).eq('id', rTargetMsg.id);
                } else {
                  const rFiltered = rExisting.filter((r: any) => !(r.from === reactionPhoneNum || (fromMe && r.from_me)));
                  const rNew = [...rFiltered, { emoji: reactionEmojiText, from: reactionPhoneNum, from_me: fromMe }];
                  await supabase.from('whatsapp_chat_messages').update({ reactions: rNew }).eq('id', rTargetMsg.id);
                }
              }
            }
          }
          await logWebhook(supabase, instanceName, 'success', payload, 'messages_reaction');
          break;
        }

        const phoneNumber = (msg.sender_pn || msg.chatid || '').replace('@s.whatsapp.net', '').replace('@c.us', '').replace(/\D/g, '');

        if (!phoneNumber) {
          await logWebhook(supabase, instanceName, 'error', payload, 'messages_no_phone');
          break;
        }

        console.log(`[uazapi-webhook] 💬 Msg ${fromMe ? 'enviada' : 'recebida'}: ${phoneNumber} | Tipo: ${messageType} | Texto: ${(textContent || '').substring(0, 100)}`);

        let instance = await findInstance(supabase, instanceName, ownerPhone, payloadToken);
        if (!instance) {
          const normalizedInstanceName = instanceName === 'minha-instancia' && ownerPhone ? ownerPhone.replace(/\D/g, '') : instanceName;
          if (normalizedInstanceName !== instanceName) {
            console.log(`[uazapi-webhook] 🔁 Tentando fallback por owner: ${normalizedInstanceName}`);
            instance = await findInstance(supabase, normalizedInstanceName, ownerPhone, payloadToken);
          }
        }

        if (!instance) {
          console.log(`[uazapi-webhook] ⚠️ Instância não encontrada: name=${instanceName}, owner=${ownerPhone}, token=${payloadToken?.substring(0, 8)}...`);
          await logWebhook(supabase, instanceName, 'error', payload, 'messages');
          break;
        }

        const storeId = instance.store_id;

        if (ownerPhone && instance.phone_number !== ownerPhone) {
          await supabase.from('whatsapp_instances').update({ phone_number: ownerPhone }).eq('id', instance.id);
        }

        let contactName = senderName;
        if (!fromMe) {
          const phoneVariants = getPhoneVariants(phoneNumber);
          const { data: registeredCustomer } = await supabase
            .from('customers').select('name').in('phone', phoneVariants).limit(1).maybeSingle();
          if (registeredCustomer?.name) {
            contactName = registeredCustomer.name;
            console.log(`[uazapi-webhook] 📇 Cliente cadastrado: ${contactName}`);
          }
        }

        const uaMsgType = (messageType || '').toLowerCase();
        const incomingType = uaMsgType.includes('image') ? 'image' :
          uaMsgType.includes('audio') || uaMsgType.includes('ptt') ? 'audio' :
          uaMsgType.includes('video') ? 'video' :
          uaMsgType.includes('document') ? 'document' :
          uaMsgType.includes('sticker') ? 'sticker' :
          uaMsgType.includes('location') ? 'location' : 'text';

        const content = msg.content || {};
        const contentUrl = typeof content === 'object' ? (content.URL || content.url || content.directPath) : null;
        let mediaUrl = msg.fileURL || contentUrl || null;
        const mediaFilename = (typeof content === 'object' ? content.fileName : null) || null;
        const mediaMimetype = (typeof content === 'object' ? content.mimetype : null) || null;

        console.log(`[uazapi-webhook] 🔗 Mídia: msg.fileURL=${msg.fileURL?.substring(0, 80)}, content.URL=${contentUrl?.substring(0, 80)}, tipo=${incomingType}, mimetype=${mediaMimetype}`);

        const normalizedJid = remoteJid.includes('@') ? remoteJid : `${phoneNumber}@s.whatsapp.net`;

        // =============================================
        // DEDUP ATÔMICO: Usa advisory lock via RPC para 
        // garantir que apenas 1 isolate processe cada msg
        // =============================================
        if (messageId) {
          // Deduplicação em memória (best-effort para mesmo isolate)
          const dedupeKey = `msg_${messageId}`;
          if (globalProcessingSet.has(dedupeKey)) {
            console.log(`[uazapi-webhook] ⏭️ DEDUP_GLOBAL: Msg ${messageId} já sendo processada neste isolate. Ignorando.`);
            break;
          }
          globalProcessingSet.add(dedupeKey);
          setTimeout(() => globalProcessingSet.delete(dedupeKey), 30000);

          // Deduplicação DB: check rápido (pre-filter)
          const { data: existingMsg } = await supabase
            .from('whatsapp_chat_messages').select('id').eq('evolution_message_id', messageId).maybeSingle();
          if (existingMsg) {
            console.log(`[uazapi-webhook] ⏭️ DEDUP_DB: Msg duplicada ignorada: ${messageId}`);
            break;
          }
          console.log(`[uazapi-webhook] 🆕 DEDUP_DB: Msg ${messageId} não existe no DB, prosseguindo`);
        }

        // MUTEX: será decidido APÓS o INSERT atômico da mensagem
        let botMutexAcquired = false;

        // Mídia: download e persistência
        let audioTranscription: string | null = null;
        const mediaTypes = ['audio', 'image', 'video', 'sticker', 'document'];
        
        if (mediaTypes.includes(incomingType) && messageId) {
          try {
            const { data: instData } = await supabase.from('whatsapp_instances').select('api_token').eq('id', instance.id).single();
            const { data: uazapiConfig } = await supabase.from('uazapi_config').select('api_url').limit(1).maybeSingle();
            const instToken = instData?.api_token;
            const serverUrl = uazapiConfig?.api_url;
            
            if (instToken && serverUrl) {
              const cleanServerUrl = serverUrl.replace(/\/+$/, '');
              const downloadBody: any = { id: messageId, return_link: true };
              if (incomingType === 'audio') { downloadBody.generate_mp3 = true; downloadBody.transcribe = true; }
              
              const downloadResp = await fetch(`${cleanServerUrl}/message/download`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'token': instToken },
                body: JSON.stringify(downloadBody),
              });
              
              if (downloadResp.ok) {
                const downloadData = await downloadResp.json();
                const fileUrl = downloadData.fileURL || downloadData.url;
                if (fileUrl) {
                  const fileResponse = await fetch(fileUrl);
                  if (fileResponse.ok) {
                    const fileBytes = new Uint8Array(await fileResponse.arrayBuffer());
                    const extMap: Record<string, string> = { audio: 'mp3', image: 'jpg', video: 'mp4', sticker: 'webp', document: 'pdf' };
                    const mimeMap: Record<string, string> = { audio: 'audio/mpeg', image: 'image/jpeg', video: 'video/mp4', sticker: 'image/webp', document: 'application/pdf' };
                    const docFileName = mediaFilename || '';
                    const docExt = docFileName.includes('.') ? docFileName.split('.').pop()!.toLowerCase() : null;
                    const ext = (incomingType === 'document' && docExt) ? docExt : (extMap[incomingType] || 'bin');
                    const mime = mediaMimetype || downloadData.mimetype || mimeMap[incomingType] || 'application/octet-stream';
                    const storagePath = `${storeId}/${phoneNumber}/${Date.now()}_${messageId}.${ext}`;
                    
                    const { error: uploadError } = await supabase.storage
                      .from('whatsapp-chat-media')
                      .upload(storagePath, fileBytes, { contentType: (mime as string).split(';')[0].trim(), upsert: false });
                    
                    if (!uploadError) {
                      const { data: publicUrlData } = supabase.storage.from('whatsapp-chat-media').getPublicUrl(storagePath);
                      mediaUrl = publicUrlData.publicUrl;
                      console.log(`[uazapi-webhook] ✅ Mídia persistida: ${mediaUrl.substring(0, 80)}`);
                    }
                  } else { await fileResponse.text(); }
                }
                if (downloadData.transcription) {
                  audioTranscription = downloadData.transcription;
                  console.log(`[uazapi-webhook] ✅ Transcrição UaZapi: "${audioTranscription?.slice(0, 100)}"`);
                }
              } else { await downloadResp.text(); }
            }
            
            // Fallback Whisper
            if (incomingType === 'audio' && !audioTranscription && mediaUrl) {
              const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
              if (OPENAI_API_KEY) {
                try {
                  const audioResp = await fetch(mediaUrl);
                  if (audioResp.ok) {
                    const audioBytes = new Uint8Array(await audioResp.arrayBuffer());
                    const formData = new FormData();
                    formData.append('file', new Blob([audioBytes], { type: 'audio/mpeg' }), 'audio.mp3');
                    formData.append('model', 'whisper-1');
                    formData.append('language', 'pt');
                    formData.append('response_format', 'text');
                    const whisperResp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                      method: 'POST', headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` }, body: formData,
                    });
                    if (whisperResp.ok) {
                      audioTranscription = (await whisperResp.text()).trim();
                      console.log(`[uazapi-webhook] ✅ Transcrição Whisper: "${audioTranscription?.slice(0, 100)}"`);
                    } else { await whisperResp.text(); }
                  } else { await audioResp.text(); }
                } catch (whisperErr) { console.error(`[uazapi-webhook] ❌ Whisper:`, whisperErr); }
              }
            }
          } catch (dlErr) { console.error(`[uazapi-webhook] ❌ Download mídia:`, dlErr); }
        }

        // Citação/resposta
        let quotedMessageDbId: string | null = null;
        let quotedContentData: any = null;
        const contextInfo = typeof content === 'object' ? content.contextInfo : null;

        if (contextInfo?.quotedMessage || msg.quoted) {
          const quotedMsg = contextInfo?.quotedMessage;
          let quotedText = '';
          if (typeof quotedMsg === 'string') quotedText = quotedMsg;
          else if (typeof quotedMsg === 'object' && quotedMsg) {
            quotedText = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || quotedMsg.imageMessage?.caption || quotedMsg.videoMessage?.caption || '';
          }
          if (!quotedText && msg.quoted && typeof msg.quoted === 'string') {
            if (!/^[0-9A-F]{20,}$/i.test(msg.quoted)) quotedText = msg.quoted;
          }
          let quotedType = 'text';
          if (quotedMsg?.imageMessage) quotedType = 'image';
          else if (quotedMsg?.videoMessage) quotedType = 'video';
          else if (quotedMsg?.audioMessage) quotedType = 'audio';
          else if (quotedMsg?.documentMessage) quotedType = 'document';
          quotedContentData = { content: quotedText || null, message_type: quotedType };

          if (contextInfo?.stanzaId) {
            const { data: quotedDbMsg } = await supabase
              .from('whatsapp_chat_messages').select('id, sender_name, content')
              .eq('store_id', storeId).eq('evolution_message_id', contextInfo.stanzaId).maybeSingle();
            if (quotedDbMsg) {
              quotedMessageDbId = quotedDbMsg.id;
              if (quotedDbMsg.sender_name) quotedContentData.sender_name = quotedDbMsg.sender_name;
              if (!quotedContentData.content && quotedDbMsg.content) quotedContentData.content = quotedDbMsg.content;
            }
          }
        }

        const messageMetadata: Record<string, any> = {};
        if (audioTranscription) messageMetadata.transcription = audioTranscription;

        // Origem da mensagem
        let messageSource = 'unknown';
        if (!fromMe) {
          messageSource = 'client';
        } else {
          messageSource = 'cellphone';
          const { data: pauseConv } = await supabase
            .from('whatsapp_conversations').select('id, is_bot_active')
            .eq('store_id', storeId).eq('remote_jid', normalizedJid).maybeSingle();
          if (pauseConv?.is_bot_active) {
            await supabase.from('whatsapp_conversations').update({ is_bot_active: false }).eq('id', pauseConv.id);
            console.log(`[uazapi-webhook] ⏸️ Bot pausado (resposta manual celular)`);
          }
        }

        // Salvar mensagem
        const direction = fromMe ? 'outgoing' : 'incoming';
        const insertData: any = {
          store_id: storeId,
          remote_jid: normalizedJid,
          phone_number: phoneNumber,
          direction,
          sender_name: fromMe ? null : contactName,
          message_source: messageSource,
          content: incomingType === 'audio' ? '🎵 Áudio'
            : incomingType === 'location' ? (() => {
                const loc = typeof content === 'object' ? content : {};
                const lat = loc.latitude || loc.degreesLatitude;
                const lng = loc.longitude || loc.degreesLongitude;
                if (lat && lng) return `📍 Localização: ${lat}, ${lng}`;
                return textContent || '📍 Localização enviada';
              })()
            : (textContent || null),
          message_type: incomingType,
          media_url: mediaUrl,
          media_filename: mediaFilename,
          media_mimetype: mediaMimetype,
          evolution_message_id: messageId || null,
          is_from_bot: false,
          is_read_by_attendant: fromMe,
          timestamp: new Date().toISOString(),
          metadata: Object.keys(messageMetadata).length > 0 ? messageMetadata : null,
        };
        if (quotedMessageDbId) insertData.quoted_message_id = quotedMessageDbId;
        if (quotedContentData) insertData.quoted_content = quotedContentData;

        const { error: msgError } = await supabase.from('whatsapp_chat_messages').insert(insertData);
        if (msgError) {
          // Se erro é de duplicata (unique constraint), este é um webhook duplicado
          if (msgError.message?.includes('unique') || msgError.message?.includes('duplicate')) {
            console.log(`[uazapi-webhook] ⏭️ DEDUP_ATOMIC: Msg ${messageId} já inserida por outro isolate. Abortando processamento.`);
            break;
          }
          console.error(`[uazapi-webhook] ❌ Erro ao salvar mensagem:`, msgError.message);
        } else {
          console.log(`[uazapi-webhook] ✅ Msg ${direction} salva no chat (INSERT atômico bem-sucedido)`);
          // Só quem conseguiu inserir pode processar o bot
          if (!fromMe && messageId) {
            botMutexAcquired = true;
            console.log(`[uazapi-webhook] 🔓 MUTEX_ATOMIC: Bot liberado via INSERT atômico para msg ${messageId}`);
          }
        }

        // Upsert conversa
        const { data: existingConv } = await supabase
          .from('whatsapp_conversations').select('id, unread_count, status, is_bot_active')
          .eq('store_id', storeId).eq('remote_jid', normalizedJid).maybeSingle();

        const mediaLabel = incomingType === 'audio' ? '🎵 Áudio' : incomingType === 'image' ? '📷 Imagem'
          : incomingType === 'video' ? '🎥 Vídeo' : incomingType === 'document' ? '📄 Documento'
          : incomingType === 'sticker' ? '🏷️ Figurinha' : incomingType === 'location' ? '📍 Localização' : '[mídia]';
        const lastMsgPreview = (textContent || mediaLabel).slice(0, 200);

        if (existingConv) {
          const convUpdateData: any = {
            last_message: lastMsgPreview,
            last_message_at: new Date().toISOString(),
            last_message_direction: direction,
            last_message_source: messageSource,
          };
          if (!fromMe) {
            convUpdateData.unread_count = (existingConv.unread_count || 0) + 1;
            if (contactName !== 'Cliente') convUpdateData.contact_name = contactName;
            if (existingConv.status === 'closed') {
              convUpdateData.status = 'active';
              convUpdateData.is_bot_active = true;
              convUpdateData.assigned_to = null;
            }
          }
          await supabase.from('whatsapp_conversations').update(convUpdateData).eq('id', existingConv.id);
        } else {
          await supabase.from('whatsapp_conversations').insert({
            store_id: storeId, remote_jid: normalizedJid, phone_number: phoneNumber,
            contact_name: contactName !== 'Cliente' ? contactName : null,
            last_message: lastMsgPreview, last_message_at: new Date().toISOString(),
            last_message_direction: direction, last_message_source: messageSource,
            unread_count: fromMe ? 0 : 1,
          });
        }

        // Captura automática do contato
        if (!fromMe && phoneNumber.length >= 10 && phoneNumber.length <= 15) {
          await supabase.from('whatsapp_contacts').upsert({
            store_id: storeId, phone_number: phoneNumber, push_name: senderName,
            name: contactName, is_whatsapp_valid: true, source: 'chat',
            last_synced_at: new Date().toISOString(),
          }, { onConflict: 'store_id,phone_number', ignoreDuplicates: false });
        }

        // ========================================
        // BOT IA: PROCESSAMENTO OPENAI PELO WEBHOOK
        // ========================================
         if (!fromMe && botMutexAcquired) {
          console.log(`[uazapi-webhook] 🤖 BOT_ENTRY: Iniciando processamento bot para msg ${messageId} | phone=${phoneNumber} | jid=${normalizedJid}`);
          try {
            const botConfigRes = await supabase
              .from('store_bot_config')
              .select('enabled, keyword_finish, unknown_message, whatsapp_provider, openai_assistant_id, bot_mode, custom_prompt_instructions, bot_name, delay_message, bot_split_messages, bot_time_per_char')
              .eq('store_id', storeId).maybeSingle();
            const botConfig = botConfigRes.data;
            
            console.log(`[uazapi-webhook] 🤖 BOT_CONFIG: enabled=${botConfig?.enabled}, provider=${botConfig?.whatsapp_provider}, mode=${botConfig?.bot_mode}, assistant=${botConfig?.openai_assistant_id?.substring(0, 20)}`);
            
            if (botConfig?.enabled && botConfig.whatsapp_provider === 'uazapi') {
              const { data: convCheck } = await supabase
                .from('whatsapp_conversations').select('is_bot_active')
                .eq('store_id', storeId).eq('remote_jid', normalizedJid).maybeSingle();
              
              console.log(`[uazapi-webhook] 🤖 BOT_ACTIVE_CHECK: is_bot_active=${convCheck?.is_bot_active}`);
              
              if (convCheck?.is_bot_active === false) {
                console.log(`[uazapi-webhook] ⏸️ Bot pausado para ${normalizedJid}`);
              } else {
                const botInputText = audioTranscription || textContent || '';
                const hasImage = (incomingType === 'image' || messageType === 'imageMessage') && mediaUrl;
                if (botInputText.trim() || hasImage) {
                  const keywordFinish = botConfig.keyword_finish || '#sair';
                  if (botInputText.trim().toLowerCase() === keywordFinish.toLowerCase()) {
                    console.log(`[uazapi-webhook] 🔑 Keyword de finalização: ${keywordFinish}`);
                    await supabase.from('whatsapp_conversations')
                      .update({ is_bot_active: false }).eq('store_id', storeId).eq('remote_jid', normalizedJid);
                    const farewellMsg = botConfig.unknown_message || 'Atendimento encerrado. Se precisar, é só chamar novamente! 😊';
                    await sendBotReply(supabase, instance, storeId, phoneNumber, normalizedJid, farewellMsg);
                  } else {
                    console.log(`[uazapi-webhook] 🤖 BOT_PROCESS: Chamando processAIBotResponse para msg ${messageId}`);
                    await processAIBotResponse(supabase, instance, storeId, phoneNumber, normalizedJid, botInputText, botConfig, contactName, mediaUrl, incomingType);
                    console.log(`[uazapi-webhook] 🤖 BOT_PROCESS_DONE: processAIBotResponse finalizado para msg ${messageId}`);
                  }
                }
              }
            }
          } catch (botErr) {
            console.error(`[uazapi-webhook] ❌ Erro no bot:`, botErr);
          }
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
            const mappedStatus = 
              status === 3 || status === 'READ' || status === 'read' ? 'read' :
              status === 2 || status === 'DELIVERY_ACK' || status === 'delivered' ? 'delivered' :
              status === 1 || status === 'SENT' || status === 'sent' || status === 'SERVER_ACK' ? 'sent' :
              status === -1 || status === 'ERROR' || status === 'failed' ? 'failed' : null;
            if (mappedStatus) {
              await supabase.from('whatsapp_chat_messages').update({ status: mappedStatus }).eq('evolution_message_id', msgId);
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
        await supabase.from('whatsapp_instances')
          .update({ status: newStatus, ...(newStatus === 'connected' ? { last_connected_at: new Date().toISOString() } : {}) })
          .eq('provider', 'uazapi').eq('instance_name', instanceName);
        await logWebhook(supabase, instanceName, 'success', payload, 'connection');
        break;
      }

      case 'presence': {
        const presenceType = payload.data?.presence || payload.presence || payload.type || '';
        const presenceJid = payload.data?.id || payload.data?.remoteJid || payload.chat?.jid || payload.from || '';
        console.log(`[uazapi-webhook] 📝 Presença: ${presenceType} de ${presenceJid}`);
        
        if (presenceJid && (presenceType === 'composing' || presenceType === 'recording' || presenceType === 'paused')) {
          const presInstance = await findInstance(supabase, instanceName, ownerPhone, payloadToken);
          if (presInstance) {
            const normalizedPresJid = presenceJid.includes('@') ? presenceJid : `${presenceJid}@s.whatsapp.net`;
            const { data: conv } = await supabase
              .from('whatsapp_conversations').select('id')
              .eq('store_id', presInstance.store_id).eq('remote_jid', normalizedPresJid).maybeSingle();
            if (conv) {
              const isTyping = presenceType === 'composing' || presenceType === 'recording';
              try {
                await fetch(`${supabaseUrl}/realtime/v1/api/broadcast`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` },
                  body: JSON.stringify({
                    messages: [{ topic: `realtime:typing-presence:${presInstance.store_id}`, event: 'client-typing', payload: { conversationId: conv.id, isTyping, presenceType } }],
                  }),
                });
              } catch {}
            }
          }
        }
        await logWebhook(supabase, instanceName, 'success', payload, 'presence');
        break;
      }

      case 'messages_reaction':
      case 'reaction': {
        const reactionData = payload.message || payload.data || {};
        const reactionMsgId = reactionData.id || reactionData.messageid || reactionData.key?.id || '';
        const reactionEmoji = reactionData.text || reactionData.content?.text || reactionData.reaction || '';
        const reactionFromMe = reactionData.fromMe === true;
        const reactionPhone = (reactionData.chatid || reactionData.sender_pn || reactionData.key?.remoteJid || '')
          .replace('@s.whatsapp.net', '').replace('@c.us', '').replace(/\D/g, '');

        if (reactionMsgId) {
          const reactionInstance = await findInstance(supabase, instanceName, ownerPhone, payloadToken);
          if (reactionInstance) {
            const { data: targetMsg } = await supabase
              .from('whatsapp_chat_messages').select('id, reactions')
              .eq('store_id', reactionInstance.store_id).eq('evolution_message_id', reactionMsgId).maybeSingle();
            if (targetMsg) {
              const existingReactions = (targetMsg.reactions as any[]) || [];
              if (reactionEmoji === '') {
                const filtered = existingReactions.filter((r: any) => !(r.from === reactionPhone || (reactionFromMe && r.from_me)));
                await supabase.from('whatsapp_chat_messages').update({ reactions: filtered }).eq('id', targetMsg.id);
              } else {
                const filtered = existingReactions.filter((r: any) => !(r.from === reactionPhone || (reactionFromMe && r.from_me)));
                await supabase.from('whatsapp_chat_messages').update({ reactions: [...filtered, { emoji: reactionEmoji, from: reactionPhone, from_me: reactionFromMe }] }).eq('id', targetMsg.id);
              }
            }
          }
        }
        await logWebhook(supabase, instanceName, 'success', payload, 'reaction');
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

// ========================================
// FUNÇÕES AUXILIARES (fora do serve())
// ========================================

async function findInstance(supabase: any, instanceName: string, ownerPhone?: string, token?: string) {
  // 1. Busca por nome exato
  const { data: byName } = await supabase
    .from('whatsapp_instances').select('id, store_id, instance_name, phone_number')
    .eq('provider', 'uazapi').eq('instance_name', instanceName).maybeSingle();
  if (byName) return byName;

  // 2. Busca por token
  if (token) {
    const { data: byToken } = await supabase
      .from('whatsapp_instances').select('id, store_id, instance_name, phone_number')
      .eq('provider', 'uazapi').eq('api_token', token).maybeSingle();
    if (byToken) return byToken;
  }

  // 3. Busca por telefone do owner
  const { data: allInstances } = await supabase
    .from('whatsapp_instances').select('id, store_id, instance_name, phone_number')
    .eq('provider', 'uazapi');

  if (allInstances?.length) {
    if (ownerPhone) {
      const cleanOwner = ownerPhone.replace(/\D/g, '');
      const match = allInstances.find((i: any) => {
        const iPhone = (i.phone_number || '').replace(/\D/g, '');
        return iPhone === cleanOwner || cleanOwner.endsWith(iPhone) || iPhone.endsWith(cleanOwner);
      });
      if (match) return match;
  }

  // SEM FALLBACK: nunca associar mensagens de instâncias desconhecidas a lojas
  }

  return null;
}

async function logWebhook(supabase: any, instanceName: string, status: string, payload: any, eventType: string) {
  await supabase.from('webhook_logs').insert({
    webhook_type: 'uazapi', source: `uazapi-${instanceName}`, status, payload, event_type: eventType,
  });
}

// Marcar mensagens como lidas via UaZapi API (blue ticks)
async function markMessagesAsRead(supabase: any, instance: any, storeId: string, normalizedJid: string, phoneNumber: string) {
  try {
    const { data: uaCfg } = await supabase.from('uazapi_config').select('api_url').limit(1).single();
    const { data: instData } = await supabase.from('whatsapp_instances').select('api_token').eq('id', instance.id).single();
    
    if (!uaCfg?.api_url || !instData?.api_token) return;
    
    const uaBase = uaCfg.api_url.replace(/\/+$/, '');
    const token = instData.api_token;

    // Buscar IDs das mensagens não lidas do cliente
    const { data: unreadMsgs } = await supabase
      .from('whatsapp_chat_messages')
      .select('evolution_message_id')
      .eq('store_id', storeId)
      .eq('remote_jid', normalizedJid)
      .eq('direction', 'incoming')
      .eq('is_read_by_attendant', false)
      .not('evolution_message_id', 'is', null);

    const messageIds = (unreadMsgs || []).map((m: any) => m.evolution_message_id).filter(Boolean);

    if (messageIds.length > 0) {
      const resp = await fetch(`${uaBase}/message/markread`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'token': token },
        body: JSON.stringify({ id: messageIds }),
      });
      console.log(`[uazapi-webhook] 📖 BOT markread ${messageIds.length} msgs → ${resp.status}`);
    } else {
      // Fallback: marcar chat inteiro como lido
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const resp = await fetch(`${uaBase}/chat/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'token': token },
        body: JSON.stringify({ number: cleanPhone, read: true }),
      });
      console.log(`[uazapi-webhook] 📖 BOT chat/read fallback → ${resp.status}`);
    }

    // Atualizar status no banco local
    await supabase.from('whatsapp_chat_messages')
      .update({ is_read_by_attendant: true })
      .eq('store_id', storeId)
      .eq('remote_jid', normalizedJid)
      .eq('direction', 'incoming')
      .eq('is_read_by_attendant', false);

  } catch (err) {
    console.error(`[uazapi-webhook] ❌ Erro markread bot:`, err);
  }
}


// PROCESSAMENTO DE IA (OpenAI)
// ========================================
async function processAIBotResponse(
  supabase: any, instance: any, storeId: string, phoneNumber: string, normalizedJid: string,
  userMessage: string, botConfig: any, contactName: string, mediaUrl?: string | null, messageType?: string
) {
  console.log(`[uazapi-webhook] 🤖 PROCESS_AI_ENTRY: phone=${phoneNumber} | msg="${userMessage.substring(0, 60)}" | mode=${botConfig.bot_mode}`);
  try {
    const { data: store } = await supabase.from('stores').select('openai_api_key').eq('id', storeId).single();
    const openaiApiKey = store?.openai_api_key;
    if (!openaiApiKey) {
      console.error(`[uazapi-webhook] ❌ OpenAI API Key não configurada`);
      return;
    }

    // Marcar mensagens como lidas na API (confirmação de leitura / blue ticks)
    await markMessagesAsRead(supabase, instance, storeId, normalizedJid, phoneNumber);

    await sendUaZapiPresence(supabase, instance, phoneNumber, 'composing', 60000);

    const openaiAssistantId = botConfig.openai_assistant_id;
    const botMode = botConfig.bot_mode || 'chat_completion';

    console.log(`[uazapi-webhook] 🤖 PROCESS_AI_MODE: botMode=${botMode} | assistantId=${openaiAssistantId?.substring(0, 20)}`);
    if ((botMode === 'assistant' || botMode === 'conversational') && openaiAssistantId) {
      await handleAssistantMode(supabase, instance, storeId, phoneNumber, normalizedJid, userMessage, openaiApiKey, openaiAssistantId, contactName);
    } else {
      await handleChatCompletionMode(supabase, instance, storeId, phoneNumber, normalizedJid, userMessage, openaiApiKey, botConfig, contactName);
    }
  } catch (err) {
    console.error(`[uazapi-webhook] ❌ Erro processAIBotResponse:`, err);
  }
}

async function handleChatCompletionMode(
  supabase: any, instance: any, storeId: string, phoneNumber: string, normalizedJid: string,
  userMessage: string, openaiApiKey: string, botConfig: any, contactName: string
) {
  const systemPrompt = botConfig.custom_prompt_instructions || `Você é ${botConfig.bot_name || 'Assistente'}, um assistente virtual.`;

  const { data: recentMsgs } = await supabase
    .from('whatsapp_chat_messages').select('direction, content, is_from_bot')
    .eq('store_id', storeId).eq('remote_jid', normalizedJid)
    .order('timestamp', { ascending: false }).limit(20);

  const messages: any[] = [{ role: 'system', content: systemPrompt }];
  if (recentMsgs) {
    for (const m of recentMsgs.reverse()) {
      if (!m.content) continue;
      messages.push({ role: m.direction === 'incoming' ? 'user' : 'assistant', content: m.content });
    }
  }
  messages.push({ role: 'user', content: userMessage });

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${openaiApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages, max_tokens: 1000, temperature: 0.7 }),
  });

  if (resp.ok) {
    const data = await resp.json();
    const reply = data.choices?.[0]?.message?.content;
    if (reply) await sendBotReply(supabase, instance, storeId, phoneNumber, normalizedJid, reply);
  } else {
    const errText = await resp.text();
    console.error(`[uazapi-webhook] ❌ Chat completion error: ${resp.status}: ${errText.substring(0, 200)}`);
  }
}

async function handleAssistantMode(
  supabase: any, instance: any, storeId: string, phoneNumber: string, normalizedJid: string,
  userMessage: string, openaiApiKey: string, assistantId: string, contactName: string
) {
  const headers = {
    'Authorization': `Bearer ${openaiApiKey}`,
    'Content-Type': 'application/json',
    'OpenAI-Beta': 'assistants=v2',
  };

  // Coletar imagens de produtos encontrados nas tools
  const productImages: Array<{ name: string; price: string; promoPrice?: string | null; imageUrl: string; slug?: string; stockLabel?: string }> = [];

  // Buscar ou criar thread
  const { data: conv } = await supabase
    .from('whatsapp_conversations').select('id, metadata')
    .eq('store_id', storeId).eq('remote_jid', normalizedJid).maybeSingle();

  let threadId = (conv?.metadata as any)?.openai_thread_id || null;
  console.log(`[uazapi-webhook] 🧵 Thread lookup: conv=${conv?.id || 'NULL'} | threadId=${threadId || 'NULL'} | metadata=${JSON.stringify(conv?.metadata || null)}`);

  if (!threadId) {
    const threadResp = await fetch('https://api.openai.com/v1/threads', { method: 'POST', headers, body: JSON.stringify({}) });
    if (threadResp.ok) {
      const threadData = await threadResp.json();
      threadId = threadData.id;
      console.log(`[uazapi-webhook] 🧵 Nova thread criada: ${threadId}`);
      const meta = (conv?.metadata as any) || {};
      const { error: metaErr } = await supabase.from('whatsapp_conversations')
        .update({ metadata: { ...meta, openai_thread_id: threadId } })
        .eq('store_id', storeId).eq('remote_jid', normalizedJid);
      if (metaErr) console.error(`[uazapi-webhook] ❌ Erro ao salvar thread no metadata:`, metaErr.message);
      else console.log(`[uazapi-webhook] ✅ Thread ${threadId} salva no metadata da conversa`);
    } else {
      console.error(`[uazapi-webhook] ❌ Erro ao criar thread: ${(await threadResp.text()).substring(0, 200)}`);
      return;
    }
  }

  // Adicionar mensagem
  const msgContent = contactName && contactName !== 'Cliente' ? `[Cliente: ${contactName}] ${userMessage}` : userMessage;
  await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
    method: 'POST', headers, body: JSON.stringify({ role: 'user', content: msgContent }),
  });

  // Criar run
  const runResp = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
    method: 'POST', headers, body: JSON.stringify({ assistant_id: assistantId }),
  });

  if (!runResp.ok) {
    console.error(`[uazapi-webhook] ❌ Erro ao criar run: ${(await runResp.text()).substring(0, 200)}`);
    return;
  }

  let run = await runResp.json();
  const runId = run.id;
  console.log(`[uazapi-webhook] 🏃 Run criada: ${runId} (status: ${run.status})`);

  // Polling com requires_action
  const maxAttempts = 30;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (run.status === 'completed') break;
    if (['failed', 'cancelled', 'expired'].includes(run.status)) {
      console.error(`[uazapi-webhook] ❌ Run ${runId} terminou: ${run.status}`);
      return;
    }

    if (run.status === 'requires_action') {
      const toolCalls = run.required_action?.submit_tool_outputs?.tool_calls || [];
      console.log(`[uazapi-webhook] 🔧 TOOLS_REQUIRED: ${toolCalls.length} tool(s)`);

      const toolOutputs = [];
      for (const tc of toolCalls) {
        const fnName = tc.function?.name;
        let args: Record<string, any> = {};
        try { args = JSON.parse(tc.function?.arguments || '{}'); } catch {}
        console.log(`[uazapi-webhook] 🔧 TOOL_CALL: ${fnName} args=${JSON.stringify(args).substring(0, 200)}`);
        
        const result = await executeToolCall(supabase, storeId, fnName, args, phoneNumber);
        console.log(`[uazapi-webhook] 🔧 TOOL_RESULT: ${fnName} = ${JSON.stringify(result).substring(0, 300)}`);

        // Se o resultado for send_location, enviar localização imediatamente via API
        if (result?.status === 'send_location' && result.latitude && result.longitude) {
          console.log(`[uazapi-webhook] 📍 SEND_LOCATION: Enviando localização ${result.latitude}, ${result.longitude}`);
          await sendBotLocation(supabase, instance, storeId, phoneNumber, normalizedJid, result.latitude, result.longitude, result.name || '', result.address || '');
        }

        // Coletar imagens dos produtos encontrados
        if ((fnName === 'search_products' || fnName === 'check_stock') && result?.status === 'success') {
          const items = result.results || [];
          for (const item of items) {
            const imgUrl = item.imagem || item.image_url;
            if (imgUrl) {
              productImages.push({
                name: item.nome || item.name || '',
                price: item.preco || `R$ ${Number(item.price || 0).toFixed(2)}`,
                promoPrice: item.preco_promocional || null,
                imageUrl: imgUrl,
                slug: item.slug,
                stockLabel: item.estoque || item.status_estoque,
              });
            }
          }
          console.log(`[uazapi-webhook] 📸 ${productImages.length} imagem(ns) de produtos coletadas`);
        }
        
        toolOutputs.push({ tool_call_id: tc.id, output: JSON.stringify(result) });
      }

      console.log(`[uazapi-webhook] 🔧 TOOLS_SUBMIT: ${toolOutputs.length} output(s)`);
      const submitResp = await fetch(
        `https://api.openai.com/v1/threads/${threadId}/runs/${runId}/submit_tool_outputs`,
        { method: 'POST', headers, body: JSON.stringify({ tool_outputs: toolOutputs }) }
      );
      
      if (submitResp.ok) {
        run = await submitResp.json();
        console.log(`[uazapi-webhook] ✅ Tool outputs submetidos. Status: ${run.status}`);
        continue;
      } else {
        console.error(`[uazapi-webhook] ❌ Erro submit tool outputs: ${(await submitResp.text()).substring(0, 200)}`);
        return;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    const checkResp = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, { method: 'GET', headers });
    if (checkResp.ok) run = await checkResp.json();
  }

  if (run.status !== 'completed') {
    console.error(`[uazapi-webhook] ❌ Run não completou. Status: ${run.status}`);
    return;
  }

  // Buscar resposta
  const msgsResp = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages?limit=5&order=desc`, { method: 'GET', headers });
  if (msgsResp.ok) {
    const msgsData = await msgsResp.json();
    const assistantMsgs = msgsData.data?.filter((m: any) => m.role === 'assistant') || [];
    if (assistantMsgs.length > 0) {
      let replyText = assistantMsgs[0].content?.filter((c: any) => c.type === 'text')?.map((c: any) => c.text?.value)?.join('\n') || '';
      
      if (replyText) {
        // Verificar se já respondemos esta mensagem (dedup final antes de enviar)
        const { data: convFinal } = await supabase
          .from('whatsapp_conversations').select('metadata')
          .eq('store_id', storeId).eq('remote_jid', normalizedJid).maybeSingle();
        const finalMeta = (convFinal?.metadata as any) || {};
        const lastBotReplyRunId = finalMeta?.last_bot_reply_run_id;
        if (lastBotReplyRunId === runId) {
          console.log(`[uazapi-webhook] ⏭️ DEDUP_REPLY: Run ${runId} já respondida. Ignorando envio.`);
          return;
        }
        // Marcar run como respondida ANTES de enviar para evitar race condition
        await supabase.from('whatsapp_conversations')
          .update({ metadata: { ...finalMeta, last_bot_reply_run_id: runId } })
          .eq('store_id', storeId).eq('remote_jid', normalizedJid);

        // Limpar URLs de imagem, links e listas de produtos do texto (serão enviados como mídia)
        if (productImages.length > 0) {
          replyText = replyText.replace(/!\?\[[^\]]*\]\([^)]+\)/g, '');
          replyText = replyText.replace(/https?:\/\/[^\s)]+\.(jpg|jpeg|png|webp|gif)[^\s)"]*/gi, '');
          replyText = replyText.replace(/^\s*\[?\s*Ver produto\s*\]?\s*$/gim, '');
          replyText = replyText.replace(/^\s*\d+\.\s*\*[^*\n]+\*\s*(?:-|–|—)\s*R\$\s*.*$/gm, '');
          replyText = replyText.replace(/^\s*[-•]\s*\*?[^*\n]+\*?\s*(?:-|–|—)\s*R\$\s*.*$/gm, '');
          replyText = replyText.replace(/^\s*[-•]?\s*\[.*?\]\(https?:\/\/[^)]+\)\s*$/gm, '');
          replyText = replyText.replace(/\(https?:\/\/mostralo[^)]+\)/g, '');
          replyText = replyText.replace(/https?:\/\/mostralo\.com\.br\/loja\/[^\s]+/g, '');
          replyText = replyText.replace(/^\s*[-•]\s*Preço:.*$/gm, '');
          replyText = replyText.replace(/^\s*[-•]\s*Estoque:.*$/gm, '');
          replyText = replyText.replace(/^\s*[-•]\s*\[Mais detalhes.*$/gm, '');
          replyText = replyText.replace(/\n{3,}/g, '\n\n').trim();

          const normalizedUserMessage = normalizeProductSearch(userMessage);
          // Detectar se o usuário está perguntando preço/valor — NÃO simplificar a resposta
          const isPriceQuestion = /\b(valor|preco|preço|quanto|custa|custo|quanto e|quanto que|qual o preco|qual o valor|quanto ta|quanto tá|quanto sai|quanto fica)\b/.test(normalizedUserMessage);
          const isAvailabilityQuestion = !isPriceQuestion && /\b(tem|disponivel|possui)\b/.test(normalizedUserMessage);
          
          // Só limpar lista de produtos se NÃO for pergunta de preço
          if (!isPriceQuestion) {
            const stillLooksLikeProductList =
              /(?:^|\n)\s*\d+\.\s+/.test(replyText) ||
              /\bR\$\s*\d/.test(replyText) ||
              /\bver produto\b/i.test(replyText);

            if (stillLooksLikeProductList) {
              replyText = '';
            }

            if (isAvailabilityQuestion && (!replyText || replyText.length > 90 || /confira abaixo|algumas opções|opções disponíveis/i.test(replyText))) {
              replyText = 'Temos sim! 😊';
            }
          }

          if (!replyText.trim()) {
            replyText = isPriceQuestion ? 'Aqui estão os valores 😊' : 'Encontrei algumas opções para você 😊';
          }
        }
        
        console.log(`[uazapi-webhook] 💬 Resposta assistant: "${replyText.substring(0, 100)}..."`);
        
        // Enviar texto principal primeiro (se houver conteúdo útil além dos produtos)
        if (replyText.trim()) {
          await sendBotReply(supabase, instance, storeId, phoneNumber, normalizedJid, replyText);
        }
        
        // Enviar cada produto como imagem separada com legenda
        if (productImages.length > 0) {
          // Buscar configurações: never_send_links + max_products_per_response
          let neverSendLinks = false;
          let maxProductsPerResponse = 0; // 0 = sem limite
          
          try {
            const { data: convSettings } = await supabase
              .from('store_bot_conversational_settings')
              .select('never_send_links')
              .eq('store_id', storeId)
              .maybeSingle();
            neverSendLinks = convSettings?.never_send_links !== false;
          } catch {}
          
          try {
            const { data: storeRow } = await supabase.from('stores').select('niche_id').eq('id', storeId).single();
            if (storeRow?.niche_id) {
              const { data: nicheConfigs } = await supabase
                .from('niche_ai_configs')
                .select('max_products_per_response')
                .eq('niche_id', storeRow.niche_id)
                .eq('is_active', true)
                .limit(1);
              if (nicheConfigs?.[0]?.max_products_per_response) {
                maxProductsPerResponse = nicheConfigs[0].max_products_per_response;
              }
            }
          } catch {}
          
          // Aplicar limite de produtos
          const productsToSend = maxProductsPerResponse > 0 
            ? productImages.slice(0, maxProductsPerResponse) 
            : productImages;
          
          console.log(`[uazapi-webhook] 📸 Enviando ${productsToSend.length}/${productImages.length} imagem(ns) (max=${maxProductsPerResponse || 'ilimitado'}, neverSendLinks=${neverSendLinks})`);
          
          // Buscar dados da loja para montar link (só se links permitidos)
          let storeSlug = '';
          if (!neverSendLinks) {
            const { data: storeData } = await supabase.from('stores').select('slug').eq('id', storeId).single();
            storeSlug = storeData?.slug || '';
          }
          
          for (const product of productsToSend) {
            try {
              const priceText = product.promoPrice 
                ? `~${product.price}~ ${product.promoPrice}` 
                : product.price;
              
              let caption = `*${product.name}*\n💰 ${priceText}`;
              // Só adiciona link se never_send_links = false
              if (!neverSendLinks && product.slug && storeSlug) {
                caption += `\n🔗 https://mostralo.com.br/loja/${storeSlug}/produto/${product.slug}`;
              }
              
              await sendBotMedia(supabase, instance, storeId, phoneNumber, normalizedJid, product.imageUrl, caption);
              await new Promise(resolve => setTimeout(resolve, 800));
            } catch (imgErr) {
              console.error(`[uazapi-webhook] ❌ Erro ao enviar imagem ${product.name}:`, imgErr);
            }
          }
        }
      }
    }
  }
}

// ========================================
// EXECUTAR TOOL CALL
// ========================================
const PRODUCT_SEARCH_STOP_WORDS = new Set([
  'a', 'o', 'as', 'os', 'um', 'uma', 'uns', 'umas', 'de', 'da', 'do', 'das', 'dos',
  'e', 'em', 'no', 'na', 'nos', 'nas', 'para', 'por', 'com', 'sem', 'que', 'tem',
  'tenho', 'ter', 'quero', 'preciso', 'gostaria', 'saber', 'se', 'tem?', 'temos',
  'vocês', 'voces', 'ai', 'aí', 'qual', 'quais', 'me', 'mostrar', 'procura', 'procurar'
]);

function normalizeProductSearch(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildProductSearchCandidates(input: string): string[] {
  const normalized = normalizeProductSearch(input);
  if (!normalized) return [];

  const words = normalized.split(' ').filter(Boolean);
  const meaningfulWords = words.filter(
    (word) => word.length > 2 && !PRODUCT_SEARCH_STOP_WORDS.has(word)
  );

  const candidates = [
    normalized,
    meaningfulWords.join(' '),
    meaningfulWords.slice(0, 3).join(' '),
    ...meaningfulWords,
  ].filter((value) => value && value.length >= 2);

  return [...new Set(candidates)];
}

function getProductSalePrice(product: Record<string, any>): number | null {
  return product.offer_price ?? null;
}

function getProductStockLabel(product: Record<string, any>): string {
  if (!product.is_available) return 'indisponível';
  if (product.track_stock === false || product.stock_quantity === null) {
    return 'disponível (estoque não controlado)';
  }
  if (product.stock_quantity > 0) {
    return `${product.stock_quantity} unidade(s) em estoque`;
  }
  return 'sem estoque';
}

async function searchStoreProducts(
  supabase: any,
  storeId: string,
  rawQuery: string,
  limit = 5,
  onlyAvailable = false
) {
  const candidates = buildProductSearchCandidates(rawQuery);
  const uniqueProducts = new Map<string, any>();

  for (const candidate of candidates) {
    let query = supabase
      .from('products')
      .select('id, name, price, offer_price, description, slug, is_available, track_stock, stock_quantity, image_url')
      .eq('store_id', storeId);

    if (onlyAvailable) {
      query = query.eq('is_available', true);
    }

    const { data: products, error } = await query
      .or(`name.ilike.%${candidate}%,description.ilike.%${candidate}%`)
      .limit(limit);

    if (error) {
      console.error(`[uazapi-webhook] ❌ Erro searchStoreProducts (${candidate}):`, error.message);
      continue;
    }

    for (const product of products || []) {
      uniqueProducts.set(product.id, product);
      if (uniqueProducts.size >= limit) {
        return { products: Array.from(uniqueProducts.values()).slice(0, limit), candidates };
      }
    }
  }

  return { products: Array.from(uniqueProducts.values()).slice(0, limit), candidates };
}

async function executeToolCall(supabase: any, storeId: string, fnName: string, args: Record<string, any>, customerPhone?: string): Promise<any> {
  switch (fnName) {
    case 'search_products': {
      const rawQuery = args.query || args.produto || args.busca || '';
      const limit = Number(args.limit || 5);
      const { products, candidates } = await searchStoreProducts(supabase, storeId, rawQuery, limit, true);
      console.log(`[uazapi-webhook] 🔎 search_products query="${rawQuery}" candidates=${JSON.stringify(candidates)}`);

      if (!products.length) {
        return {
          status: 'not_found',
          message: `Nenhum produto encontrado para "${rawQuery}"`,
          results: [],
        };
      }

      return {
        status: 'success',
        quantidade_encontrada: products.length,
        results: products.map((p: any) => ({
          nome: p.name,
          preco: `R$ ${Number(p.price || 0).toFixed(2)}`,
          preco_promocional: getProductSalePrice(p) ? `R$ ${Number(getProductSalePrice(p)).toFixed(2)}` : null,
          descricao: p.description?.substring(0, 100) || null,
          slug: p.slug,
          disponivel: p.is_available,
          estoque: getProductStockLabel(p),
          imagem: p.image_url,
        })),
      };
    }
    case 'check_stock': {
      const rawQuery = args.product_name || args.produto || args.nome || args.query || '';
      const { products, candidates } = await searchStoreProducts(supabase, storeId, rawQuery, 5, false);
      console.log(`[uazapi-webhook] 📦 check_stock query="${rawQuery}" candidates=${JSON.stringify(candidates)}`);

      if (!products.length) {
        return {
          status: 'not_found',
          disponivel: false,
          message: `Nenhum produto encontrado com "${rawQuery}"`,
        };
      }

      return {
        status: 'success',
        results: products.map((p: any) => ({
          nome: p.name,
          disponivel: p.is_available && (p.track_stock === false || p.stock_quantity === null || p.stock_quantity > 0),
          estoque: p.stock_quantity,
          status_estoque: getProductStockLabel(p),
          preco: `R$ ${Number(p.price || 0).toFixed(2)}`,
          preco_promocional: getProductSalePrice(p) ? `R$ ${Number(getProductSalePrice(p)).toFixed(2)}` : null,
          slug: p.slug,
          imagem: p.image_url,
        })),
      };
    }
    case 'get_product_details': {
      const { data: product } = await supabase
        .from('products').select('name, price, offer_price, description, slug, is_available, track_stock, stock_quantity, image_url')
        .eq('store_id', storeId).eq('slug', args.slug || '').maybeSingle();
      if (!product) return { status: 'not_found', message: 'Produto não encontrado' };
      return {
        status: 'success',
        ...product,
        preco_promocional: getProductSalePrice(product),
        status_estoque: getProductStockLabel(product),
      };
    }
    case 'list_categories': {
      const { data: cats } = await supabase
        .from('categories').select('name, description').eq('store_id', storeId).eq('is_active', true).order('display_order');
      return { status: 'success', categorias: cats || [] };
    }
    case 'get_promotions': {
      const { data: promos } = await supabase
        .from('products').select('name, price, offer_price, slug, image_url')
        .eq('store_id', storeId).eq('is_available', true)
        .not('offer_price', 'is', null).gt('offer_price', 0).limit(args.limit || 5);
      return {
        status: 'success',
        promocoes: (promos || []).map((p: any) => ({
          ...p,
          preco_promocional: p.offer_price,
        })),
      };
    }
    case 'get_recommendations': {
      const { data: recs } = await supabase
        .from('products').select('name, price, description, slug, image_url')
        .eq('store_id', storeId).eq('is_available', true).order('total_orders', { ascending: false }).limit(args.limit || 5);
      return { status: 'success', recomendacoes: recs || [] };
    }
    case 'get_store_info': {
      const { data: store } = await supabase
        .from('stores').select('name, description, address, whatsapp, business_hours, delivery_fee, min_order_value, google_maps_link')
        .eq('id', storeId).single();
      if (!store) return { status: 'error', message: 'Loja não encontrada' };
      return { status: 'success', ...store };
    }
    case 'check_store_status': {
      const { data: store } = await supabase.from('stores').select('is_open, business_hours, timezone').eq('id', storeId).single();
      return { status: 'success', aberta: store?.is_open ?? true, horario_funcionamento: store?.business_hours };
    }
    case 'get_last_delivery_info': {
      const phone = (args.customer_phone || customerPhone || '').replace(/\D/g, '');
      const variants = [phone];
      if (phone.startsWith('55')) variants.push(phone.substring(2));
      else variants.push('55' + phone);
      const { data: customer } = await supabase.from('customers').select('name, address').in('phone', variants).limit(1).maybeSingle();
      if (!customer) return { status: 'not_found', message: 'Cliente não encontrado' };
      return { status: 'success', nome: customer.name, endereco: customer.address };
    }
    case 'calculate_delivery_fee': {
      const { data: store } = await supabase.from('stores').select('delivery_fee').eq('id', storeId).single();
      return { status: 'success', taxa_entrega: store?.delivery_fee || 0 };
    }
    case 'send_location': {
      // Enviar localização da loja via WhatsApp
      const { data: store } = await supabase
        .from('stores')
        .select('name, address, google_maps_link, latitude, longitude')
        .eq('id', storeId)
        .single();
      
      if (!store) return { status: 'error', message: 'Loja não encontrada' };
      
      // Tentar extrair coordenadas do google_maps_link se não tiver lat/lng diretos
      let lat = store.latitude || args.latitude;
      let lng = store.longitude || args.longitude;
      
      if ((!lat || !lng) && store.google_maps_link) {
        // Tentar extrair coordenadas do link do Google Maps
        const coordMatch = store.google_maps_link.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (coordMatch) {
          lat = parseFloat(coordMatch[1]);
          lng = parseFloat(coordMatch[2]);
        }
        const queryMatch = store.google_maps_link.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (!lat && queryMatch) {
          lat = parseFloat(queryMatch[1]);
          lng = parseFloat(queryMatch[2]);
        }
      }
      
      if (!lat || !lng) {
        return { status: 'error', message: 'Coordenadas da loja não disponíveis. Compartilhe o endereço por texto.' };
      }
      
      // Enviar localização via UaZapi
      return {
        status: 'send_location',
        latitude: lat,
        longitude: lng,
        name: store.name || 'Nossa loja',
        address: store.address || '',
        google_maps_link: store.google_maps_link || '',
      };
    }
    default:
      return { status: 'error', message: `Função "${fnName}" não reconhecida` };
  }
}

// ========================================
// ENVIAR RESPOSTA DO BOT VIA UAZAPI
// ========================================
async function sendBotReply(supabase: any, instance: any, storeId: string, phoneNumber: string, normalizedJid: string, text: string) {
  console.log(`[uazapi-webhook] 📤 SEND_BOT_REPLY: Enviando texto para ${phoneNumber} | tamanho=${text.length} | preview="${text.substring(0, 80)}..."`);
  console.log(`[uazapi-webhook] 📤 SEND_BOT_REPLY_STACK: ${new Error().stack?.split('\n').slice(1, 4).join(' <- ')}`);
  try {
    const { data: instData } = await supabase.from('whatsapp_instances').select('api_token').eq('id', instance.id).single();
    const { data: uazapiConfig } = await supabase.from('uazapi_config').select('api_url').limit(1).maybeSingle();
    const token = instData?.api_token;
    const serverUrl = uazapiConfig?.api_url?.replace(/\/+$/, '');
    if (!token || !serverUrl) { console.error(`[uazapi-webhook] ❌ Token/URL não encontrados`); return; }

    console.log(`[uazapi-webhook] 📤 SEND_BOT_REPLY_API: POST ${serverUrl}/send/text para ${phoneNumber}`);
    const sendResp = await fetch(`${serverUrl}/send/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'token': token },
      body: JSON.stringify({ number: phoneNumber, text }),
    });

    if (sendResp.ok) {
      const sendData = await sendResp.json();
      const sentMsgId = sendData.key?.id || sendData.messageId || sendData.id || `bot_${Date.now()}`;
      await supabase.from('whatsapp_chat_messages').insert({
        store_id: storeId, remote_jid: normalizedJid, phone_number: phoneNumber,
        direction: 'outgoing', content: text, message_type: 'text',
        evolution_message_id: sentMsgId, is_from_bot: true, is_read_by_attendant: true,
        message_source: 'system', timestamp: new Date().toISOString(),
      });
      await supabase.from('whatsapp_conversations').update({
        last_message: text.slice(0, 200), last_message_at: new Date().toISOString(),
        last_message_direction: 'outgoing', last_message_source: 'system',
      }).eq('store_id', storeId).eq('remote_jid', normalizedJid);
      console.log(`[uazapi-webhook] ✅ Bot reply enviada: "${text.substring(0, 80)}..."`);
    } else {
      const errText = await sendResp.text();
      console.error(`[uazapi-webhook] ❌ Erro enviar: ${sendResp.status}: ${errText.substring(0, 200)}`);
    }
  } catch (err) { console.error(`[uazapi-webhook] ❌ Erro sendBotReply:`, err); }
}

// Enviar localização via bot
async function sendBotLocation(supabase: any, instance: any, storeId: string, phoneNumber: string, normalizedJid: string, latitude: number, longitude: number, name: string, address: string) {
  console.log(`[uazapi-webhook] 📤 SEND_BOT_LOCATION: ${latitude}, ${longitude} para ${phoneNumber}`);
  try {
    const { data: instData } = await supabase.from('whatsapp_instances').select('api_token').eq('id', instance.id).single();
    const { data: uazapiConfig } = await supabase.from('uazapi_config').select('api_url').limit(1).maybeSingle();
    const token = instData?.api_token;
    const serverUrl = uazapiConfig?.api_url?.replace(/\/+$/, '');
    if (!token || !serverUrl) { console.error(`[uazapi-webhook] ❌ Token/URL não encontrados para localização`); return; }

    const sendResp = await fetch(`${serverUrl}/send/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'token': token },
      body: JSON.stringify({ number: phoneNumber, latitude, longitude, name, address }),
    });

    if (sendResp.ok) {
      const sendData = await sendResp.json();
      const sentMsgId = sendData.messageid || sendData.id || `bot_loc_${Date.now()}`;
      const locationContent = `📍 ${name || 'Localização'}: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}${address ? ` - ${address}` : ''}`;
      await supabase.from('whatsapp_chat_messages').insert({
        store_id: storeId, remote_jid: normalizedJid, phone_number: phoneNumber,
        direction: 'outgoing', content: locationContent, message_type: 'location',
        evolution_message_id: sentMsgId, is_from_bot: true, is_read_by_attendant: true,
        message_source: 'system', timestamp: new Date().toISOString(),
        metadata: { latitude, longitude, location_name: name, location_address: address },
      });
      await supabase.from('whatsapp_conversations').update({
        last_message: '📍 Localização', last_message_at: new Date().toISOString(),
        last_message_direction: 'outgoing', last_message_source: 'system',
      }).eq('store_id', storeId).eq('remote_jid', normalizedJid);
      console.log(`[uazapi-webhook] ✅ Bot localização enviada: ${name}`);
    } else {
      const errText = await sendResp.text();
      console.error(`[uazapi-webhook] ❌ Erro enviar localização: ${sendResp.status}: ${errText.substring(0, 200)}`);
    }
  } catch (err) { console.error(`[uazapi-webhook] ❌ Erro sendBotLocation:`, err); }
}


async function sendBotMedia(supabase: any, instance: any, storeId: string, phoneNumber: string, normalizedJid: string, imageUrl: string, caption: string) {
  console.log(`[uazapi-webhook] 📤 SEND_BOT_MEDIA: Enviando imagem para ${phoneNumber} | caption="${caption.substring(0, 60)}..." | url=${imageUrl.substring(0, 80)}`);
  try {
    const { data: instData } = await supabase.from('whatsapp_instances').select('api_token').eq('id', instance.id).single();
    const { data: uazapiConfig } = await supabase.from('uazapi_config').select('api_url').limit(1).maybeSingle();
    const token = instData?.api_token;
    const serverUrl = uazapiConfig?.api_url?.replace(/\/+$/, '');
    if (!token || !serverUrl) { console.error(`[uazapi-webhook] ❌ Token/URL não encontrados para mídia`); return; }

    const sendResp = await fetch(`${serverUrl}/send/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'token': token },
      body: JSON.stringify({ number: phoneNumber, type: 'image', file: imageUrl, text: caption }),
    });

    if (sendResp.ok) {
      const sendData = await sendResp.json();
      const sentMsgId = sendData.key?.id || sendData.messageId || sendData.id || `bot_media_${Date.now()}`;
      await supabase.from('whatsapp_chat_messages').insert({
        store_id: storeId, remote_jid: normalizedJid, phone_number: phoneNumber,
        direction: 'outgoing', content: caption, message_type: 'image',
        media_url: imageUrl, evolution_message_id: sentMsgId,
        is_from_bot: true, is_read_by_attendant: true,
        message_source: 'system', timestamp: new Date().toISOString(),
      });
      console.log(`[uazapi-webhook] ✅ Bot mídia enviada: ${caption.substring(0, 50)}...`);
    } else {
      const errText = await sendResp.text();
      console.error(`[uazapi-webhook] ❌ Erro enviar mídia: ${sendResp.status}: ${errText.substring(0, 200)}`);
    }
  } catch (err) { console.error(`[uazapi-webhook] ❌ Erro sendBotMedia:`, err); }
}

async function sendUaZapiPresence(supabase: any, instance: any, phoneNumber: string, presence: string, delay?: number) {
  try {
    const { data: instData } = await supabase.from('whatsapp_instances').select('api_token').eq('id', instance.id).single();
    const { data: uazapiConfig } = await supabase.from('uazapi_config').select('api_url').limit(1).maybeSingle();
    const token = instData?.api_token;
    const serverUrl = uazapiConfig?.api_url?.replace(/\/+$/, '');
    if (!token || !serverUrl) return;
    const body: any = { number: phoneNumber, presence };
    if (delay) body.delay = delay;
    console.log(`[uazapi-webhook] ⌨️ Presença: ${presence} para ${phoneNumber} (delay: ${delay || 'padrão'})`);
    await fetch(`${serverUrl}/message/presence`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'token': token },
      body: JSON.stringify(body),
    });
  } catch (err) { console.error(`[uazapi-webhook] ❌ Erro presença:`, err); }
}
