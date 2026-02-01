// Product Search Agent - v2.0.0
// Edge Function para consultas em tempo real ao banco de produtos
// Usado pelo Assistente Inteligente v2 via Function Calling da OpenAI
// Adicionado: Suporte a análise de imagens (AI Vision Plus) + Tracking de uso OpenAI

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logOpenAIUsage, estimateTokens, calculateImageTokens } from "../_shared/openai-usage.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FunctionCallRequest {
  function: string;
  args: Record<string, any>;
  storeId: string;
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
    });

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
            track_stock, stock_quantity,
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
        const productName = args.product_name?.toLowerCase() || '';

        const { data: products, error } = await supabase
          .from('products')
          .select(`
            id, name, slug, price, track_stock, stock_quantity, is_available
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
          result = {
            found: true,
            products: products.map(p => ({
              name: p.name,
              in_stock: p.track_stock ? (p.stock_quantity || 0) > 0 : true,
              stock_quantity: p.track_stock ? p.stock_quantity : 'Não controlado',
              link: buildProductLink(p.slug),
            })),
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
            track_stock, stock_quantity,
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
            track_stock, stock_quantity,
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
      // ========================================
      case 'analyze_image': {
        const imageData = args.image_data || args.imageData;
        const imageContext = args.image_context || args.context || '';

        // Verificar se a loja tem o módulo ai_vision habilitado
        const { data: visionAccess } = await supabase
          .from('store_modules')
          .select('is_enabled, modules!inner(key)')
          .eq('store_id', storeId)
          .eq('modules.key', 'ai_vision')
          .single();

        if (!visionAccess?.is_enabled) {
          result = {
            error: true,
            message: 'O módulo de Visão por IA não está habilitado para esta loja.',
            hint: 'Entre em contato com o suporte para ativar este recurso.',
          };
          break;
        }

        // Verificar se temos dados da imagem
        if (!imageData?.base64 && !imageData?.url) {
          result = {
            error: true,
            message: 'Dados da imagem não fornecidos',
            hint: 'Por favor, envie a imagem novamente.',
          };
          break;
        }

        try {
          // Obter credenciais OpenAI da loja
          const { data: openaiCreds } = await supabase
            .from('openai_credentials')
            .select('api_key')
            .eq('store_id', storeId)
            .eq('is_active', true)
            .single();

          if (!openaiCreds?.api_key) {
            result = {
              error: true,
              message: 'Credenciais da OpenAI não configuradas para esta loja',
            };
            break;
          }

          // Construir conteúdo da imagem
          const imageContent = imageData.base64 
            ? { url: `data:${imageData.mimetype || 'image/jpeg'};base64,${imageData.base64}` }
            : { url: imageData.url };

          // Prompt especializado baseado no segmento da loja
          const systemPrompt = `Você é um assistente de identificação de produtos. Analise a imagem enviada e:
1. Identifique o produto mostrado (nome, marca se visível, quantidade/tamanho)
2. Se for uma receita médica, identifique os medicamentos prescritos (NUNCA faça diagnósticos médicos)
3. Se for uma embalagem, leia as informações do produto
4. Se não conseguir identificar claramente, diga o que você consegue ver e peça uma foto mais nítida

Seja objetivo e forneça informações úteis para ajudar o cliente a encontrar o produto.
${imageContext ? `Contexto adicional: ${imageContext}` : ''}`;

          // Chamar GPT-4o Vision
          const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiCreds.api_key}`,
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
              max_tokens: 500,
            }),
          });

          if (!visionResponse.ok) {
            const errorText = await visionResponse.text();
            console.error('[product-search-agent] Erro OpenAI Vision:', errorText);
            result = {
              error: true,
              message: 'Erro ao processar a imagem. Tente novamente.',
            };
            break;
          }

          const visionResult = await visionResponse.json();
          const analysisContent = visionResult.choices?.[0]?.message?.content || '';

          // Registrar uso de tokens (Vision usa mais tokens por causa da imagem)
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
              image_source: imageData.base64 ? 'base64' : 'url',
            }
          });

          console.log(`[product-search-agent] 📊 Vision usage logged: ${promptTokens + completionTokens} tokens`);

          // Extrair informações do produto identificado
          result = {
            success: true,
            analysis: analysisContent,
            message: 'Imagem analisada com sucesso',
            next_steps: 'Use search_products para buscar o produto identificado no catálogo',
          };

        } catch (visionError) {
          console.error('[product-search-agent] Erro no Vision:', visionError);
          result = {
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
