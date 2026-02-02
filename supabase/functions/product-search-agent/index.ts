// Product Search Agent - v2.1.0
// Edge Function para consultas em tempo real ao banco de produtos
// Usado pelo Assistente Inteligente v2 via Function Calling da OpenAI
// Adicionado: Suporte a análise de imagens (AI Vision Plus) + Tracking de uso OpenAI
// v2.1.0: Adicionado mecanismo de deduplicação para evitar chamadas duplicadas

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logOpenAIUsage, estimateTokens, calculateImageTokens } from "../_shared/openai-usage.ts";

// ========================================
// DEDUPLICAÇÃO: Cache em memória para evitar processamento duplicado
// ========================================
const recentRequests = new Map<string, { timestamp: number; result: any }>();
const DEDUP_TTL_MS = 10000; // 10 segundos - considera duplicata se mesma request em 10s

function generateRequestKey(storeId: string, functionName: string, query: string, remoteJid: string): string {
  return `${storeId}:${functionName}:${query}:${remoteJid}`;
}

function cleanupExpiredCache() {
  const now = Date.now();
  for (const [key, value] of recentRequests.entries()) {
    if (now - value.timestamp > DEDUP_TTL_MS) {
      recentRequests.delete(key);
    }
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    
    // Extrair argumentos primeiro para obter dados de sessão WhatsApp
    // Evolution API passa remoteJid/pushName DENTRO de functionArguments
    const rawArgs = 
      body.functionArguments ||
      body.args || 
      body.arguments ||
      body.parameters ||
      body.input ||
      body.function_call?.arguments ||
      body.tool_calls?.[0]?.function?.arguments ||
      {};
    
    // Se args for string (JSON), parsear
    const parsedArgs = typeof rawArgs === 'string' ? JSON.parse(rawArgs) : rawArgs;
    
    // Extrair remoteJid - PRIORIDADE: dentro de functionArguments
    let remoteJid = 
      parsedArgs?.remoteJid ||
      body.remoteJid || 
      body.key?.remoteJid || 
      body.data?.key?.remoteJid ||
      body.sender ||
      null;
    
    // instanceName pode vir de vários lugares - será buscado do banco se não encontrado
    let instanceName = 
      body.instanceName ||
      body.instance?.instanceName ||
      (typeof body.instance === 'string' ? body.instance : null) ||
      body.key?.instance ||
      null;
    
    console.log(`[product-search-agent] 📱 Sessão inicial: instanceName=${instanceName}, remoteJid=${remoteJid}`);
    
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
    
    // Usar args já parseados anteriormente
    const args = parsedArgs;

    console.log(`[product-search-agent] Função extraída: ${functionName}, Args:`, args);

    // ========================================
    // DEDUPLICAÇÃO: Verificar se é requisição duplicada
    // ========================================
    cleanupExpiredCache(); // Limpar cache expirado
    
    const queryForDedup = args.query || args.product_name || args.slug || 'no-query';
    const requestKey = generateRequestKey(storeId, functionName || 'unknown', queryForDedup, remoteJid || 'no-jid');
    
    const cachedResult = recentRequests.get(requestKey);
    if (cachedResult && (Date.now() - cachedResult.timestamp) < DEDUP_TTL_MS) {
      console.log(`[product-search-agent] 🔄 DUPLICATA DETECTADA - retornando resultado cacheado`);
      console.log(`[product-search-agent] 📋 Key: ${requestKey}`);
      
      // Retornar resultado cacheado sem reprocessar (evita enviar imagens duplicadas)
      return new Response(JSON.stringify({
        ...cachedResult.result,
        _cached: true,
        _cache_age_ms: Date.now() - cachedResult.timestamp,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`[product-search-agent] ✅ Requisição nova - processando (key: ${requestKey})`);

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

    // Se não temos instanceName mas temos remoteJid, buscar da instância WhatsApp da loja
    if (!instanceName && remoteJid && storeId) {
      console.log(`[product-search-agent] 🔍 Buscando instanceName para loja ${storeId}`);
      const { data: whatsappInstance } = await supabase
        .from('whatsapp_instances')
        .select('instance_name')
        .eq('store_id', storeId)
        .eq('status', 'connected')
        .single();
      
      if (whatsappInstance?.instance_name) {
        instanceName = whatsappInstance.instance_name;
        console.log(`[product-search-agent] ✅ instanceName encontrado: ${instanceName}`);
      }
    }

    // ========================================
    // BUSCAR NOME DO CLIENTE - PRIORIDADE: pushName de functionArguments
    // ========================================
    // PRIMEIRO: Tentar extrair pushName diretamente dos argumentos da função
    // A Evolution API envia o pushName dentro de functionArguments
    let customerName: string | null = parsedArgs?.pushName || null;
    
    console.log(`[product-search-agent] 👤 pushName de functionArguments: ${customerName || 'não encontrado'}`);
    
    // FALLBACK: Se não veio no payload, buscar na tabela whatsapp_contacts
    if (!customerName && remoteJid) {
      const phone = remoteJid.replace(/@.*$/, '');
      console.log(`[product-search-agent] 🔍 Buscando nome do cliente na tabela para telefone: ${phone}`);
      
      // Usar variantes de telefone para busca tolerante
      const { getPhoneVariants } = await import("../_shared/phoneUtils.ts");
      const phoneVariants = getPhoneVariants(phone);
      
      const { data: contact } = await supabase
        .from('whatsapp_contacts')
        .select('push_name, name')
        .in('phone_number', phoneVariants)
        .limit(1)
        .maybeSingle();
      
      if (contact) {
        customerName = contact.push_name || contact.name || null;
        console.log(`[product-search-agent] ✅ Nome encontrado no banco: ${customerName}`);
      } else {
        console.log(`[product-search-agent] ⚠️ Cliente não encontrado na tabela whatsapp_contacts`);
      }
    }
    
    console.log(`[product-search-agent] 👤 Nome final do cliente: ${customerName || 'não disponível'}`);

    // Determinar base URL para links
    const baseUrl = store.custom_domain && store.custom_domain_verified
      ? `https://${store.custom_domain}`
      : 'https://mostralo.com.br';

    const storeLink = `${baseUrl}/loja/${store.slug}`;

    // Helper para construir link do produto
    const buildProductLink = (productSlug: string) => 
      `${storeLink}/produto/${productSlug}`;

    // Helper para construir link de navegação
    const buildNavigationLink = () => {
      if (!store.latitude || !store.longitude) return null;
      const address = encodeURIComponent(store.address || '');
      return `${baseUrl}/navegar?lat=${store.latitude}&lng=${store.longitude}&store=${store.slug}&address=${address}`;
    };

    // Helper para formatar produto
    // IMPORTANTE: NÃO incluir image_url aqui - imagens são enviadas via Evolution API
    // Se incluir URL, o assistente pode vazar ela na resposta de texto
    const formatProduct = (p: any) => ({
      name: p.name,
      price: p.is_on_offer && p.offer_price ? p.offer_price : p.price,
      original_price: p.is_on_offer ? p.original_price || p.price : null,
      is_on_offer: p.is_on_offer || false,
      stock_quantity: p.track_stock ? p.stock_quantity : null,
      in_stock: p.track_stock ? (p.stock_quantity || 0) > 0 : true,
      is_featured: p.is_featured || false,
      description: p.description,
      category: p.categories?.name || null,
      link: buildProductLink(p.slug),
      // NÃO incluir image_url - causa vazamento de URL pública na resposta do assistente
    });

    // ========================================
    // HELPER: Enviar imagem de produto via Evolution API
    // ========================================
    const sendProductImageWithCaption = async (
      product: { name: string; price: number; link: string; image_url: string }
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
        
        // Legenda completa com nome, preço e link
        const caption = `📦 *${product.name}*\n💰 R$ ${product.price.toFixed(2)}\n👉 ${product.link}`;
        
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

    // Helper para enviar fotos de produtos (máximo 3) - retorna número de imagens enviadas
    const sendProductImages = async (products: any[]): Promise<number> => {
      if (!instanceName || !remoteJid) return 0;
      
      const productsWithImages = products
        .filter(p => p.image_url)
        .slice(0, 3); // Máximo 3 fotos
      
      if (productsWithImages.length === 0) return 0;
      
      console.log(`[product-search-agent] 📷 Enviando ${productsWithImages.length} foto(s) de produtos`);
      
      let sentCount = 0;
      for (const product of productsWithImages) {
        const price = product.is_on_offer && product.offer_price 
          ? product.offer_price 
          : product.price;
        
        const sent = await sendProductImageWithCaption({
          name: product.name,
          price: price,
          link: buildProductLink(product.slug),
          image_url: product.image_url,
        });
        
        if (sent) sentCount++;
        
        // Delay entre envios para manter ordem correta
        await new Promise(r => setTimeout(r, 300));
      }
      
      return sentCount;
    };

    let result: any;

    switch (functionName) {
      // ========================================
      // SEARCH_PRODUCTS - Busca produtos por termo
      // ========================================
      case 'search_products': {
        const query = args.query?.toLowerCase() || '';
        const limit = args.limit || 5;

        // Buscar produtos que contenham o termo
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
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
          .order('is_featured', { ascending: false })
          .order('name')
          .limit(limit);

        if (error) {
          console.error('Erro na busca:', error);
          result = { products: [], message: 'Erro ao buscar produtos' };
        } else {
          // Enviar fotos dos produtos via WhatsApp (se sessão disponível)
          let imagesSentCount = 0;
          if (products && products.length > 0) {
            imagesSentCount = await sendProductImages(products);
          }
          
          // Construir sugestão de resposta para evitar duplicação
          const suggestedResponse = imagesSentCount > 0
            ? (customerName 
                ? `Olá ${customerName}! Encontrei essas opções pra você 😊`
                : `Encontrei essas opções pra você 😊`)
            : null;
          
          // ANTI-DUPLICAÇÃO: Se imagens foram enviadas, NÃO incluir lista de produtos
          // Isso evita que o assistente repita as informações já presentes nas legendas das fotos
          if (imagesSentCount > 0) {
            result = {
              images_sent: true,
              images_sent_count: imagesSentCount,
              customer_name: customerName,
              suggested_response: suggestedResponse,
              message: `${imagesSentCount} produto(s) encontrado(s) e enviado(s) com foto. As informações já foram enviadas nas legendas.`,
              // NÃO incluir products[] aqui para evitar que o assistente liste novamente
            };
          } else {
            // Se não enviou imagens (produtos sem foto), inclui lista para o assistente responder
            result = {
              products: (products || []).map(formatProduct),
              total: products?.length || 0,
              query,
              images_sent: false,
              customer_name: customerName,
            };
          }
        }
        break;
      }

      // ========================================
      // CHECK_STOCK - Verifica estoque de produto
      // ========================================
      case 'check_stock': {
        const productName = args.product_name?.toLowerCase() || '';

        const { data: products, error } = await supabase
          .from('products')
          .select(`
            id, name, slug, price, offer_price, is_on_offer, track_stock, stock_quantity, is_available, image_url
          `)
          .eq('store_id', storeId)
          .eq('is_available', true)
          .ilike('name', `%${productName}%`)
          .limit(3);

        if (error || !products?.length) {
          result = { 
            found: false, 
            message: `Produto "${args.product_name}" não encontrado` 
          };
        } else {
          // Enviar fotos dos produtos via WhatsApp (se sessão disponível)
          const imagesSentCount = await sendProductImages(products);
          
          // Construir sugestão de resposta para evitar duplicação
          const suggestedResponse = imagesSentCount > 0
            ? (customerName 
                ? `Olá ${customerName}! Encontrei essas opções pra você 😊`
                : `Encontrei essas opções pra você 😊`)
            : null;
          
          // ANTI-DUPLICAÇÃO: Se imagens foram enviadas, NÃO incluir lista de produtos
          if (imagesSentCount > 0) {
            result = {
              found: true,
              images_sent: true,
              images_sent_count: imagesSentCount,
              customer_name: customerName,
              suggested_response: suggestedResponse,
              message: `${imagesSentCount} produto(s) encontrado(s) e enviado(s) com foto. As informações já foram enviadas nas legendas.`,
            };
          } else {
            result = {
              found: true,
              products: products.map(p => ({
                name: p.name,
                in_stock: p.track_stock ? (p.stock_quantity || 0) > 0 : true,
                stock_quantity: p.track_stock ? p.stock_quantity : 'Não controlado',
                link: buildProductLink(p.slug),
              })),
              images_sent: false,
              customer_name: customerName,
            };
          }
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
          let imagesSentCount = 0;
          if (products && products.length > 0) {
            imagesSentCount = await sendProductImages(products);
          }
          
          // ANTI-DUPLICAÇÃO
          if (imagesSentCount > 0) {
            const suggestedResponse = customerName 
              ? `Olá ${customerName}! Essas são as promoções do momento 🔥`
              : `Essas são as promoções do momento 🔥`;
            result = {
              images_sent: true,
              images_sent_count: imagesSentCount,
              customer_name: customerName,
              suggested_response: suggestedResponse,
              message: `${imagesSentCount} promoção(ões) enviada(s) com foto.`,
            };
          } else {
            result = {
              products: (products || []).map(formatProduct),
              total: products?.length || 0,
              images_sent: false,
              customer_name: customerName,
              message: products?.length 
                ? `${products.length} produto(s) em promoção` 
                : 'Nenhuma promoção disponível no momento',
            };
          }
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
          let imagesSentCount = 0;
          if (products && products.length > 0) {
            imagesSentCount = await sendProductImages(products);
          }
          
          // ANTI-DUPLICAÇÃO
          if (imagesSentCount > 0) {
            const suggestedResponse = customerName 
              ? `Olá ${customerName}! Separei essas recomendações pra você 😊`
              : `Separei essas recomendações pra você 😊`;
            result = {
              images_sent: true,
              images_sent_count: imagesSentCount,
              customer_name: customerName,
              suggested_response: suggestedResponse,
              message: `${imagesSentCount} recomendação(ões) enviada(s) com foto.`,
            };
          } else {
            result = {
              products: (products || []).map(formatProduct),
              total: products?.length || 0,
              images_sent: false,
              customer_name: customerName,
              message: products?.length 
                ? `${products.length} produto(s) recomendado(s)` 
                : 'Nenhum produto em destaque no momento',
            };
          }
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
              links: {
                catalog: storeLink,
                navigation: navigationLink,
              },
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
          
          for (const productName of productNames.slice(0, 5)) {
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
                  foundProducts.push({
                    name: p.name,
                    identified_name: productName,
                    slug: p.slug,
                    price: p.is_on_offer && p.offer_price ? p.offer_price : p.price,
                    link: buildProductLink(p.slug),
                    in_stock: inStock,
                    stock_quantity: p.track_stock ? p.stock_quantity : 'Disponível',
                    found_in_catalog: true,
                    is_similar: true, // Flag para indicar que é um produto similar
                    original_search: productName, // O que foi buscado originalmente
                    image_url: p.image_url || undefined, // URL da imagem do produto
                  });
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
                foundProducts.push({
                  name: p.name,
                  identified_name: productName,
                  slug: p.slug,
                  price: p.is_on_offer && p.offer_price ? p.offer_price : p.price,
                  link: buildProductLink(p.slug),
                  in_stock: inStock,
                  stock_quantity: p.track_stock ? p.stock_quantity : 'Disponível',
                  found_in_catalog: true,
                  is_similar: false,
                  image_url: p.image_url || undefined, // URL da imagem do produto
                });
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
          ],
        };
    }

    const elapsedMs = Date.now() - startTime;
    console.log(`[product-search-agent] ✅ Resultado (${elapsedMs}ms):`, JSON.stringify(result).slice(0, 500));

    // ========================================
    // DEDUPLICAÇÃO: Salvar resultado no cache
    // ========================================
    const queryForCache = args?.query || args?.product_name || args?.slug || 'no-query';
    const cacheKey = generateRequestKey(storeId, functionName || 'unknown', queryForCache, remoteJid || 'no-jid');
    recentRequests.set(cacheKey, {
      timestamp: Date.now(),
      result: result,
    });
    console.log(`[product-search-agent] 💾 Resultado cacheado para: ${cacheKey}`);

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
