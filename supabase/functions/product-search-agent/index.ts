// Product Search Agent - v2.0.0
// Edge Function para consultas em tempo real ao banco de produtos
// Usado pelo Assistente Inteligente v2 via Function Calling da OpenAI
// Adicionado: Suporte a análise de imagens (AI Vision Plus) + Tracking de uso OpenAI

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logOpenAIUsage, estimateTokens, calculateImageTokens } from "../_shared/openai-usage.ts";
import { getPhoneVariants } from "../_shared/phoneUtils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ========================================
// CACHE DE DEDUPLICAÇÃO - Previne mensagens duplicadas
// ========================================
const DEDUP_CACHE_TTL_MS = 10000; // 10 segundos
const IMAGE_DEDUP_TTL_MS = 120000; // 2 minutos
const dedupCache = new Map<string, number>();
const imageDedupCache = new Map<string, number>();

// Limpar entradas expiradas do cache periodicamente
function cleanupDedupCache() {
  const now = Date.now();
  for (const [key, timestamp] of dedupCache.entries()) {
    if (now - timestamp > DEDUP_CACHE_TTL_MS) {
      dedupCache.delete(key);
    }
  }

  for (const [key, timestamp] of imageDedupCache.entries()) {
    if (now - timestamp > IMAGE_DEDUP_TTL_MS) {
      imageDedupCache.delete(key);
    }
  }
}

// Gerar chave única para deduplicação
function getDedupKey(storeId: string, remoteJid: string | null, functionName: string, query: string): string {
  return `${storeId}:${remoteJid || 'unknown'}:${functionName}:${query}`.toLowerCase();
}

function getImageDedupKey(storeId: string, remoteJid: string | null, productIdentifier: string): string {
  return `${storeId}:${remoteJid || 'unknown'}:image:${productIdentifier}`.toLowerCase();
}

// Verificar se é chamada duplicada
function isDuplicateCall(key: string): boolean {
  cleanupDedupCache();
  const lastCall = dedupCache.get(key);
  if (lastCall && Date.now() - lastCall < DEDUP_CACHE_TTL_MS) {
    console.log(`[product-search-agent] ⚠️ Chamada duplicada detectada: ${key}`);
    return true;
  }
  dedupCache.set(key, Date.now());
  return false;
}

function shouldSkipImageSend(imageKey: string): boolean {
  cleanupDedupCache();
  const lastSent = imageDedupCache.get(imageKey);
  if (lastSent && Date.now() - lastSent < IMAGE_DEDUP_TTL_MS) {
    console.log(`[product-search-agent] ⚠️ Imagem duplicada suprimida: ${imageKey}`);
    return true;
  }

  imageDedupCache.set(imageKey, Date.now());
  return false;
}

interface FunctionCallRequest {
  function: string;
  args: Record<string, any>;
  storeId: string;
}

// ========================================
// HELPER: Gerar prompt de Vision dinâmico por segmento
// ========================================
function buildVisionPrompt(segment: string, imageContext?: string): string {
  const baseInstructions = `Você é um assistente especializado em identificar produtos em imagens.

INSTRUÇÕES GERAIS:
1. Identifique os produtos/itens visíveis na imagem
2. Seja preciso nos nomes e especificações
3. NÃO invente produtos que não estão visíveis
4. IGNORE dados pessoais se houver
5. NUNCA faça diagnósticos ou dê orientações médicas`;

  const segmentPrompts: Record<string, string> = {
    'saude-e-bem-estar': `${baseInstructions}

FOCO: Medicamentos, produtos de saúde, cosméticos, suplementos.

CLASSIFICAÇÃO DE DOCUMENTO (OBRIGATÓRIO na primeira linha):
Identifique o tipo de documento na imagem e retorne uma das opções:
- RECEITA_CONTROLADA: Se for receita com tarja preta (controlados especiais) ou que menciona medicamentos como: clonazepam, diazepam, alprazolam, lorazepam, zolpidem, bromazepam, rivotril, lexotan, frontal, midazolam, codeína, tramadol, morfina, fentanil, oxicodona, metilfenidato, ritalina, concerta, anfetamina, fenobarbital, fluoxetina, sertralina, escitalopram
- RECEITA_RETIDA: Se for receita de antibiótico (amoxicilina, azitromicina, cefalexina, ciprofloxacino, levofloxacino, etc.) ou outros medicamentos com tarja vermelha que precisam de retenção de receita
- RECEITA_SIMPLES: Se for receita médica comum sem necessidade de retenção
- PRODUTO: Se for foto de embalagem, caixa ou produto (não é receita)

FORMATO DE RESPOSTA OBRIGATÓRIO:
[TIPO_DOCUMENTO: RECEITA_CONTROLADA|RECEITA_RETIDA|RECEITA_SIMPLES|PRODUTO]

1. [Nome do medicamento/produto] [dosagem/quantidade]
2. ...

EXEMPLO CORRETO (receita controlada):
[TIPO_DOCUMENTO: RECEITA_CONTROLADA]

1. Clonazepam 2mg
2. Alprazolam 0,5mg`,

    'alimentacao-e-bebidas': `${baseInstructions}

FOCO: Pratos, bebidas, ingredientes, cardápios, alimentos.

FORMATO DE RESPOSTA OBRIGATÓRIO:
[TIPO_DOCUMENTO: PRODUTO]

1. [Nome do prato/bebida/alimento] [tamanho/porção se visível]
2. ...

Identifique ingredientes principais quando possível.
Se for um cardápio, liste os itens visíveis.`,

    'pet-shop': `${baseInstructions}

FOCO: Rações, petiscos, acessórios, medicamentos veterinários, produtos para pets.

FORMATO DE RESPOSTA OBRIGATÓRIO:
[TIPO_DOCUMENTO: PRODUTO]

1. [Nome do produto] [peso/quantidade]
2. ...

Inclua: marca, sabor, tipo de animal (cão, gato, pássaro, etc) quando visível.`,

    'suplementos': `${baseInstructions}

FOCO: Suplementos alimentares, vitaminas, proteínas, pré-treinos, creatina, BCAA.

FORMATO DE RESPOSTA OBRIGATÓRIO:
[TIPO_DOCUMENTO: PRODUTO]

1. [Nome do suplemento] [dosagem/peso] [sabor se visível]
2. ...

Inclua: marca e especificações quando visíveis.`,

    'moda-e-vestuario': `${baseInstructions}

FOCO: Roupas, calçados, acessórios de moda.

FORMATO DE RESPOSTA OBRIGATÓRIO:
[TIPO_DOCUMENTO: PRODUTO]

1. [Tipo de peça] [cor/estampa] [tamanho se visível]
2. ...

Inclua: marca, material e detalhes relevantes quando visíveis.`,

    'generico': `${baseInstructions}

Identifique todos os produtos visíveis na imagem.

FORMATO DE RESPOSTA OBRIGATÓRIO:
[TIPO_DOCUMENTO: PRODUTO]

1. [Nome do produto] [especificações relevantes]
2. ...`
  };

  // Mapear segmentos alternativos para os principais
  const segmentMapping: Record<string, string> = {
    'saude-e-bem-estar': 'saude-e-bem-estar',
    'farmacia': 'saude-e-bem-estar',
    'drogaria': 'saude-e-bem-estar',
    'alimentacao-e-bebidas': 'alimentacao-e-bebidas',
    'restaurante': 'alimentacao-e-bebidas',
    'lanchonete': 'alimentacao-e-bebidas',
    'pizzaria': 'alimentacao-e-bebidas',
    'pet-shop': 'pet-shop',
    'pet': 'pet-shop',
    'animais': 'pet-shop',
    'suplementos': 'suplementos',
    'fitness': 'suplementos',
    'academia': 'suplementos',
    'moda-e-vestuario': 'moda-e-vestuario',
    'moda': 'moda-e-vestuario',
    'roupas': 'moda-e-vestuario',
    'calcados': 'moda-e-vestuario',
  };

  const normalizedSegment = segment?.toLowerCase() || 'generico';
  const mappedSegment = segmentMapping[normalizedSegment] || 'generico';
  const prompt = segmentPrompts[mappedSegment] || segmentPrompts['generico'];
  
  return imageContext ? `${prompt}\n\nContexto adicional do cliente: ${imageContext}` : prompt;
}

