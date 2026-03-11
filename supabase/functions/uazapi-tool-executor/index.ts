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

async function executeFunction(supabase: any, storeId: string, fnName: string, args: Record<string, any>): Promise<any> {
  switch (fnName) {
    case 'search_products': {
      const query = args.query || args.produto || args.busca || '';
      const limit = parseInt(args.limit || '5');
      const { data: products } = await supabase
        .from('products')
        .select('name, price, description, slug, is_available, promotional_price, stock_quantity')
        .eq('store_id', storeId)
        .eq('is_available', true)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(limit);

      if (!products?.length) return { status: 'not_found', message: `Nenhum produto encontrado para "${query}"`, results: [] };

      return {
        status: 'success',
        quantidade_encontrada: products.length,
        results: products.map((p: any) => ({
          nome: p.name,
          preco: `R$ ${p.price?.toFixed(2)}`,
          preco_promocional: p.promotional_price ? `R$ ${p.promotional_price.toFixed(2)}` : null,
          descricao: p.description,
          slug: p.slug,
          disponivel: p.is_available,
          estoque: p.stock_quantity === null ? 'disponível' : p.stock_quantity > 0 ? `${p.stock_quantity} unidades` : 'sem estoque',
        })),
      };
    }

    case 'check_stock': {
      const searchName = args.product_name || args.produto || args.nome || '';
      const { data: products } = await supabase
        .from('products')
        .select('name, is_available, stock_quantity, price, promotional_price')
        .eq('store_id', storeId)
        .ilike('name', `%${searchName}%`)
        .limit(5);

      if (!products?.length) return { status: 'not_found', disponivel: false, message: `Nenhum produto encontrado com "${searchName}"` };

      return {
        status: 'success',
        results: products.map((p: any) => ({
          nome: p.name,
          disponivel: p.is_available,
          estoque: p.stock_quantity,
          status_estoque: p.stock_quantity === null ? 'disponível (estoque não controlado)'
            : p.stock_quantity > 0 ? `${p.stock_quantity} unidade(s) em estoque`
            : 'sem estoque',
          preco: `R$ ${p.price?.toFixed(2)}`,
          preco_promocional: p.promotional_price ? `R$ ${p.promotional_price.toFixed(2)}` : null,
        })),
      };
    }

    case 'get_product_details': {
      const slug = args.slug || '';
      const { data: product } = await supabase
        .from('products')
        .select('name, price, promotional_price, description, slug, is_available, stock_quantity, image_url')
        .eq('store_id', storeId)
        .eq('slug', slug)
        .maybeSingle();

      if (!product) return { status: 'not_found', message: 'Produto não encontrado' };
      return { status: 'success', ...product };
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
        .select('name, price, promotional_price, slug')
        .eq('store_id', storeId)
        .eq('is_available', true)
        .not('promotional_price', 'is', null)
        .gt('promotional_price', 0)
        .limit(limit);
      return { status: 'success', promocoes: promos || [] };
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
