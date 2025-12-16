import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

interface StoreData {
  name: string;
  description: string | null;
  logo_url: string | null;
  slug: string;
}

interface ProductData {
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  slug: string;
  store: {
    name: string;
    slug: string;
    logo_url: string | null;
  };
}

function isCrawler(userAgent: string | null): boolean {
  if (!userAgent) return false;
  
  const crawlerPatterns = [
    'WhatsApp',
    'facebookexternalhit',
    'Facebot',
    'Twitterbot',
    'TelegramBot',
    'LinkedInBot',
    'Slackbot',
    'Discordbot',
    'SkypeUriPreview'
  ];
  
  return crawlerPatterns.some(pattern => 
    userAgent.toLowerCase().includes(pattern.toLowerCase())
  );
}

function generateStorePreviewHTML(store: StoreData, baseUrl: string): string {
  const storeUrl = `${baseUrl}/loja/${store.slug}`;
  const imageUrl = store.logo_url || `${baseUrl}/placeholder.svg`;
  const description = store.description || `Conheça ${store.name} - Peça delivery agora!`;
  
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Open Graph / Facebook / WhatsApp / LinkedIn -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${storeUrl}" />
  <meta property="og:title" content="${store.name}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="Mostralo" />
  <meta property="og:locale" content="pt_BR" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${storeUrl}" />
  <meta name="twitter:title" content="${store.name}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${imageUrl}" />
  
  <!-- Standard Meta Tags -->
  <meta name="description" content="${description}" />
  <meta name="author" content="Mostralo" />
  
  <title>${store.name} - Mostralo</title>
  
  <!-- Favicon fixo do Mostralo -->
  <link rel="icon" href="${baseUrl}/mostralo-icon.png" type="image/png">
  <link rel="shortcut icon" href="${baseUrl}/mostralo-icon.png">
  <link rel="apple-touch-icon" href="${baseUrl}/mostralo-icon.png">
  
  <!-- Redirect para usuários reais -->
  <meta http-equiv="refresh" content="0;url=${storeUrl}" />
  
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: white;
      text-align: center;
      padding: 20px;
    }
    .container {
      max-width: 400px;
    }
    .logo {
      width: 120px;
      height: 120px;
      border-radius: 20px;
      margin: 0 auto 20px;
      object-fit: cover;
      background: white;
    }
    h1 {
      font-size: 24px;
      margin: 0 0 10px;
    }
    p {
      font-size: 16px;
      opacity: 0.9;
      margin: 0 0 20px;
    }
    .footer {
      font-size: 14px;
      opacity: 0.7;
      margin-top: 30px;
    }
    a {
      color: white;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    ${store.logo_url ? `<img src="${store.logo_url}" alt="${store.name}" class="logo" />` : ''}
    <h1>${store.name}</h1>
    <p>${description}</p>
    <p>Redirecionando para <a href="${storeUrl}">${storeUrl}</a></p>
    <div class="footer">
      Feito por <strong>Mostralo</strong>
    </div>
  </div>
</body>
</html>`;
}

function generateProductPreviewHTML(product: ProductData, baseUrl: string): string {
  const productUrl = `${baseUrl}/loja/${product.store.slug}/produto/${product.slug}`;
  const imageUrl = product.image_url || product.store.logo_url || `${baseUrl}/placeholder.svg`;
  const priceFormatted = `R$ ${product.price.toFixed(2).replace('.', ',')}`;
  const description = product.description 
    ? `${product.description.substring(0, 100)}${product.description.length > 100 ? '...' : ''} - ${priceFormatted}`
    : `${product.name} por ${priceFormatted} em ${product.store.name}. Peça agora!`;
  
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Open Graph / Facebook / WhatsApp / LinkedIn -->
  <meta property="og:type" content="product" />
  <meta property="og:url" content="${productUrl}" />
  <meta property="og:title" content="${product.name} - ${priceFormatted}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="${product.store.name} - Mostralo" />
  <meta property="og:locale" content="pt_BR" />
  
  <!-- Product specific meta tags -->
  <meta property="product:price:amount" content="${product.price.toFixed(2)}" />
  <meta property="product:price:currency" content="BRL" />
  <meta property="product:availability" content="in stock" />
  <meta property="product:brand" content="${product.store.name}" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${productUrl}" />
  <meta name="twitter:title" content="${product.name} - ${priceFormatted}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${imageUrl}" />
  
  <!-- Standard Meta Tags -->
  <meta name="description" content="${description}" />
  <meta name="author" content="${product.store.name}" />
  
  <title>${product.name} - ${product.store.name}</title>
  
  <!-- Favicon fixo do Mostralo -->
  <link rel="icon" href="${baseUrl}/mostralo-icon.png" type="image/png">
  <link rel="shortcut icon" href="${baseUrl}/mostralo-icon.png">
  <link rel="apple-touch-icon" href="${baseUrl}/mostralo-icon.png">
  
  <!-- Redirect para usuários reais -->
  <meta http-equiv="refresh" content="0;url=${productUrl}" />
  
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: white;
      text-align: center;
      padding: 20px;
    }
    .container {
      max-width: 400px;
    }
    .product-image {
      width: 200px;
      height: 200px;
      border-radius: 16px;
      margin: 0 auto 20px;
      object-fit: cover;
      background: white;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    }
    h1 {
      font-size: 22px;
      margin: 0 0 8px;
    }
    .price {
      font-size: 28px;
      font-weight: bold;
      margin: 0 0 8px;
    }
    .store-name {
      font-size: 16px;
      opacity: 0.9;
      margin: 0 0 20px;
    }
    .footer {
      font-size: 14px;
      opacity: 0.7;
      margin-top: 30px;
    }
    a {
      color: white;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <img src="${imageUrl}" alt="${product.name}" class="product-image" />
    <h1>${product.name}</h1>
    <p class="price">${priceFormatted}</p>
    <p class="store-name">${product.store.name}</p>
    <p>Redirecionando para <a href="${productUrl}">ver produto</a></p>
    <div class="footer">
      Feito por <strong>Mostralo</strong>
    </div>
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');
    const productSlug = url.searchParams.get('product');
    
    if (!slug) {
      return new Response('Missing slug parameter', { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    // Detectar crawler
    const userAgent = req.headers.get('user-agent');
    const isBot = isCrawler(userAgent);
    
    console.log(`[store-og-preview] Request for slug: ${slug}, product: ${productSlug || 'none'}, User-Agent: ${userAgent}, Is Crawler: ${isBot}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Determinar URL base - usa parâmetro domain se disponível (passado pelo nginx)
    const domainParam = url.searchParams.get('domain');
    const baseUrl = domainParam || (url.origin.includes('supabase.co') 
      ? 'https://mostralo.com.br'  // fallback padrão
      : url.origin);
    
    console.log(`[store-og-preview] Domain param: ${domainParam}, Final baseUrl: ${baseUrl}`);

    // Se tem productSlug, buscar produto
    if (productSlug) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select(`
          name, description, price, image_url, slug,
          stores:store_id (name, slug, logo_url)
        `)
        .eq('slug', productSlug)
        .eq('is_available', true)
        .single();

      if (productError || !product) {
        console.error('[store-og-preview] Product not found:', productError);
        // Fallback: redirecionar para URL do produto mesmo assim
        const productUrl = `${baseUrl}/loja/${slug}/produto/${productSlug}`;
        return new Response(null, {
          status: 302,
          headers: { ...corsHeaders, 'Location': productUrl }
        });
      }

      // Para crawlers, retornar HTML com meta tags OG do produto
      if (isBot) {
        const storeData = product.stores as unknown as { name: string; slug: string; logo_url: string | null };
        const html = generateProductPreviewHTML({
          name: product.name,
          description: product.description,
          price: product.price,
          image_url: product.image_url,
          slug: product.slug,
          store: storeData
        }, baseUrl);
        
        return new Response(html, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=300',
          }
        });
      }

      // Para usuários normais, redirecionar para o produto
      const productUrl = `${baseUrl}/loja/${slug}/produto/${productSlug}`;
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, 'Location': productUrl }
      });
    }

    // Buscar dados da loja (comportamento original)
    const { data: store, error } = await supabase
      .from('public_stores')
      .select('name, description, logo_url, slug')
      .eq('slug', slug)
      .single();

    if (error || !store) {
      console.error('[store-og-preview] Store not found:', error);
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, 'Location': baseUrl }
      });
    }

    // Para crawlers, retornar HTML com meta tags OG da loja
    if (isBot) {
      const html = generateStorePreviewHTML(store as StoreData, baseUrl);
      
      return new Response(html, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
        }
      });
    }

    // Para usuários normais, redirecionar para o SPA
    const storeUrl = `${baseUrl}/loja/${store.slug}`;
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, 'Location': storeUrl }
    });

  } catch (error) {
    console.error('[store-og-preview] Error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
