import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Buscar lojas ativas com assinatura válida
    const { data: stores, error } = await supabase
      .from('stores')
      .select('slug, updated_at')
      .eq('status', 'active')
      .gt('subscription_expires_at', new Date().toISOString())
      .not('slug', 'is', null)

    if (error) {
      console.error('Erro ao buscar lojas:', error)
    }

    const baseUrl = 'https://mostralo.com.br'
    const today = new Date().toISOString().split('T')[0]

    // Páginas estáticas
    const staticPages = [
      { loc: '/', priority: '1.0', changefreq: 'weekly', lastmod: today },
      { loc: '/seja-vendedor', priority: '0.5', changefreq: 'monthly', lastmod: today },
      { loc: '/termos-de-uso', priority: '0.3', changefreq: 'monthly', lastmod: today },
      { loc: '/privacidade', priority: '0.3', changefreq: 'monthly', lastmod: today },
    ]

    // URLs das lojas
    const storeUrls = (stores || []).map((store) => ({
      loc: `/loja/${store.slug}`,
      priority: '0.8',
      changefreq: 'daily',
      lastmod: store.updated_at?.split('T')[0] || today,
    }))

    const allUrls = [...staticPages, ...storeUrls]

    // Gerar XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(url => `  <url>
    <loc>${baseUrl}${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`

    console.log(`Sitemap gerado com ${allUrls.length} URLs (${stores?.length || 0} lojas)`)

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      }
    })

  } catch (error) {
    console.error('Erro ao gerar sitemap:', error)
    return new Response('Erro interno', { status: 500, headers: corsHeaders })
  }
})
