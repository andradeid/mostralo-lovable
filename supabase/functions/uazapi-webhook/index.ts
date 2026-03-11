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

        // 🔒 DEDUP GLOBAL via cache em memória para webhooks simultâneos do mesmo messageId
        // Previne race condition quando UaZapi manda o mesmo evento 2x antes do DB insert
        const dedupeKey = `msg_${messageId}`;
        if (messageId && globalProcessingSet.has(dedupeKey)) {
          console.log(`[uazapi-webhook] ⏭️ DEDUP_GLOBAL: Msg ${messageId} já está sendo processada neste worker. Ignorando.`);
          break;
        }
        if (messageId) globalProcessingSet.add(dedupeKey);
        // Limpar após 30s para não crescer indefinidamente
        if (messageId) setTimeout(() => globalProcessingSet.delete(dedupeKey), 30000);

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
        // BOT IA: PROCESSAMENTO OPENAI PELO WEBHOOK
        // O webhook gerencia o ciclo completo: threads, runs, requires_action, tool_calls
        // ========================================
        if (!fromMe && botMutexAcquired) {
          try {
            const botConfigRes = await supabase
              .from('store_bot_config')
              .select('enabled, keyword_finish, unknown_message, whatsapp_provider, openai_assistant_id, bot_mode, custom_prompt_instructions, bot_name, delay_message, bot_split_messages, bot_time_per_char')
              .eq('store_id', storeId)
              .maybeSingle();
            const botConfig = botConfigRes.data;
            
            if (botConfig?.enabled && botConfig.whatsapp_provider === 'uazapi') {
              // Verificar se bot está ativo na conversa
              const { data: convCheck } = await supabase
                .from('whatsapp_conversations')
                .select('is_bot_active')
                .eq('store_id', storeId)
                .eq('remote_jid', normalizedJid)
                .maybeSingle();
              
              if (convCheck?.is_bot_active === false) {
                console.log(`[uazapi-webhook] ⏸️ Bot pausado para ${normalizedJid}, ignorando`);
              } else {
                const botInputText = audioTranscription || textContent || '';
                
                if (botInputText.trim()) {
                  // Verificar keyword de finalização
                  const keywordFinish = botConfig.keyword_finish || '#sair';
                  if (botInputText.trim().toLowerCase() === keywordFinish.toLowerCase()) {
                    console.log(`[uazapi-webhook] 🔑 Keyword de finalização: ${keywordFinish}`);
                    await supabase.from('whatsapp_conversations')
                      .update({ is_bot_active: false })
                      .eq('store_id', storeId)
                      .eq('remote_jid', normalizedJid);
                    
                    const farewellMsg = botConfig.unknown_message || 'Atendimento encerrado. Se precisar, é só chamar novamente! 😊';
                    await sendBotReply(supabase, instance, storeId, phoneNumber, normalizedJid, farewellMsg);
                  } else {
                    // Processar resposta IA
                    await processAIBotResponse(
                      supabase, instance, storeId, phoneNumber, normalizedJid,
                      botInputText, botConfig, contactName, mediaUrl, incomingType
                    );
                  }
                }
              }
            }
          } catch (botErr) {
            console.error(`[uazapi-webhook] ❌ Erro no bot:`, botErr);
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
