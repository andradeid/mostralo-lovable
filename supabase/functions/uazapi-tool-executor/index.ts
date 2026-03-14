// UaZapi Tool Executor v1.0.0
// Endpoint HTTP que o sistema de funções nativo da UaZapi chama
// quando o agente precisa executar uma ferramenta (check_stock, search_products, etc.)
// UaZapi envia os parâmetros via query string ou POST body
// e espera uma resposta JSON simples

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, token',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extrair parâmetros de query string E body
    const url = new URL(req.url);
    const fnName = url.searchParams.get('function') || url.searchParams.get('fn') || '';
    const storeId = url.searchParams.get('store_id') || '';
    const authToken = url.searchParams.get('auth') || req.headers.get('token') || '';

    // Parâmetros podem vir via query string ou POST body
    let bodyParams: Record<string, any> = {};
    if (req.method === 'POST') {
      try {
        bodyParams = await req.json();
      } catch {
        // Se não for JSON, tentar form data
        try {
          const text = await req.text();
          const pairs = text.split('&');
          for (const pair of pairs) {
            const [k, v] = pair.split('=');
            if (k) bodyParams[decodeURIComponent(k)] = decodeURIComponent(v || '');
          }
        } catch {}
      }
    }

    // Merge: query string params + body params
    const params: Record<string, any> = { ...bodyParams };
    for (const [key, value] of url.searchParams.entries()) {
      if (!['function', 'fn', 'store_id', 'auth'].includes(key)) {
        params[key] = value;
      }
    }

    console.log(`[uazapi-tool-executor] 🔧 Função: ${fnName} | Store: ${storeId} | Params: ${JSON.stringify(params).substring(0, 300)}`);

    if (!fnName) {
      return jsonResponse({ error: 'Parâmetro "function" é obrigatório' }, 400);
    }

    if (!storeId) {
      return jsonResponse({ error: 'Parâmetro "store_id" é obrigatório' }, 400);
    }

    // Validar que o store_id existe
    const { data: store } = await supabase
      .from('stores')
      .select('id, name')
      .eq('id', storeId)
      .single();

    if (!store) {
      return jsonResponse({ error: 'Loja não encontrada' }, 404);
    }

    // Executar a função
    const result = await executeFunction(supabase, storeId, fnName, params);
    const elapsed = Date.now() - startTime;
    console.log(`[uazapi-tool-executor] ✅ ${fnName} concluído em ${elapsed}ms | Resultado: ${JSON.stringify(result).substring(0, 300)}`);

    return jsonResponse(result);

  } catch (error) {
    console.error(`[uazapi-tool-executor] ❌ Erro:`, error);
    return jsonResponse({ error: error.message || 'Erro interno' }, 500);
  }
});

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const PRODUCT_SEARCH_STOP_WORDS = new Set([
  'a', 'o', 'as', 'os', 'um', 'uma', 'uns', 'umas', 'de', 'da', 'do', 'das', 'dos',
  'e', 'em', 'no', 'na', 'nos', 'nas', 'para', 'por', 'com', 'sem', 'que', 'tem',
  'tenho', 'ter', 'quero', 'preciso', 'gostaria', 'saber', 'se', 'tem?', 'temos',
  'vocês', 'voces', 'ai', 'aí', 'qual', 'quais', 'me', 'mostrar', 'procura', 'procurar'
]);

