import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
...
    // ========== Send Media ==========
    if (['image', 'video', 'audio', 'document'].includes(messageType)) {
      const mediaBody: Record<string, unknown> = {
        number: phoneNumber,
        type: messageType,
        file: mediaUrl,
        text: content || '',
        mimetype: mediaMimetype || 'application/octet-stream',
      };

      if (messageType === 'document') {
        mediaBody.docName = mediaFilename || 'file';
      }

      if (quotedEvolutionId) {
        mediaBody.replyid = quotedEvolutionId;
      }

      console.log('[master-whatsapp-chat-send] Enviando mídia:', {
        number: phoneNumber,
        type: messageType,
        file: mediaUrl,
        text: content || '',
        docName: messageType === 'document' ? mediaBody.docName : undefined,
      });

      const resp = await fetch(`${apiUrl}/send/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'token': token },
        body: JSON.stringify(mediaBody),
      });

      const respBody = await resp.text();
      console.log('[master-whatsapp-chat-send] Resposta envio mídia:', resp.status, respBody);
      let evolutionId: string | null = null;
      try {
        const parsed = JSON.parse(respBody);
        evolutionId = parsed?.id || parsed?.messageid || parsed?.key?.id || null;
      } catch { /* ignore */ }

      if (resp.ok) {
        await persistOutgoingMessage(
          supabase, config.id, remoteJid, phoneNumber, content || mediaFilename || 'Mídia', messageType, user.id,
          evolutionId, undefined, mediaUrl, mediaFilename, mediaMimetype
        );
      }

      return new Response(JSON.stringify({ success: resp.ok, messageId: evolutionId, response: respBody }), {
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
    metadata: extraMetadata || {},
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
