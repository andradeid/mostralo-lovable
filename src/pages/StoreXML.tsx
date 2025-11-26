import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Tipos
interface Store {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  segment: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  google_maps_link: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  website: string | null;
  logo_url: string | null;
  cover_url: string | null;
  delivery_fee: number | null;
  min_order_value: number | null;
  business_hours: any;
  accepts_pix: boolean;
  accepts_card: boolean;
  accepts_cash: boolean;
}

interface StoreConfig {
  primary_color: string | null;
  secondary_color: string | null;
  product_display_layout: string | null;
  delivery_zones: any;
  delivery_times: any;
  online_payment_enabled?: boolean; // Opcional - não disponível na view pública
  qr_code_enabled: boolean;
  delivery_button_text: string | null;
  pickup_button_text: string | null;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

interface ProductVariant {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_default: boolean;
  is_available: boolean;
  display_order: number;
}

interface Product {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  category_id: string | null;
  price: number;
  is_on_offer: boolean;
  original_price: number | null;
  offer_price: number | null;
  is_available: boolean;
  image_url: string | null;
  image_gallery: string[] | null;
  button_text: string | null;
  display_order: number;
  product_variants: ProductVariant[];
}

interface AddonCategory {
  id: string;
  name: string;
  description: string | null;
  min_selections: number;
  max_selections: number | null;
  is_required: boolean;
  display_order: number;
}

interface Addon {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  display_order: number;
}

interface ProductAddon {
  product_id: string;
  addon_id: string;
  is_required: boolean;
  max_quantity: number;
}

export default function StoreXML() {
  const { slug } = useParams<{ slug: string }>();
  const [xml, setXml] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) {
        setXml('<?xml version="1.0" encoding="UTF-8"?><erro>Slug não fornecido</erro>');
        setLoading(false);
        return;
      }

      try {
        // 1. Buscar loja
        const { data: store, error: storeError } = await supabase
          .from('stores')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'active')
          .maybeSingle();

        if (storeError || !store) {
          setXml('<?xml version="1.0" encoding="UTF-8"?><erro>Loja não encontrada</erro>');
          setLoading(false);
          return;
        }

        // 2. Buscar configuração (usando view pública segura)
        const { data: config } = await supabase
          .from('public_store_config')
          .select('*')
          .eq('store_id', store.id)
          .maybeSingle();

        // 3. Buscar categorias
        const { data: categories } = await supabase
          .from('categories')
          .select('*')
          .eq('store_id', store.id)
          .eq('is_active', true)
          .order('display_order');

        // 4. Buscar produtos
        const { data: products } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', store.id)
          .eq('is_available', true)
          .order('display_order');

        // 4b. Buscar variantes dos produtos
        const productIds = products?.map(p => p.id) || [];
        const { data: allVariants } = await supabase
          .from('product_variants')
          .select('*')
          .in('product_id', productIds)
          .order('display_order');

        // Associar variantes aos produtos
        const productsWithVariants = products?.map(product => ({
          ...product,
          product_variants: allVariants?.filter(v => v.product_id === product.id) || []
        }));

        // 5. Buscar addon categories
        const { data: addonCategories } = await supabase
          .from('addon_categories')
          .select('*')
          .eq('store_id', store.id)
          .eq('is_active', true)
          .order('display_order');

        // 6. Buscar addons
        const { data: addons } = await supabase
          .from('addons')
          .select('*')
          .eq('store_id', store.id)
          .eq('is_available', true)
          .order('display_order');

        // 7. Buscar product_addons
        const { data: productAddons } = await supabase
          .from('product_addons')
          .select('product_id, addon_id, is_required, max_quantity');

        // Gerar XML
        const generatedXml = generateXML(
          store,
          config,
          categories || [],
          productsWithVariants || [],
          addonCategories || [],
          addons || [],
          productAddons || []
        );

        setXml(generatedXml);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        setXml('<?xml version="1.0" encoding="UTF-8"?><erro>Erro ao buscar dados da loja</erro>');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '12px' }}>
      {xml}
    </pre>
  );
}

// Funções auxiliares
function escapeXML(str: string | null | undefined): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function businessHoursToXML(hours: any): string {
  if (!hours) return '';
  
  const days = [
    { key: 'monday', label: 'segunda' },
    { key: 'tuesday', label: 'terca' },
    { key: 'wednesday', label: 'quarta' },
    { key: 'thursday', label: 'quinta' },
    { key: 'friday', label: 'sexta' },
    { key: 'saturday', label: 'sabado' },
    { key: 'sunday', label: 'domingo' }
  ];
  
  return days.map(day => {
    const dayData = hours[day.key] || { closed: true, open: '00:00', close: '00:00' };
    return `    <${day.label} abertura="${escapeXML(dayData.open || '00:00')}" fechamento="${escapeXML(dayData.close || '00:00')}" fechado="${dayData.closed || true}"/>`;
  }).join('\n');
}

