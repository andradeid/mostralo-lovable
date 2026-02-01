// WhatsApp Media Webhook - Recebe imagens da Evolution API e processa via GPT-4o Vision
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName?: string;
    message?: {
      imageMessage?: {
        url?: string;
        mimetype?: string;
        caption?: string;
        jpegThumbnail?: string;
      };
      documentMessage?: {
        url?: string;
        mimetype?: string;
        fileName?: string;
      };
      conversation?: string;
      extendedTextMessage?: {
        text?: string;
      };
    };
    messageType?: string;
    messageTimestamp?: number;
    base64?: string; // Quando WEBHOOK_BASE64=true
  };
  destination?: string;
  date_time?: string;
  sender?: string;
  server_url?: string;
  apikey?: string;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const instanceFromQuery = url.searchParams.get('instance');

  try {
    const payload: EvolutionWebhookPayload = await req.json();
    
    console.log('📥 Webhook recebido:', {
      event: payload.event,
      instance: payload.instance || instanceFromQuery,
      messageType: payload.data?.messageType,
      hasBase64: !!payload.data?.base64,
      remoteJid: payload.data?.key?.remoteJid,
    });

    // Ignorar mensagens que não são de mídia ou que são enviadas por nós
    if (payload.event !== 'messages.upsert') {
      console.log('⏭️ Evento ignorado:', payload.event);
      return new Response(JSON.stringify({ status: 'ignored', reason: 'not_message_event' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Ignorar mensagens enviadas por nós mesmos
    if (payload.data?.key?.fromMe) {
      console.log('⏭️ Mensagem própria ignorada');
      return new Response(JSON.stringify({ status: 'ignored', reason: 'from_me' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar se é uma mensagem de imagem
    const messageType = payload.data?.messageType;
    const isImageMessage = messageType === 'imageMessage' || 
                          !!payload.data?.message?.imageMessage;

    if (!isImageMessage) {
      console.log('⏭️ Não é mensagem de imagem:', messageType);
      return new Response(JSON.stringify({ status: 'ignored', reason: 'not_image' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Obter dados da imagem
    const imageData = payload.data?.message?.imageMessage;
    const base64Data = payload.data?.base64;

    if (!base64Data && !imageData?.url) {
      console.error('❌ Sem dados de imagem (base64 ou URL)');
      return new Response(JSON.stringify({ 
        status: 'error', 
        reason: 'no_image_data',
        hint: 'Verifique se WEBHOOK_BASE64 está habilitado na Evolution API'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Identificar a instância/loja
    const instanceName = payload.instance || instanceFromQuery;
    
    if (!instanceName) {
      console.error('❌ Instância não identificada');
      return new Response(JSON.stringify({ status: 'error', reason: 'no_instance' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Conectar ao Supabase para buscar a loja
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar store_id pelo instance_name
    const { data: botConfig, error: configError } = await supabase
      .from('store_bot_config')
      .select('store_id')
      .eq('instance_name', instanceName)
      .single();

    if (configError || !botConfig) {
      console.error('❌ Loja não encontrada para instância:', instanceName);
      return new Response(JSON.stringify({ 
        status: 'error', 
        reason: 'store_not_found',
        instance: instanceName
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const storeId = botConfig.store_id;

    // Verificar se o módulo AI Vision está habilitado para esta loja
    const { data: moduleAccess, error: moduleError } = await supabase
      .from('store_modules')
      .select(`
        id,
        modules!inner (key)
      `)
      .eq('store_id', storeId)
      .eq('modules.key', 'ai_vision')
      .single();

    if (moduleError || !moduleAccess) {
      console.log('⚠️ Módulo AI Vision não habilitado para loja:', storeId);
      return new Response(JSON.stringify({ 
        status: 'ignored', 
        reason: 'ai_vision_not_enabled',
        storeId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Módulo AI Vision ativo - processando imagem para loja:', storeId);

    // Preparar dados para o product-search-agent
    const imagePayload = {
      image_data: {
        base64: base64Data || null,
        url: imageData?.url || null,
        mimetype: imageData?.mimetype || 'image/jpeg',
      },
      image_context: imageData?.caption || 'Imagem enviada pelo cliente',
    };

    // Chamar o product-search-agent para análise
    const searchAgentUrl = `${supabaseUrl}/functions/v1/product-search-agent`;
    
    const agentResponse = await fetch(searchAgentUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        storeId,
        functionName: 'analyze_image',
        functionArguments: imagePayload,
      }),
    });

    if (!agentResponse.ok) {
      const errorText = await agentResponse.text();
      console.error('❌ Erro no product-search-agent:', errorText);
      return new Response(JSON.stringify({ 
        status: 'error', 
        reason: 'agent_error',
        details: errorText.slice(0, 200)
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const agentResult = await agentResponse.json();
    
    console.log('✅ Imagem processada com sucesso:', {
      storeId,
      instance: instanceName,
      resultPreview: JSON.stringify(agentResult).slice(0, 200),
    });

    // Retornar resultado para a Evolution API/OpenAI Assistant
    return new Response(JSON.stringify({
      status: 'success',
      storeId,
      instance: instanceName,
      analysis: agentResult,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    return new Response(JSON.stringify({
      status: 'error',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
