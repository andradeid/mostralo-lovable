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

interface AnalysisResult {
  success?: boolean;
  description?: string;
  products?: Array<{
    name: string;
    price?: number;
    id?: string;
    slug?: string;
  }>;
  message?: string;
  error?: string;
}

// Normalizar telefone para WhatsApp
function normalizePhone(jid: string): string {
  // Extrair número do JID (5561999999999@s.whatsapp.net -> 5561999999999)
  const phone = jid.replace(/@.*$/, '');
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('55') && cleaned.length <= 11) {
    cleaned = '55' + cleaned;
  }
  return cleaned;
}

// Formatar valor monetário
function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Enviar mensagem via Evolution API
async function sendWhatsAppMessage(
  supabase: any,
  storeId: string,
  instanceName: string,
  remoteJid: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Buscar configuração Evolution API
    const { data: evolutionConfig, error: configError } = await supabase
      .from('evolution_config')
      .select('api_url, api_key')
      .eq('is_active', true)
      .single();

    if (configError || !evolutionConfig) {
      console.error('[sendWhatsAppMessage] Evolution API não configurada:', configError);
      return { success: false, error: 'Evolution API não configurada' };
    }

    const phone = normalizePhone(remoteJid);
    console.log(`📤 Enviando resposta para ${phone} via ${instanceName}`);

    // Enviar mensagem via Evolution API
    const response = await fetch(
      `${evolutionConfig.api_url}/message/sendText/${instanceName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionConfig.api_key,
        },
        body: JSON.stringify({
          number: phone,
          text: message,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[sendWhatsAppMessage] Erro Evolution API:', errorText);
      return { success: false, error: errorText };
    }

    const result = await response.json();
    console.log('✅ Mensagem enviada:', JSON.stringify(result).slice(0, 200));
    return { success: true };
  } catch (error) {
    console.error('[sendWhatsAppMessage] Erro:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

// Formatar mensagem de resposta com os produtos identificados
function formatResponseMessage(
  analysis: AnalysisResult,
  customerName: string,
  storeSlug?: string
): string {
  const greeting = customerName ? `Olá, ${customerName}! ` : '';
  
  // Se houve erro na análise
  if (analysis.error || !analysis.success) {
    return `${greeting}🔍 Recebi sua imagem, mas não consegui identificar os produtos claramente.\n\nPode me descrever o que você está procurando? 😊`;
  }

  // Se não identificou produtos
  if (!analysis.products || analysis.products.length === 0) {
    const desc = analysis.description || 'a imagem que você enviou';
    return `${greeting}🔍 Analisei ${desc}.\n\n${analysis.message || 'Não encontrei produtos correspondentes no nosso catálogo. Pode me dar mais detalhes?'} 😊`;
  }

  // Formatar lista de produtos identificados
  let message = `${greeting}🔍 Analisei a imagem que você enviou!\n\n`;
  
  if (analysis.description) {
    message += `📋 ${analysis.description}\n\n`;
  }
  
  message += `Identifiquei os seguintes itens:\n\n`;

  analysis.products.forEach((product, index) => {
    const price = product.price ? ` - ${formatCurrency(product.price)}` : '';
    message += `${index + 1}. *${product.name}*${price}\n`;
    
    // Adicionar link do produto se tiver slug
    if (storeSlug && product.slug) {
      message += `   👉 https://mostralo.com.br/loja/${storeSlug}/produto/${product.slug}\n`;
    }
  });

  message += `\nDeseja que eu adicione algum ao carrinho? 🛒`;
  
  return message;
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

    // Extrair dados do cliente
    const remoteJid = payload.data?.key?.remoteJid;
    const customerName = payload.data?.pushName || '';

    if (!remoteJid) {
      console.error('❌ remoteJid não encontrado');
      return new Response(JSON.stringify({ status: 'error', reason: 'no_remote_jid' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Conectar ao Supabase para buscar a loja
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar store_id e slug pelo instance_name na tabela whatsapp_instances
    const { data: instanceData, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('store_id, stores(slug)')
      .eq('instance_name', instanceName)
      .single();

    if (instanceError || !instanceData) {
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

    const storeId = instanceData.store_id;
    const storeSlug = (instanceData as any).stores?.slug;

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

    let agentResult: AnalysisResult = { success: false };

    if (!agentResponse.ok) {
      const errorText = await agentResponse.text();
      console.error('❌ Erro no product-search-agent:', errorText);
      agentResult = { success: false, error: errorText.slice(0, 200) };
    } else {
      agentResult = await agentResponse.json();
    }
    
    console.log('📊 Resultado da análise:', {
      storeId,
      instance: instanceName,
      success: agentResult.success,
      productsCount: agentResult.products?.length || 0,
    });

    // Formatar e enviar resposta para o cliente
    const responseMessage = formatResponseMessage(agentResult, customerName, storeSlug);
    
    const sendResult = await sendWhatsAppMessage(
      supabase,
      storeId,
      instanceName,
      remoteJid,
      responseMessage
    );

    if (!sendResult.success) {
      console.error('❌ Falha ao enviar resposta:', sendResult.error);
    }

    // Retornar resultado
    return new Response(JSON.stringify({
      status: 'success',
      storeId,
      instance: instanceName,
      analysis: agentResult,
      messageSent: sendResult.success,
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
