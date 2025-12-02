import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean | null;
  is_on_offer: boolean | null;
  offer_price: number | null;
}

interface Store {
  id: string;
  name: string;
  slug: string;
}

export default function GoogleShoppingFeed() {
  const { slug } = useParams<{ slug: string }>();
  const [xml, setXml] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;

      try {
        // Buscar loja
        const { data: store, error: storeError } = await supabase
          .from('stores')
          .select('id, name, slug')
          .eq('slug', slug)
          .eq('status', 'active')
          .single();

        if (storeError || !store) {
          setXml('<?xml version="1.0" encoding="UTF-8"?><error>Loja não encontrada</error>');
          setLoading(false);
          return;
        }

        // Buscar produtos disponíveis
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, name, description, price, image_url, is_available, is_on_offer, offer_price')
          .eq('store_id', store.id)
          .eq('is_available', true);

        if (productsError) {
          setXml('<?xml version="1.0" encoding="UTF-8"?><error>Erro ao buscar produtos</error>');
          setLoading(false);
          return;
        }

        const generatedXml = generateGoogleShoppingXML(store, products || []);
        setXml(generatedXml);
      } catch (error) {
        console.error('Erro ao gerar feed Google Shopping:', error);
        setXml('<?xml version="1.0" encoding="UTF-8"?><error>Erro interno</error>');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  if (loading) {
    return <pre>Carregando feed...</pre>;
  }

  return (
    <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily: 'monospace', fontSize: '12px' }}>
      {xml}
    </pre>
  );
}

function escapeXML(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateGoogleShoppingXML(store: Store, products: Product[]): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://mostralo.com.br';
  const storeUrl = `${baseUrl}/loja/${store.slug}`;
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXML(store.name)} - Produtos</title>
    <link>${storeUrl}</link>
    <description>Catálogo de produtos de ${escapeXML(store.name)}</description>
`;

  products.forEach(product => {
    const finalPrice = product.is_on_offer && product.offer_price 
      ? product.offer_price 
      : product.price;
    
    const productUrl = `${storeUrl}?produto=${product.id}`;
    const availability = product.is_available ? 'in_stock' : 'out_of_stock';
    
    xml += `
    <item>
      <g:id>${escapeXML(product.id)}</g:id>
      <g:title>${escapeXML(product.name)}</g:title>
      <g:description>${escapeXML(product.description || product.name)}</g:description>
      <g:link>${productUrl}</g:link>
      <g:image_link>${escapeXML(product.image_url || '')}</g:image_link>
      <g:price>${finalPrice.toFixed(2)} BRL</g:price>
      <g:availability>${availability}</g:availability>
      <g:condition>new</g:condition>
      <g:brand>${escapeXML(store.name)}</g:brand>
    </item>`;
  });

  xml += `
  </channel>
</rss>`;

  return xml;
}
