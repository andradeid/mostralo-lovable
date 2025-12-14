import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');

    if (!slug) {
      return new Response('Missing slug parameter', { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
      });
    }

    console.log(`[meta-commerce-feed] Generating CSV feed for store: ${slug}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch store
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name, slug, status')
      .eq('slug', slug)
      .eq('status', 'active')
      .single();

    if (storeError || !store) {
      console.error(`[meta-commerce-feed] Store not found: ${slug}`, storeError);
      return new Response('Store not found', { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
      });
    }

    // Fetch products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        offer_price,
        is_on_offer,
        is_available,
        image_url,
        slug
      `)
      .eq('store_id', store.id);

    if (productsError) {
      console.error(`[meta-commerce-feed] Error fetching products:`, productsError);
      return new Response('Error fetching products', { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
      });
    }

    console.log(`[meta-commerce-feed] Found ${products?.length || 0} products`);

    // Base URL for product links
    const baseUrl = `https://mostralo.com.br/loja/${store.slug}`;

    // CSV Header
    const csvHeader = 'id,title,description,availability,condition,price,link,image_link,brand';

    // Generate CSV rows
    const csvRows = (products || []).map(product => {
      const productId = product.id;
      const title = escapeCSV(product.name || '');
      const description = escapeCSV((product.description || '').substring(0, 5000));
      const availability = product.is_available ? 'in_stock' : 'out_of_stock';
      const condition = 'new';
      
      // Price formatting: use offer_price if on offer, otherwise regular price
      const priceValue = (product.is_on_offer && product.offer_price) 
        ? product.offer_price 
        : product.price;
      const price = `${Number(priceValue || 0).toFixed(2)} BRL`;
      
      // Product link
      const link = product.slug 
        ? `${baseUrl}/produto/${product.slug}` 
        : `${baseUrl}?produto=${product.id}`;
      
      // Image URL
      const imageLink = product.image_url || '';
      
      // Brand is store name
      const brand = escapeCSV(store.name || '');

      return `${productId},${title},${description},${availability},${condition},${price},${link},${imageLink},${brand}`;
    });

    // Combine header and rows
    const csvContent = [csvHeader, ...csvRows].join('\n');

    console.log(`[meta-commerce-feed] Generated CSV with ${csvRows.length} products for ${store.name}`);

    return new Response(csvContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="products-${slug}.csv"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[meta-commerce-feed] Error:', errorMessage);
    return new Response(`Error: ${errorMessage}`, { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
    });
  }
});

// Helper function to escape CSV values
function escapeCSV(value: string): string {
  if (!value) return '';
  
  // Remove line breaks and tabs
  let escaped = value.replace(/[\r\n\t]/g, ' ');
  
  // If contains comma, quote, or space, wrap in quotes and escape internal quotes
  if (escaped.includes(',') || escaped.includes('"') || escaped.includes(' ')) {
    escaped = `"${escaped.replace(/"/g, '""')}"`;
  }
  
  return escaped;
}
