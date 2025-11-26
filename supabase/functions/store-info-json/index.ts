import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para verificar se está aberto agora
function isOpenNow(businessHours: any): boolean {
  if (!businessHours) return false;
  
  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = dayNames[now.getDay()];
  const currentTime = now.toTimeString().slice(0, 5);
  
  const hours = businessHours[today];
  if (!hours || hours.closed) return false;
  
  return currentTime >= hours.open && currentTime <= hours.close;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');

    if (!slug) {
      return new Response(
        JSON.stringify({ error: 'Slug da loja é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Criar cliente Supabase (service role para bypass de RLS com respostas seguras)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Buscando informações para loja: ${slug}`);

    // 1. Buscar dados da loja
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'active')
      .maybeSingle();

    if (storeError) {
      console.error('Erro ao buscar loja:', storeError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar loja', details: storeError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!store) {
      console.log('Loja não encontrada com slug:', slug);
      return new Response(
        JSON.stringify({ error: 'Loja não encontrada ou inativa' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 2. Buscar configuração da loja
    const { data: config } = await supabase
      .from('store_configurations')
      .select('*')
      .eq('store_id', store.id)
      .maybeSingle();

    // 3. Buscar categorias
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .eq('store_id', store.id)
      .eq('is_active', true)
      .order('display_order');

    // 4. Buscar produtos com variantes
    const { data: products } = await supabase
      .from('products')
      .select(`
        *,
        product_variants(*)
      `)
      .eq('store_id', store.id)
      .eq('is_available', true)
      .order('display_order');

    // 5. Buscar categorias de addons
    const { data: addonCategories } = await supabase
      .from('addon_categories')
      .select('*')
      .eq('store_id', store.id)
      .eq('is_active', true)
      .order('display_order');

    // 6. Buscar addons
    const { data: addons } = await supabase
      .from('addons')
      .select('*')
      .eq('store_id', store.id)
      .eq('is_available', true)
      .order('display_order');

    // 7. Buscar relacionamento produto-addons
    const { data: productAddons } = await supabase
      .from('product_addons')
      .select('*');

    // Processar produtos com seus addons
    const productsWithAddons = products?.map(product => {
      // Encontrar addons relacionados a este produto
      const relatedAddonIds = productAddons
        ?.filter(pa => pa.product_id === product.id)
        .map(pa => pa.addon_id) || [];

      // Agrupar addons por categoria
      const addonsByCategory = addonCategories?.map(category => {
        const categoryAddons = addons
          ?.filter(addon => 
            addon.category_id === category.id && 
            relatedAddonIds.includes(addon.id)
          )
          .map(addon => ({
            id: addon.id,
            name: addon.name,
            description: addon.description,
            price: parseFloat(addon.price?.toString() || '0'),
            is_available: addon.is_available,
            display_order: addon.display_order
          })) || [];

        return categoryAddons.length > 0 ? {
          id: category.id,
          name: category.name,
          description: category.description,
          min_selections: category.min_selections || 0,
          max_selections: category.max_selections,
          is_required: category.is_required || false,
          display_order: category.display_order,
          addons: categoryAddons
        } : null;
      }).filter(Boolean) || [];

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: parseFloat(product.price?.toString() || '0'),
        original_price: product.original_price ? parseFloat(product.original_price.toString()) : null,
        offer_price: product.offer_price ? parseFloat(product.offer_price.toString()) : null,
        is_on_offer: product.is_on_offer || false,
        is_available: product.is_available,
        image_url: product.image_url,
        image_gallery: product.image_gallery || [],
        category_id: product.category_id,
        display_order: product.display_order,
        button_text: product.button_text,
        variants: product.product_variants?.map((v: any) => ({
          id: v.id,
          name: v.name,
          description: v.description,
          price: parseFloat(v.price?.toString() || '0'),
          is_default: v.is_default,
          is_available: v.is_available,
          display_order: v.display_order
        })) || [],
        addon_categories: addonsByCategory
      };
    }) || [];

    // Calcular metadados úteis para IA
    const prices = productsWithAddons.map(p => p.price).filter(p => p > 0);
    const avgPrice = prices.length > 0 
      ? prices.reduce((a, b) => a + b, 0) / prices.length 
      : 0;
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    const cheapestProduct = productsWithAddons
      .filter(p => p.price > 0)
      .sort((a, b) => a.price - b.price)[0];

    const mostExpensiveProduct = productsWithAddons
      .filter(p => p.price > 0)
      .sort((a, b) => b.price - a.price)[0];

    const currentlyOpen = isOpenNow(store.business_hours);

    // Montar resposta JSON completa
    const response = {
      basic_info: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        description: store.description,
        status: store.status,
        segment: store.segment,
        created_at: store.created_at,
        updated_at: store.updated_at
      },
      location: {
        address: store.address,
        city: store.city,
        state: store.state,
        latitude: store.latitude ? parseFloat(store.latitude.toString()) : null,
        longitude: store.longitude ? parseFloat(store.longitude.toString()) : null,
        google_maps_link: store.google_maps_link
      },
      contact: {
        phone: store.phone,
        whatsapp: store.whatsapp,
        instagram: store.instagram,
        facebook: store.facebook,
        website: store.website,
        responsible_name: store.responsible_name,
        responsible_email: store.responsible_email,
        responsible_phone: store.responsible_phone
      },
      business_hours: store.business_hours || {},
      delivery: {
        does_delivery: true, // assumindo que sim, baseado no delivery_config
        allows_pickup: true,
        delivery_fee: store.delivery_fee ? parseFloat(store.delivery_fee.toString()) : 0,
        min_order_value: store.min_order_value ? parseFloat(store.min_order_value.toString()) : 0,
        delivery_zones: config?.delivery_zones || [],
        scheduled_orders: store.delivery_config?.scheduled_orders || {}
      },
      payment_methods: {
        accepts_pix: store.accepts_pix,
        accepts_card: store.accepts_card,
        accepts_cash: store.accepts_cash,
        online_payment_enabled: config?.online_payment_enabled || false,
        payment_gateways: store.payment_gateways || {}
      },
      categories: categories?.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        display_order: cat.display_order,
        is_active: cat.is_active
      })) || [],
      products: productsWithAddons,
      theme: {
        primary_color: config?.primary_color || '#3B82F6',
        secondary_color: config?.secondary_color || '#10B981',
        theme_colors: store.theme_colors || {},
        product_display_layout: config?.product_display_layout || 'grid',
        logo_url: store.logo_url,
        cover_url: store.cover_url
      },
      ai_metadata: {
        total_products: productsWithAddons.length,
        total_categories: categories?.length || 0,
        average_product_price: Math.round(avgPrice * 100) / 100,
        min_product_price: minPrice,
        max_product_price: maxPrice,
        is_currently_open: currentlyOpen,
        current_timestamp: new Date().toISOString(),
        has_variants: productsWithAddons.some(p => p.variants.length > 0),
        has_addons: productsWithAddons.some(p => p.addon_categories.length > 0),
        cheapest_product: cheapestProduct ? {
          name: cheapestProduct.name,
          price: cheapestProduct.price
        } : null,
        most_expensive_product: mostExpensiveProduct ? {
          name: mostExpensiveProduct.name,
          price: mostExpensiveProduct.price
        } : null,
        products_on_offer: productsWithAddons.filter(p => p.is_on_offer).length
      }
    };

    console.log(`Informações processadas com sucesso para loja: ${slug}`);

    return new Response(
      JSON.stringify(response, null, 2),
      { 
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300' // Cache de 5 minutos
        }
      }
    );

  } catch (error) {
    console.error('Erro na função store-info-json:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao processar informações da loja',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
