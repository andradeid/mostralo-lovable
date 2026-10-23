import { createClient } from "npm:@supabase/supabase-js@2";

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
  slug: string | null;
  image_gallery: string[] | null;
}

function escapeXML(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateGoogleShoppingXML(store: Store, products: Product[]): string {
  const baseUrl = 'https://mostralo.com.br';
  const storeUrl = `${baseUrl}/loja/${store.slug}`;
  const shippingPrice = store.delivery_fee ? store.delivery_fee.toFixed(2) : '0.00';
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
<channel>
<title>${escapeXML(store.name)} - Produtos</title>
<link>${storeUrl}</link>
<description>Catálogo de produtos de ${escapeXML(store.name)}</description>
`;

  products.forEach(product => {
    const imgs = [product.image_url, ...(product.image_gallery ?? [])]
      .filter((u): u is string => !!u && /^https?:\/\//.test(u));
    const uniq = [...new Set(imgs)];
    // Sem imagem o Google reprova o item ("Imagem do produto ausente"): fica de fora do feed.
    if (uniq.length === 0 || !(product.price > 0)) return;

    const onSale = !!(product.is_on_offer && product.offer_price && product.offer_price > 0 && product.offer_price < product.price);
    // Link da página do próprio produto (sai do servidor com preço e dados estruturados).
    const productUrl = product.slug
      ? `${storeUrl}/produto/${encodeURIComponent(product.slug)}`
      : `${storeUrl}?produto=${product.id}`;
    const availability = product.is_available ? 'in_stock' : 'out_of_stock';

    xml += `<item>
<g:id>${escapeXML(product.id)}</g:id>
<g:title>${escapeXML(product.name.slice(0, 150))}</g:title>
<g:description>${escapeXML((product.description || product.name).slice(0, 5000))}</g:description>
<g:link>${escapeXML(productUrl)}</g:link>
<g:image_link>${escapeXML(uniq[0])}</g:image_link>
${uniq.slice(1, 10).map((u) => `<g:additional_image_link>${escapeXML(u)}</g:additional_image_link>`).join('\n')}
<g:condition>new</g:condition>
<g:availability>${availability}</g:availability>
<g:price>${product.price.toFixed(2)} BRL</g:price>
${onSale ? `<g:sale_price>${product.offer_price!.toFixed(2)} BRL</g:sale_price>` : ''}
<g:shipping>
<g:country>BR</g:country>
<g:service>Entrega Padrão</g:service>
<g:price>${shippingPrice} BRL</g:price>
</g:shipping>
<g:brand>${escapeXML(store.name)}</g:brand>
<g:identifier_exists>no</g:identifier_exists>
</item>
`;
  });

  xml += `</channel>
</rss>`;

  return xml;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');

    console.log(`[google-shopping-feed] Requisição recebida para slug: ${slug}`);

    if (!slug) {
      console.error('[google-shopping-feed] Parâmetro slug não informado');
      return new Response('<?xml version="1.0" encoding="UTF-8"?><error>Parâmetro slug obrigatório</error>', {
        status: 400,
        headers: { 'Content-Type': 'application/xml; charset=utf-8', ...corsHeaders }
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
      console.error('[google-shopping-feed] Loja não encontrada:', storeError?.message);
      return new Response('<?xml version="1.0" encoding="UTF-8"?><error>Loja não encontrada</error>', {
        status: 404,
        headers: { 'Content-Type': 'application/xml; charset=utf-8', ...corsHeaders }
      });
    }

    console.log(`[google-shopping-feed] Loja encontrada: ${store.name} (${store.id})`);

    // Buscar TODOS os produtos disponíveis (paginação para lojas grandes)
    const PAGE_SIZE = 1000;
    let allProducts: Product[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data: batch, error: batchError } = await supabase
        .from('products')
        .select('id, name, description, price, image_url, image_gallery, slug, is_available, is_on_offer, offer_price')
        .eq('store_id', store.id)
        .eq('is_available', true)
        .range(from, to);

      if (batchError) {
        console.error(`[google-shopping-feed] Erro página ${page}:`, batchError.message);
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

    const products = allProducts;

    // Erro de produtos já tratado no loop acima

    console.log(`[google-shopping-feed] ${products?.length || 0} produtos encontrados`);

    // Gerar XML
    const xml = generateGoogleShoppingXML(store, products || []);

    console.log('[google-shopping-feed] XML gerado com sucesso');

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('[google-shopping-feed] Erro interno:', error);
    return new Response('<?xml version="1.0" encoding="UTF-8"?><error>Erro interno do servidor</error>', {
      status: 500,
      headers: { 'Content-Type': 'application/xml; charset=utf-8', ...corsHeaders }
    });
  }
});
