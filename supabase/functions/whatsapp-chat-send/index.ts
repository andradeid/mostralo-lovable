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
    } = body;

    if (!storeId || !remoteJid) {
      return new Response(JSON.stringify({ error: 'Parâmetros obrigatórios: storeId, remoteJid' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar instância da loja
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('instance_name, status')
      .eq('store_id', storeId)
      .single();

    if (instanceError || !instance) {
      return new Response(JSON.stringify({ error: 'Instância WhatsApp não encontrada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (instance.status !== 'connected') {
      return new Response(JSON.stringify({ error: 'WhatsApp não está conectado' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
    const phone = normalizePhoneForWhatsApp(remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', ''));

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

    // Salvar mensagem enviada em whatsapp_chat_messages
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

    const { error: convError } = await supabase
      .from('whatsapp_conversations')
      .upsert({
        store_id: storeId,
        remote_jid: remoteJid,
        phone_number: phoneNumber,
        last_message: lastMsgPreview,
        last_message_at: new Date().toISOString(),
        last_message_direction: 'outgoing',
      }, {
        onConflict: 'store_id,remote_jid',
      });

    if (convError) {
      console.error('[whatsapp-chat-send] Erro ao atualizar conversa:', convError);
    }

    // Pausar o bot para este contato
    await supabase
      .from('whatsapp_paused_contacts')
      .upsert({
        store_id: storeId,
        remote_jid: remoteJid,
        paused_at: new Date().toISOString(),
        paused_by: 'manual_chat',
        reason: 'Atendente respondeu via chat',
      }, {
        onConflict: 'store_id,remote_jid',
      });

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