// Helper para verificar se segmento é de saúde (para lógica de receitas controladas)
function isHealthSegment(segment: string): boolean {
  const healthSegments = ['saude-e-bem-estar', 'farmacia', 'drogaria'];
  return healthSegments.includes(segment?.toLowerCase() || '');
}

serve(async (req) => {
  const startTime = Date.now();
  console.log(`[product-search-agent] ⏱️ Requisição iniciada: ${new Date().toISOString()}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Obter storeId da query string ou do body
    const url = new URL(req.url);
    let storeId = url.searchParams.get('storeId');
    
    let body: any = {};
    const contentType = req.headers.get('content-type') || '';
    
    // Tentar ler o body de forma segura
    try {
      const rawBody = await req.text();
      console.log(`[product-search-agent] 📥 Raw body recebido:`, rawBody.slice(0, 500));
      
      if (rawBody && rawBody.trim()) {
        body = JSON.parse(rawBody);
      }
    } catch (parseError) {
      console.error(`[product-search-agent] ⚠️ Erro ao parsear body:`, parseError);
    }
    
    // Log do payload recebido para debug
    console.log(`[product-search-agent] 📦 Payload processado:`, JSON.stringify(body, null, 2));
    
    // Extrair argumentos primeiro para poder usar na extração de sessão
    const rawArgs = body.functionArguments || body.args || body.arguments || body.parameters || {};
    const parsedArgs = typeof rawArgs === 'string' ? JSON.parse(rawArgs) : rawArgs;
    
    // Extrair dados da sessão WhatsApp para envio de imagens
    // Suporta múltiplos formatos da Evolution API + dados dentro de functionArguments
    let instanceName = 
      body.instanceName ||
      body.instance?.instanceName ||
      (typeof body.instance === 'string' ? body.instance : null) ||
      body.key?.instance ||
      body.serverUrl?.split('/')?.pop() ||
      parsedArgs?.instanceName ||  // Também buscar em args
      null;
    
    // Tentar extrair do evento se disponível
    if (!instanceName && body.event) {
      const eventParts = body.event?.split('/');
      if (eventParts?.length > 0) {
        instanceName = eventParts[0];
      }
    }
    
    // remoteJid pode vir no body root OU dentro de functionArguments
    let remoteJid = 
      body.remoteJid || 
      body.key?.remoteJid || 
      body.data?.key?.remoteJid ||
      body.sender ||
      parsedArgs?.remoteJid ||  // IMPORTANTE: buscar em functionArguments
      null;
    
    // pushName para personalização (também pode vir em args)
    const pushName = body.pushName || parsedArgs?.pushName || null;
    
    if (instanceName && remoteJid) {
      console.log(`[product-search-agent] 📱 Sessão WhatsApp detectada: ${instanceName} -> ${remoteJid} (pushName: ${pushName})`);
    } else {
      console.log(`[product-search-agent] ⚠️ Dados de sessão WhatsApp parciais. instanceName: ${instanceName}, remoteJid: ${remoteJid}`);
      console.log(`[product-search-agent] 🔍 Campos no body:`, Object.keys(body));
      console.log(`[product-search-agent] 🔍 Campos em args:`, Object.keys(parsedArgs));
    }
    
    if (!storeId && body.storeId) {
      storeId = body.storeId;
    }

    if (!storeId) {
      console.error(`[product-search-agent] ❌ storeId não fornecido`);
      return new Response(JSON.stringify({ 
        error: 'storeId é obrigatório' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`[product-search-agent] 🏪 storeId: ${storeId}`);
    
    // Fallback: buscar instanceName da tabela whatsapp_instances se não veio no payload
    if (!instanceName && remoteJid) {
      console.log(`[product-search-agent] 🔍 Buscando instanceName via storeId...`);
      const { data: whatsappInstance } = await supabase
        .from('whatsapp_instances')
        .select('instance_name')
        .eq('store_id', storeId)
        .eq('status', 'connected')
        .single();
      
      if (whatsappInstance?.instance_name) {
        instanceName = whatsappInstance.instance_name;
        console.log(`[product-search-agent] ✅ instanceName encontrado via DB: ${instanceName}`);
      }
    }

    // Extrair nome da função - suporta múltiplos formatos da Evolution/OpenAI
    // Formato Evolution: functionName, functionArguments
    // Formato OpenAI: function, args / name / tool_calls
    let functionName = 
      body.functionName ||  // Evolution API format
      body.function || 
      body.name || 
      body.function_call?.name ||
      body.tool_calls?.[0]?.function?.name ||
      body.action ||
      body.method;
    
    // Extrair argumentos - suporta múltiplos formatos
    let args = 
      body.functionArguments ||  // Evolution API format
      body.args || 
      body.arguments ||
      body.parameters ||
      body.input ||
      body.function_call?.arguments ||
      body.tool_calls?.[0]?.function?.arguments ||
      {};
    
    // Se args for string (JSON), parsear
    if (typeof args === 'string') {
      try {
        args = JSON.parse(args);
      } catch (e) {
        console.warn('[product-search-agent] Erro ao parsear args:', args);
        args = {};
      }
    }

    console.log(`[product-search-agent] Função extraída: ${functionName}, Args:`, args);

    // ========================================
    // VERIFICAÇÃO DE DUPLICAÇÃO
    // ========================================
    const queryString = args.query || args.product_name || args.image_url || '';
    const dedupKey = getDedupKey(storeId, remoteJid, functionName || 'unknown', queryString);
    
    if (isDuplicateCall(dedupKey)) {
      console.log(`[product-search-agent] 🔄 Ignorando chamada duplicada em ${DEDUP_CACHE_TTL_MS/1000}s`);
      return new Response(JSON.stringify({ 
        suppress_reply: true,
        message: 'Chamada duplicada ignorada',
        cached: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar dados da loja para construir links
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('slug, name, custom_domain, custom_domain_verified, latitude, longitude, address, city, state')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      return new Response(JSON.stringify({ 
        error: 'Loja não encontrada' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar se o bot está em modo conversacional (sem links)
    let neverSendLinks = false;
    try {
      const { data: botConfig } = await supabase
        .from('store_bot_config')
        .select('bot_mode')
        .eq('store_id', storeId)
        .maybeSingle();

      if (botConfig?.bot_mode === 'conversational') {
        const { data: convSettings } = await supabase
          .from('store_bot_conversational_settings')
          .select('never_send_links')
          .eq('store_id', storeId)
          .maybeSingle();

        neverSendLinks = convSettings?.never_send_links !== false;
        if (neverSendLinks) {
          console.log(`[product-search-agent] 🚫 Modo conversacional: links desabilitados`);
        }
      }
    } catch (e) {
      console.warn('[product-search-agent] Erro ao verificar modo conversacional:', e);
    }

    // Determinar base URL para links
    const baseUrl = store.custom_domain && store.custom_domain_verified
      ? `https://${store.custom_domain}`
      : 'https://mostralo.com.br';

    const storeLink = `${baseUrl}/loja/${store.slug}`;

    // Helper para construir link do produto (retorna null se links desabilitados)
    const buildProductLink = (productSlug: string) => 
      neverSendLinks ? null : `${storeLink}/produto/${productSlug}`;

    // Helper para construir link de navegação
    const buildNavigationLink = () => {
      if (neverSendLinks) return null;
      if (!store.latitude || !store.longitude) return null;
      const address = encodeURIComponent(store.address || '');
      return `${baseUrl}/navegar?lat=${store.latitude}&lng=${store.longitude}&store=${store.slug}&address=${address}`;
    };

    // Helper para formatar produto
    // NOTA: image_url é OMITIDO do resultado JSON retornado ao assistente
    // porque as fotos já são enviadas diretamente via sendProductImages()
    // Incluir image_url faria o assistente tentar reenviar as fotos, causando duplicação
    const formatProduct = (p: any) => {
      const formatted: any = {
        name: p.name,
        price: p.is_on_offer && p.offer_price ? p.offer_price : p.price,
        original_price: p.is_on_offer ? p.original_price || p.price : null,
        is_on_offer: p.is_on_offer || false,
        stock_quantity: p.track_stock ? p.stock_quantity : null,
        in_stock: p.track_stock ? (p.stock_quantity || 0) > 0 : true,
        is_featured: p.is_featured || false,
        description: p.description,
        category: p.categories?.name || null,
        // image_url removido intencionalmente — fotos já enviadas via WhatsApp
      };
      const link = buildProductLink(p.slug);
      if (link) formatted.link = link;
      return formatted;
    };

    // ========================================
    // HELPER: Enviar imagem de produto via Evolution API
    // ========================================
    const sendProductImageWithCaption = async (
      product: { name: string; price: number; link: string | null; image_url: string }
    ): Promise<boolean> => {
      if (!instanceName || !remoteJid) return false;
      
      try {
        // Buscar configuração da Evolution API
        const { data: evolutionConfig } = await supabase
          .from('evolution_config')
          .select('api_url, api_key')
          .eq('is_active', true)
          .single();
        
        if (!evolutionConfig) {
          console.log('[product-search-agent] ⚠️ Evolution config não encontrada');
          return false;
        }
        
        const phone = remoteJid.replace(/@.*$/, '');
        
        // Legenda completa com nome, preço e link (se habilitado)
        const caption = product.link 
          ? `📦 *${product.name}*\n💰 R$ ${product.price.toFixed(2)}\n👉 ${product.link}`
          : `📦 *${product.name}*\n💰 R$ ${product.price.toFixed(2)}`;
        
        const apiUrl = evolutionConfig.api_url.replace(/\/+$/, '');
        const endpoint = `${apiUrl}/message/sendMedia/${instanceName}`;
        
        console.log(`[product-search-agent] 📤 Enviando imagem: ${product.name} -> ${phone}`);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionConfig.api_key,
          },
          body: JSON.stringify({
            number: phone,
            mediatype: 'image',
            media: product.image_url,
            caption: caption,
          }),
        });
        
        if (response.ok) {
          console.log(`[product-search-agent] ✅ Imagem enviada: ${product.name}`);
          return true;
        } else {
          const errorText = await response.text();
          console.error(`[product-search-agent] ❌ Erro ao enviar imagem:`, errorText);
          return false;
        }
      } catch (error) {
        console.error('[product-search-agent] ❌ Erro ao enviar imagem:', error);
        return false;
      }
    };

    // Helper para enviar fotos de produtos (máximo 5)
    const sendProductImages = async (products: any[]) => {
      if (!instanceName || !remoteJid) return;
      
      const productsWithImages = products
        .filter(p => p.image_url)
        .slice(0, 3); // Máximo 3 fotos
      
      if (productsWithImages.length === 0) return;
      
      console.log(`[product-search-agent] 📷 Enviando ${productsWithImages.length} foto(s) de produtos`);
      
      for (const product of productsWithImages) {
        const productIdentifier = product.slug || product.id || product.name;
        const imageKey = getImageDedupKey(storeId, remoteJid, String(productIdentifier));

        if (shouldSkipImageSend(imageKey)) {
          continue;
        }

        const price = product.is_on_offer && product.offer_price 
          ? product.offer_price 
          : product.price;
        
        await sendProductImageWithCaption({
          name: product.name,
          price: price,
          link: buildProductLink(product.slug),
          image_url: product.image_url,
        });
        
        // Delay entre envios para manter ordem correta
        await new Promise(r => setTimeout(r, 300));
      }
    };

    let result: any;

    switch (functionName) {
      // ========================================
      // SEARCH_PRODUCTS - Busca produtos por termo
      // ========================================
      case 'search_products': {
        const query = args.query?.toLowerCase()?.trim() || '';
        const limit = args.limit || 10;

        // Estratégia de busca em 2 etapas:
        // 1. Busca exata com o termo completo
        // 2. Se poucos resultados, busca por cada palavra individualmente
        
        let products: any[] | null = null;
        let error: any = null;

        // Etapa 1: Busca com termo completo
        const exactResult = await supabase
          .from('products')
          .select(`
            id, name, slug, price, original_price, offer_price, description,
            is_available, is_featured, is_on_offer,
            track_stock, stock_quantity, image_url,
            categories(name)
          `)
          .eq('store_id', storeId)
          .eq('is_available', true)
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
          .order('is_featured', { ascending: false })
          .order('name')
          .limit(limit);

        products = exactResult.data;
        error = exactResult.error;

        // Etapa 2: Se poucos resultados, buscar por palavras individuais (AND)
        if (!error && (!products || products.length < 2) && query.includes(' ')) {
          const words = query.split(/\s+/).filter(w => w.length >= 2);
          if (words.length >= 2) {
            // Construir filtro AND: todas as palavras devem estar no nome
            const andFilter = words.map(w => `name.ilike.%${w}%`).join(',');
            const wordResult = await supabase
              .from('products')
              .select(`
                id, name, slug, price, original_price, offer_price, description,
                is_available, is_featured, is_on_offer,
                track_stock, stock_quantity, image_url,
                categories(name)
              `)
              .eq('store_id', storeId)
              .eq('is_available', true)
              .or(andFilter)
              .order('is_featured', { ascending: false })
              .order('name')
              .limit(limit);

            if (!wordResult.error && wordResult.data && wordResult.data.length > (products?.length || 0)) {
              products = wordResult.data;
              console.log(`[product-search-agent] Busca por palavras "${words.join('" + "')}" encontrou ${products.length} resultados (vs ${exactResult.data?.length || 0} exata)`);
            }
          }
        }

        // Etapa 3: Busca fuzzy com pg_trgm se poucos resultados
        if (!error && (!products || products.length === 0)) {
          console.log(`[product-search-agent] 🔍 Tentando busca fuzzy para "${query}"...`);
          const { data: fuzzyResults, error: fuzzyError } = await supabase
            .rpc('fuzzy_search_products', {
              p_store_id: storeId,
              p_search_term: query,
              p_limit: limit,
              p_min_similarity: 0.15
            });
          
          if (!fuzzyError && fuzzyResults?.length > 0) {
            console.log(`[product-search-agent] ✅ Busca fuzzy encontrou ${fuzzyResults.length} resultados`);
            products = fuzzyResults.map((r: any) => ({
              id: r.id, name: r.name, slug: r.slug, price: r.price,
              original_price: r.original_price, offer_price: r.offer_price,
              description: r.description, is_available: r.is_available,
              is_featured: r.is_featured, is_on_offer: r.is_on_offer,
              track_stock: r.track_stock, stock_quantity: r.stock_quantity,
              image_url: r.image_url, categories: r.category_name ? { name: r.category_name } : null,
            }));
          }
        }

        if (error) {
          console.error('Erro na busca:', error);
          result = { products: [], message: 'Erro ao buscar produtos' };
        } else {
          // Enviar fotos dos produtos via WhatsApp (se sessão disponível)
          if (products && products.length > 0) {
            await sendProductImages(products);
          }
          
          result = {
            products: (products || []).map(formatProduct),
            total: products?.length || 0,
            query,
          };
        }
        break;
      }

      // ========================================
      // CHECK_STOCK - Verifica estoque de produto
      // ========================================
      case 'check_stock': {
        const productName = args.product_name?.toLowerCase()?.trim() || '';

        // Busca primária: termo completo
        let { data: products, error } = await supabase
          .from('products')
          .select(`
            id, name, slug, price, offer_price, is_on_offer, track_stock, stock_quantity, is_available, image_url
          `)
          .eq('store_id', storeId)
          .eq('is_available', true)
          .ilike('name', `%${productName}%`)
          .limit(5);

        // Busca secundária: por palavras individuais se não encontrou
        if (!error && (!products || products.length === 0) && productName.includes(' ')) {
          const words = productName.split(/\s+/).filter(w => w.length >= 2);
          if (words.length >= 2) {
            const andFilter = words.map(w => `name.ilike.%${w}%`).join(',');
            const wordResult = await supabase
              .from('products')
              .select(`
                id, name, slug, price, offer_price, is_on_offer, track_stock, stock_quantity, is_available, image_url
              `)
              .eq('store_id', storeId)
              .eq('is_available', true)
              .or(andFilter)
              .limit(5);

            if (!wordResult.error && wordResult.data?.length) {
              products = wordResult.data;
              console.log(`[product-search-agent] check_stock: busca por palavras encontrou ${products.length} para "${productName}"`);
            }
          }
        }

        // Etapa 3: Busca fuzzy com pg_trgm se nada encontrado
        if (!error && (!products || products.length === 0)) {
          console.log(`[product-search-agent] 🔍 Tentando busca fuzzy para "${productName}"...`);
          const { data: fuzzyResults, error: fuzzyError } = await supabase
            .rpc('fuzzy_search_products', {
              p_store_id: storeId,
              p_search_term: productName,
              p_limit: 5,
              p_min_similarity: 0.15
            });
          
          if (!fuzzyError && fuzzyResults?.length > 0) {
            console.log(`[product-search-agent] ✅ Busca fuzzy encontrou ${fuzzyResults.length} resultados (similaridade: ${fuzzyResults[0]?.similarity_score?.toFixed(2)})`);
            products = fuzzyResults.map((r: any) => ({
              id: r.id,
              name: r.name,
              slug: r.slug,
              price: r.price,
              offer_price: r.offer_price,
              is_on_offer: r.is_on_offer,
              track_stock: r.track_stock,
              stock_quantity: r.stock_quantity,
              is_available: r.is_available,
              image_url: r.image_url,
            }));
          }
        }

        if (error || !products?.length) {
          result = { 
            found: false, 
            message: `Produto "${args.product_name}" não encontrado` 
          };
        } else {
          // Enviar fotos dos produtos via WhatsApp (se sessão disponível)
          await sendProductImages(products);
          
          result = {
            found: true,
            products: products.map(p => {
              const item: any = {
                name: p.name,
                in_stock: p.track_stock ? (p.stock_quantity || 0) > 0 : true,
                stock_quantity: p.track_stock ? p.stock_quantity : 'Não controlado',
              };
              const link = buildProductLink(p.slug);
              if (link) item.link = link;
              return item;
            }),
          };
        }
        break;
      }

      // ========================================
      // GET_PRODUCT_DETAILS - Detalhes de um produto
      // ========================================
      case 'get_product_details': {
        const slug = args.slug || args.product_slug;

        const { data: product, error } = await supabase
          .from('products')
          .select(`
            id, name, slug, price, original_price, offer_price, description,
            is_available, is_featured, is_on_offer,
            track_stock, stock_quantity, image_url,
            categories(name)
          `)
          .eq('store_id', storeId)
          .eq('slug', slug)
          .single();

        if (error || !product) {
          result = { found: false, message: 'Produto não encontrado' };
        } else {
          result = {
            found: true,
            product: formatProduct(product),
          };
        }
        break;
      }

      // ========================================
      // LIST_CATEGORIES - Lista categorias
      // ========================================
      case 'list_categories': {
        const { data: categories, error } = await supabase
          .from('categories')
          .select('id, name, description')
          .eq('store_id', storeId)
          .eq('is_active', true)
          .order('display_order')
          .order('name');

        if (error) {
          result = { categories: [], message: 'Erro ao listar categorias' };
        } else {
          result = {
            categories: (categories || []).map(c => c.name),
            total: categories?.length || 0,
          };
        }
        break;
      }

      // ========================================
      // GET_PROMOTIONS - Produtos em oferta
      // ========================================
      case 'get_promotions': {
        const limit = args.limit || 5;

        const { data: products, error } = await supabase
          .from('products')
          .select(`
            id, name, slug, price, original_price, offer_price, description,
            is_available, is_featured, is_on_offer,
            track_stock, stock_quantity, image_url,
            categories(name)
          `)
          .eq('store_id', storeId)
          .eq('is_available', true)
          .eq('is_on_offer', true)
          .order('name')
          .limit(limit);

        if (error) {
          result = { products: [], message: 'Erro ao buscar promoções' };
        } else {
          // Enviar fotos dos produtos via WhatsApp (se sessão disponível)
          if (products && products.length > 0) {
            await sendProductImages(products);
          }
          
          result = {
            products: (products || []).map(formatProduct),
            total: products?.length || 0,
            message: products?.length 
              ? `${products.length} produto(s) em promoção` 
              : 'Nenhuma promoção disponível no momento',
          };
        }
        break;
      }

      // ========================================
      // GET_RECOMMENDATIONS - Produtos em destaque
      // ========================================
      case 'get_recommendations': {
        const limit = args.limit || 5;

        const { data: products, error } = await supabase
          .from('products')
          .select(`
            id, name, slug, price, original_price, offer_price, description,
            is_available, is_featured, is_on_offer,
            track_stock, stock_quantity, image_url,
            categories(name)
          `)
          .eq('store_id', storeId)
          .eq('is_available', true)
          .eq('is_featured', true)
          .order('name')
          .limit(limit);

        if (error) {
          result = { products: [], message: 'Erro ao buscar recomendações' };
        } else {
          // Enviar fotos dos produtos via WhatsApp (se sessão disponível)
          if (products && products.length > 0) {
            await sendProductImages(products);
          }
          
          result = {
            products: (products || []).map(formatProduct),
            total: products?.length || 0,
            message: products?.length 
              ? `${products.length} produto(s) recomendado(s)` 
              : 'Nenhum produto em destaque no momento',
          };
        }
        break;
      }

      // ========================================
      // GET_STORE_INFO - Informações da loja
      // ========================================
      case 'get_store_info': {
        const { data: storeInfo, error } = await supabase
          .from('stores')
          .select(`
            name, description, address, city, state,
            whatsapp, phone, business_hours,
            delivery_fee, min_order_value,
            accepts_pix, accepts_card, accepts_cash,
            latitude, longitude
          `)
          .eq('id', storeId)
          .single();

        if (error || !storeInfo) {
          result = { found: false, message: 'Loja não encontrada' };
        } else {
          const navigationLink = buildNavigationLink();
          result = {
            found: true,
            store: {
              name: storeInfo.name,
              description: storeInfo.description,
              address: storeInfo.address,
              city: storeInfo.city,
              state: storeInfo.state,
              whatsapp: storeInfo.whatsapp,
              phone: storeInfo.phone,
              business_hours: storeInfo.business_hours,
              delivery_fee: storeInfo.delivery_fee,
              min_order_value: storeInfo.min_order_value,
              payment_methods: {
                pix: storeInfo.accepts_pix !== false,
                card: storeInfo.accepts_card !== false,
                cash: storeInfo.accepts_cash !== false,
              },
              ...(neverSendLinks ? {} : {
                links: {
                  catalog: storeLink,
                  navigation: navigationLink,
                },
              }),
            },
          };
        }
        break;
      }

      // ========================================
      // CHECK_STORE_STATUS - Verifica se loja está aberta (tempo real)
      // ========================================
      case 'check_store_status': {
        const { data: storeInfo, error } = await supabase
          .from('stores')
          .select('business_hours, timezone')
          .eq('id', storeId)
          .single();

        if (error || !storeInfo) {
          result = { error: true, message: 'Não foi possível verificar o status da loja' };
          break;
        }

        const businessHours = storeInfo.business_hours;
        const timezone = storeInfo.timezone || 'America/Sao_Paulo';

        // Verificar se serviço está pausado manualmente
        if (businessHours?.service_paused === true || businessHours?.service_paused === 'true') {
          result = {
            is_open: false,
            status: 'paused',
            message: 'O serviço está pausado temporariamente. Por favor, tente novamente mais tarde.',
            next_opening: null,
          };
          break;
        }

        // Obter hora atual no fuso horário da loja
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          weekday: 'long',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        
        const parts = formatter.formatToParts(now);
        const weekdayEn = parts.find(p => p.type === 'weekday')?.value?.toLowerCase() || '';
        const hour = parts.find(p => p.type === 'hour')?.value || '00';
        const minute = parts.find(p => p.type === 'minute')?.value || '00';
        const currentTime = `${hour}:${minute}`;

        // Mapear dia da semana inglês para português
        const dayMap: Record<string, string> = {
          sunday: 'sunday',
          monday: 'monday',
          tuesday: 'tuesday',
          wednesday: 'wednesday',
          thursday: 'thursday',
          friday: 'friday',
          saturday: 'saturday',
        };

        const dayNamesPortuguese: Record<string, string> = {
          sunday: 'Domingo',
          monday: 'Segunda',
          tuesday: 'Terça',
          wednesday: 'Quarta',
          thursday: 'Quinta',
          friday: 'Sexta',
          saturday: 'Sábado',
        };

        const today = dayMap[weekdayEn] || 'monday';
        const todayHours = businessHours?.[today];

        // Verificar se está dentro do horário de funcionamento
        let isOpen = false;
        if (todayHours && !todayHours.closed && todayHours.open && todayHours.close) {
          isOpen = currentTime >= todayHours.open && currentTime <= todayHours.close;
        }

        // Se fechado, calcular próxima abertura
        let nextOpening = null;
        if (!isOpen) {
          // Verificar se abre ainda hoje
          if (todayHours && !todayHours.closed && todayHours.open && currentTime < todayHours.open) {
            nextOpening = {
              day: 'hoje',
              time: todayHours.open,
              message: `Abrimos hoje às ${todayHours.open}`,
            };
          } else {
            // Procurar próximo dia aberto
            const dayOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const currentDayIndex = dayOrder.indexOf(today);
            
            for (let i = 1; i <= 7; i++) {
              const nextDayIndex = (currentDayIndex + i) % 7;
              const nextDay = dayOrder[nextDayIndex];
              const nextDayHours = businessHours?.[nextDay];
              
              if (nextDayHours && !nextDayHours.closed && nextDayHours.open) {
                const dayLabel = i === 1 ? 'amanhã' : dayNamesPortuguese[nextDay];
                nextOpening = {
                  day: dayLabel,
                  time: nextDayHours.open,
                  message: i === 1 
                    ? `Abrimos amanhã às ${nextDayHours.open}`
                    : `Abrimos ${dayNamesPortuguese[nextDay]} às ${nextDayHours.open}`,
                };
                break;
              }
            }
          }
        }

        if (isOpen) {
          result = {
            is_open: true,
            status: 'open',
            message: `Estamos abertos agora! 🟢 Funcionamos até às ${todayHours.close} hoje.`,
            current_time: currentTime,
            closes_at: todayHours.close,
          };
        } else {
          result = {
            is_open: false,
            status: 'closed',
            message: nextOpening 
              ? `Estamos fechados no momento. 🔴 ${nextOpening.message}.`
              : 'Estamos fechados no momento.',
            current_time: currentTime,
            next_opening: nextOpening,
          };
        }
        break;
      }

      // ========================================
      // GET_CURRENT_GREETING - Saudação baseada no horário atual
      // ========================================
      case 'get_current_greeting': {
        const { data: storeInfo, error } = await supabase
          .from('stores')
          .select('timezone, name')
          .eq('id', storeId)
          .single();

        if (error || !storeInfo) {
          result = { 
            greeting: 'Olá',
            emoji: '👋',
            error: true 
          };
          break;
        }

        const timezone = storeInfo.timezone || 'America/Sao_Paulo';

        // Obter hora atual no fuso horário da loja
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('pt-BR', {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        
        const currentTime = formatter.format(now);
        const hour = parseInt(currentTime.split(':')[0]);

        // Determinar saudação baseada no horário
        let greeting: string;
        let emoji: string;
        let period: string;

        if (hour >= 0 && hour < 5) {
          greeting = 'Boa madrugada';
          emoji = '🌃';
          period = 'madrugada';
        } else if (hour >= 5 && hour < 12) {
          greeting = 'Bom dia';
          emoji = '☀️';
          period = 'manhã';
        } else if (hour >= 12 && hour < 18) {
          greeting = 'Boa tarde';
          emoji = '🌤️';
          period = 'tarde';
        } else {
          greeting = 'Boa noite';
          emoji = '🌙';
          period = 'noite';
        }

        result = {
          greeting,
          emoji,
          period,
          current_time: currentTime,
          timezone,
          store_name: storeInfo.name,
          formatted: `${greeting}! ${emoji}`,
        };
        break;
      }

      // ========================================
      // ANALYZE_IMAGE - Análise de imagem com AI Vision
      // Retorna estrutura compatível com AnalysisResult do webhook
      // ========================================
      case 'analyze_image': {
        const imageData = args.image_data || args.imageData;
        const imageContext = args.image_context || args.context || '';

        console.log(`[product-search-agent] 🖼️ analyze_image iniciado:`, {
          hasBase64: !!imageData?.base64,
          hasUrl: !!imageData?.url,
          urlPreview: imageData?.url?.slice(0, 60),
          context: imageContext?.slice(0, 50),
        });

        // Verificar se a loja tem o módulo ai_vision habilitado
        const { data: visionAccess } = await supabase
          .from('store_modules')
          .select('is_enabled, modules!inner(key)')
          .eq('store_id', storeId)
          .eq('modules.key', 'ai_vision')
          .single();

        if (!visionAccess?.is_enabled) {
          result = {
            success: false,
            error: true,
            message: 'O módulo de Visão por IA não está habilitado para esta loja.',
            hint: 'Entre em contato com o suporte para ativar este recurso.',
          };
          break;
        }

        // Verificar se temos dados da imagem
        if (!imageData?.base64 && !imageData?.url) {
          result = {
            success: false,
            error: true,
            message: 'Dados da imagem não fornecidos',
            hint: 'Por favor, envie a imagem novamente.',
          };
          break;
        }

        // CRÍTICO: Se temos apenas URL do WhatsApp (mmg.whatsapp.net), não vai funcionar
        // porque OpenAI não consegue baixar diretamente
        if (!imageData.base64 && imageData.url?.includes('mmg.whatsapp.net')) {
          console.error('[product-search-agent] ❌ URL do WhatsApp sem base64 - OpenAI não consegue acessar');
          result = {
            success: false,
            error: true,
            message: 'Não foi possível acessar a imagem. Por favor, envie novamente.',
            hint: 'O webhook precisa enviar a imagem em base64. Verifique a configuração WEBHOOK_BASE64.',
            debug: 'invalid_whatsapp_url',
          };
          break;
        }

        try {
          // Obter credenciais OpenAI da loja
          let openaiApiKey: string | null = null;

          const { data: openaiCredsList } = await supabase
            .from('openai_credentials')
            .select('api_key')
            .eq('store_id', storeId)
            .eq('is_active', true)
            .limit(1);

          if (openaiCredsList?.[0]?.api_key) {
            openaiApiKey = openaiCredsList[0].api_key;
          }

          if (!openaiApiKey) {
            const { data: storeKeyData } = await supabase
              .from('stores')
              .select('openai_api_key')
              .eq('id', storeId)
              .single();

            if (storeKeyData?.openai_api_key) {
              openaiApiKey = storeKeyData.openai_api_key;
            }
          }

          if (!openaiApiKey) {
            result = {
              success: false,
              error: true,
              message: 'Credenciais da OpenAI não configuradas para esta loja',
            };
            break;
          }

          // Construir conteúdo da imagem
          const imageSource = imageData.base64 ? 'base64' : 'url';
          const imageContent = imageData.base64 
            ? { url: `data:${imageData.mimetype || 'image/jpeg'};base64,${imageData.base64}` }
            : { url: imageData.url };

          console.log(`[product-search-agent] 📤 Enviando imagem para GPT-4o Vision (source: ${imageSource})`);

          // NOVO: Buscar segmento da loja para prompt dinâmico
          const { data: storeSegmentData } = await supabase
            .from('stores')
            .select('segment')
            .eq('id', storeId)
            .single();
          
          const storeSegment = storeSegmentData?.segment || 'generico';
          console.log(`[product-search-agent] 🏪 Segmento da loja: ${storeSegment}`);

          // Gerar prompt dinâmico baseado no segmento da loja
          const systemPrompt = buildVisionPrompt(storeSegment, imageContext);

          // Chamar GPT-4o Vision
          const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: [
                {
                  role: 'user',
                  content: [
                    { type: 'image_url', image_url: imageContent },
                    { type: 'text', text: systemPrompt }
                  ]
                }
              ],
              max_tokens: 800,
            }),
          });

          if (!visionResponse.ok) {
            const errorText = await visionResponse.text();
            console.error('[product-search-agent] ❌ Erro OpenAI Vision:', errorText);
            
            // Verificar se é erro de URL inválida
            if (errorText.includes('invalid_image_url') || errorText.includes('Could not download')) {
              result = {
                success: false,
                error: true,
                message: 'Não foi possível acessar a imagem. Por favor, envie novamente.',
                debug: 'invalid_image_url',
              };
            } else {
              result = {
                success: false,
                error: true,
                message: 'Erro ao processar a imagem. Tente novamente.',
              };
            }
            break;
          }

          const visionResult = await visionResponse.json();
          const analysisContent = visionResult.choices?.[0]?.message?.content || '';

          console.log(`[product-search-agent] ✅ Análise recebida (${analysisContent.length} chars):`, analysisContent.slice(0, 300));

          // Extrair tipo de documento da resposta
          type DocumentType = 'RECEITA_CONTROLADA' | 'RECEITA_RETIDA' | 'RECEITA_SIMPLES' | 'PRODUTO';
          let documentType: DocumentType = 'PRODUTO';
          const docTypeMatch = analysisContent.match(/\[TIPO_DOCUMENTO:\s*(RECEITA_CONTROLADA|RECEITA_RETIDA|RECEITA_SIMPLES|PRODUTO)\]/i);
          if (docTypeMatch) {
            documentType = docTypeMatch[1].toUpperCase() as DocumentType;
            console.log(`[product-search-agent] 📋 Tipo de documento identificado: ${documentType}`);
          } else {
            console.log(`[product-search-agent] ⚠️ Tipo de documento não identificado, usando padrão: PRODUTO`);
          }
          
          // Só marcar como receita controlada se for segmento de saúde
          const isControlledPrescription = isHealthSegment(storeSegment) && 
            (documentType === 'RECEITA_CONTROLADA' || documentType === 'RECEITA_RETIDA');

          // Registrar uso de tokens
          const imageTokens = calculateImageTokens('high');
          const promptTokens = estimateTokens(systemPrompt) + imageTokens;
          const completionTokens = visionResult.usage?.completion_tokens || estimateTokens(analysisContent);

          await logOpenAIUsage(supabase, storeId, {
            promptTokens,
            completionTokens,
            usageType: 'image',
            model: 'gpt-4o',
            messageType: 'vision_analysis',
            metadata: {
              has_context: Boolean(imageContext),
              image_source: imageSource,
            }
          });

          // Extrair nomes de medicamentos/produtos da análise
          // FILTRAR METADADOS: ignorar linhas que são apenas informações secundárias
          const productNames: string[] = [];
          const lines = analysisContent.split('\n');
          
          // Palavras-chave de metadados que devem ser IGNORADAS
          const metadataKeywords = [
            'marca:', 'uso:', 'indicação:', 'indicacao:', 'tipo:', 'quantidade:', 
            'apresentação:', 'apresentacao:', 'fabricante:', 'laboratório:', 'laboratorio:',
            'posologia:', 'via:', 'administração:', 'administracao:'
          ];
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            
            // IGNORAR linhas de metadados
            const lowerLine = trimmedLine.toLowerCase();
            if (metadataKeywords.some(keyword => lowerLine.startsWith(keyword))) {
              console.log(`[product-search-agent] ⏭️ Ignorando metadado: "${trimmedLine}"`);
              continue;
            }
            
            // Se a linha começa com "Nome:", extrair apenas o valor
            if (lowerLine.startsWith('nome:') || lowerLine.startsWith('medicamento:') || lowerLine.startsWith('produto:')) {
              const value = trimmedLine.replace(/^(?:nome|medicamento|produto):\s*/i, '').trim();
              // Remover dosagem separada se vier junto
              const cleanValue = value.replace(/\s*[-–]\s*(?:Dosagem|Quantidade|Qtd).*$/i, '').trim();
              if (cleanValue.length > 2) {
                productNames.push(cleanValue);
                console.log(`[product-search-agent] ✅ Extraído de prefixo: "${cleanValue}"`);
              }
              continue;
            }
            
            // Padrão 1: Lista numerada "1. Paracetamol 750mg"
            let nameMatch = trimmedLine.match(/^\d+\.\s+(.+?)(?:\s*[-–]\s*(?:Dosagem|Quantidade)|$)/i);
            
            // Padrão 2: Lista com bullet "- Paracetamol 750mg" ou "* Paracetamol"
            if (!nameMatch) {
              nameMatch = trimmedLine.match(/^[-*•]\s+(.+?)(?:\s*[-–]\s*(?:Dosagem|Quantidade)|$)/i);
            }
            
            if (nameMatch && nameMatch[1]) {
              let name = nameMatch[1].trim();
              // Remover sufixos indesejados
              name = name.replace(/\s*[-–]\s*(Dosagem|Quantidade|Qtd).*$/i, '').trim();
              // Verificar se não é um metadado disfarçado
              const nameLower = name.toLowerCase();
              if (name.length > 2 && 
                  !nameLower.includes('dosagem:') && 
                  !nameLower.includes('quantidade:') &&
                  !nameLower.startsWith('marca') &&
                  !nameLower.startsWith('uso')) {
                productNames.push(name);
                console.log(`[product-search-agent] ✅ Extraído de lista: "${name}"`);
              }
            }
          }

          console.log(`[product-search-agent] 📋 Produtos identificados na análise:`, productNames);

          // Buscar produtos no catálogo para cada item identificado (limite 5)
          // Agora incluindo informações de estoque e flag de similares
          const foundProducts: Array<{
            name: string;
            identified_name: string;
            slug?: string;
            price?: number;
            link?: string;
            in_stock?: boolean;
            stock_quantity?: number | string;
            found_in_catalog: boolean;
            is_similar?: boolean;
            original_search?: string;
            image_url?: string; // URL da imagem do produto
          }> = [];
          
          for (const productName of productNames.slice(0, 3)) {
            // Extrair termo principal de busca (primeiro termo significativo)
            const cleanName = productName
              .replace(/\d+\s*(mg|ml|g|mcg|ui|comp|cáps|caps)/gi, '') // Remover dosagens para busca mais ampla
              .trim();
            
            const searchTerms = cleanName.toLowerCase().split(/\s+/).filter(t => t.length > 2);
            
            // Tentar busca com nome completo primeiro
            let matchedProducts: any[] = [];
            
            // Busca 1: Nome completo
            const { data: exactMatch } = await supabase
              .from('products')
              .select('id, name, slug, price, offer_price, is_on_offer, track_stock, stock_quantity, is_available, image_url')
              .eq('store_id', storeId)
              .eq('is_available', true)
              .ilike('name', `%${productName}%`)
              .limit(3);
            
            if (exactMatch && exactMatch.length > 0) {
              matchedProducts = exactMatch;
            } else if (searchTerms.length > 0) {
              // Busca 2: Termo principal (ex: "Amoxicilina" sem a dosagem)
              const { data: partialMatch } = await supabase
                .from('products')
                .select('id, name, slug, price, offer_price, is_on_offer, track_stock, stock_quantity, is_available, image_url')
                .eq('store_id', storeId)
                .eq('is_available', true)
                .ilike('name', `%${searchTerms[0]}%`)
                .limit(3);
              
              if (partialMatch && partialMatch.length > 0) {
                matchedProducts = partialMatch;
              }
            }
            
            // Busca 3: Se ainda não encontrou, tentar buscar SIMILARES pelo princípio ativo
            // Extrair apenas a primeira palavra (geralmente é o princípio ativo)
            if (matchedProducts.length === 0 && searchTerms.length > 0) {
              const activeIngredient = searchTerms[0]; // Ex: "paracetamol" de "Paracetamol EMS 750mg"
              
              console.log(`[product-search-agent] 🔄 Buscando similares pelo princípio ativo: "${activeIngredient}"`);
              
              const { data: similarMatch } = await supabase
                .from('products')
                .select('id, name, slug, price, offer_price, is_on_offer, track_stock, stock_quantity, is_available, image_url')
                .eq('store_id', storeId)
                .eq('is_available', true)
                .ilike('name', `%${activeIngredient}%`)
                .limit(3);
              
              if (similarMatch && similarMatch.length > 0) {
                console.log(`[product-search-agent] ✅ Encontrados ${similarMatch.length} produto(s) similar(es):`, similarMatch.map(p => p.name));
                
                // Marcar como "similar" (produto diferente do identificado, mas mesmo princípio ativo)
                for (const p of similarMatch) {
                  const inStock = p.track_stock ? (p.stock_quantity || 0) > 0 : true;
                  const productLink = buildProductLink(p.slug);
                  const productEntry: any = {
                    name: p.name,
                    identified_name: productName,
                    slug: p.slug,
                    price: p.is_on_offer && p.offer_price ? p.offer_price : p.price,
                    in_stock: inStock,
                    stock_quantity: p.track_stock ? p.stock_quantity : 'Disponível',
                    found_in_catalog: true,
                    is_similar: true,
                    original_search: productName,
                    image_url: p.image_url || undefined,
                  };
                  if (productLink) productEntry.link = productLink;
                  foundProducts.push(productEntry);
                }
              }
            }

            console.log(`[product-search-agent] 🔍 Busca "${productName}":`, {
              searchTerms,
              found: matchedProducts.length,
              products: matchedProducts.map(p => p.name),
            });

            if (matchedProducts.length > 0) {
              // Adicionar produtos encontrados com match direto
              for (const p of matchedProducts) {
                const inStock = p.track_stock ? (p.stock_quantity || 0) > 0 : true;
                const productLink = buildProductLink(p.slug);
                const productEntry: any = {
                  name: p.name,
                  identified_name: productName,
                  slug: p.slug,
                  price: p.is_on_offer && p.offer_price ? p.offer_price : p.price,
                  in_stock: inStock,
                  stock_quantity: p.track_stock ? p.stock_quantity : 'Disponível',
                  found_in_catalog: true,
                  is_similar: false,
                  image_url: p.image_url || undefined,
                };
                if (productLink) productEntry.link = productLink;
                foundProducts.push(productEntry);
              }
            } else if (!foundProducts.some(p => p.identified_name === productName)) {
              // Produto não encontrado no catálogo (e não foi adicionado como similar)
              foundProducts.push({
                name: productName,
                identified_name: productName,
                slug: undefined,
                price: undefined,
                in_stock: undefined,
                stock_quantity: undefined,
                found_in_catalog: false,
                is_similar: false,
              });
            }
          }

          // Construir resultado estruturado compatível com o webhook
          const catalogProducts = foundProducts.filter(p => p.found_in_catalog);
          const availableProducts = catalogProducts.filter(p => p.in_stock);
          const unavailableProducts = catalogProducts.filter(p => !p.in_stock);
          const notFoundProducts = foundProducts.filter(p => !p.found_in_catalog);
          
          let statusMessage = '';
          if (availableProducts.length > 0) {
            statusMessage = `✅ ${availableProducts.length} produto(s) disponível(is) em estoque!`;
          }
          if (unavailableProducts.length > 0) {
            statusMessage += `\n⚠️ ${unavailableProducts.length} produto(s) sem estoque no momento.`;
          }
          if (notFoundProducts.length > 0) {
            statusMessage += `\n❌ ${notFoundProducts.length} item(s) não encontrado(s) no catálogo.`;
          }
          
          result = {
            success: true,
            description: foundProducts.length > 0 
              ? `Receita/imagem analisada - ${productNames.length} item(s) identificado(s)`
              : 'Imagem analisada',
            analysis: analysisContent,
            products: foundProducts,
            document_type: documentType,
            is_controlled_prescription: isControlledPrescription,
            summary: {
              identified: productNames.length,
              found_in_catalog: catalogProducts.length,
              in_stock: availableProducts.length,
              out_of_stock: unavailableProducts.length,
              not_found: notFoundProducts.length,
            },
            message: statusMessage || 'Não consegui identificar produtos específicos na imagem.',
          };

        } catch (visionError) {
          console.error('[product-search-agent] ❌ Erro no Vision:', visionError);
          result = {
            success: false,
            error: true,
            message: 'Não foi possível analisar a imagem no momento. Tente descrever o produto.',
          };
        }
        break;
      }

      // ========================================
      // GET_LAST_DELIVERY_INFO - Busca endereço e taxa do último pedido
      // ========================================
      case 'get_last_delivery_info': {
        const customerPhone = args.customer_phone || '';
        console.log(`[product-search-agent] 📍 Buscando último pedido para telefone: ${customerPhone}`);

        if (!customerPhone) {
          result = { found: false, message: 'Telefone do cliente não fornecido' };
          break;
        }

        try {
          const phoneVariants = getPhoneVariants(customerPhone);
          console.log(`[product-search-agent] 📞 Variantes de telefone geradas: ${phoneVariants.join(', ')}`);

          const { data: lastOrder, error: orderError } = await supabase
            .from('orders')
            .select('customer_name, customer_address, delivery_fee, delivery_type, customer_phone')
            .eq('store_id', storeId)
            .eq('delivery_type', 'delivery')
            .in('customer_phone', phoneVariants)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (orderError) {
            console.error('[product-search-agent] ❌ Erro ao buscar último pedido:', orderError);
            result = { found: false, message: 'Erro ao buscar histórico de pedidos' };
            break;
          }

          if (lastOrder && lastOrder.customer_address) {
            console.log(`[product-search-agent] ✅ Último pedido encontrado: ${lastOrder.customer_address}`);
            result = {
              found: true,
              customer_name: lastOrder.customer_name || null,
              customer_address: lastOrder.customer_address,
              delivery_fee: lastOrder.delivery_fee || 0,
            };
          } else {
            console.log(`[product-search-agent] ℹ️ Nenhum pedido anterior encontrado`);
            result = { found: false, message: 'Nenhum pedido anterior encontrado para este cliente' };
          }
        } catch (err) {
          console.error('[product-search-agent] ❌ Erro em get_last_delivery_info:', err);
          result = { found: false, message: 'Erro ao buscar histórico' };
        }
        break;
      }

      // ========================================
      // CALCULATE_DELIVERY_FEE - Calcula taxa por localização GPS
      // ========================================
      case 'calculate_delivery_fee': {
        const lat = args.latitude;
        const lng = args.longitude;
        console.log(`[product-search-agent] 📍 Calculando taxa de entrega: lat=${lat}, lng=${lng}`);

        if (!lat || !lng) {
          result = { success: false, message: 'Latitude e longitude são obrigatórios' };
          break;
        }

        try {
          // Buscar zonas de entrega da loja
          const { data: storeConfig } = await supabase
            .from('store_configurations')
            .select('delivery_zones')
            .eq('store_id', storeId)
            .maybeSingle();

          const zones = storeConfig?.delivery_zones as any[] || [];
          const activeZones = zones.filter((z: any) => z.isActive !== false);

          if (activeZones.length === 0) {
            // Sem zonas configuradas, usar taxa padrão da loja
            const deliveryFee = store.delivery_fee || 0;
            result = {
              success: true,
              zone_name: 'Área padrão',
              delivery_fee: deliveryFee,
              is_night_rate: false,
              message: `Taxa de entrega: R$ ${deliveryFee.toFixed(2)}`,
            };
            break;
          }

          // Verificar em qual zona o ponto está usando distância simples
          // (sem @turf/turf para manter edge function leve)
          let matchedZone: any = null;

          for (const zone of activeZones) {
            if (zone.coordinates && Array.isArray(zone.coordinates) && zone.coordinates.length >= 3) {
              // Point-in-polygon usando ray casting
              const point = [lng, lat];
              const polygon = zone.coordinates.map((c: any) => [c.lng || c[0], c.lat || c[1]]);
              
              if (isPointInPolygon(point, polygon)) {
                matchedZone = zone;
                break;
              }
            }
          }

          if (!matchedZone) {
            result = {
              success: false,
              message: 'Endereço fora da área de entrega. Por favor, verifique o endereço.',
            };
            break;
          }

          // Verificar taxa por horário
          let deliveryFee = Number(matchedZone.deliveryFee) || 0;
          let isNightRate = false;

          if (matchedZone.timeFees && matchedZone.timeFees.length > 0) {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

            for (const tf of matchedZone.timeFees) {
              if (tf.startTime && tf.endTime && currentTime >= tf.startTime && currentTime <= tf.endTime) {
                deliveryFee = Number(tf.fee) || deliveryFee;
                isNightRate = true;
                break;
              }
            }
          }

          result = {
            success: true,
            zone_name: matchedZone.name || 'Zona de entrega',
            delivery_fee: deliveryFee,
            is_night_rate: isNightRate,
            message: `Taxa de entrega para ${matchedZone.name || 'sua região'}: R$ ${deliveryFee.toFixed(2)}${isNightRate ? ' (taxa noturna)' : ''}`,
          };
        } catch (err) {
          console.error('[product-search-agent] ❌ Erro em calculate_delivery_fee:', err);
          result = { success: false, message: 'Erro ao calcular taxa de entrega' };
        }
        break;
      }

      default:
        result = { 
          error: `Função "${functionName}" não reconhecida`,
          available_functions: [
            'search_products',
            'check_stock',
            'get_product_details',
            'list_categories',
            'get_promotions',
            'get_recommendations',
            'get_store_info',
            'check_store_status',
            'get_current_greeting',
            'analyze_image',
            'get_last_delivery_info',
            'calculate_delivery_fee',
          ],
        };
    }

    const elapsedMs = Date.now() - startTime;
    console.log(`[product-search-agent] ✅ Resultado (${elapsedMs}ms):`, JSON.stringify(result).slice(0, 500));

    // Log de uso para todas as chamadas (exceto analyze_image que já faz log próprio)
    if (functionName !== 'analyze_image' && result && !result.error) {
      try {
        const estimatedTokens = estimateTokens(JSON.stringify(result));
        await logOpenAIUsage(supabase, storeId, {
          promptTokens: 50, // Estimativa do prompt de function calling
          completionTokens: estimatedTokens,
          usageType: 'text',
          model: 'gpt-4o-mini',
          messageType: `function_${functionName}`,
          metadata: {
            function_name: functionName,
            result_size: JSON.stringify(result).length,
          }
        });
      } catch (logError) {
        console.warn('[product-search-agent] Falha ao registrar uso:', logError);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const elapsedMs = Date.now() - startTime;
    console.error(`[product-search-agent] ❌ Erro (${elapsedMs}ms):`, error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro interno',
      debug: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack?.slice(0, 200) : undefined,
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
