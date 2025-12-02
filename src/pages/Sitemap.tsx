import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StoreData {
  slug: string;
  updated_at: string;
}

export default function Sitemap() {
  const [xml, setXml] = useState<string>('');

  useEffect(() => {
    const generateSitemap = async () => {
      const baseUrl = 'https://mostralo.com.br';
      const today = new Date().toISOString().split('T')[0];

      // Buscar lojas ativas com assinatura válida
      const { data: stores } = await supabase
        .from('stores')
        .select('slug, updated_at')
        .eq('status', 'active')
        .gt('subscription_expires_at', new Date().toISOString())
        .not('slug', 'is', null);

      const staticPages = [
        { loc: '/', priority: '1.0', changefreq: 'weekly', lastmod: today },
        { loc: '/seja-vendedor', priority: '0.5', changefreq: 'monthly' },
        { loc: '/termos-de-uso', priority: '0.3', changefreq: 'monthly' },
        { loc: '/privacidade', priority: '0.3', changefreq: 'monthly' },
      ];

      const storeUrls = (stores || []).map((store: StoreData) => ({
        loc: `/loja/${store.slug}`,
        priority: '0.8',
        changefreq: 'daily',
        lastmod: store.updated_at?.split('T')[0] || today,
      }));

      const allUrls = [...staticPages, ...storeUrls];

      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(url => `  <url>
    <loc>${baseUrl}${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

      setXml(xmlContent);
    };

    generateSitemap();
  }, []);

  // Renderizar XML formatado
  if (!xml) {
    return <div>Gerando sitemap...</div>;
  }

  return (
    <pre style={{ 
      fontFamily: 'monospace', 
      whiteSpace: 'pre-wrap', 
      wordWrap: 'break-word',
      padding: '1rem',
      backgroundColor: '#f5f5f5',
      margin: 0
    }}>
      {xml}
    </pre>
  );
}
