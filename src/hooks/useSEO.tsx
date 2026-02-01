import { useEffect } from 'react';

// Hook simples e direto para SEO
export const usePageSEO = (config: {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: string;
  keywords?: string;
  price?: number;
  currency?: string;
  availability?: string;
  brand?: string;
}) => {
  useEffect(() => {
    // Log para debug
    console.log('🔍 Configurando SEO:', config.title);
    
    // Definir título
    document.title = config.title;
    console.log('✅ Título definido:', document.title);

    // Remover meta tags existentes personalizadas
    removeCustomMetaTags();

    // Adicionar novas meta tags
    addMetaTag('name', 'description', config.description);
    
    if (config.keywords) {
      addMetaTag('name', 'keywords', config.keywords);
    }

    // Meta tags básicas do Open Graph
    addMetaTag('property', 'og:title', config.title);
    addMetaTag('property', 'og:description', config.description);
    addMetaTag('property', 'og:type', config.type || 'website');
    addMetaTag('property', 'og:site_name', 'Mostralo');
    addMetaTag('property', 'og:locale', 'pt_BR');
    
    if (config.image) {
      addMetaTag('property', 'og:image', config.image);
      addMetaTag('property', 'og:image:alt', `Imagem de ${config.title.split(' - ')[0]}`);
      addMetaTag('property', 'og:image:width', '800');
      addMetaTag('property', 'og:image:height', '600');
    }
    
    if (config.url) {
      addMetaTag('property', 'og:url', config.url);
    }

    // Meta tags específicas para produtos
    if (config.type === 'product' && config.price && config.currency) {
      addMetaTag('property', 'product:price:amount', config.price.toString());
      addMetaTag('property', 'product:price:currency', config.currency);
      addMetaTag('property', 'og:price:amount', config.price.toString());
      addMetaTag('property', 'og:price:currency', config.currency);
      
      if (config.availability) {
        addMetaTag('property', 'product:availability', config.availability);
        addMetaTag('property', 'og:availability', config.availability);
      }
      
      if (config.brand) {
        addMetaTag('property', 'product:brand', config.brand);
      }
    }

    // Twitter Cards melhoradas
    addMetaTag('name', 'twitter:card', 'summary_large_image');
    addMetaTag('name', 'twitter:title', config.title);
    addMetaTag('name', 'twitter:description', config.description);
    addMetaTag('name', 'twitter:site', '@mostralo');
    addMetaTag('name', 'twitter:creator', '@mostralo');
    
    if (config.image) {
      addMetaTag('name', 'twitter:image', config.image);
      addMetaTag('name', 'twitter:image:alt', `Imagem de ${config.title.split(' - ')[0]}`);
    }

    // Meta tags para WhatsApp e Telegram
    addMetaTag('property', 'al:web:url', config.url || window.location.href);
    
    return () => {
      console.log('🧹 Limpando SEO');
      removeCustomMetaTags();
    };
  }, [config.title, config.description, config.keywords, config.price]);
};

// Função auxiliar para adicionar meta tags
const addMetaTag = (attribute: string, name: string, content: string) => {
  if (!content) return;
  
  const existing = document.querySelector(`meta[${attribute}="${name}"]`);
  if (existing) {
    existing.setAttribute('content', content);
  } else {
    const meta = document.createElement('meta');
    meta.setAttribute(attribute, name);
    meta.setAttribute('content', content);
    meta.setAttribute('data-seo-dynamic', 'true');
    document.head.appendChild(meta);
  }
};

// Função auxiliar para remover meta tags personalizadas
const removeCustomMetaTags = () => {
  const customTags = document.querySelectorAll('[data-seo-dynamic="true"]');
  customTags.forEach(tag => tag.remove());
};

// Função de mapeamento SEO por segmento
const getSegmentSEO = (segment?: string) => {
  switch (segment) {
    case 'alimentacao-e-bebidas':
      return { 
        titleSuffix: 'Cardápio Digital', 
        descriptionPrefix: 'Conheça o cardápio',
        keywords: 'cardápio digital, menu online, pedidos, delivery'
      };
    case 'saude-e-bem-estar':
      return { 
        titleSuffix: 'Loja Online', 
        descriptionPrefix: 'Confira os produtos',
        keywords: 'farmácia online, saúde, bem-estar, medicamentos'
      };
    case 'servicos':
      return { 
        titleSuffix: 'Catálogo de Serviços', 
        descriptionPrefix: 'Veja nossos serviços',
        keywords: 'serviços, catálogo, orçamento online'
      };
    default:
      return { 
        titleSuffix: 'Loja Online', 
        descriptionPrefix: 'Confira os produtos',
        keywords: 'loja online, produtos, compras, catálogo'
      };
  }
};

// Hook específico para páginas de loja (mantido para compatibilidade)
export const useSEO = (store: any | null, slug?: string) => {
  const seo = getSegmentSEO(store?.segment);
  
  usePageSEO({
    title: store ? `${store.name} - ${seo.titleSuffix} | Mostralo` : 'Carregando...',
    description: store?.description || `${seo.descriptionPrefix} da ${store?.name || 'loja'}. Faça seu pedido online!`,
    image: store?.logo_url || '/favicon.png',
    keywords: seo.keywords
  });
};