function isOpenNow(hours: any): boolean {
  if (!hours) return false;
  
  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = dayNames[now.getDay()];
  const currentTime = now.toTimeString().slice(0, 5);
  
  const dayHours = hours[today];
  if (!dayHours || dayHours.closed) return false;
  
  return currentTime >= dayHours.open && currentTime <= dayHours.close;
}

function getCurrentDay(): string {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayNamesPortuguese = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  return dayNamesPortuguese[new Date().getDay()];
}

function getCurrentTime(): string {
  return new Date().toTimeString().slice(0, 5);
}

function calculateMetadata(products: Product[]) {
  if (!products || products.length === 0) {
    return { avgPrice: 0, cheapest: null, mostExpensive: null };
  }

  const prices = products.map(p => Number(p.price || 0));
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length || 0;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  return {
    avgPrice: avgPrice.toFixed(2),
    cheapest: products.find(p => Number(p.price) === minPrice),
    mostExpensive: products.find(p => Number(p.price) === maxPrice)
  };
}

function generateXML(
  store: Store,
  config: StoreConfig | null,
  categories: Category[],
  products: Product[],
  addonCategories: AddonCategory[],
  addons: Addon[],
  productAddons: ProductAddon[]
): string {
  const metadata = calculateMetadata(products);
  const openNow = isOpenNow(store.business_hours);
  
  // Organizar adicionais por produto
  const productAddonsMap = new Map<string, Map<string, { category: AddonCategory; addons: Addon[] }>>();
  
  productAddons.forEach(pa => {
    const addon = addons.find(a => a.id === pa.addon_id);
    if (!addon || !addon.category_id) return;
    
    const category = addonCategories.find(c => c.id === addon.category_id);
    if (!category) return;
    
    if (!productAddonsMap.has(pa.product_id)) {
      productAddonsMap.set(pa.product_id, new Map());
    }
    
    const productData = productAddonsMap.get(pa.product_id)!;
    
    if (!productData.has(category.id)) {
      productData.set(category.id, { category, addons: [] });
    }
    
    productData.get(category.id)!.addons.push(addon);
  });

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<loja>\n';
  
  // Informações básicas
  xml += '  <informacoes_basicas>\n';
  xml += `    <id>${escapeXML(store.id)}</id>\n`;
  xml += `    <nome>${escapeXML(store.name)}</nome>\n`;
  xml += `    <slug>${escapeXML(store.slug)}</slug>\n`;
  xml += `    <descricao>${escapeXML(store.description)}</descricao>\n`;
  xml += `    <status>${escapeXML(store.status)}</status>\n`;
  xml += `    <segmento>${escapeXML(store.segment)}</segmento>\n`;
  xml += '  </informacoes_basicas>\n\n';
  
  // Localização
  xml += '  <localizacao>\n';
  xml += `    <endereco>${escapeXML(store.address)}</endereco>\n`;
  xml += `    <cidade>${escapeXML(store.city)}</cidade>\n`;
  xml += `    <estado>${escapeXML(store.state)}</estado>\n`;
  xml += `    <latitude>${store.latitude || ''}</latitude>\n`;
  xml += `    <longitude>${store.longitude || ''}</longitude>\n`;
  xml += `    <link_google_maps>${escapeXML(store.google_maps_link)}</link_google_maps>\n`;
  xml += '  </localizacao>\n\n';
  
  // Contato
  xml += '  <contato>\n';
  xml += `    <telefone>${escapeXML(store.phone)}</telefone>\n`;
  xml += `    <whatsapp>${escapeXML(store.whatsapp)}</whatsapp>\n`;
  xml += `    <instagram>${escapeXML(store.instagram)}</instagram>\n`;
  xml += `    <facebook>${escapeXML(store.facebook)}</facebook>\n`;
  xml += `    <website>${escapeXML(store.website)}</website>\n`;
  xml += '  </contato>\n\n';
  
  // Horários
  xml += '  <horarios_funcionamento>\n';
  xml += businessHoursToXML(store.business_hours);
  xml += '\n  </horarios_funcionamento>\n\n';
  
  // Delivery
  xml += '  <delivery>\n';
  xml += `    <faz_delivery>true</faz_delivery>\n`;
  xml += `    <permite_retirada>true</permite_retirada>\n`;
  xml += `    <taxa_entrega>${store.delivery_fee || 0}</taxa_entrega>\n`;
  xml += `    <pedido_minimo>${store.min_order_value || 0}</pedido_minimo>\n`;
  xml += `    <tempo_entrega>${escapeXML(config?.delivery_times?.delivery || '')}</tempo_entrega>\n`;
  xml += `    <tempo_retirada>${escapeXML(config?.delivery_times?.pickup || '')}</tempo_retirada>\n`;
  
  // Zonas de entrega
  if (config?.delivery_zones && Array.isArray(config.delivery_zones)) {
    xml += '    <zonas_entrega>\n';
    config.delivery_zones.forEach((zone: any, index: number) => {
      xml += `      <zona id="${index + 1}" nome="${escapeXML(zone.name)}" tipo="${escapeXML(zone.type)}" raio="${zone.radius || ''}" taxa="${zone.fee || 0}" ativa="${zone.enabled !== false}"/>\n`;
    });
    xml += '    </zonas_entrega>\n';
  }
  
  xml += `    <agendamento_habilitado>false</agendamento_habilitado>\n`;
  xml += `    <aceita_automaticamente>false</aceita_automaticamente>\n`;
  xml += '  </delivery>\n\n';
  
  // Pagamentos
  xml += '  <pagamentos>\n';
  xml += `    <aceita_pix>${store.accepts_pix || false}</aceita_pix>\n`;
  xml += `    <aceita_cartao>${store.accepts_card || false}</aceita_cartao>\n`;
  xml += `    <aceita_dinheiro>${store.accepts_cash || false}</aceita_dinheiro>\n`;
  xml += `    <pagamento_online_habilitado>${config?.online_payment_enabled || false}</pagamento_online_habilitado>\n`;
  xml += `    <gateway>nenhum</gateway>\n`;
  xml += '  </pagamentos>\n\n';
  
  // Categorias
  xml += '  <categorias>\n';
  categories.forEach(cat => {
    xml += `    <categoria id="${escapeXML(cat.id)}">\n`;
    xml += `      <nome>${escapeXML(cat.name)}</nome>\n`;
    xml += `      <descricao>${escapeXML(cat.description)}</descricao>\n`;
    xml += `      <ordem_exibicao>${cat.display_order}</ordem_exibicao>\n`;
    xml += `      <ativa>${cat.is_active}</ativa>\n`;
    xml += '    </categoria>\n';
  });
  xml += '  </categorias>\n\n';
  
  // Produtos
  xml += '  <produtos>\n';
  products.forEach(product => {
    xml += `    <produto id="${escapeXML(product.id)}">\n`;
    xml += `      <nome>${escapeXML(product.name)}</nome>\n`;
    xml += `      <slug>${escapeXML(product.slug)}</slug>\n`;
    xml += `      <descricao>${escapeXML(product.description)}</descricao>\n`;
    xml += `      <categoria_id>${escapeXML(product.category_id)}</categoria_id>\n`;
    xml += `      <preco>${product.price}</preco>\n`;
    xml += `      <em_oferta>${product.is_on_offer || false}</em_oferta>\n`;
    xml += `      <preco_original>${product.original_price || ''}</preco_original>\n`;
    xml += `      <preco_oferta>${product.offer_price || ''}</preco_oferta>\n`;
    xml += `      <disponivel>${product.is_available}</disponivel>\n`;
    xml += `      <imagem_principal>${escapeXML(product.image_url)}</imagem_principal>\n`;
    
    // Galeria de imagens
    if (product.image_gallery && Array.isArray(product.image_gallery)) {
      xml += '      <galeria_imagens>\n';
      product.image_gallery.forEach(img => {
        xml += `        <imagem>${escapeXML(img)}</imagem>\n`;
      });
      xml += '      </galeria_imagens>\n';
    }
    
    xml += `      <texto_botao>${escapeXML(product.button_text || 'Pedir Agora')}</texto_botao>\n`;
    
    // Variantes
    if (product.product_variants && product.product_variants.length > 0) {
      xml += '      <variantes>\n';
      product.product_variants.forEach((variant: ProductVariant) => {
        xml += `        <variante id="${escapeXML(variant.id)}">\n`;
        xml += `          <nome>${escapeXML(variant.name)}</nome>\n`;
        xml += `          <descricao>${escapeXML(variant.description)}</descricao>\n`;
        xml += `          <preco>${variant.price}</preco>\n`;
        xml += `          <padrao>${variant.is_default}</padrao>\n`;
        xml += `          <disponivel>${variant.is_available}</disponivel>\n`;
        xml += `          <ordem_exibicao>${variant.display_order}</ordem_exibicao>\n`;
        xml += '        </variante>\n';
      });
      xml += '      </variantes>\n';
    }
    
    // Categorias de adicionais
    const productAddonData = productAddonsMap.get(product.id);
    if (productAddonData && productAddonData.size > 0) {
      xml += '      <categorias_adicionais>\n';
      productAddonData.forEach((data, categoryId) => {
        const { category, addons: categoryAddons } = data;
        xml += `        <categoria_adicional id="${escapeXML(category.id)}">\n`;
        xml += `          <nome>${escapeXML(category.name)}</nome>\n`;
        xml += `          <descricao>${escapeXML(category.description)}</descricao>\n`;
        xml += `          <selecoes_minimas>${category.min_selections}</selecoes_minimas>\n`;
        xml += `          <selecoes_maximas>${category.max_selections || ''}</selecoes_maximas>\n`;
        xml += `          <obrigatorio>${category.is_required}</obrigatorio>\n`;
        xml += `          <ordem_exibicao>${category.display_order}</ordem_exibicao>\n`;
        
        xml += '          <adicionais>\n';
        categoryAddons.forEach(addon => {
          xml += `            <adicional id="${escapeXML(addon.id)}">\n`;
          xml += `              <nome>${escapeXML(addon.name)}</nome>\n`;
          xml += `              <descricao>${escapeXML(addon.description)}</descricao>\n`;
          xml += `              <preco>${addon.price}</preco>\n`;
          xml += `              <disponivel>${addon.is_available}</disponivel>\n`;
          xml += `              <ordem_exibicao>${addon.display_order}</ordem_exibicao>\n`;
          xml += '            </adicional>\n';
        });
        xml += '          </adicionais>\n';
        
        xml += '        </categoria_adicional>\n';
      });
      xml += '      </categorias_adicionais>\n';
    }
    
    xml += '    </produto>\n';
  });
  xml += '  </produtos>\n\n';
  
  // Configuração visual
  xml += '  <configuracao_visual>\n';
  xml += `    <cor_primaria>${escapeXML(config?.primary_color || '#21b8c8')}</cor_primaria>\n`;
  xml += `    <cor_secundaria>${escapeXML(config?.secondary_color || '#10B981')}</cor_secundaria>\n`;
  xml += `    <layout_produtos>${escapeXML(config?.product_display_layout || 'grid')}</layout_produtos>\n`;
  xml += `    <url_logo>${escapeXML(store.logo_url)}</url_logo>\n`;
  xml += `    <url_capa>${escapeXML(store.cover_url)}</url_capa>\n`;
  xml += '  </configuracao_visual>\n\n';
  
  // Metadados para IA
  xml += '  <metadados_ia>\n';
  xml += `    <total_produtos>${products.length}</total_produtos>\n`;
  xml += `    <total_categorias>${categories.length}</total_categorias>\n`;
  xml += `    <aberto_agora>${openNow}</aberto_agora>\n`;
  xml += `    <dia_atual>${getCurrentDay()}</dia_atual>\n`;
  xml += `    <hora_atual>${getCurrentTime()}</hora_atual>\n`;
  xml += `    <preco_medio_produtos>${metadata.avgPrice}</preco_medio_produtos>\n`;
  
  if (metadata.cheapest) {
    xml += '    <produto_mais_barato>\n';
    xml += `      <nome>${escapeXML(metadata.cheapest.name)}</nome>\n`;
    xml += `      <preco>${metadata.cheapest.price}</preco>\n`;
    xml += '    </produto_mais_barato>\n';
  }
  
  if (metadata.mostExpensive) {
    xml += '    <produto_mais_caro>\n';
    xml += `      <nome>${escapeXML(metadata.mostExpensive.name)}</nome>\n`;
    xml += `      <preco>${metadata.mostExpensive.price}</preco>\n`;
    xml += '    </produto_mais_caro>\n';
  }
  
  xml += `    <ultima_atualizacao>${new Date().toISOString()}</ultima_atualizacao>\n`;
  xml += '  </metadados_ia>\n';
  
  xml += '</loja>';
  
  return xml;
}
