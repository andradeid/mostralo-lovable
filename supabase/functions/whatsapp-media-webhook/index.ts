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

// Função para obter base64 da imagem via Evolution API (fallback)
async function getBase64FromEvolution(
  supabase: any,
  instanceName: string,
  messageId: string,
  correlationId: string
): Promise<{ success: boolean; base64?: string; error?: string }> {
  try {
    console.log(`[${correlationId}] 🔄 Buscando base64 via Evolution API para mensagem ${messageId}`);

    // Buscar configuração Evolution API
    const { data: evolutionConfig, error: configError } = await supabase
      .from('evolution_config')
      .select('api_url, api_key')
      .eq('is_active', true)
      .single();

    if (configError || !evolutionConfig) {
      console.error(`[${correlationId}] ❌ Evolution API não configurada:`, configError);
      return { success: false, error: 'Evolution API não configurada' };
    }

    // Normalizar api_url removendo / no final
    const apiUrl = evolutionConfig.api_url.replace(/\/+$/, '');

    // Chamar endpoint getBase64FromMediaMessage
    const response = await fetch(
      `${apiUrl}/chat/getBase64FromMediaMessage/${instanceName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionConfig.api_key,
        },
        body: JSON.stringify({
          message: { key: { id: messageId } },
          convertToMp4: false,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${correlationId}] ❌ Erro Evolution getBase64:`, errorText);
      return { success: false, error: `Evolution API retornou ${response.status}: ${errorText.slice(0, 100)}` };
    }

    const result = await response.json();
    console.log(`[${correlationId}] 📦 Resposta Evolution getBase64:`, JSON.stringify(result).slice(0, 200));

    // Extrair base64 de forma tolerante (pode vir em diferentes formatos)
    let base64 = 
      result.base64 || 
      result.data?.base64 || 
      result.media?.base64 ||
      result.message?.base64 ||
      null;

    if (!base64) {
      console.warn(`[${correlationId}] ⚠️ Evolution não retornou base64. Response keys:`, Object.keys(result));
      return { 
        success: false, 
        error: 'Evolution API não retornou base64. Habilite WEBHOOK_BASE64=true na instância.' 
      };
    }

    // Remover prefixo data:image/... se existir
    if (base64.startsWith('data:')) {
      base64 = base64.replace(/^data:[^;]+;base64,/, '');
    }

    console.log(`[${correlationId}] ✅ Base64 obtido via Evolution API (${base64.length} chars)`);
    return { success: true, base64 };

  } catch (error) {
    console.error(`[${correlationId}] ❌ Erro ao obter base64 da Evolution:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

interface AnalysisResult {
  success?: boolean;
  description?: string;
  analysis?: string;
  products?: Array<{
    name: string;
    identified_name?: string;
    price?: number;
    id?: string;
    slug?: string;
    link?: string;
    in_stock?: boolean;
    stock_quantity?: number | string;
    found_in_catalog?: boolean;
    is_similar?: boolean;
    original_search?: string;
  }>;
  summary?: {
    identified: number;
    found_in_catalog: number;
    in_stock: number;
    out_of_stock: number;
    not_found: number;
  };
  message?: string;
  error?: string;
  hint?: string;
  debug?: string;
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

// Formatar mensagem de resposta com os produtos identificados e informações de estoque
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

  // Separar produtos por status
  // Produtos exatos (não similares) disponíveis
  const exactInStock = analysis.products.filter(p => p.found_in_catalog && p.in_stock && !p.is_similar);
  // Produtos similares disponíveis
  const similarInStock = analysis.products.filter(p => p.found_in_catalog && p.in_stock && p.is_similar);
  // Produtos sem estoque
  const outOfStockProducts = analysis.products.filter(p => p.found_in_catalog && !p.in_stock);
  // Produtos não encontrados
  const notFoundProducts = analysis.products.filter(p => !p.found_in_catalog);

  // Produtos EXATOS disponíveis em estoque
  if (exactInStock.length > 0) {
    message += `✅ *Disponíveis em estoque:*\n\n`;
    exactInStock.forEach((product, index) => {
      const price = product.price ? ` - ${formatCurrency(product.price)}` : '';
      message += `${index + 1}. *${product.name}*${price}\n`;
      
      if (product.link) {
        message += `   👉 ${product.link}\n`;
      } else if (storeSlug && product.slug) {
        message += `   👉 https://mostralo.com.br/loja/${storeSlug}/produto/${product.slug}\n`;
      }
    });
    message += '\n';
  }

  // Produtos SIMILARES disponíveis (mesmo princípio ativo)
  if (similarInStock.length > 0) {
    // Se não achou o exato mas achou similar
    if (exactInStock.length === 0) {
      message += `❌ O produto exato da imagem não foi encontrado.\n\n`;
    }
    
    message += `🔄 *Produtos similares disponíveis:*\n\n`;
    similarInStock.forEach((product, index) => {
      const price = product.price ? ` - ${formatCurrency(product.price)}` : '';
      // Mostrar o que foi buscado vs o que foi encontrado
      const searchInfo = product.original_search && product.original_search !== product.name 
        ? ` _(similar a ${product.original_search})_` 
        : '';
      message += `${index + 1}. *${product.name}*${price}${searchInfo}\n`;
      
      if (product.link) {
        message += `   👉 ${product.link}\n`;
      } else if (storeSlug && product.slug) {
        message += `   👉 https://mostralo.com.br/loja/${storeSlug}/produto/${product.slug}\n`;
      }
    });
    message += '\n';
  }

  // Produtos sem estoque
  if (outOfStockProducts.length > 0) {
    message += `⚠️ *Sem estoque no momento:*\n`;
    outOfStockProducts.forEach((product) => {
      message += `• ${product.name}\n`;
    });
    message += '\n';
  }

  // Produtos não encontrados no catálogo (nem exato, nem similar)
  if (notFoundProducts.length > 0) {
    message += `❌ *Não encontrado no catálogo:*\n`;
    notFoundProducts.forEach((product) => {
      const name = product.identified_name || product.name;
      message += `• ${name}\n`;
    });
    message += '\n';
  }

  // CTA baseado no que foi encontrado
  const totalAvailable = exactInStock.length + similarInStock.length;
  if (totalAvailable > 0) {
    message += `Clique no link acima para ver mais detalhes e finalizar sua compra! 🛒`;
  } else if (outOfStockProducts.length > 0) {
    message += `Posso avisar quando os produtos estiverem disponíveis! 📲`;
  } else {
    message += `Posso ajudar a encontrar algo parecido? 🔍`;
  }
  
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
    
    // Identificar a instância primeiro para criar correlation ID
    const instanceName = payload.instance || instanceFromQuery || 'unknown';
    const messageId = payload.data?.key?.id || 'no-id';
    const correlationId = `${instanceName}:${messageId.slice(-8)}`;
    
    console.log(`[${correlationId}] 📥 Webhook recebido:`, {
      event: payload.event,
      instance: instanceName,
      messageType: payload.data?.messageType,
      hasBase64: !!payload.data?.base64,
      hasUrl: !!payload.data?.message?.imageMessage?.url,
      remoteJid: payload.data?.key?.remoteJid,
    });

    // Ignorar mensagens que não são de mídia ou que são enviadas por nós
    if (payload.event !== 'messages.upsert') {
      console.log(`[${correlationId}] ⏭️ Evento ignorado:`, payload.event);
      return new Response(JSON.stringify({ status: 'ignored', reason: 'not_message_event' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Ignorar mensagens enviadas por nós mesmos
    if (payload.data?.key?.fromMe) {
      console.log(`[${correlationId}] ⏭️ Mensagem própria ignorada`);
      return new Response(JSON.stringify({ status: 'ignored', reason: 'from_me' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar se é uma mensagem de imagem
    const messageType = payload.data?.messageType;
    const isImageMessage = messageType === 'imageMessage' || 
                          !!payload.data?.message?.imageMessage;

    if (!isImageMessage) {
      console.log(`[${correlationId}] ⏭️ Não é mensagem de imagem:`, messageType);
      return new Response(JSON.stringify({ status: 'ignored', reason: 'not_image' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!instanceName || instanceName === 'unknown') {
      console.error(`[${correlationId}] ❌ Instância não identificada`);
      return new Response(JSON.stringify({ status: 'error', reason: 'no_instance' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extrair dados do cliente
    const remoteJid = payload.data?.key?.remoteJid;
    const customerName = payload.data?.pushName || '';

    if (!remoteJid) {
      console.error(`[${correlationId}] ❌ remoteJid não encontrado`);
      return new Response(JSON.stringify({ status: 'error', reason: 'no_remote_jid' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Conectar ao Supabase para buscar a loja
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obter dados da imagem
    const imageData = payload.data?.message?.imageMessage;
    let base64Data = payload.data?.base64;
    let imageSource = base64Data ? 'webhook_base64' : 'none';

    // Se não temos base64 no payload, tentar obter via Evolution API
    if (!base64Data && imageData?.url) {
      console.log(`[${correlationId}] ⚠️ Base64 não veio no webhook, tentando via Evolution API...`);
      
      const evolutionResult = await getBase64FromEvolution(
        supabase,
        instanceName,
        messageId,
        correlationId
      );

      if (evolutionResult.success && evolutionResult.base64) {
        base64Data = evolutionResult.base64;
        imageSource = 'evolution_getBase64';
        console.log(`[${correlationId}] ✅ Base64 obtido via Evolution API`);
      } else {
        console.warn(`[${correlationId}] ⚠️ Fallback falhou: ${evolutionResult.error}`);
        // Vamos tentar continuar mesmo assim, mas provavelmente vai falhar no OpenAI
      }
    }

    // Verificar se temos alguma forma de acessar a imagem
    if (!base64Data && (!imageData?.url || imageData.url.includes('mmg.whatsapp.net'))) {
      console.error(`[${correlationId}] ❌ Sem dados de imagem válidos (base64 ou URL acessível)`);
      return new Response(JSON.stringify({ 
        status: 'error', 
        reason: 'no_valid_image_data',
        hint: 'Habilite WEBHOOK_BASE64=true na configuração do webhook da Evolution API',
        correlationId,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[${correlationId}] 📸 Fonte da imagem: ${imageSource}`);

    // Buscar store_id e slug pelo instance_name na tabela whatsapp_instances
    const { data: instanceData, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('store_id, stores(slug)')
      .eq('instance_name', instanceName)
      .single();

    if (instanceError || !instanceData) {
      console.error(`[${correlationId}] ❌ Loja não encontrada para instância:`, instanceName);
      return new Response(JSON.stringify({ 
        status: 'error', 
        reason: 'store_not_found',
        instance: instanceName,
        correlationId,
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
      console.log(`[${correlationId}] ⚠️ Módulo AI Vision não habilitado para loja:`, storeId);
      return new Response(JSON.stringify({ 
        status: 'ignored', 
        reason: 'ai_vision_not_enabled',
        storeId,
        correlationId,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[${correlationId}] ✅ Módulo AI Vision ativo - processando imagem para loja:`, storeId);

    // Preparar dados para o product-search-agent (sempre enviar base64 quando disponível)
    const imagePayload = {
      image_data: {
        base64: base64Data || null,
        url: base64Data ? null : imageData?.url, // Não enviar URL se temos base64
        mimetype: imageData?.mimetype || 'image/jpeg',
      },
      image_context: imageData?.caption || 'Imagem enviada pelo cliente',
    };

    console.log(`[${correlationId}] 📤 Chamando product-search-agent...`, {
      hasBase64: !!imagePayload.image_data.base64,
      hasUrl: !!imagePayload.image_data.url,
      context: imagePayload.image_context?.slice(0, 50),
    });

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
      console.error(`[${correlationId}] ❌ Erro no product-search-agent:`, errorText);
      agentResult = { success: false, error: errorText.slice(0, 200) };
    } else {
      agentResult = await agentResponse.json();
    }
    
    console.log(`[${correlationId}] 📊 Resultado da análise:`, {
      storeId,
      instance: instanceName,
      success: agentResult.success,
      productsCount: agentResult.products?.length || 0,
      hasAnalysis: !!agentResult.analysis,
      imageSource,
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
      console.error(`[${correlationId}] ❌ Falha ao enviar resposta:`, sendResult.error);
    } else {
      console.log(`[${correlationId}] ✅ Resposta enviada com sucesso para o cliente`);
    }

    // Retornar resultado
    return new Response(JSON.stringify({
      status: 'success',
      storeId,
      instance: instanceName,
      analysis: agentResult,
      messageSent: sendResult.success,
      imageSource,
      correlationId,
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
