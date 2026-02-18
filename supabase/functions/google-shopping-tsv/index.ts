import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Store {
  id: string;
  name: string;
  slug: string;
  delivery_fee: number | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean | null;
  is_on_offer: boolean | null;
  offer_price: number | null;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
}

// Limpa texto para TSV: remove tabs, quebras de linha
function cleanTSV(str: string | null | undefined): string {
  if (!str) return '';
  return str.replace(/[\t\r\n]/g, ' ').trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');

    console.log(`[google-shopping-tsv] Requisição recebida para slug: ${slug}`);

    if (!slug) {
      return new Response('Parâmetro slug obrigatório', {
        status: 400,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', ...corsHeaders }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Buscar loja ativa
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name, slug, delivery_fee')
      .eq('slug', slug)
      .eq('status', 'active')
      .single();

    if (storeError || !store) {
      console.error('[google-shopping-tsv] Loja não encontrada:', storeError?.message);
      return new Response('Loja não encontrada', {
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', ...corsHeaders }
      });
    }

    // Buscar categorias para mapear nomes
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name')
      .eq('store_id', store.id);

    const categoryMap = new Map<string, string>();
    categories?.forEach((c: Category) => categoryMap.set(c.id, c.name));

    // Buscar TODOS os produtos com paginação
    const PAGE_SIZE = 1000;
    let allProducts: Product[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data: batch, error: batchError } = await supabase
        .from('products')
        .select('id, name, description, price, image_url, is_available, is_on_offer, offer_price, category_id')
        .eq('store_id', store.id)
        .eq('is_available', true)
        .range(from, to);

      if (batchError) {
        console.error(`[google-shopping-tsv] Erro página ${page}:`, batchError.message);
        break;
      }

      if (batch && batch.length > 0) {
        allProducts = allProducts.concat(batch as Product[]);
        hasMore = batch.length === PAGE_SIZE;
        page++;
      } else {
        hasMore = false;
      }
    }

    console.log(`[google-shopping-tsv] ${allProducts.length} produtos encontrados`);

    const baseUrl = 'https://mostralo.com.br';
    const storeUrl = `${baseUrl}/loja/${store.slug}`;
    const shippingPrice = store.delivery_fee ? store.delivery_fee.toFixed(2) : '0.00';

    // Cabeçalho TSV (colunas obrigatórias do Google Merchant Center)
    const headers = [
      'id',
      'title',
      'description',
      'link',
      'image_link',
      'availability',
      'price',
      'brand',
      'condition',
      'product_type',
      'shipping(country:service:price)'
    ];

    let tsv = headers.join('\t') + '\n';

    // Linhas de produtos
    for (const product of allProducts) {
      const finalPrice = product.is_on_offer && product.offer_price
        ? product.offer_price
        : product.price;

      const productUrl = `${storeUrl}?produto=${product.id}`;
      const availability = product.is_available ? 'in_stock' : 'out_of_stock';
      const categoryName = product.category_id ? categoryMap.get(product.category_id) || '' : '';

      const row = [
        cleanTSV(product.id),
        cleanTSV(product.name),
        cleanTSV(product.description || product.name),
        productUrl,
        cleanTSV(product.image_url || ''),
        availability,
        `${finalPrice.toFixed(2)} BRL`,
        cleanTSV(store.name),
        'new',
        cleanTSV(categoryName),
        `BR:Entrega Padrão:${shippingPrice} BRL`
      ];

      tsv += row.join('\t') + '\n';
    }

    console.log('[google-shopping-tsv] TSV gerado com sucesso');

    return new Response(tsv, {
      headers: {
        'Content-Type': 'text/tab-separated-values; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'Content-Disposition': `attachment; filename="${store.slug}-google-shopping.tsv"`,
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('[google-shopping-tsv] Erro interno:', error);
    return new Response('Erro interno do servidor', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', ...corsHeaders }
    });
  }
});
