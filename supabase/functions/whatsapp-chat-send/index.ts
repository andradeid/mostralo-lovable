import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function normalizePhoneForWhatsApp(phone: string): string {
  let normalized = phone.replace(/\D/g, '');
  if (normalized.startsWith('55') && normalized.length >= 12 && normalized.length <= 13) {
    return normalized;
  }
  if (normalized.length >= 10 && normalized.length <= 11) {
    return '55' + normalized;
  }
  return normalized;
}

// Transcrever áudio via OpenAI Whisper
async function transcribeAudioFromUrl(
  audioUrl: string,
  mimetype: string,
  correlationId: string
): Promise<string | null> {
  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error(`[${correlationId}] ❌ OPENAI_API_KEY não configurada para transcrição`);
      return null;
    }

    console.log(`[${correlationId}] 🎤 Baixando áudio para transcrição...`);
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      console.error(`[${correlationId}] ❌ Erro ao baixar áudio: ${audioResponse.status}`);
      return null;
    }

    const audioBlob = await audioResponse.blob();
    const extension = mimetype?.includes('ogg') ? 'ogg' 
      : mimetype?.includes('mp4') ? 'm4a'
      : mimetype?.includes('mpeg') ? 'mp3'
      : mimetype?.includes('wav') ? 'wav'
      : 'ogg';

    const formData = new FormData();
    formData.append('file', audioBlob, `audio.${extension}`);
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');
    formData.append('response_format', 'text');

    console.log(`[${correlationId}] 🎤 Transcrevendo áudio enviado via Whisper...`);
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${correlationId}] ❌ Whisper error ${response.status}:`, errorText);
      return null;
    }

    const transcription = await response.text();
    console.log(`[${correlationId}] ✅ Transcrição enviada: "${transcription.trim().slice(0, 100)}..."`);
    return transcription.trim();
  } catch (error) {
    console.error(`[${correlationId}] ❌ Erro na transcrição:`, error);
    return null;
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

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const {
      storeId, remoteJid, content, messageType = 'text',
      mediaUrl, mediaFilename, mediaMimetype,
      // Quote/Reply fields
      quotedMessageId, quotedEvolutionId, quotedContent, quotedFromMe,
      // Reaction fields
      reactionEmoji, reactionMessageId, reactionEvolutionId, reactionFromMe,
      // Presence fields
      presence, presenceDelay,
      // Location fields
      latitude, longitude, locationName, locationAddress,
      // Payment request fields
      amount, pixKey, pixType, pixName, paymentText, paymentItemName, paymentInvoiceNumber, paymentFooter,
    } = body;

    if (!storeId || !remoteJid) {
      return new Response(JSON.stringify({ error: 'Parâmetros obrigatórios: storeId, remoteJid' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========== MARCAR COMO LIDA (markread) ==========
    if (messageType === 'markread') {
      console.log(`[whatsapp-chat-send] 📖 Marcando mensagens como lidas para ${remoteJid}`);

      // Buscar instância conectada
      const { data: mrInsts } = await supabase
        .from('whatsapp_instances')
        .select('instance_name, status, provider, api_token')
        .eq('store_id', storeId)
        .eq('status', 'connected')
        .limit(1);

      const mrInst = mrInsts?.[0];
      if (!mrInst) {
        return new Response(JSON.stringify({ error: 'Instância não encontrada' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (mrInst.provider === 'uazapi') {
        const { data: uaCfg } = await supabase.from('uazapi_config').select('api_url').limit(1).single();
        if (uaCfg?.api_url && mrInst.api_token) {
          const uaBase = uaCfg.api_url.replace(/\/+$/, '');

          // Buscar IDs das mensagens não lidas do cliente
          const { data: unreadMsgs } = await supabase
            .from('whatsapp_chat_messages')
            .select('evolution_message_id')
            .eq('store_id', storeId)
            .eq('remote_jid', remoteJid)
            .eq('direction', 'incoming')
            .eq('is_read_by_attendant', false)
            .not('evolution_message_id', 'is', null);

          const messageIds = (unreadMsgs || [])
            .map((m: any) => m.evolution_message_id)
            .filter(Boolean);

          if (messageIds.length > 0) {
            // POST /message/markread com array de IDs
            const markReadUrl = `${uaBase}/message/markread`;
            const markReadResp = await fetch(markReadUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'token': mrInst.api_token },
              body: JSON.stringify({ id: messageIds }),
            });
            console.log(`[whatsapp-chat-send] 📖 UaZapi markread ${messageIds.length} msgs → ${markReadResp.status}`);
          } else {
            // Fallback: usar /chat/read para marcar o chat inteiro como lido
            const mrPhone = normalizePhoneForWhatsApp(remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', ''));
            const chatReadUrl = `${uaBase}/chat/read`;
            const chatReadResp = await fetch(chatReadUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'token': mrInst.api_token },
              body: JSON.stringify({ number: mrPhone, read: true }),
            });
            console.log(`[whatsapp-chat-send] 📖 UaZapi chat/read fallback → ${chatReadResp.status}`);
          }
        }
      } else {
        // Evolution API: POST /chat/markAllAsRead/{instanceName}
        const { data: evoCfg } = await supabase.from('evolution_config').select('api_url, api_key').eq('is_active', true).single();
        if (evoCfg) {
          const mrPhone = normalizePhoneForWhatsApp(remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', ''));
          const readUrl = `${evoCfg.api_url.replace(/\/+$/, '')}/chat/markAllAsRead/${mrInst.instance_name}`;
          const readResp = await fetch(readUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': evoCfg.api_key },
            body: JSON.stringify({ number: `${mrPhone}@s.whatsapp.net` }),
          });
          console.log(`[whatsapp-chat-send] 🔵 Evolution markAllAsRead → ${readResp.status}`);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========== PRESENÇA (composing/recording/paused) ==========
    if (messageType === 'presence' && presence) {
      const phone = normalizePhoneForWhatsApp(remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', ''));

      // Buscar instância conectada
      const { data: presInsts } = await supabase
        .from('whatsapp_instances')
        .select('instance_name, status, provider, api_token')
        .eq('store_id', storeId)
        .eq('status', 'connected')
        .limit(1);

      const presInst = presInsts?.[0];
      if (!presInst) {
        return new Response(JSON.stringify({ error: 'Instância não encontrada' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (presInst.provider === 'uazapi') {
        // UaZapi: POST /message/presence
        const { data: uaCfg } = await supabase.from('uazapi_config').select('api_url').limit(1).single();
        if (uaCfg?.api_url && presInst.api_token) {
          const presUrl = `${uaCfg.api_url.replace(/\/+$/, '')}/message/presence`;
          const presPayload: any = { number: phone, presence };
          if (presenceDelay) presPayload.delay = presenceDelay;

          const presResp = await fetch(presUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'token': presInst.api_token },
            body: JSON.stringify(presPayload),
          });
          console.log(`[whatsapp-chat-send] 🟠 Presence UaZapi: ${presence} → ${presResp.status}`);
        }
      } else {
        // Evolution API: POST /chat/updatePresence/{instanceName}
        const { data: evoCfg } = await supabase.from('evolution_config').select('api_url, api_key').eq('is_active', true).single();
        if (evoCfg) {
          const presUrl = `${evoCfg.api_url.replace(/\/+$/, '')}/chat/updatePresence/${presInst.instance_name}`;
          const evoPresence = presence === 'composing' ? 'composing' : presence === 'recording' ? 'recording' : 'paused';
          const presResp = await fetch(presUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': evoCfg.api_key },
            body: JSON.stringify({ number: phone, presence: evoPresence }),
          });
          console.log(`[whatsapp-chat-send] 🔵 Presence Evolution: ${evoPresence} → ${presResp.status}`);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar instância conectada da loja (filtra por status para evitar conflito com instâncias antigas)
    const { data: instances, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('instance_name, status, provider, api_token')
      .eq('store_id', storeId)
      .eq('status', 'connected')
      .limit(1);

    const instance = instances?.[0];

    if (instanceError || !instance) {
      return new Response(JSON.stringify({ error: 'Instância WhatsApp conectada não encontrada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isUazapi = instance.provider === 'uazapi';
    const phone = normalizePhoneForWhatsApp(remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', ''));

    // ========== ROTEAMENTO UAZAPI ==========
    if (isUazapi) {
      console.log(`[whatsapp-chat-send] 🟠 Usando UaZapi para enviar ${messageType} para ${phone}`);

      // Buscar config UaZapi
      const { data: uazapiConfig } = await supabase
        .from('uazapi_config')
        .select('api_url')
        .limit(1)
        .single();

      if (!uazapiConfig?.api_url || !instance.api_token) {
        return new Response(JSON.stringify({ error: 'UaZapi não configurada ou token ausente' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const uaBaseUrl = uazapiConfig.api_url.replace(/\/+$/, '');
      const uaToken = instance.api_token;

      // ========== EDITAR MENSAGEM VIA UAZAPI ==========
      if (messageType === 'editMessage') {
        const editMessageId = body.editMessageId;
        const editEvolutionId = body.editEvolutionId;
        const editNewText = body.editNewText;
        console.log(`[whatsapp-chat-send] ✏️ Editando mensagem UaZapi: evolutionId=${editEvolutionId}, newText=${editNewText?.substring(0, 50)}`);

        console.log(`[whatsapp-chat-send] ✏️ Editando mensagem UaZapi: ${editEvolutionId}`);

        if (!editEvolutionId || !editNewText) {
          return new Response(JSON.stringify({ error: 'editEvolutionId e editNewText são obrigatórios' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const editUrl = `${uaBaseUrl}/message/edit`;
        const editPayload = {
          id: editEvolutionId,
          text: editNewText,
        };

        const editResponse = await fetch(editUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'token': uaToken,
          },
          body: JSON.stringify(editPayload),
        });

        let editData: any;
        const editText = await editResponse.text();
        try { editData = JSON.parse(editText); } catch { editData = { raw: editText }; }

        if (!editResponse.ok) {
          console.error('[whatsapp-chat-send] ❌ Erro edição UaZapi:', editData);
          return new Response(JSON.stringify({ error: 'Erro ao editar mensagem via UaZapi', details: editData }), {
            status: editResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        console.log(`[whatsapp-chat-send] ✅ Edição UaZapi OK: ${JSON.stringify(editData).substring(0, 200)}`);

        // Atualizar conteúdo no banco de dados
        if (editMessageId) {
          const { error: updateError } = await supabase
            .from('whatsapp_chat_messages')
            .update({ 
              content: editNewText,
              metadata: { edited: true, edited_at: new Date().toISOString() }
            })
            .eq('id', editMessageId);

          if (updateError) {
            console.error('[whatsapp-chat-send] ❌ Erro ao atualizar mensagem editada no DB:', updateError);
          }
        }

        return new Response(JSON.stringify({ success: true, data: editData }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ========== APAGAR MENSAGEM VIA UAZAPI ==========
      if (messageType === 'deleteMessage') {
        const deleteMessageId = body.deleteMessageId;
        const deleteEvolutionId = body.deleteEvolutionId;
        console.log(`[whatsapp-chat-send] 🗑️ Apagando mensagem UaZapi: evolutionId=${deleteEvolutionId}`);

        if (!deleteEvolutionId) {
          return new Response(JSON.stringify({ error: 'deleteEvolutionId é obrigatório' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const deleteUrl = `${uaBaseUrl}/message/delete`;
        const deletePayload = { id: deleteEvolutionId };

        const deleteResponse = await fetch(deleteUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'token': uaToken,
          },
          body: JSON.stringify(deletePayload),
        });

        let deleteData: any;
        const deleteText = await deleteResponse.text();
        try { deleteData = JSON.parse(deleteText); } catch { deleteData = { raw: deleteText }; }

        if (!deleteResponse.ok) {
          console.error('[whatsapp-chat-send] ❌ Erro ao apagar UaZapi:', deleteData);
          return new Response(JSON.stringify({ error: 'Erro ao apagar mensagem via UaZapi', details: deleteData }), {
            status: deleteResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        console.log(`[whatsapp-chat-send] ✅ Mensagem apagada UaZapi OK`);

        // Marcar como apagada no banco
        if (deleteMessageId) {
          const { error: updateError } = await supabase
            .from('whatsapp_chat_messages')
            .update({
              content: '🚫 Mensagem apagada',
              metadata: { deleted: true, deleted_at: new Date().toISOString() },
            })
            .eq('id', deleteMessageId);

          if (updateError) {
            console.error('[whatsapp-chat-send] ❌ Erro ao marcar mensagem como apagada no DB:', updateError);
          }
        }

        return new Response(JSON.stringify({ success: true, data: deleteData }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ========== REAÇÃO VIA UAZAPI ==========
      if (messageType === 'reaction') {
        console.log(`[whatsapp-chat-send] 🟠 Enviando reação UaZapi: ${reactionEmoji} para msg ${reactionEvolutionId}`);

        if (!reactionEvolutionId || reactionEmoji === undefined) {
          return new Response(JSON.stringify({ error: 'Reação requer reactionEvolutionId e reactionEmoji' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // UaZapi: POST /message/react
        const reactUrl = `${uaBaseUrl}/message/react`;
        const reactPayload = {
          number: `${phone}@s.whatsapp.net`,
          text: reactionEmoji,
          id: reactionEvolutionId,
        };

        console.log(`[whatsapp-chat-send] 🟠 React payload: ${JSON.stringify(reactPayload)}`);

        const reactResponse = await fetch(reactUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'token': uaToken },
          body: JSON.stringify(reactPayload),
        });

        const reactText = await reactResponse.text();
        let reactData: any;
        try { reactData = JSON.parse(reactText); } catch { reactData = { raw: reactText }; }

        if (!reactResponse.ok) {
          console.error('[whatsapp-chat-send] ❌ Erro reação UaZapi:', reactData);
          return new Response(JSON.stringify({ error: 'Erro ao enviar reação via UaZapi', details: reactData }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        console.log(`[whatsapp-chat-send] ✅ Reação UaZapi OK: ${JSON.stringify(reactData).substring(0, 200)}`);

        // Atualizar reações no banco
        if (reactionMessageId) {
          const { data: existingMsg } = await supabase
            .from('whatsapp_chat_messages')
            .select('reactions')
            .eq('id', reactionMessageId)
            .single();

          const existingReactions = (existingMsg?.reactions as any[]) || [];

          if (reactionEmoji === '') {
            // Remoção de reação
            const filtered = existingReactions.filter((r: any) => !r.from_me);
            await supabase.from('whatsapp_chat_messages')
              .update({ reactions: filtered })
              .eq('id', reactionMessageId);
          } else {
            // Remover reação anterior do mesmo remetente e adicionar nova
            const filtered = existingReactions.filter((r: any) => !r.from_me);
            const newReactions = [...filtered, { emoji: reactionEmoji, from: phone, from_me: true }];
            await supabase.from('whatsapp_chat_messages')
              .update({ reactions: newReactions })
              .eq('id', reactionMessageId);
          }
        }

        return new Response(JSON.stringify({ success: true, type: 'reaction' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (messageType === 'text' && !content) {
        return new Response(JSON.stringify({ error: 'Conteúdo é obrigatório para mensagens de texto' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Pausar bot na conversa
      await supabase
        .from('whatsapp_conversations')
        .update({ is_bot_active: false })
        .eq('store_id', storeId)
        .eq('remote_jid', remoteJid);

      // Enviar via UaZapi
      let uaEndpoint: string;
      let uaPayload: any = {};

      if (messageType === 'location' && latitude !== undefined && longitude !== undefined) {
        uaEndpoint = `${uaBaseUrl}/send/location`;
        uaPayload = {
          number: phone,
          latitude: Number(latitude),
          longitude: Number(longitude),
          name: locationName || '',
          address: locationAddress || '',
          readmessages: true,
        };
      } else if (messageType === 'payment_request' && amount && pixKey) {
        uaEndpoint = `${uaBaseUrl}/send/request-payment`;
        uaPayload = {
          number: phone,
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
        console.log(`[whatsapp-chat-send] 💰 Payment request: R$${amount} | PIX: ${pixKey} (${pixType})`);
      } else if (messageType === 'text') {
        uaEndpoint = `${uaBaseUrl}/send/text`;
        uaPayload = { number: phone, text: content, readmessages: true };
      } else if (messageType === 'image' && mediaUrl) {
        uaEndpoint = `${uaBaseUrl}/send/media`;
        uaPayload = { number: phone, type: 'image', file: mediaUrl, text: content || '', readmessages: true };
      } else if (messageType === 'audio' && mediaUrl) {
        uaEndpoint = `${uaBaseUrl}/send/media`;
        uaPayload = { number: phone, type: 'ptt', file: mediaUrl, readmessages: true };
      } else if (messageType === 'video' && mediaUrl) {
        uaEndpoint = `${uaBaseUrl}/send/media`;
        uaPayload = { number: phone, type: 'video', file: mediaUrl, text: content || '', readmessages: true };
      } else if (messageType === 'document' && mediaUrl) {
        uaEndpoint = `${uaBaseUrl}/send/media`;
        uaPayload = { number: phone, type: 'document', file: mediaUrl, text: content || '', docName: mediaFilename || 'document', readmessages: true };
      } else {
        uaEndpoint = `${uaBaseUrl}/send/text`;
        uaPayload = { number: phone, text: content || '', readmessages: true };
      }

      // Adicionar ID da mensagem citada para resposta/quote via UaZapi
      // UaZapi usa "replyid" para enviar como resposta (reply)
      if (quotedEvolutionId) {
        uaPayload.replyid = quotedEvolutionId;
        console.log(`[whatsapp-chat-send] 🟠 UaZapi reply to (replyid): ${quotedEvolutionId}`);
        console.log(`[whatsapp-chat-send] 🟠 Full payload: ${JSON.stringify(uaPayload)}`);
      }

      console.log(`[whatsapp-chat-send] 🟠 UaZapi endpoint: ${uaEndpoint}`);

      const sendResponse = await fetch(uaEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': uaToken,
        },
        body: JSON.stringify(uaPayload),
      });

      let sendData: any;
      const sendText = await sendResponse.text();
      try { sendData = JSON.parse(sendText); } catch { sendData = { raw: sendText }; }

      if (!sendResponse.ok) {
        console.error('[whatsapp-chat-send] ❌ Erro UaZapi:', sendData);
        return new Response(JSON.stringify({ error: 'Erro ao enviar mensagem via UaZapi', details: sendData }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`[whatsapp-chat-send] ✅ UaZapi envio OK: ${JSON.stringify(sendData).substring(0, 200)}`);

      const evolutionMessageId = sendData.messageid || sendData.id || null;

      // Transcrever áudio se aplicável
      let audioTranscription: string | null = null;
      if (messageType === 'audio' && mediaUrl) {
        const correlationId = `uazapi-send-${Date.now()}`;
        audioTranscription = await transcribeAudioFromUrl(mediaUrl, mediaMimetype || 'audio/ogg', correlationId);
      }

      // Salvar mensagem no chat
      const messageMetadata: Record<string, any> = {};
      if (audioTranscription) messageMetadata.transcription = audioTranscription;

      // Conteúdo para localização
      const locationContent = messageType === 'location' && latitude !== undefined && longitude !== undefined
        ? `📍 ${locationName || 'Localização'}: ${Number(latitude).toFixed(6)}, ${Number(longitude).toFixed(6)}${locationAddress ? ` - ${locationAddress}` : ''}`
        : null;

      // Metadata para localização
      if (messageType === 'location' && latitude !== undefined && longitude !== undefined) {
        messageMetadata.latitude = Number(latitude);
        messageMetadata.longitude = Number(longitude);
        if (locationName) messageMetadata.location_name = locationName;
        if (locationAddress) messageMetadata.location_address = locationAddress;
      }

      // Metadata e conteúdo para payment_request
      let paymentContent: string | null = null;
      if (messageType === 'payment_request' && amount) {
        const formattedAmt = Number(amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        paymentContent = `💰 Solicitação de pagamento: ${formattedAmt}`;
        if (paymentText) paymentContent += `\n${paymentText}`;
        messageMetadata.amount = Number(amount);
        messageMetadata.pix_key = pixKey;
        messageMetadata.pix_type = pixType || 'EVP';
        if (pixName) messageMetadata.pix_name = pixName;
        if (paymentItemName) messageMetadata.item_name = paymentItemName;
        if (paymentInvoiceNumber) messageMetadata.invoice_number = paymentInvoiceNumber;
      }

      const insertData: any = {
        store_id: storeId,
        remote_jid: remoteJid,
        phone_number: phone,
        direction: 'outgoing',
        sender_name: user.user_metadata?.full_name || 'Atendente',
        content: paymentContent || locationContent || content || null,
        message_type: messageType,
        media_url: mediaUrl || null,
        media_filename: mediaFilename || null,
        media_mimetype: mediaMimetype || null,
        evolution_message_id: evolutionMessageId,
        is_from_bot: false,
        is_read_by_attendant: true,
        message_source: 'system',
        timestamp: new Date().toISOString(),
        status: 'sent',
        ...(Object.keys(messageMetadata).length > 0 ? { metadata: messageMetadata } : {}),
      };
      if (quotedMessageId) insertData.quoted_message_id = quotedMessageId;
      if (quotedContent) insertData.quoted_content = quotedContent;

      const { data: chatMsg, error: chatError } = await supabase
        .from('whatsapp_chat_messages')
        .insert(insertData)
        .select('id')
        .single();

      if (chatError) console.error('[whatsapp-chat-send] Erro ao salvar chat message:', chatError);

      // Atualizar conversa
      const lastMsgPreview = messageType === 'text' 
        ? (content || '').slice(0, 200)
        : messageType === 'location' ? '📍 Localização'
        : messageType === 'payment_request' ? `💰 Cobrança: R$ ${Number(amount || 0).toFixed(2)}`
        : messageType === 'image' ? '📷 Imagem' 
        : messageType === 'video' ? '🎥 Vídeo'
        : messageType === 'audio' ? '🎵 Áudio'
        : messageType === 'document' ? '📄 Documento'
        : '📎 Mídia';

      const { data: existingConv } = await supabase
        .from('whatsapp_conversations')
        .select('id, assigned_to')
        .eq('store_id', storeId)
        .eq('remote_jid', remoteJid)
        .maybeSingle();

      if (existingConv) {
        const updateData: any = {
          last_message: lastMsgPreview,
          last_message_at: new Date().toISOString(),
          last_message_direction: 'outgoing',
          last_message_source: 'system',
          is_bot_active: false,
        };
        if (!existingConv.assigned_to) updateData.assigned_to = user.id;
        await supabase.from('whatsapp_conversations').update(updateData).eq('id', existingConv.id);
      } else {
        await supabase.from('whatsapp_conversations').insert({
          store_id: storeId,
          remote_jid: remoteJid,
          phone_number: phone,
          last_message: lastMsgPreview,
          last_message_at: new Date().toISOString(),
          last_message_direction: 'outgoing',
          last_message_source: 'system',
          assigned_to: user.id,
          is_bot_active: false,
        });
      }

      return new Response(JSON.stringify({
        success: true,
        messageId: evolutionMessageId,
        chatMessageId: chatMsg?.id,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========== EVOLUTION API (provider padrão) ==========
    // Buscar configuração Evolution API
    const { data: evolutionConfig, error: configError } = await supabase
      .from('evolution_config')
      .select('api_url, api_key')
      .eq('is_active', true)
      .single();

    if (configError || !evolutionConfig) {
      return new Response(JSON.stringify({ error: 'Evolution API não configurada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { api_url, api_key } = evolutionConfig;
    const apiUrl = api_url.replace(/\/+$/, '');

    // 🛡️ PAUSAR BOT VIA ignoreJids IMEDIATAMENTE (antes de enviar a mensagem)
    // ignoreJids é PERSISTENTE - diferente do changeStatus que reseta ao receber msg
    try {
      // 1. Buscar settings COMPLETO
      const settingsResp = await fetch(`${apiUrl}/openai/fetchSettings/${instance.instance_name}`, {
        method: 'GET',
        headers: { 'apikey': api_key },
      });
      if (settingsResp.ok) {
        const settingsData = await settingsResp.json();
        const rawSettings = Array.isArray(settingsData) ? settingsData[0] : settingsData;
        const s = rawSettings?.OpenaiSetting || rawSettings || {};
        const currentIgnoreJids: string[] = s.ignoreJids || [];

        console.log(`[whatsapp-chat-send] 🔍 Settings recebidos - openaiCredsId: "${s.openaiCredsId}", expire: ${s.expire}, openaiIdFallback: "${s.openaiIdFallback}", splitMessages: ${s.splitMessages}, timePerChar: ${s.timePerChar}, speechToText: ${s.speechToText}`);

        // 2. Adicionar JID se não estiver na lista
        if (!currentIgnoreJids.includes(remoteJid)) {
          const updatedJids = [...currentIgnoreJids, remoteJid];
          // Montar payload COMPLETO preservando todos os campos
          const payload: any = {
            openaiCredsId: s.openaiCredsId || s.openai_creds_id,
            expire: s.expire ?? 20,
            keywordFinish: s.keywordFinish || s.keyword_finish || '#SAIR',
            delayMessage: s.delayMessage || s.delay_message || 1000,
            unknownMessage: s.unknownMessage || s.unknown_message || '',
            listeningFromMe: s.listeningFromMe ?? s.listening_from_me ?? false,
            stopBotFromMe: s.stopBotFromMe ?? s.stop_bot_from_me ?? true,
            keepOpen: s.keepOpen ?? s.keep_open ?? false,
            debounceTime: s.debounceTime ?? s.debounce_time ?? 0,
            ignoreJids: updatedJids,
          };
          if (s.openaiIdFallback || s.openai_id_fallback) {
            payload.openaiIdFallback = s.openaiIdFallback || s.openai_id_fallback;
          }
          if (s.splitMessages !== undefined) payload.splitMessages = s.splitMessages;
          if (s.timePerChar !== undefined) payload.timePerChar = s.timePerChar;
          if (s.speechToText !== undefined) payload.speechToText = s.speechToText;

          console.log(`[whatsapp-chat-send] 📡 POST payload: ${JSON.stringify(payload)}`);

          const updateResp = await fetch(`${apiUrl}/openai/settings/${instance.instance_name}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': api_key },
            body: JSON.stringify(payload),
          });
          const updateBody = await updateResp.text();
          console.log(`[whatsapp-chat-send] 🛡️ ignoreJids atualizado: status=${updateResp.status}, response=${updateBody.slice(0, 300)}`);
        } else {
          console.log(`[whatsapp-chat-send] ℹ️ JID ${remoteJid} já está em ignoreJids`);
        }
      } else {
        console.error(`[whatsapp-chat-send] ❌ fetchSettings falhou: status=${settingsResp.status}`);
      }
    } catch (e) {
      console.error('[whatsapp-chat-send] ⚠️ Erro ao atualizar ignoreJids:', e);
    }

    // ========== REAÇÃO ==========
    if (messageType === 'reaction') {
      console.log(`[whatsapp-chat-send] Enviando reação ${reactionEmoji} para msg ${reactionEvolutionId}`);

      if (!reactionEvolutionId || !reactionEmoji) {
        return new Response(JSON.stringify({ error: 'Reação requer reactionEvolutionId e reactionEmoji' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Enviar reação via Evolution API
      const reactionResponse = await fetch(`${apiUrl}/message/sendReaction/${instance.instance_name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': api_key,
        },
        body: JSON.stringify({
          key: {
            remoteJid: remoteJid,
            fromMe: body.reactionFromMe || false,
            id: reactionEvolutionId,
          },
          reaction: reactionEmoji,
        }),
      });

      if (!reactionResponse.ok) {
        const errData = await reactionResponse.text();
        console.error('[whatsapp-chat-send] Erro ao enviar reação:', errData);
        return new Response(JSON.stringify({ error: 'Erro ao enviar reação', details: errData }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Atualizar reações no banco
      if (reactionMessageId) {
        const { data: existingMsg } = await supabase
          .from('whatsapp_chat_messages')
          .select('reactions')
          .eq('id', reactionMessageId)
          .single();

        const existingReactions = (existingMsg?.reactions as any[]) || [];
        const newReactions = [...existingReactions, { emoji: reactionEmoji, from: phone, from_me: true }];

        await supabase
          .from('whatsapp_chat_messages')
          .update({ reactions: newReactions })
          .eq('id', reactionMessageId);
      }

      console.log(`[whatsapp-chat-send] ✅ Reação ${reactionEmoji} enviada`);
      return new Response(JSON.stringify({ success: true, type: 'reaction' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========== MENSAGEM NORMAL (texto/mídia) ==========
    if (messageType === 'text' && !content) {
      return new Response(JSON.stringify({ error: 'Conteúdo é obrigatório para mensagens de texto' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[whatsapp-chat-send] Enviando ${messageType} para ${remoteJid}, Store: ${storeId}${quotedEvolutionId ? `, citando: ${quotedEvolutionId}` : ''}`);

    // 🛡️ PAUSAR BOT PRIMEIRO - antes de enviar a mensagem para evitar que a IA responda
    try {
      console.log(`[whatsapp-chat-send] ⏸️ Pausando bot ANTES do envio para ${remoteJid}...`);
      const { error: pauseError } = await supabase.functions.invoke('whatsapp-bot-pause', {
        body: {
          action: 'pause',
          storeId,
          instanceName: instance.instance_name,
          remoteJid,
          customerName: null,
        },
      });
      if (pauseError) {
        console.error('[whatsapp-chat-send] ⚠️ Erro ao pausar bot (pré-envio):', pauseError);
      } else {
        console.log(`[whatsapp-chat-send] ✅ Bot pausado ANTES do envio para ${remoteJid}`);
      }
    } catch (pauseErr) {
      console.error('[whatsapp-chat-send] ⚠️ Erro ao invocar whatsapp-bot-pause (pré-envio):', pauseErr);
    }

    // Construir payload base
    let endpoint: string;
    let payload: any = { number: phone };

    // Adicionar quoted message se existir
    if (quotedEvolutionId) {
      payload.quoted = {
        key: {
          remoteJid: remoteJid,
          fromMe: quotedFromMe || false,
          id: quotedEvolutionId,
        },
      };
    }

    if (messageType === 'image' && mediaUrl) {
      endpoint = `${apiUrl}/message/sendMedia/${instance.instance_name}`;
      payload.mediatype = 'image';
      payload.media = mediaUrl;
      payload.caption = content || '';
      payload.fileName = mediaFilename || 'image.jpg';
    } else if (messageType === 'video' && mediaUrl) {
      endpoint = `${apiUrl}/message/sendMedia/${instance.instance_name}`;
      payload.mediatype = 'video';
      payload.media = mediaUrl;
      payload.caption = content || '';
      payload.fileName = mediaFilename || 'video.mp4';
    } else if (messageType === 'audio' && mediaUrl) {
      endpoint = `${apiUrl}/message/sendWhatsAppAudio/${instance.instance_name}`;
      payload.audio = mediaUrl;
    } else if (messageType === 'document' && mediaUrl) {
      endpoint = `${apiUrl}/message/sendMedia/${instance.instance_name}`;
      payload.mediatype = 'document';
      payload.media = mediaUrl;
      payload.caption = content || '';
      payload.fileName = mediaFilename || 'document';
    } else {
      endpoint = `${apiUrl}/message/sendText/${instance.instance_name}`;
      payload.text = content;
    }

    console.log(`[whatsapp-chat-send] Endpoint: ${endpoint}`);

    const sendResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': api_key,
      },
      body: JSON.stringify(payload),
    });

    let sendData: any;
    try {
      sendData = await sendResponse.json();
    } catch {
      sendData = { error: 'Resposta inválida da Evolution API' };
    }

    if (!sendResponse.ok) {
      console.error('[whatsapp-chat-send] Erro Evolution:', sendData);
      return new Response(JSON.stringify({ error: 'Erro ao enviar mensagem', details: sendData }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const evolutionMessageId = sendData.key?.id || null;
    const phoneNumber = phone;

    // Transcrever áudio enviado (async, não bloqueia resposta)
    let audioTranscription: string | null = null;
    if (messageType === 'audio' && mediaUrl) {
      const correlationId = `send-${Date.now()}`;
      audioTranscription = await transcribeAudioFromUrl(mediaUrl, mediaMimetype || 'audio/ogg', correlationId);
    }

    // Salvar mensagem enviada em whatsapp_chat_messages
    const messageMetadata: Record<string, any> = {};
    if (audioTranscription) {
      messageMetadata.transcription = audioTranscription;
    }

    const insertData: any = {
      store_id: storeId,
      remote_jid: remoteJid,
      phone_number: phoneNumber,
      direction: 'outgoing',
      sender_name: user.user_metadata?.full_name || 'Atendente',
      content: content || null,
      message_type: messageType,
      media_url: mediaUrl || null,
      media_filename: mediaFilename || null,
      media_mimetype: mediaMimetype || null,
      evolution_message_id: evolutionMessageId,
      is_from_bot: false,
      is_read_by_attendant: true,
      timestamp: new Date().toISOString(),
      status: 'sent',
      ...(Object.keys(messageMetadata).length > 0 ? { metadata: messageMetadata } : {}),
    };

    // Salvar dados da citação
    if (quotedMessageId) {
      insertData.quoted_message_id = quotedMessageId;
    }
    if (quotedContent) {
      insertData.quoted_content = quotedContent;
    }

    const { data: chatMsg, error: chatError } = await supabase
      .from('whatsapp_chat_messages')
      .insert(insertData)
      .select('id')
      .single();

    if (chatError) {
      console.error('[whatsapp-chat-send] Erro ao salvar chat message:', chatError);
    }

    // Atualizar conversa
    const lastMsgPreview = messageType === 'text' 
      ? (content || '').slice(0, 200)
      : messageType === 'image' ? '📷 Imagem' 
      : messageType === 'video' ? '🎥 Vídeo'
      : messageType === 'audio' ? '🎵 Áudio'
      : messageType === 'document' ? '📄 Documento'
      : '📎 Mídia';

    // Primeiro, tentar atualizar conversa existente (incluindo assigned_to se ainda não atribuído)
    const { data: existingConv } = await supabase
      .from('whatsapp_conversations')
      .select('id, assigned_to')
      .eq('store_id', storeId)
      .eq('remote_jid', remoteJid)
      .maybeSingle();

    if (existingConv) {
      const updateData: any = {
        last_message: lastMsgPreview,
        last_message_at: new Date().toISOString(),
        last_message_direction: 'outgoing',
        last_message_source: 'system',
        is_bot_active: false, // Pausar IA ao enviar mensagem manual
      };
      // Auto-assign: atribuir atendente se conversa não tem responsável
      if (!existingConv.assigned_to) {
        updateData.assigned_to = user.id;
        console.log(`[whatsapp-chat-send] Auto-assign: atendente ${user.id} atribuído à conversa ${existingConv.id}`);
      }
      console.log(`[whatsapp-chat-send] IA pausada para conversa ${existingConv.id}`);
      const { error: convError } = await supabase
        .from('whatsapp_conversations')
        .update(updateData)
        .eq('id', existingConv.id);
      if (convError) {
        console.error('[whatsapp-chat-send] Erro ao atualizar conversa:', convError);
      }
    } else {
      // Criar nova conversa já com assigned_to e IA pausada
      const { error: convError } = await supabase
        .from('whatsapp_conversations')
        .insert({
          store_id: storeId,
          remote_jid: remoteJid,
          phone_number: phoneNumber,
          last_message: lastMsgPreview,
          last_message_at: new Date().toISOString(),
          last_message_direction: 'outgoing',
          last_message_source: 'system',
          assigned_to: user.id,
          is_bot_active: false,
        });
      if (convError) {
        console.error('[whatsapp-chat-send] Erro ao criar conversa:', convError);
      }
    }

    // Bot já foi pausado no início (antes do envio)

    console.log(`[whatsapp-chat-send] ✅ Mensagem ${messageType} enviada e salva`);

    return new Response(JSON.stringify({
      success: true,
      messageId: evolutionMessageId,
      chatMessageId: chatMsg?.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[whatsapp-chat-send] Erro:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Erro desconhecido' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