function normalizeProductSearch(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildProductSearchCandidates(input: string): string[] {
  const normalized = normalizeProductSearch(input);
  if (!normalized) return [];

  const words = normalized.split(' ').filter(Boolean);
  const meaningfulWords = words.filter(
    (word) => word.length > 2 && !PRODUCT_SEARCH_STOP_WORDS.has(word)
  );

  if (meaningfulWords.length === 0) return [normalized].filter(v => v.length >= 2);

  // Classificar palavras: mais longas/raras = mais específicas → prioridade alta
  const GENERIC_PRODUCT_WORDS = new Set([
    'xarope', 'pomada', 'creme', 'gel', 'comprimido', 'capsula', 'gotas', 'spray',
    'shampoo', 'sabonete', 'loção', 'locao', 'pastilha', 'solucao', 'solução',
    'remedio', 'remédio', 'medicamento', 'vitamina', 'suplemento', 'protetor',
    'esmalte', 'hidratante', 'condicionador', 'desodorante', 'absorvente',
    'fralda', 'leite', 'papa', 'soro', 'colírio', 'colirio', 'pilula', 'pílula',
    'grande', 'pequeno', 'pequena', 'medio', 'media', 'infantil', 'adulto'
  ]);

  const specificWords = meaningfulWords.filter(w => !GENERIC_PRODUCT_WORDS.has(w));
  const genericWords = meaningfulWords.filter(w => GENERIC_PRODUCT_WORDS.has(w));

  const candidates: string[] = [];

  // 1. Palavras específicas individuais PRIMEIRO (ex: "expec" antes de "xarope")
  for (const word of specificWords) {
    candidates.push(word);
  }

  // 2. Combinação completa de palavras significativas
  if (meaningfulWords.length > 1) {
    candidates.push(meaningfulWords.join(' '));
    // Permutação invertida (ex: "expec xarope" se input foi "xarope expec")
    candidates.push([...meaningfulWords].reverse().join(' '));
    // Específicas + genéricas
    if (specificWords.length > 0 && genericWords.length > 0) {
      candidates.push([...specificWords, ...genericWords].join(' '));
    }
  }

  // 3. Primeiras 3 palavras significativas
  if (meaningfulWords.length > 3) {
    candidates.push(meaningfulWords.slice(0, 3).join(' '));
  }

  // 4. Palavras genéricas por último (ex: "xarope")
  for (const word of genericWords) {
    candidates.push(word);
  }

  // 5. Frase completa normalizada como fallback
  candidates.push(normalized);

  return [...new Set(candidates)].filter((value) => value && value.length >= 2);
}

function getProductSalePrice(product: Record<string, any>): number | null {
  return product.offer_price ?? null;
}

function getProductStockLabel(product: Record<string, any>): string {
  if (!product.is_available) return 'indisponível';
  if (product.track_stock === false || product.stock_quantity === null) {
    return 'disponível (estoque não controlado)';
  }
  if (product.stock_quantity > 0) {
    return `${product.stock_quantity} unidade(s) em estoque`;
  }
  return 'sem estoque';
}

async function searchStoreProducts(
  supabase: any,
  storeId: string,
  rawQuery: string,
  limit = 5,
  onlyAvailable = false
) {
  const candidates = buildProductSearchCandidates(rawQuery);
  const uniqueProducts = new Map<string, any>();

  for (const candidate of candidates) {
    let query = supabase
      .from('products')
      .select('id, name, price, offer_price, description, slug, is_available, track_stock, stock_quantity, image_url')
      .eq('store_id', storeId);

    if (onlyAvailable) {
      query = query.eq('is_available', true);
    }

    const { data: products, error } = await query
      .or(`name.ilike.%${candidate}%,description.ilike.%${candidate}%`)
      .limit(limit);

    if (error) {
      console.error(`[uazapi-tool-executor] ❌ Erro searchStoreProducts (${candidate}):`, error.message);
      continue;
    }

    for (const product of products || []) {
      uniqueProducts.set(product.id, product);
      if (uniqueProducts.size >= limit) {
        return { products: Array.from(uniqueProducts.values()).slice(0, limit), candidates };
      }
    }
  }

  return { products: Array.from(uniqueProducts.values()).slice(0, limit), candidates };
}

async function executeFunction(supabase: any, storeId: string, fnName: string, args: Record<string, any>): Promise<any> {
  switch (fnName) {
    case 'search_products': {
      const rawQuery = args.query || args.produto || args.busca || '';
      const limit = parseInt(args.limit || '5');
      const { products, candidates } = await searchStoreProducts(supabase, storeId, rawQuery, limit, true);
      console.log(`[uazapi-tool-executor] 🔎 search_products query="${rawQuery}" candidates=${JSON.stringify(candidates)}`);

      if (!products.length) {
        return { status: 'not_found', message: `Nenhum produto encontrado para "${rawQuery}"`, results: [] };
      }

      return {
        status: 'success',
        quantidade_encontrada: products.length,
        results: products.map((p: any) => ({
          nome: p.name,
          preco: `R$ ${Number(p.price || 0).toFixed(2)}`,
          preco_promocional: getProductSalePrice(p) ? `R$ ${Number(getProductSalePrice(p)).toFixed(2)}` : null,
          descricao: p.description,
          slug: p.slug,
          disponivel: p.is_available,
          estoque: getProductStockLabel(p),
        })),
      };
    }

    case 'check_stock': {
      const rawQuery = args.product_name || args.produto || args.nome || args.query || '';
      const { products, candidates } = await searchStoreProducts(supabase, storeId, rawQuery, 5, false);
      console.log(`[uazapi-tool-executor] 📦 check_stock query="${rawQuery}" candidates=${JSON.stringify(candidates)}`);

      if (!products.length) {
        return { status: 'not_found', disponivel: false, message: `Nenhum produto encontrado com "${rawQuery}"` };
      }

      return {
        status: 'success',
        results: products.map((p: any) => ({
          nome: p.name,
          disponivel: p.is_available && (p.track_stock === false || p.stock_quantity === null || p.stock_quantity > 0),
          estoque: p.stock_quantity,
          status_estoque: getProductStockLabel(p),
          preco: `R$ ${Number(p.price || 0).toFixed(2)}`,
          preco_promocional: getProductSalePrice(p) ? `R$ ${Number(getProductSalePrice(p)).toFixed(2)}` : null,
          slug: p.slug,
        })),
      };
    }

    case 'get_product_details': {
      const slug = args.slug || '';
      const { data: product } = await supabase
        .from('products')
        .select('name, price, offer_price, description, slug, is_available, track_stock, stock_quantity, image_url')
        .eq('store_id', storeId)
        .eq('slug', slug)
        .maybeSingle();

      if (!product) return { status: 'not_found', message: 'Produto não encontrado' };
      return {
        status: 'success',
        ...product,
        preco_promocional: getProductSalePrice(product),
        status_estoque: getProductStockLabel(product),
      };
    }

    case 'list_categories': {
      const { data: cats } = await supabase
        .from('categories')
        .select('name, description')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('display_order');
      return { status: 'success', categorias: cats || [] };
    }

    case 'get_promotions': {
      const limit = parseInt(args.limit || '5');
      const { data: promos } = await supabase
        .from('products')
        .select('name, price, offer_price, slug')
        .eq('store_id', storeId)
        .eq('is_available', true)
        .not('offer_price', 'is', null)
        .gt('offer_price', 0)
        .limit(limit);
      return {
        status: 'success',
        promocoes: (promos || []).map((p: any) => ({
          ...p,
          preco_promocional: p.offer_price,
        })),
      };
    }

    case 'get_recommendations': {
      const limit = parseInt(args.limit || '5');
      const { data: recs } = await supabase
        .from('products')
        .select('name, price, description, slug')
        .eq('store_id', storeId)
        .eq('is_available', true)
        .order('total_orders', { ascending: false })
        .limit(limit);
      return { status: 'success', recomendacoes: recs || [] };
    }

    case 'get_store_info': {
      const { data: store } = await supabase
        .from('stores')
        .select('name, description, address, whatsapp, business_hours, delivery_fee, min_order_value')
        .eq('id', storeId)
        .single();
      if (!store) return { status: 'error', message: 'Loja não encontrada' };
      return { status: 'success', ...store };
    }

    case 'check_store_status': {
      const { data: store } = await supabase
        .from('stores')
        .select('is_open, business_hours, timezone')
        .eq('id', storeId)
        .single();
      return {
        status: 'success',
        aberta: store?.is_open ?? true,
        horario_funcionamento: store?.business_hours,
      };
    }

    case 'get_last_delivery_info': {
      const phone = args.customer_phone || args.telefone || '';
      const variants = [phone];
      if (phone.startsWith('55')) variants.push(phone.substring(2));
      else variants.push('55' + phone);

      const { data: customer } = await supabase
        .from('customers')
        .select('name, address, latitude, longitude')
        .in('phone', variants)
        .limit(1)
        .maybeSingle();

      if (!customer) return { status: 'not_found', message: 'Cliente não encontrado' };
      return { status: 'success', nome: customer.name, endereco: customer.address };
    }

    case 'calculate_delivery_fee': {
      const { data: store } = await supabase
        .from('stores')
        .select('delivery_fee')
        .eq('id', storeId)
        .single();
      return { status: 'success', taxa_entrega: store?.delivery_fee || 0 };
    }

    default:
      return { status: 'error', message: `Função "${fnName}" não reconhecida` };
  }
}
