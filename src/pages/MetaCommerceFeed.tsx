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

export default function MetaCommerceFeed() {
  const { slug } = useParams<{ slug: string }>();
  const [csv, setCsv] = useState<string>('');
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
          setCsv('error,Loja não encontrada');
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
          setCsv('error,Erro ao buscar produtos');
          setLoading(false);
          return;
        }

        const generatedCsv = generateMetaCommerceCSV(store, products || []);
        setCsv(generatedCsv);
      } catch (error) {
        console.error('Erro ao gerar feed Meta Commerce:', error);
        setCsv('error,Erro interno');
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
      {csv}
    </pre>
  );
}

function escapeCSV(str: string | null | undefined): string {
  if (!str) return '';
  // Se contém vírgula, aspas ou quebra de linha, envolver em aspas e escapar aspas internas
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function generateMetaCommerceCSV(store: Store, products: Product[]): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://mostralo.com.br';
  const storeUrl = `${baseUrl}/loja/${store.slug}`;
  
  // Header do CSV (campos obrigatórios do Meta Commerce)
  let csv = 'id,title,description,availability,condition,price,link,image_link,brand\n';

  products.forEach(product => {
    const finalPrice = product.is_on_offer && product.offer_price 
      ? product.offer_price 
      : product.price;
    
    const productUrl = `${storeUrl}?produto=${product.id}`;
    const availability = product.is_available ? 'in_stock' : 'out_of_stock';
    
    csv += `${escapeCSV(product.id)},`;
    csv += `${escapeCSV(product.name)},`;
    csv += `${escapeCSV(product.description || product.name)},`;
    csv += `${availability},`;
    csv += `new,`;
    csv += `${finalPrice.toFixed(2)} BRL,`;
    csv += `${productUrl},`;
    csv += `${escapeCSV(product.image_url || '')},`;
    csv += `${escapeCSV(store.name)}\n`;
  });

  return csv;
}
