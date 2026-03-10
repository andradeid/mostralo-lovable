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

  // Aceitar apenas POST (webhooks)
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const payload = await req.json();
    
    // Log do evento recebido (resumido)
    const eventType = payload.event || payload.type || 'unknown';
    const instanceId = payload.instanceId || payload.instance?.id || payload.id || 'unknown';
    const instanceName = payload.instance?.name || payload.instanceName || 'unknown';
    
    console.log(`[uazapi-webhook] 📥 Evento: ${eventType} | Instância: ${instanceName} (${instanceId})`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Processar por tipo de evento
    switch (eventType) {
      case 'messages': {
        // Mensagem recebida
        const message = payload.data || payload;
        const remoteJid = message.key?.remoteJid || message.remoteJid || '';
        const fromMe = message.key?.fromMe || false;
        const messageType = message.messageType || 'conversation';
        const content = message.message?.conversation 
          || message.message?.extendedTextMessage?.text 
          || message.body
          || '';
        const messageId = message.key?.id || message.id || '';

        // Ignorar mensagens de grupo/broadcast
        if (remoteJid.includes('@g.us') || remoteJid === 'status@broadcast') {
          console.log(`[uazapi-webhook] 🚫 Grupo/broadcast ignorado: ${remoteJid}`);
          break;
        }

        // Extrair número do telefone
        const phoneNumber = remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '');

        console.log(`[uazapi-webhook] 💬 Mensagem ${fromMe ? 'enviada' : 'recebida'}: ${phoneNumber} | Tipo: ${messageType} | Conteúdo: ${content.substring(0, 100)}`);

        // TODO: Fase 2 - Salvar em whatsapp_chat_messages e whatsapp_conversations
        // Por agora, apenas logamos para validar o formato dos dados
        
        // Registrar no webhook_logs para monitoramento
        await supabase.from('webhook_logs').insert({
          webhook_type: 'uazapi',
          source: `uazapi-${instanceName}`,
          status: 'success',
          payload: payload,
          event_type: eventType,
        }).then(({ error }) => {
          if (error) console.error('[uazapi-webhook] Erro ao salvar log:', error.message);
        });

        break;
      }

      case 'messages_update': {
        // Atualização de status de mensagem (entregue, lido, etc.)
        const updates = Array.isArray(payload.data) ? payload.data : [payload.data || payload];
        
        for (const update of updates) {
          const status = update.status || update.update?.status;
          const messageId = update.key?.id || update.id;
          console.log(`[uazapi-webhook] 📩 Status atualizado: ${messageId} → ${status}`);
        }

        // Log para monitoramento
        await supabase.from('webhook_logs').insert({
          webhook_type: 'uazapi',
          source: `uazapi-${instanceName}`,
          status: 'received',
          payload: payload,
          event_type: 'messages_update',
        });

        break;
      }

      case 'connection': {
        // Mudança de status de conexão
        const state = payload.data?.state || payload.state || 'unknown';
        const statusReason = payload.data?.statusReason || '';
        
        console.log(`[uazapi-webhook] 🔌 Conexão: ${instanceName} → ${state} (${statusReason})`);

        // Log para monitoramento
        await supabase.from('webhook_logs').insert({
          webhook_type: 'uazapi',
          source: `uazapi-${instanceName}`,
          status: 'received',
          payload: payload,
          event_type: 'connection',
        });

        break;
      }

      default: {
        console.log(`[uazapi-webhook] ℹ️ Evento não processado: ${eventType}`);
        
        // Logar eventos desconhecidos para análise
        await supabase.from('webhook_logs').insert({
          webhook_type: 'uazapi',
          source: `uazapi-${instanceName}`,
          status: 'received',
          payload: payload,
          event_type: eventType,
        });
      }
    }

    // Sempre responder 200 para o webhook não retentar
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[uazapi-webhook] ❌ Erro:', error);
    // Mesmo com erro, retornar 200 para evitar retentativas infinitas
    return new Response(JSON.stringify({ received: true, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
