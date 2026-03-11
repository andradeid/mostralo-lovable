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

        // Verificar se é uma reação dentro do evento messages
        const uaMsgTypeLower = (messageType || '').toLowerCase();
        if (uaMsgTypeLower === 'reactionmessage' || uaMsgTypeLower === 'reaction') {
          const reactionContent = msg.content || {};
          
          // Debug: logar estrutura completa para descobrir onde está o ID da msg alvo
          console.log(`[uazapi-webhook] 🔍 Reaction msg keys: ${JSON.stringify(Object.keys(msg))}`);
          console.log(`[uazapi-webhook] 🔍 Reaction msg.content: ${JSON.stringify(reactionContent).substring(0, 500)}`);
          console.log(`[uazapi-webhook] 🔍 Reaction full msg: ${JSON.stringify(msg).substring(0, 800)}`);
          
          // Tentar múltiplos caminhos para encontrar o ID da mensagem alvo
          const targetMsgId = reactionContent.key?.id 
            || reactionContent.id
            || msg.reactionId
            || msg.reaction_id
            || msg.quoted_message_id
            || msg.quotedMsgId
            || '';
          const reactionEmojiText = reactionContent.text || msg.text || '';
          const reactionPhoneNum = (msg.chatid || msg.sender_pn || '')
            .replace('@s.whatsapp.net', '').replace('@c.us', '').replace(/\D/g, '');

          console.log(`[uazapi-webhook] 😀 Reação via messages: emoji="${reactionEmojiText}" targetId=${targetMsgId} fromMe=${fromMe}`);

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
                  const rFiltered = rExisting.filter(
                    (r: any) => !(r.from === reactionPhoneNum || (fromMe && r.from_me))
                  );
                  await supabase.from('whatsapp_chat_messages')
                    .update({ reactions: rFiltered }).eq('id', rTargetMsg.id);
                  console.log(`[uazapi-webhook] ✅ Reação removida: ${targetMsgId}`);
                } else {
                  const rFiltered = rExisting.filter(
                    (r: any) => !(r.from === reactionPhoneNum || (fromMe && r.from_me))
                  );
                  const rNew = [...rFiltered, { emoji: reactionEmojiText, from: reactionPhoneNum, from_me: fromMe }];
                  await supabase.from('whatsapp_chat_messages')
                    .update({ reactions: rNew }).eq('id', rTargetMsg.id);
                  console.log(`[uazapi-webhook] ✅ Reação ${reactionEmojiText} salva: ${targetMsgId}`);
                }
              }
            }
          }
          await logWebhook(supabase, instanceName, 'success', payload, 'messages_reaction');
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
        let instance = await findInstance(supabase, instanceName, ownerPhone, payloadToken);
        if (!instance) {
          const normalizedInstanceName = instanceName === 'minha-instancia' && ownerPhone
            ? ownerPhone.replace(/\D/g, '')
            : instanceName;

          if (normalizedInstanceName !== instanceName) {
            console.log(`[uazapi-webhook] 🔁 Tentando fallback por owner como nome da instância: ${normalizedInstanceName}`);
            instance = await findInstance(supabase, normalizedInstanceName, ownerPhone, payloadToken);
          }
        }

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
        // UaZapi pode fornecer URL em múltiplos campos
        // msg.fileURL = URL desencriptada/processada pela UaZapi (preferível)
        // content.URL = URL do WhatsApp CDN (pode estar encriptada .enc)
        // content.directPath, content.url = alternativas
        const contentUrl = typeof content === 'object' ? (content.URL || content.url || content.directPath) : null;
        let mediaUrl = msg.fileURL || contentUrl || null;
        const mediaFilename = (typeof content === 'object' ? content.fileName : null) || null;
        const mediaMimetype = (typeof content === 'object' ? content.mimetype : null) || null;

        // Log detalhado de todas as URLs disponíveis para debug
        console.log(`[uazapi-webhook] 🔗 Mídia: msg.fileURL=${msg.fileURL?.substring(0, 80)}, content.URL=${contentUrl?.substring(0, 80)}, tipo=${incomingType}, mimetype=${mediaMimetype}`);
        if (incomingType !== 'text') {
          console.log(`[uazapi-webhook] 🔍 Mídia keys msg: ${Object.keys(msg).filter(k => k.toLowerCase().includes('file') || k.toLowerCase().includes('url') || k.toLowerCase().includes('media')).join(', ')}`);
          console.log(`[uazapi-webhook] 🔍 Mídia keys content: ${typeof content === 'object' ? Object.keys(content).join(', ') : 'not-object'}`);
        }

        // Normalizar o remoteJid para ter o formato correto
        const normalizedJid = remoteJid.includes('@') ? remoteJid : `${phoneNumber}@s.whatsapp.net`;

        // Deduplicação ANTES de qualquer processamento pesado
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

        // 🔒 MUTEX: Verificar se já há processamento de bot em andamento para esta conversa
        // Isso previne respostas duplicadas quando UaZapi envia o webhook 2x simultaneamente
        const mutexKey = `${storeId}:${normalizedJid}`;
        let botMutexAcquired = false;
        if (!fromMe && messageId) {
          const { data: convMutex } = await supabase
            .from('whatsapp_conversations')
            .select('id, metadata')
            .eq('store_id', storeId)
            .eq('remote_jid', normalizedJid)
            .maybeSingle();
          
          if (convMutex) {
            const meta = convMutex.metadata as any || {};
            const lastProcessedMsgId = meta?.bot_processing_message_id;
            const lastProcessedAt = meta?.bot_processing_at ? new Date(meta.bot_processing_at).getTime() : 0;
            const now = Date.now();
            
            if (lastProcessedMsgId === messageId && (now - lastProcessedAt) < 120000) {
              console.log(`[uazapi-webhook] 🔒 MUTEX: Msg ${messageId} já está sendo processada pelo bot (há ${Math.round((now - lastProcessedAt)/1000)}s). Ignorando bot.`);
              // Continua para salvar a mensagem, mas NÃO processa o bot
              botMutexAcquired = false;
            } else {
              // Adquirir mutex: marcar que estamos processando esta mensagem
              await supabase.from('whatsapp_conversations')
                .update({ 
                  metadata: { ...meta, bot_processing_message_id: messageId, bot_processing_at: new Date().toISOString() } 
                })
                .eq('id', convMutex.id);
              botMutexAcquired = true;
              console.log(`[uazapi-webhook] 🔓 MUTEX adquirido para msg ${messageId}`);
            }
          } else {
            // Conversa nova, mutex será criado junto
            botMutexAcquired = true;
            console.log(`[uazapi-webhook] 🔓 MUTEX: Conversa nova, processamento liberado`);
          }
        }

        // Para mídias: usar /message/download da UaZapi para obter arquivo processado
        let audioTranscription: string | null = null;
        const mediaTypes = ['audio', 'image', 'video', 'sticker', 'document'];
        
        if (mediaTypes.includes(incomingType) && messageId) {
          try {
            // Buscar token da instância e api_url da UaZapi
            const { data: instData } = await supabase
              .from('whatsapp_instances')
              .select('api_token')
              .eq('id', instance.id)
              .single();
            
            const { data: uazapiConfig } = await supabase
              .from('uazapi_config')
              .select('api_url')
              .limit(1)
              .maybeSingle();
            
            const instToken = instData?.api_token;
            const serverUrl = uazapiConfig?.api_url;
            
            if (instToken && serverUrl) {
              const cleanServerUrl = serverUrl.replace(/\/+$/, '');
              console.log(`[uazapi-webhook] 📥 Chamando /message/download: tipo=${incomingType}, id=${messageId}`);
              
              const downloadBody: any = {
                id: messageId,
                return_link: true,
              };
              
              // Para áudio: gerar MP3 e transcrever
              if (incomingType === 'audio') {
                downloadBody.generate_mp3 = true;
                downloadBody.transcribe = true;
              }
              
              const downloadResp = await fetch(`${cleanServerUrl}/message/download`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'token': instToken,
                },
                body: JSON.stringify(downloadBody),
              });
              
              if (downloadResp.ok) {
                const downloadData = await downloadResp.json();
                console.log(`[uazapi-webhook] ✅ Download response keys: ${Object.keys(downloadData).join(', ')}`);
                
                const fileUrl = downloadData.fileURL || downloadData.url;
                if (fileUrl) {
                  // Baixar e persistir no Storage
                  const fileResponse = await fetch(fileUrl);
                  if (fileResponse.ok) {
                    const fileBuffer = await fileResponse.arrayBuffer();
                    const fileBytes = new Uint8Array(fileBuffer);
                    
                    const extMap: Record<string, string> = { audio: 'mp3', image: 'jpg', video: 'mp4', sticker: 'webp', document: 'pdf' };
                    const mimeMap: Record<string, string> = { audio: 'audio/mpeg', image: 'image/jpeg', video: 'video/mp4', sticker: 'image/webp', document: 'application/pdf' };
                    // Para documentos: usar extensão e mimetype do payload original se disponível
                    const docFileName = mediaFilename || '';
                    const docExt = docFileName.includes('.') ? docFileName.split('.').pop()!.toLowerCase() : null;
                    const ext = (incomingType === 'document' && docExt) ? docExt : (extMap[incomingType] || 'bin');
                    const docMime = mediaMimetype || downloadData.mimetype || null;
                    const mime = docMime || mimeMap[incomingType] || 'application/octet-stream';
                    const storagePath = `${storeId}/${phoneNumber}/${Date.now()}_${messageId}.${ext}`;
                    
                    const { error: uploadError } = await supabase.storage
                      .from('whatsapp-chat-media')
                      .upload(storagePath, fileBytes, {
                        contentType: mime.split(';')[0].trim(),
                        upsert: false,
                      });
                    
                    if (!uploadError) {
                      const { data: publicUrlData } = supabase.storage
                        .from('whatsapp-chat-media')
                        .getPublicUrl(storagePath);
                      mediaUrl = publicUrlData.publicUrl;
                      console.log(`[uazapi-webhook] ✅ Mídia persistida: ${mediaUrl.substring(0, 80)}`);
                    } else {
                      console.error(`[uazapi-webhook] ⚠️ Erro upload:`, uploadError.message);
                    }
                  } else {
                    console.error(`[uazapi-webhook] ❌ Erro ao baixar arquivo: ${fileResponse.status}`);
                    await fileResponse.text(); // consume body
                  }
                }
                
                // Transcrição retornada pela UaZapi
                if (downloadData.transcription) {
                  audioTranscription = downloadData.transcription;
                  console.log(`[uazapi-webhook] ✅ Transcrição UaZapi: "${audioTranscription?.slice(0, 100)}"`);
                }
              } else {
                const errText = await downloadResp.text();
                console.error(`[uazapi-webhook] ❌ Download error ${downloadResp.status}: ${errText.substring(0, 200)}`);
              }
            } else {
              console.warn(`[uazapi-webhook] ⚠️ Token ou api_url não encontrados para download`);
            }
            
            // Fallback: transcrever via Whisper se UaZapi não retornou transcrição
            if (incomingType === 'audio' && !audioTranscription && mediaUrl) {
              const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
              if (OPENAI_API_KEY) {
                try {
                  console.log(`[uazapi-webhook] 🎤 Fallback: transcrevendo via Whisper...`);
                  const audioResp = await fetch(mediaUrl);
                  if (audioResp.ok) {
                    const audioBytes = new Uint8Array(await audioResp.arrayBuffer());
                    const audioBlob = new Blob([audioBytes], { type: 'audio/mpeg' });
                    const formData = new FormData();
                    formData.append('file', audioBlob, 'audio.mp3');
                    formData.append('model', 'whisper-1');
                    formData.append('language', 'pt');
                    formData.append('response_format', 'text');
                    
                    const whisperResp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
                      body: formData,
                    });
                    
                    if (whisperResp.ok) {
                      audioTranscription = (await whisperResp.text()).trim();
                      console.log(`[uazapi-webhook] ✅ Transcrição Whisper: "${audioTranscription?.slice(0, 100)}"`);
                    } else {
                      const wErr = await whisperResp.text();
                      console.error(`[uazapi-webhook] ❌ Whisper error ${whisperResp.status}: ${wErr.substring(0, 200)}`);
                    }
                  } else {
                    await audioResp.text();
                  }
                } catch (whisperErr) {
                  console.error(`[uazapi-webhook] ❌ Erro transcrição Whisper:`, whisperErr);
                }
              }
            }
          } catch (dlErr) {
            console.error(`[uazapi-webhook] ❌ Erro download mídia:`, dlErr);
          }
        }

        // Extrair informações de citação/resposta
        let quotedMessageDbId: string | null = null;
        let quotedContentData: any = null;
        const contextInfo = typeof content === 'object' ? content.contextInfo : null;

        if (contextInfo?.quotedMessage || msg.quoted) {
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
          
          if (!quotedText && msg.quoted && typeof msg.quoted === 'string') {
            const looksLikeId = /^[0-9A-F]{20,}$/i.test(msg.quoted);
            if (!looksLikeId) {
              quotedText = msg.quoted;
            }
          }
          
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
              if (!quotedContentData.content && quotedDbMsg.content) {
                quotedContentData.content = quotedDbMsg.content;
              }
            }
          }
        }

        // Construir metadata com transcrição
        const messageMetadata: Record<string, any> = {};
        if (audioTranscription) {
          messageMetadata.transcription = audioTranscription;
        }

        // Determinar origem da mensagem
        let messageSource = 'unknown';
        if (!fromMe) {
          messageSource = 'client';
        } else {
          messageSource = 'cellphone';
          console.log(`[uazapi-webhook] 📱 Mensagem enviada pelo CELULAR (ID: ${messageId})`);
          
          // Pausar bot quando atendente responde pelo celular
          const { data: pauseConv } = await supabase
            .from('whatsapp_conversations')
            .select('id, is_bot_active')
            .eq('store_id', storeId)
            .eq('remote_jid', normalizedJid)
            .maybeSingle();
          
          if (pauseConv?.is_bot_active) {
            await supabase.from('whatsapp_conversations')
              .update({ is_bot_active: false })
              .eq('id', pauseConv.id);
            console.log(`[uazapi-webhook] ⏸️ Bot pausado (resposta manual celular) para ${normalizedJid}`);
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
          message_source: messageSource,
        content: incomingType === 'audio' ? '🎵 Áudio'
            : incomingType === 'location' ? (() => {
                const loc = typeof content === 'object' ? content : {};
                const lat = loc.latitude || loc.degreesLatitude;
                const lng = loc.longitude || loc.degreesLongitude;
                const locName = loc.name || '';
                const locAddr = loc.address || '';
                if (lat && lng) {
                  const parts = [`📍 Localização: ${lat}, ${lng}`];
                  if (locName) parts.push(locName);
                  if (locAddr) parts.push(locAddr);
                  return parts.join('\n');
                }
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

        const mediaLabel = incomingType === 'audio' ? '🎵 Áudio'
          : incomingType === 'image' ? '📷 Imagem'
          : incomingType === 'video' ? '🎥 Vídeo'
          : incomingType === 'document' ? '📄 Documento'
          : incomingType === 'sticker' ? '🏷️ Figurinha'
          : incomingType === 'ptt' ? '🎤 Áudio'
          : incomingType === 'location' ? '📍 Localização'
          : '[mídia]';
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
            last_message_source: messageSource,
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

        // ========================================
        // PROCESSAMENTO DO BOT IA (UaZapi)
        // ========================================
        if (!fromMe && botMutexAcquired) {
          const isBotActive = existingConv?.is_bot_active !== false; // default true para novas conversas
          console.log(`[uazapi-webhook] 🤖 Bot check: fromMe=${fromMe}, mutexAcquired=${botMutexAcquired}, isBotActive=${isBotActive}, msgId=${messageId}`);
          
          if (isBotActive) {
            try {
              // Buscar config do bot E a chave OpenAI da loja em paralelo
              const [botConfigRes, storeKeyRes] = await Promise.all([
                supabase.from('store_bot_config').select('*').eq('store_id', storeId).maybeSingle(),
                supabase.from('stores').select('openai_api_key').eq('id', storeId).single(),
              ]);
              const botConfig = botConfigRes.data;
              // CRÍTICO: usar a chave OpenAI da LOJA (mesma conta onde o Assistant foi criado)
              const storeOpenaiKey = storeKeyRes.data?.openai_api_key || '';
              const openaiApiKey = storeOpenaiKey || Deno.env.get('OPENAI_API_KEY') || '';
              
              if (botConfig?.enabled && (botConfig.whatsapp_provider === 'uazapi' || botConfig.uazapi_assistant_id)) {
                // Se tem openai_assistant_id, forçar modo assistant (usar o Assistant real da OpenAI)
                const hasAssistant = !!botConfig.openai_assistant_id;
                const botMode = hasAssistant ? 'assistant' : (botConfig.bot_mode || 'chat_completion');
                const assistantId = botConfig.openai_assistant_id || '';
                
                console.log(`[uazapi-webhook] 🤖 Bot ativo! Modo: ${botMode}, Assistant: ${assistantId?.slice(0, 30)}, Key: ****${storeOpenaiKey ? storeOpenaiKey.slice(-4) : 'env'}`);
                
                // Determinar texto da mensagem para a IA
                const botInputText = audioTranscription || textContent || '';
                
                if (botInputText.trim()) {
                  // Verificar keyword de finalização
                  const keywordFinish = botConfig.keyword_finish || '#sair';
                  if (botInputText.trim().toLowerCase() === keywordFinish.toLowerCase()) {
                    console.log(`[uazapi-webhook] 🔑 Keyword de finalização detectada: ${keywordFinish}`);
                    await supabase.from('whatsapp_conversations')
                      .update({ is_bot_active: false })
                      .eq('store_id', storeId)
                      .eq('remote_jid', normalizedJid);
                    
                    // Enviar mensagem de despedida
                    const farewellMsg = botConfig.unknown_message || 'Atendimento encerrado. Se precisar, é só chamar novamente! 😊';
                    await sendBotReply(supabase, instance, storeId, phoneNumber, normalizedJid, farewellMsg);
                  } else {
                    if (!openaiApiKey) {
                      console.error(`[uazapi-webhook] ❌ Nenhuma chave OpenAI disponível (nem da loja, nem do env)!`);
                    } else {
                      console.log(`[uazapi-webhook] 🧠 Chamando OpenAI (modo: ${botMode}, assistant: ${hasAssistant})...`);
                      await processAIBotResponse({
                        supabase,
                        storeId,
                        phoneNumber,
                        normalizedJid,
                        assistantId,
                        botMode,
                        botConfig,
                        inputText: botInputText,
                        pushName: contactName,
                        instance,
                        openaiApiKey,
                      });
                    }
                  }
                } else {
                  console.log(`[uazapi-webhook] ℹ️ Sem texto para processar (mídia sem transcrição)`);
                }
              } else if (botConfig?.enabled) {
                console.log(`[uazapi-webhook] ℹ️ Bot habilitado mas provider não é uazapi (provider: ${botConfig.whatsapp_provider})`);
              }
            } catch (botErr) {
              console.error(`[uazapi-webhook] ❌ Erro no processamento do bot:`, botErr);
            }
          } else {
            console.log(`[uazapi-webhook] ⏸️ Bot pausado para ${normalizedJid}`);
          }
        } else if (!fromMe && !botMutexAcquired) {
          console.log(`[uazapi-webhook] 🔒 Bot NÃO processado (mutex não adquirido) para msg ${messageId}`);
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
                      payload: { conversationId: conv.id, isTyping, presenceType },
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

      case 'messages_reaction':
      case 'reaction': {
        // UaZapi envia eventos de reação - pode vir em payload.message ou payload.data
        const reactionData = payload.message || payload.data || {};
        const reactionMsgId = reactionData.id || reactionData.messageid || reactionData.key?.id || '';
        const reactionEmoji = reactionData.text || reactionData.content?.text || reactionData.reaction || '';
        const reactionFromMe = reactionData.fromMe === true;
        const reactionPhone = (reactionData.chatid || reactionData.sender_pn || reactionData.key?.remoteJid || '')
          .replace('@s.whatsapp.net', '').replace('@c.us', '').replace(/\D/g, '');

        console.log(`[uazapi-webhook] 😀 Reação recebida: emoji="${reactionEmoji}" msgId=${reactionMsgId} fromMe=${reactionFromMe} phone=${reactionPhone}`);

        if (reactionMsgId) {
          const reactionInstance = await findInstance(supabase, instanceName, ownerPhone, payloadToken);
          if (reactionInstance) {
            // Buscar mensagem alvo pelo evolution_message_id
            const { data: targetMsg } = await supabase
              .from('whatsapp_chat_messages')
              .select('id, reactions')
              .eq('store_id', reactionInstance.store_id)
              .eq('evolution_message_id', reactionMsgId)
              .maybeSingle();

            if (targetMsg) {
              const existingReactions = (targetMsg.reactions as any[]) || [];

              if (reactionEmoji === '') {
                // Remoção de reação
                const filtered = existingReactions.filter(
                  (r: any) => !(r.from === reactionPhone || (reactionFromMe && r.from_me))
                );
                await supabase.from('whatsapp_chat_messages')
                  .update({ reactions: filtered })
                  .eq('id', targetMsg.id);
                console.log(`[uazapi-webhook] ✅ Reação removida da msg ${reactionMsgId}`);
              } else {
                // Remover reação anterior do mesmo remetente e adicionar nova
                const filtered = existingReactions.filter(
                  (r: any) => !(r.from === reactionPhone || (reactionFromMe && r.from_me))
                );
                const newReactions = [...filtered, { emoji: reactionEmoji, from: reactionPhone, from_me: reactionFromMe }];
                await supabase.from('whatsapp_chat_messages')
                  .update({ reactions: newReactions })
                  .eq('id', targetMsg.id);
                console.log(`[uazapi-webhook] ✅ Reação ${reactionEmoji} salva na msg ${reactionMsgId}`);
              }
            } else {
              console.log(`[uazapi-webhook] ⚠️ Msg alvo não encontrada para reação: ${reactionMsgId}`);
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

// ========================================
// PROCESSAMENTO DO BOT IA (OpenAI Assistants API)
// ========================================
interface BotProcessParams {
  supabase: any;
  storeId: string;
  phoneNumber: string;
  normalizedJid: string;
  assistantId: string;
  botMode: string;
  botConfig: any;
  inputText: string;
  pushName: string;
  instance: any;
  openaiApiKey: string;
}

async function processAIBotResponse(params: BotProcessParams) {
  const { supabase, storeId, phoneNumber, normalizedJid, assistantId, botMode, botConfig, inputText, pushName, instance, openaiApiKey } = params;
  const headers = {
    'Authorization': `Bearer ${openaiApiKey}`,
    'Content-Type': 'application/json',
    'OpenAI-Beta': 'assistants=v2',
  };

  try {
    // Delay configurável antes de responder
    const delayMs = (botConfig.delay_message || 1) * 1000;
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, Math.min(delayMs, 10000)));
    }

    // Enviar presença "digitando" via UaZapi
    await sendUaZapiPresence(supabase, instance, phoneNumber, 'composing');

    if (botMode === 'chat_completion') {
      // Modo simples: Chat Completions API (sem threads)
      await handleChatCompletionMode(params);
    } else {
      // Modo assistant/conversational: Assistants API com threads
      await handleAssistantMode(params);
    }
  } catch (err) {
    console.error(`[uazapi-webhook] ❌ Erro bot response:`, err);
  }
}

async function handleChatCompletionMode(params: BotProcessParams) {
  const { supabase, storeId, phoneNumber, normalizedJid, inputText, pushName, instance, openaiApiKey, botConfig } = params;
  
  // Buscar últimas mensagens para contexto
  const { data: recentMsgs } = await supabase
    .from('whatsapp_chat_messages')
    .select('direction, content, message_type')
    .eq('store_id', storeId)
    .eq('remote_jid', normalizedJid)
    .order('timestamp', { ascending: false })
    .limit(20);
  
  const conversationHistory = (recentMsgs || []).reverse().map((m: any) => ({
    role: m.direction === 'incoming' ? 'user' : 'assistant',
    content: m.content || '[mídia]',
  }));

  // Usar prompt completo salvo pelo bot-sync (inclui catálogo, personalidade, etc.)
  const systemPrompt = botConfig.custom_prompt_instructions || `Você é um assistente virtual da loja. Responda em português brasileiro.`;

  // Montar histórico + mensagem atual
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: inputText },
  ];

  const chatBody = {
    model: 'gpt-4o-mini',
    messages,
    max_tokens: 1000,
  };

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(chatBody),
  });

  if (resp.ok) {
    const data = await resp.json();
    const botReply = data.choices?.[0]?.message?.content;
    if (botReply) {
      await sendBotReply(supabase, instance, storeId, phoneNumber, normalizedJid, botReply);
    }
  } else {
    const errText = await resp.text();
    console.error(`[uazapi-webhook] ❌ Chat completion error: ${resp.status}: ${errText.substring(0, 200)}`);
  }
}

async function handleAssistantMode(params: BotProcessParams) {
  const { supabase, storeId, phoneNumber, normalizedJid, assistantId, inputText, pushName, instance, openaiApiKey, botConfig } = params;
  const headers = {
    'Authorization': `Bearer ${openaiApiKey}`,
    'Content-Type': 'application/json',
    'OpenAI-Beta': 'assistants=v2',
  };

  // Buscar ou criar thread para esta conversa
  const { data: convData } = await supabase
    .from('whatsapp_conversations')
    .select('id, metadata')
    .eq('store_id', storeId)
    .eq('remote_jid', normalizedJid)
    .maybeSingle();
  
  let threadId = convData?.metadata?.openai_thread_id || null;

  // Criar thread se não existe
  if (!threadId) {
    const threadResp = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });
    if (threadResp.ok) {
      const threadData = await threadResp.json();
      threadId = threadData.id;
      console.log(`[uazapi-webhook] 🧵 Thread criada: ${threadId}`);
      
      // Salvar thread_id na conversa
      const existingMetadata = convData?.metadata || {};
      await supabase.from('whatsapp_conversations')
        .update({ metadata: { ...existingMetadata, openai_thread_id: threadId } })
        .eq('store_id', storeId)
        .eq('remote_jid', normalizedJid);
    } else {
      const errText = await threadResp.text();
      console.error(`[uazapi-webhook] ❌ Erro criar thread: ${errText.substring(0, 200)}`);
      return;
    }
  }

  // Adicionar mensagem do usuário à thread
  const userMsg = pushName && pushName !== 'Cliente' 
    ? `[pushName: ${pushName}] ${inputText}` 
    : inputText;

  const addMsgResp = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ role: 'user', content: userMsg }),
  });

  if (!addMsgResp.ok) {
    const errText = await addMsgResp.text();
    console.error(`[uazapi-webhook] ❌ Erro adicionar msg à thread: ${errText.substring(0, 200)}`);
    // Se thread inválida, criar nova
    if (addMsgResp.status === 404) {
      const existingMetadata = convData?.metadata || {};
      await supabase.from('whatsapp_conversations')
        .update({ metadata: { ...existingMetadata, openai_thread_id: null } })
        .eq('store_id', storeId)
        .eq('remote_jid', normalizedJid);
    }
    return;
  }

  // Criar run
  const runResp = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ assistant_id: assistantId }),
  });

  if (!runResp.ok) {
    const errText = await runResp.text();
    console.error(`[uazapi-webhook] ❌ Erro criar run: ${errText.substring(0, 200)}`);
    return;
  }

  const runData = await runResp.json();
  let runId = runData.id;
  let runStatus = runData.status;
  console.log(`[uazapi-webhook] 🏃 Run criado: ${runId} (${runStatus})`);

  // Poll até completar (max 60 segundos)
  const maxWaitMs = 60000;
  const pollIntervalMs = 1500;
  const startTime = Date.now();

  while (['queued', 'in_progress', 'requires_action'].includes(runStatus) && (Date.now() - startTime) < maxWaitMs) {
    if (runStatus === 'requires_action') {
      // Processar tool calls
      const toolCalls = runData.required_action?.submit_tool_outputs?.tool_calls || [];
      console.log(`[uazapi-webhook] 🔧 ${toolCalls.length} tool call(s) pendente(s)`);

      const toolOutputs = [];
      for (const tc of toolCalls) {
        const fnName = tc.function.name;
        let fnArgs: any = {};
        try { fnArgs = JSON.parse(tc.function.arguments || '{}'); } catch {}
        
        console.log(`[uazapi-webhook] 🔧 Executando: ${fnName}(${JSON.stringify(fnArgs).substring(0, 100)})`);
        const result = await executeToolCall(supabase, storeId, fnName, fnArgs, phoneNumber, instance);
        toolOutputs.push({ tool_call_id: tc.id, output: JSON.stringify(result) });
      }

      // Submeter resultados
      const submitResp = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}/submit_tool_outputs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ tool_outputs: toolOutputs }),
      });

      if (!submitResp.ok) {
        const errText = await submitResp.text();
        console.error(`[uazapi-webhook] ❌ Erro submit tool outputs: ${errText.substring(0, 200)}`);
        return;
      }
    }

    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));

    // Poll status
    const pollResp = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
      method: 'GET',
      headers,
    });

    if (pollResp.ok) {
      const pollData = await pollResp.json();
      runStatus = pollData.status;
      // Update runData for requires_action
      if (runStatus === 'requires_action') {
        Object.assign(runData, pollData);
      }
    } else {
      console.error(`[uazapi-webhook] ❌ Erro poll run: ${pollResp.status}`);
      break;
    }
  }

  if (runStatus === 'completed') {
    // Buscar mensagens do assistant
    const msgsResp = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages?order=desc&limit=5`, {
      method: 'GET',
      headers,
    });

    if (msgsResp.ok) {
      const msgsData = await msgsResp.json();
      const assistantMsgs = (msgsData.data || []).filter((m: any) => m.role === 'assistant');
      
      if (assistantMsgs.length > 0) {
        const latestMsg = assistantMsgs[0];
        const textParts = (latestMsg.content || [])
          .filter((c: any) => c.type === 'text')
          .map((c: any) => c.text?.value || '')
          .filter(Boolean);
        
        const botReply = textParts.join('\n').trim();
        if (botReply) {
          // Split messages se configurado
          const splitMessages = botConfig?.bot_split_messages !== false;
          if (splitMessages && botReply.includes('\n\n')) {
            const parts = botReply.split('\n\n').filter((p: string) => p.trim());
            const timePerChar = botConfig?.bot_time_per_char || 0;
            for (let i = 0; i < parts.length; i++) {
              if (i > 0 && timePerChar > 0) {
                await new Promise(resolve => setTimeout(resolve, Math.min(parts[i].length * timePerChar, 5000)));
                await sendUaZapiPresence(supabase, instance, phoneNumber, 'composing');
              }
              await sendBotReply(supabase, instance, storeId, phoneNumber, normalizedJid, parts[i].trim());
            }
          } else {
            await sendBotReply(supabase, instance, storeId, phoneNumber, normalizedJid, botReply);
          }
        }
      }
    }
  } else {
    console.error(`[uazapi-webhook] ⚠️ Run finalizado com status: ${runStatus}`);
  }
}

// ========================================
// EXECUTAR TOOL CALLS
// ========================================
async function executeToolCall(supabase: any, storeId: string, fnName: string, args: any, phoneNumber: string, instance: any): Promise<any> {
  const toolStartTime = Date.now();
  console.log(`[uazapi-webhook] 🔧 TOOL_START: ${fnName} | Store: ${storeId} | Args: ${JSON.stringify(args).substring(0, 200)}`);
  try {
    switch (fnName) {
      case 'search_products': {
        const query = args.query || '';
        const limit = args.limit || 5;
        const { data: products, error: searchErr } = await supabase
          .from('products')
          .select('name, price, description, slug, is_available, image_url, promotional_price')
          .eq('store_id', storeId)
          .eq('is_available', true)
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(limit);
        
        if (searchErr) console.error(`[uazapi-webhook] ❌ TOOL_DB_ERROR: search_products | ${searchErr.message}`);
        console.log(`[uazapi-webhook] 📦 TOOL_RESULT: search_products | query="${query}" | ${products?.length || 0} produto(s) encontrado(s) | ${Date.now() - toolStartTime}ms`);
        
        if (!products?.length) return { results: [], message: 'Nenhum produto encontrado.' };
        
        // Enviar fotos dos produtos encontrados
        for (const p of products) {
          if (p.image_url) {
            try {
              console.log(`[uazapi-webhook] 📸 TOOL_IMAGE: Enviando foto de "${p.name}" para ${phoneNumber}`);
              await sendUaZapiImage(supabase, instance, phoneNumber, p.image_url, 
                `*${p.name}*\n💰 R$ ${p.price?.toFixed(2)}${p.promotional_price ? ` ~~R$ ${p.price?.toFixed(2)}~~ → R$ ${p.promotional_price.toFixed(2)}` : ''}`);
            } catch (imgErr) {
              console.error(`[uazapi-webhook] ⚠️ TOOL_IMAGE_ERROR: "${p.name}" | ${imgErr}`);
            }
          }
        }
        
        return { results: products.map((p: any) => ({
          name: p.name, price: p.price, promotional_price: p.promotional_price,
          description: p.description, slug: p.slug, available: p.is_available,
        })) };
      }

      case 'check_stock': {
        const { data: product } = await supabase
          .from('products')
          .select('name, is_available, stock_quantity')
          .eq('store_id', storeId)
          .ilike('name', `%${args.product_name}%`)
          .limit(1)
          .maybeSingle();
        console.log(`[uazapi-webhook] 📦 TOOL_RESULT: check_stock | "${args.product_name}" | found=${!!product} available=${product?.is_available} stock=${product?.stock_quantity} | ${Date.now() - toolStartTime}ms`);
        return product ? { available: product.is_available, stock: product.stock_quantity, name: product.name } 
          : { available: false, message: 'Produto não encontrado' };
      }

      case 'get_product_details': {
        const { data: product } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', storeId)
          .eq('slug', args.slug)
          .maybeSingle();
        console.log(`[uazapi-webhook] 📦 TOOL_RESULT: get_product_details | slug="${args.slug}" | found=${!!product} | ${Date.now() - toolStartTime}ms`);
        return product || { error: 'Produto não encontrado' };
      }

      case 'list_categories': {
        const { data: cats } = await supabase
          .from('categories')
          .select('name, description')
          .eq('store_id', storeId)
          .eq('is_active', true)
          .order('display_order');
        console.log(`[uazapi-webhook] 📦 TOOL_RESULT: list_categories | ${cats?.length || 0} categoria(s) | ${Date.now() - toolStartTime}ms`);
        return { categories: cats || [] };
      }

      case 'get_promotions': {
        const { data: promos } = await supabase
          .from('products')
          .select('name, price, promotional_price, slug, image_url')
          .eq('store_id', storeId)
          .eq('is_available', true)
          .not('promotional_price', 'is', null)
          .gt('promotional_price', 0)
          .limit(args.limit || 5);
        console.log(`[uazapi-webhook] 📦 TOOL_RESULT: get_promotions | ${promos?.length || 0} promoção(ões) | ${Date.now() - toolStartTime}ms`);
        return { promotions: promos || [] };
      }

      case 'get_recommendations': {
        const { data: recs } = await supabase
          .from('products')
          .select('name, price, description, slug, image_url')
          .eq('store_id', storeId)
          .eq('is_available', true)
          .order('total_orders', { ascending: false })
          .limit(args.limit || 5);
        console.log(`[uazapi-webhook] 📦 TOOL_RESULT: get_recommendations | ${recs?.length || 0} recomendação(ões) | ${Date.now() - toolStartTime}ms`);
        return { recommendations: recs || [] };
      }

      case 'get_store_info': {
        const { data: store } = await supabase
          .from('stores')
          .select('name, description, address, whatsapp, business_hours, delivery_fee, min_order_value')
          .eq('id', storeId)
          .single();
        return store || { error: 'Loja não encontrada' };
      }

      case 'check_store_status': {
        const { data: store } = await supabase
          .from('stores')
          .select('is_open, business_hours, timezone')
          .eq('id', storeId)
          .single();
        return { is_open: store?.is_open ?? true, business_hours: store?.business_hours };
      }

      case 'get_current_greeting': {
        const now = new Date();
        const hour = now.getHours();
        const greeting = hour < 12 ? 'Bom dia! ☀️' : hour < 18 ? 'Boa tarde! 🌤️' : 'Boa noite! 🌙';
        const name = args.customer_name || '';
        return { greeting: name ? `${greeting} ${name}` : greeting };
      }

      case 'calculate_delivery_fee': {
        // Buscar zonas de entrega da loja
        const { data: store } = await supabase
          .from('stores')
          .select('delivery_zones, latitude, longitude, delivery_fee')
          .eq('id', storeId)
          .single();
        
        if (!store) return { error: 'Loja não encontrada' };
        return { delivery_fee: store.delivery_fee || 0, message: 'Taxa calculada' };
      }

      case 'get_last_delivery_info': {
        const phone = args.customer_phone || phoneNumber;
        const variants = [phone];
        if (phone.startsWith('55')) variants.push(phone.substring(2));
        else variants.push('55' + phone);
        
        const { data: customer } = await supabase
          .from('customers')
          .select('name, address, latitude, longitude')
          .in('phone', variants)
          .limit(1)
          .maybeSingle();
        
        return customer ? { name: customer.name, address: customer.address, 
          latitude: customer.latitude, longitude: customer.longitude } 
          : { message: 'Cliente não encontrado' };
      }

      default:
        return { error: `Função ${fnName} não reconhecida` };
    }
  } catch (err) {
    console.error(`[uazapi-webhook] ❌ Erro tool ${fnName}:`, err);
    return { error: `Erro ao executar ${fnName}` };
  }
}

// ========================================
// ENVIAR RESPOSTA DO BOT VIA UAZAPI
// ========================================
async function sendBotReply(supabase: any, instance: any, storeId: string, phoneNumber: string, normalizedJid: string, text: string) {
  try {
    const { data: instData } = await supabase
      .from('whatsapp_instances')
      .select('api_token')
      .eq('id', instance.id)
      .single();
    
    const { data: uazapiConfig } = await supabase
      .from('uazapi_config')
      .select('api_url')
      .limit(1)
      .maybeSingle();
    
    const token = instData?.api_token;
    const serverUrl = uazapiConfig?.api_url?.replace(/\/+$/, '');
    
    if (!token || !serverUrl) {
      console.error(`[uazapi-webhook] ❌ Token/URL UaZapi não encontrados para envio`);
      return;
    }

    // Enviar via UaZapi
    const sendResp = await fetch(`${serverUrl}/send/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'token': token },
      body: JSON.stringify({ number: phoneNumber, text }),
    });

    if (sendResp.ok) {
      const sendData = await sendResp.json();
      const sentMsgId = sendData.key?.id || sendData.messageId || sendData.id || `bot_${Date.now()}`;
      
      // Salvar mensagem do bot no chat
      await supabase.from('whatsapp_chat_messages').insert({
        store_id: storeId,
        remote_jid: normalizedJid,
        phone_number: phoneNumber,
        direction: 'outgoing',
        content: text,
        message_type: 'text',
        evolution_message_id: sentMsgId,
        is_from_bot: true,
        is_read_by_attendant: true,
        message_source: 'system',
        timestamp: new Date().toISOString(),
      });

      // Atualizar conversa com última mensagem
      await supabase.from('whatsapp_conversations')
        .update({
          last_message: text.slice(0, 200),
          last_message_at: new Date().toISOString(),
          last_message_direction: 'outgoing',
          last_message_source: 'system',
        })
        .eq('store_id', storeId)
        .eq('remote_jid', normalizedJid);

      console.log(`[uazapi-webhook] ✅ Bot reply enviada: "${text.substring(0, 80)}..."`);
    } else {
      const errText = await sendResp.text();
      console.error(`[uazapi-webhook] ❌ Erro enviar bot reply: ${sendResp.status}: ${errText.substring(0, 200)}`);
    }
  } catch (err) {
    console.error(`[uazapi-webhook] ❌ Erro sendBotReply:`, err);
  }
}

