// Product Search Agent - v1.0.0
// Edge Function para consultas em tempo real ao banco de produtos
// Usado pelo Assistente Inteligente v2 via Function Calling da OpenAI

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    
    const body = await req.json() as FunctionCallRequest;
    
    if (!storeId && body.storeId) {
      storeId = body.storeId;
    }

    if (!storeId) {
      return new Response(JSON.stringify({ 
        error: 'storeId é obrigatório' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { function: functionName, args } = body;

    console.log(`[product-search-agent] Função: ${functionName}, Args:`, args);

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
      price: p.price,
      promotional_price: p.promotional_price,
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
            id, name, slug, price, promotional_price, description,
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
            id, name, slug, price, promotional_price, description,
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
            id, name, slug, price, promotional_price, description,
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
            id, name, slug, price, promotional_price, description,
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
          ],
        };
    }

    console.log(`[product-search-agent] Resultado:`, result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[product-search-agent] Erro:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro interno' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
