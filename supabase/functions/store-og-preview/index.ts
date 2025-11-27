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

function generatePreviewHTML(store: StoreData, baseUrl: string): string {
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

Deno.serve(async (req) => {
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

    // Detectar crawler
    const userAgent = req.headers.get('user-agent');
    const isBot = isCrawler(userAgent);
    
    console.log(`[store-og-preview] Request for slug: ${slug}, User-Agent: ${userAgent}, Is Crawler: ${isBot}`);

    // Buscar dados da loja
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data: store, error } = await supabase
      .from('public_stores')
      .select('name, description, logo_url, slug')
      .eq('slug', slug)
      .single();

    if (error || !store) {
      console.error('[store-og-preview] Store not found:', error);
      
      // Se loja não existe, redirecionar para home
      const baseUrl = url.origin;
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': baseUrl,
        }
      });
    }

    // Determinar URL base (considera custom domain ou domínio padrão)
    const baseUrl = url.origin.includes('supabase.co') 
      ? 'https://mostralo.me' 
      : url.origin;

    // Para crawlers, retornar HTML com meta tags OG
    if (isBot) {
      const html = generatePreviewHTML(store as StoreData, baseUrl);
      
      return new Response(html, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300', // Cache de 5 minutos
        }
      });
    }

    // Para usuários normais, redirecionar para o SPA
    const storeUrl = `${baseUrl}/loja/${store.slug}`;
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': storeUrl,
      }
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