// Enviar imagem via UaZapi
async function sendUaZapiImage(supabase: any, instance: any, phoneNumber: string, imageUrl: string, caption: string) {
  const { data: instData } = await supabase
    .from('whatsapp_instances')
    .select('api_token')
    .eq('id', instance.id)
    .single();
  
  const { data: uazapiConfig } = await supabase
    .from('uazapi_config')
    .select('api_url')
    .limit(1)
    .maybeSingle();
  
  const token = instData?.api_token;
  const serverUrl = uazapiConfig?.api_url?.replace(/\/+$/, '');
  
  if (!token || !serverUrl) return;

  await fetch(`${serverUrl}/send/image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'token': token },
    body: JSON.stringify({ number: phoneNumber, url: imageUrl, caption }),
  });
}

// Enviar presença (digitando) via UaZapi
async function sendUaZapiPresence(supabase: any, instance: any, phoneNumber: string, type: string) {
  try {
    const { data: instData } = await supabase
      .from('whatsapp_instances')
      .select('api_token')
      .eq('id', instance.id)
      .single();
    
    const { data: uazapiConfig } = await supabase
      .from('uazapi_config')
      .select('api_url')
      .limit(1)
      .maybeSingle();
    
    const token = instData?.api_token;
    const serverUrl = uazapiConfig?.api_url?.replace(/\/+$/, '');
    
    if (!token || !serverUrl) return;

    await fetch(`${serverUrl}/chat/presence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'token': token },
      body: JSON.stringify({ number: phoneNumber, type }),
    });
  } catch {} // silenciar erros de presença
}
