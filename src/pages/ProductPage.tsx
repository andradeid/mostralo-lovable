import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePageSEO } from '@/hooks/useSEO';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useStoreStatus } from '@/hooks/useStoreStatus';
import { useProductPromotion } from '@/hooks/useProductPromotion';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Plus, 
  Minus, 
  MessageCircle,
  Share2,
  Store as StoreIcon,
  AlertCircle
} from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { type CarouselApi } from '@/components/ui/carousel';
import { CartDrawer } from '@/components/checkout/CartDrawer';
import { CheckoutDialog } from '@/components/checkout/CheckoutDialog';
import { CustomerAuthDialog } from '@/components/checkout/CustomerAuthDialog';
import { CustomerRegisterDialog } from '@/components/checkout/CustomerRegisterDialog';

interface Store {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  slug: string;
  phone?: string;
  address?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
  theme_colors: any;
  configuration?: {
    primary_color?: string;
    secondary_color?: string;
  };
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  image_gallery?: string[];
  category_id?: string;
  button_text?: string;
  slug: string;
  is_on_offer?: boolean;
  original_price?: number;
  offer_price?: number;
  category?: {
    name: string;
  };
}

interface ProductVariant {
  id: string;
  name: string;
  price: number;
  description?: string;
  is_available: boolean;
  is_default: boolean;
}

interface Addon {
  id: string;
  name: string;
  description?: string;
  price: number;
  is_available: boolean;
  addon_category: {
    id: string;
    name: string;
    description?: string;
    min_selections: number;
    max_selections: number;
    is_required: boolean;
  };
}

interface AddonCategory {
  id: string;
  name: string;
  description?: string;
  min_selections: number;
  max_selections: number;
  is_required: boolean;
  addons: Addon[];
}

const ProductPage = () => {
  const { storeSlug, productSlug } = useParams<{ storeSlug: string; productSlug: string }>();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [observations, setObservations] = useState('');
  const [loading, setLoading] = useState(true);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [addonCategories, setAddonCategories] = useState<AddonCategory[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<{[categoryId: string]: {[addonId: string]: number}}>({});
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [customerRegisterOpen, setCustomerRegisterOpen] = useState(false);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [businessHours, setBusinessHours] = useState<any>(null);
  const [deliveryConfig, setDeliveryConfig] = useState<any>(null);
  const { addItem, getTotalPrice, getTotalItems } = useCart();
  const { toast } = useToast();
  
  const storeStatus = useStoreStatus(businessHours, deliveryConfig);
  const primaryColor = store?.configuration?.primary_color || store?.theme_colors?.primary || '#3B82F6';

  // Hook para calcular promoções aplicáveis ao produto
  const { finalPrice: promotionFinalPrice, discountInfo, bestPromotion } = useProductPromotion({
    product: product,
    storeId: store?.id || '',
    quantity: quantity,
    selectedVariantPrice: selectedVariant?.price
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  // Verificar se o cliente está logado
  const isCustomerLoggedIn = () => {
    if (!store?.id) return false;
    
    const savedProfile = localStorage.getItem(`customer_${store.id}`);
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        return !!profile.name || !!profile.email;
      } catch (error) {
        return false;
      }
    }
    return false;
  };

  // Callback quando o cliente fizer login/registro com sucesso
  const handleAuthSuccess = (profile: any) => {
    setCustomerName(profile.name || null);
    setShowAuthDialog(false);
    setCustomerRegisterOpen(false);
    
    toast({
      title: "Login realizado!",
      description: `Bem-vindo, ${profile.name}! Agora você pode adicionar produtos ao carrinho.`,
    });
  };

  // SEO configuration - Melhorado para compartilhamento e ofertas
  const currentSEOPrice = selectedVariant 
    ? selectedVariant.price 
    : (product?.is_on_offer && product?.offer_price ? product?.offer_price : product?.price || 0);
  
  const originalPrice = product?.is_on_offer && product?.original_price ? product.original_price : null;
  const formattedCurrentPrice = formatPrice(currentSEOPrice);
  const formattedOriginalPrice = originalPrice ? formatPrice(originalPrice) : null;
  
  // Texto de desconto para SEO
  const discountPercentage = originalPrice && product?.offer_price 
    ? Math.round((1 - product.offer_price / originalPrice) * 100) 
    : 0;
  
  const offerPrefix = product?.is_on_offer ? '🔥 OFERTA: ' : '';
  const discountText = discountPercentage > 0 ? ` (${discountPercentage}% OFF - antes ${formattedOriginalPrice})` : '';
  
  // Título otimizado para compartilhamento
  const seoTitle = product && store 
    ? `${offerPrefix}${product.name} por ${formattedCurrentPrice}${discountText} - ${store.name}`
    : 'Carregando produto...';
  
  // Descrição otimizada para compartilhamento social
  const seoDescription = product && store 
    ? `Encontrei este produto incrível e quero compartilhar! ${product.description || product.name} 💰 Por apenas ${formattedCurrentPrice}${discountText} na ${store.name}. ${product?.category?.name ? `Categoria: ${product.category.name} • ` : ''}Peça já pelo WhatsApp!`
    : 'Carregando produto...';
  
  // Imagem priorizada do produto
  const seoImage = product?.image_url || product?.image_gallery?.[0] || store?.logo_url || '/favicon.png';
  
  // Keywords otimizadas
  const seoKeywords = [
    product?.name,
    store?.name,
    product?.category?.name,
    'cardápio digital',
    'delivery',
    'pedido online',
    store?.slug,
    product?.is_on_offer ? 'oferta' : '',
    product?.is_on_offer ? 'promoção' : '',
    product?.is_on_offer ? 'desconto' : '',
    'WhatsApp'
  ].filter(Boolean).join(', ');
  
  usePageSEO({
    title: seoTitle,
    description: seoDescription,
    image: seoImage,
    url: window.location.href,
    type: 'product',
    keywords: seoKeywords,
    price: currentSEOPrice,
    currency: 'BRL',
    availability: 'in stock',
    brand: store?.name || 'Mostralo'
  });

  useEffect(() => {
    if (storeSlug && productSlug) {
      fetchProductData();
    }
  }, [storeSlug, productSlug]);

  // Sincronizar carousel com currentImageIndex
  useEffect(() => {
    if (carouselApi) {
      carouselApi.scrollTo(currentImageIndex);
    }
  }, [carouselApi, currentImageIndex]);

  // Atualizar currentImageIndex quando carousel mudar
  useEffect(() => {
    if (!carouselApi) return;

    const handleSelect = () => {
      setCurrentImageIndex(carouselApi.selectedScrollSnap());
    };

    carouselApi.on('select', handleSelect);
    return () => {
      carouselApi.off('select', handleSelect);
    };
  }, [carouselApi]);

  const handleThumbnailClick = (index: number) => {
    setCurrentImageIndex(index);
    if (carouselApi) {
      carouselApi.scrollTo(index);
    }
  };

  const fetchProductData = async () => {
    try {
      // Fetch store
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('id, name, description, logo_url, slug, phone, theme_colors, address, instagram, facebook, website, business_hours, delivery_config')
        .eq('slug', storeSlug)
        .eq('status', 'active')
        .single();

      if (storeError) throw storeError;

      // Salvar business_hours e delivery_config
      setBusinessHours(storeData.business_hours);
      setDeliveryConfig(storeData.delivery_config);

      // Fetch store configuration (usando view pública segura)
      const { data: configData } = await supabase
        .from('public_store_config')
        .select('*')
        .eq('store_id', storeData.id)
        .maybeSingle();

      const processedStore = {
        ...storeData,
        configuration: configData || {
          primary_color: '#3B82F6',
          secondary_color: '#10B981',
        }
      };
      setStore(processedStore);

      // Fetch product with category
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select(`
          id, name, description, price, image_url, image_gallery, 
          category_id, button_text, slug, is_on_offer, original_price, offer_price,
          category:categories(name)
        `)
        .eq('slug', productSlug)
        .eq('store_id', storeData.id)
        .eq('is_available', true)
        .single();

      if (productError) throw productError;
      setProduct(productData);

      // Fetch variants
      const { data: variantsData } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productData.id)
        .eq('is_available', true)
        .order('display_order');

      if (variantsData?.length > 0) {
        setVariants(variantsData);
        const defaultVariant = variantsData.find(v => v.is_default) || variantsData[0];
        setSelectedVariant(defaultVariant);
      }

      // Fetch related products from the same category
      if (productData.category_id) {
        const { data: relatedData } = await supabase
          .from('products')
          .select('id, name, description, price, image_url, slug, is_on_offer, original_price, offer_price')
          .eq('store_id', storeData.id)
          .eq('category_id', productData.category_id)
          .eq('is_available', true)
          .neq('id', productData.id)
          .limit(8)
          .order('display_order');

        if (relatedData) {
          setRelatedProducts(relatedData);
        }
      }

      // Fetch addons linked to this specific product via product_addons table
      const { data: productAddonsData } = await supabase
        .from('product_addons')
        .select('addon_id')
        .eq('product_id', productData.id);

      console.log('Product addons:', productAddonsData);

      if (productAddonsData?.length > 0) {
        const addonIds = productAddonsData.map(pa => pa.addon_id);
        
        // Fetch the actual addons
        const { data: addonsData, error: addonsError } = await supabase
          .from('addons')
          .select('id, name, description, price, is_available, category_id')
          .in('id', addonIds)
          .eq('is_available', true)
          .order('display_order');

        console.log('Addons data:', addonsData, 'Error:', addonsError);

        if (addonsData?.length > 0) {
          // Get unique category IDs
          const categoryIds = [...new Set(addonsData.map(a => a.category_id).filter(Boolean))];
          
          // Fetch categories
          const { data: categoriesData } = await supabase
            .from('addon_categories')
            .select('id, name, description, min_selections, max_selections, is_required')
            .in('id', categoryIds)
            .eq('is_active', true);

          if (categoriesData) {
            // Group addons by category
            const categoriesMap = new Map<string, AddonCategory>();

            categoriesData.forEach(category => {
              categoriesMap.set(category.id, {
                id: category.id,
                name: category.name,
                description: category.description,
                min_selections: category.min_selections || 0,
                max_selections: category.max_selections || null,
                is_required: category.is_required || false,
                addons: []
              });
            });

            addonsData.forEach((addon) => {
              if (!addon.category_id) return;
              
              const category = categoriesMap.get(addon.category_id);
              const categoryData = categoriesData.find(c => c.id === addon.category_id);
              
              if (category && categoryData) {
                const addonData: Addon = {
                  id: addon.id,
                  name: addon.name,
                  description: addon.description,
                  price: addon.price,
                  is_available: addon.is_available,
                  addon_category: {
                    id: categoryData.id,
                    name: categoryData.name,
                    description: categoryData.description,
                    min_selections: categoryData.min_selections || 0,
                    max_selections: categoryData.max_selections || null,
                    is_required: categoryData.is_required || false
                  }
                };
                category.addons.push(addonData);
              }
            });
            
            const finalCategories = Array.from(categoriesMap.values()).filter(cat => cat.addons.length > 0);
            console.log('Final addon categories:', finalCategories);
            setAddonCategories(finalCategories);
          }
        }
      }

    } catch (error) {
      console.error('Error fetching product:', error);
      navigate('/404');
    } finally {
      setLoading(false);
    }
  };

  const handleAddonQuantityChange = (categoryId: string, addonId: string, delta: number) => {
    const category = addonCategories.find(c => c.id === categoryId);
    if (!category) return;

    const currentSelections = selectedAddons[categoryId] || {};
    const currentQuantity = currentSelections[addonId] || 0;
    const newQuantity = Math.max(0, currentQuantity + delta);

    // Se a nova quantidade é 0, remove o addon
    if (newQuantity === 0) {
      const newSelections = { ...currentSelections };
      delete newSelections[addonId];
      
      setSelectedAddons(prev => ({
        ...prev,
        [categoryId]: newSelections
      }));
      return;
    }

    // Verifica limites da categoria
    const maxSelections = category.max_selections;
    const totalItemsSelected = Object.values(currentSelections).reduce((sum, qty) => sum + qty, 0);
    
    // Se há limite máximo e seria ultrapassado
    if (maxSelections !== null && maxSelections !== undefined) {
      const totalAfterChange = totalItemsSelected - currentQuantity + newQuantity;
      if (totalAfterChange > maxSelections) {
        toast({
          title: "Limite atingido",
          description: `Você pode selecionar no máximo ${maxSelections} itens desta categoria.`,
          variant: "destructive"
        });
        return;
      }
    }

    setSelectedAddons(prev => ({
      ...prev,
      [categoryId]: {
        ...currentSelections,
        [addonId]: newQuantity
      }
    }));
  };

  const calculateAddonsPrice = () => {
    return addonCategories.reduce((total, category) => {
      const selections = selectedAddons[category.id] || {};
      return total + Object.entries(selections).reduce((categoryTotal, [addonId, quantity]) => {
        const addon = category.addons.find(a => a.id === addonId);
        return categoryTotal + (addon?.price || 0) * quantity;
      }, 0);
    }, 0);
  };

  const validateRequiredAddons = () => {
    return addonCategories.every(category => {
      if (!category.is_required) return true;
      const selections = selectedAddons[category.id] || {};
      const totalSelected = Object.values(selections).reduce((sum, qty) => sum + qty, 0);
      const minSelections = category.min_selections || 0;
      return totalSelected >= minSelections;
    });
  };

  const handleAddToCart = () => {
    if (!product) return;

    // Verificar se o cliente está logado
    if (!isCustomerLoggedIn()) {
      toast({
        title: "⚠️ Login necessário",
        description: "Para adicionar produtos ao carrinho, você precisa estar logado. Faça login ou crie uma conta.",
        variant: "destructive"
      });
      setShowAuthDialog(true);
      return;
    }

    // Verificar se pode adicionar ao carrinho
    if (!storeStatus.canAddToCart) {
      toast({
        title: "⏸️ Serviço pausado",
        description: storeStatus.scheduledOrdersEnabled 
          ? "Adicione produtos e escolha um horário de agendamento no checkout."
          : "Não estamos aceitando pedidos no momento.",
        variant: "destructive"
      });
      return;
    }

    if (!validateRequiredAddons()) {
      toast({
        title: "Adicionais obrigatórios",
        description: "Selecione todos os adicionais obrigatórios antes de adicionar ao carrinho.",
        variant: "destructive"
      });
      return;
    }

    // Usar o preço com promoção aplicada, se houver
    const currentPrice = promotionFinalPrice || (selectedVariant 
      ? selectedVariant.price 
      : (product.is_on_offer && product.offer_price ? product.offer_price : product.price));
    const addonsPrice = calculateAddonsPrice();
    const variantName = selectedVariant ? ` - ${selectedVariant.name}` : '';
    
    // Build addon names with quantities
    const addonNames = addonCategories.reduce((names, category) => {
      const selections = selectedAddons[category.id] || {};
      const selectedAddonNames = Object.entries(selections).map(([addonId, quantity]) => {
        const addon = category.addons.find(a => a.id === addonId);
        return addon ? `${quantity}x ${addon.name}` : null;
      }).filter(Boolean);
      return [...names, ...selectedAddonNames];
    }, [] as string[]);
    
    const fullName = product.name + variantName + (addonNames.length > 0 ? ` (${addonNames.join(', ')})` : '');

    addItem({
      id: `${product.id}_${selectedVariant?.id || 'default'}_${JSON.stringify(selectedAddons)}`,
      name: fullName,
      price: currentPrice + addonsPrice,
      image_url: product.image_url
    }, quantity);

    toast({
      title: "Produto adicionado!",
      description: `${quantity}x ${product.name}${discountInfo?.source === 'promotion' ? ' com promoção aplicada' : ''} adicionado ao carrinho.`,
    });

    // Redirecionar para a loja
    navigate(`/loja/${storeSlug}`);
  };

  const sendWhatsAppMessage = () => {
    if (!store || !product) return;

    if (!validateRequiredAddons()) {
      toast({
        title: "Adicionais obrigatórios",
        description: "Selecione todos os adicionais obrigatórios antes de fazer o pedido.",
        variant: "destructive"
      });
      return;
    }

    const currentPrice = selectedVariant 
      ? selectedVariant.price 
      : (product.is_on_offer && product.offer_price ? product.offer_price : product.price);
    const addonsPrice = calculateAddonsPrice();
    const totalPrice = (currentPrice + addonsPrice) * quantity;
    
    const variantText = selectedVariant ? ` - ${selectedVariant.name}` : '';
    
    // Build addons text with quantities
    const addonsText = addonCategories.reduce((text, category) => {
      const selections = selectedAddons[category.id] || {};
      if (Object.keys(selections).length === 0) return text;
      
      const selectedAddonNames = Object.entries(selections).map(([addonId, quantity]) => {
        const addon = category.addons.find(a => a.id === addonId);
        return addon ? `${quantity}x ${addon.name} (+${formatPrice(addon.price * quantity)})` : '';
      }).filter(Boolean);
      
      return text + `\n${category.name}: ${selectedAddonNames.join(', ')}`;
    }, '');
    
    const obsText = observations ? `\nObservações: ${observations}` : '';
    
    const message = `Olá! Gostaria de fazer um pedido:

*${product.name}*${variantText}${addonsText}
Quantidade: ${quantity}
Preço: ${formatPrice(totalPrice)}${obsText}

Poderia me ajudar?`;
    
    const whatsappUrl = `https://wa.me/55${store.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareProduct = async () => {
    const offerPrefix = product?.is_on_offer ? '🔥 OFERTA: ' : '';
    const currentPrice = selectedVariant 
      ? selectedVariant.price 
      : (product?.is_on_offer && product?.offer_price ? product?.offer_price : product?.price || 0);
    const formattedPrice = formatPrice(currentPrice);
    const originalPrice = product?.is_on_offer && product?.original_price ? product.original_price : null;
    const discountText = originalPrice ? ` (${Math.round((1 - currentPrice / originalPrice) * 100)}% OFF)` : '';
    
    const shareData = {
      title: `${offerPrefix}${product?.name} por ${formattedPrice} - ${store?.name}`,
      text: `Encontrei este produto incrível e quero compartilhar! ${product?.description || product?.name} 💰 Por apenas ${formattedPrice}${discountText} na ${store?.name}. Peça já pelo WhatsApp!`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // Fallback to copy URL
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copiado!",
          description: "O link do produto foi copiado para a área de transferência.",
        });
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copiado!",
        description: "O link do produto foi copiado para a área de transferência.",
      });
    }
  };

  const images = (() => {
    const allImages = [];
    
    // Adiciona a imagem principal primeiro
    if (product?.image_url) {
      allImages.push(product.image_url);
    }
    
    // Adiciona as imagens da galeria
    if (product?.image_gallery?.length > 0) {
      allImages.push(...product.image_gallery);
    }
    
    return allImages;
  })();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando produto...</p>
        </div>
      </div>
    );
  }

  if (!product || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
          <Button onClick={() => navigate('/')}>Voltar ao início</Button>
        </div>
      </div>
    );
  }

  const currentFinalPrice = promotionFinalPrice || (selectedVariant 
    ? selectedVariant.price 
    : (product.is_on_offer && product.offer_price ? product.offer_price : product.price));
  const addonsPrice = calculateAddonsPrice();
  const totalPrice = currentFinalPrice + addonsPrice;

  const handleRelatedProductClick = (relatedProduct: Product) => {
    navigate(`/loja/${store.slug}/produto/${relatedProduct.slug}`);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Cabeçalho Simplificado */}
      <header className="sticky top-0 z-40 bg-card border-b">
        <div className="max-w-[1080px] mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/loja/${store.slug}`)}
              className="hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {store?.logo_url && (
                  <img
                    src={store.logo_url}
                    alt={store.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <span className="font-semibold text-sm truncate">{store.name}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[1080px] mx-auto px-4 py-6">
        
        {/* Alerta quando não está operando normalmente */}
        {!storeStatus.isOpenForBusiness && (
          <Alert 
            className={`mb-6 ${
              storeStatus.scheduledOrdersEnabled 
                ? 'bg-blue-50 border-blue-200 text-blue-900' 
                : 'bg-orange-50 border-orange-200 text-orange-900'
            }`}
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-medium">
              {storeStatus.scheduledOrdersEnabled ? (
                <>
                  {storeStatus.isPaused && (
                    <>⏸️ <strong>Serviço pausado.</strong></>
                  )}
                  {storeStatus.isClosed && !storeStatus.isPaused && (
                    <>🕒 <strong>Estabelecimento fechado.</strong></>
                  )}
                  {' '}Você pode fazer pedidos com agendamento para horários futuros.
                </>
              ) : (
                <>
                  {storeStatus.isPaused && (
                    <>⏸️ <strong>Serviço pausado temporariamente.</strong></>
                  )}
                  {storeStatus.isClosed && !storeStatus.isPaused && (
                    <>🕒 <strong>Estabelecimento fechado no momento.</strong></>
                  )}
                  {' '}Não estamos aceitando pedidos no momento.
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            {images.length > 0 ? (
              images.length === 1 ? (
                <div className="w-full max-w-[500px] mx-auto aspect-square rounded-lg overflow-hidden bg-gray-100 relative">
                  {storeStatus.shouldShowSchedulingRequired && (
                    <Badge 
                      className="absolute top-4 right-4 bg-blue-500 text-white z-10 text-sm px-3 py-1"
                    >
                      📅 Apenas Agendamento
                    </Badge>
                  )}
                  <img
                    src={images[0]}
                    alt={product.name}
                    className={`w-full h-full object-cover ${
                      !storeStatus.canAddToCart ? 'grayscale opacity-60' : ''
                    }`}
                  />
                </div>
              ) : (
                <div className="w-full max-w-[500px] mx-auto relative">
                  {storeStatus.shouldShowSchedulingRequired && (
                    <Badge 
                      className="absolute top-4 right-4 bg-blue-500 text-white z-10 text-sm px-3 py-1"
                    >
                      📅 Apenas Agendamento
                    </Badge>
                  )}
                  <Carousel
                    className="w-full"
                    setApi={setCarouselApi}
                    opts={{
                      loop: true,
                      align: "start"
                    }}
                  >
                    <CarouselContent>
                      {images.map((image, index) => (
                        <CarouselItem key={index}>
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                            <img
                              src={image}
                              alt={`${product.name} ${index + 1}`}
                              className={`w-full h-full object-cover ${
                                !storeStatus.canAddToCart ? 'grayscale opacity-60' : ''
                              }`}
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                  </Carousel>
                </div>
              )
            ) : (
              <div className="w-full max-w-[500px] mx-auto aspect-square rounded-lg bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400">Sem imagem</span>
              </div>
            )}

            {/* Image thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto justify-center max-w-[500px] mx-auto">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => handleThumbnailClick(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 ${
                      currentImageIndex === index 
                        ? 'border-primary' 
                        : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className={`w-full h-full object-cover ${
                        !storeStatus.canAddToCart ? 'grayscale opacity-60' : ''
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              {product.description && (
                <p className="text-muted-foreground">{product.description}</p>
              )}
              
              {/* Badge de Oferta ou Promoção */}
              {discountInfo && discountInfo.amount > 0 && (
                <div className="mt-3 mb-2">
                  <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full font-semibold">
                    {Math.round((discountInfo.amount / (selectedVariant?.price || product.price)) * 100)}% OFF
                    {discountInfo.source === 'promotion' && ' (Promoção)'}
                    {discountInfo.source === 'product_offer' && ' (Oferta)'}
                  </span>
                </div>
              )}
              
              {/* Mensagem de desconto */}
              {discountInfo && discountInfo.message && (
                <p className="text-sm text-green-600 font-medium mt-2">
                  ✨ {discountInfo.message}
                </p>
              )}
            </div>

            {/* Preços */}
            <div className="flex items-baseline gap-3">
              {discountInfo && discountInfo.amount > 0 ? (
                <>
                  <div className="text-3xl font-bold text-primary">
                    {formatPrice(currentFinalPrice)}
                  </div>
                  <div className="text-xl text-muted-foreground line-through">
                    {formatPrice(selectedVariant?.price || product.price)}
                  </div>
                </>
              ) : product.is_on_offer ? (
                <>
                  <div className="text-3xl font-bold text-primary">
                    {formatPrice(product.offer_price!)}
                  </div>
                  <div className="text-xl text-muted-foreground line-through">
                    {formatPrice(product.price)}
                  </div>
                </>
              ) : (
                <div className="text-3xl font-bold text-primary">
                  {formatPrice(currentFinalPrice)}
                </div>
              )}
            </div>

            {/* Variants */}
            {variants.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Opções disponíveis:</h3>
                <div className="grid gap-2">
                  {variants.map((variant) => (
                    <Card
                      key={variant.id}
                      className={`cursor-pointer transition-colors ${
                        selectedVariant?.id === variant.id
                          ? 'ring-2 ring-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedVariant(variant)}
                    >
                      <CardContent className="p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{variant.name}</p>
                            {variant.description && (
                              <p className="text-sm text-muted-foreground">
                                {variant.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {formatPrice(variant.price)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Addons */}
            {addonCategories.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Adicionais</h3>
                {addonCategories.map((category) => (
                  <div key={category.id} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{category.name}</h4>
                      {category.is_required && (
                        <Badge variant="destructive" className="text-xs">
                          Obrigatório
                        </Badge>
                      )}
                    </div>
                    {category.description && (
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    )}
                     <p className="text-xs text-muted-foreground">
                       {category.max_selections === null || category.max_selections === undefined
                         ? `Selecione no mínimo ${category.min_selections || 0} itens`
                         : (category.min_selections || 0) === (category.max_selections || 1)
                         ? `Selecione ${category.min_selections || 0} ${(category.min_selections || 0) === 1 ? 'item' : 'itens'}`
                         : `Selecione entre ${category.min_selections || 0} e ${category.max_selections || 1} itens`
                       }
                     </p>
                    
                    <div className="grid gap-2">
                        {category.addons.map((addon) => {
                          const currentSelections = selectedAddons[category.id] || {};
                          const currentQuantity = currentSelections[addon.id] || 0;
                          const isSelected = currentQuantity > 0;
                          const maxSelections = category.max_selections;
                          
                          // Calcular total de itens selecionados na categoria
                          const totalItemsSelected = Object.values(currentSelections).reduce((sum, qty) => sum + qty, 0);
                          
                          // Se não há limite máximo, sempre pode adicionar mais
                          // Se há limite máximo, verifica se ainda pode adicionar mais
                          const canAddMore = maxSelections === null || maxSelections === undefined 
                            ? true 
                            : totalItemsSelected < maxSelections;
                         
                         return (
                           <Card
                             key={addon.id}
                             className={`transition-colors ${
                               isSelected
                                 ? 'ring-2 ring-primary bg-primary/5'
                                 : 'hover:bg-muted/50'
                             }`}
                           >
                             <CardContent className="p-3">
                               <div className="flex justify-between items-center">
                                 <div className="flex-1">
                                   <p className="font-medium">{addon.name}</p>
                                   {addon.description && (
                                     <p className="text-sm text-muted-foreground">
                                       {addon.description}
                                     </p>
                                   )}
                                 </div>
                                 <div className="flex items-center gap-3">
                                   <p className="font-semibold">
                                     +{formatPrice(addon.price)}
                                   </p>
                                   
                                   {/* Controles de quantidade */}
                                   <div className="flex items-center gap-2">
                                     <Button
                                       variant="outline"
                                       size="sm"
                                       onClick={() => handleAddonQuantityChange(category.id, addon.id, -1)}
                                       disabled={currentQuantity === 0}
                                       className="h-8 w-8 p-0"
                                     >
                                       <Minus className="w-3 h-3" />
                                     </Button>
                                     <span className="min-w-[20px] text-center font-medium">
                                       {currentQuantity}
                                     </span>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleAddonQuantityChange(category.id, addon.id, 1)}
                                        disabled={!canAddMore}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                   </div>
                                 </div>
                               </div>
                             </CardContent>
                           </Card>
                         );
                       })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Observações */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Observações (opcional):
              </label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Alguma observação especial para este produto?"
                className="w-full p-3 border rounded-lg resize-none h-20"
              />
            </div>

            {/* WhatsApp */}
            {store.phone && (
              <Button
                variant="outline"
                onClick={sendWhatsAppMessage}
                className="w-full"
                size="lg"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Pedir via WhatsApp
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* Botão Fixo Inferior - Adicionar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            {/* Controle de Quantidade */}
            <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="h-10 w-10"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-bold text-lg">{quantity}</span>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => setQuantity(quantity + 1)}
                className="h-10 w-10"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Botão Adicionar */}
            <Button 
              className="flex-1 h-12 text-lg font-semibold hover:opacity-90 transition-opacity"
              style={{ 
                backgroundColor: storeStatus.canAddToCart ? primaryColor : '#9ca3af',
                opacity: storeStatus.canAddToCart ? 1 : 0.5
              }}
              onClick={handleAddToCart}
              disabled={!storeStatus.canAddToCart}
            >
              Adicionar • {formatPrice(totalPrice * quantity)}
            </Button>

            {/* Botão Compartilhar */}
            <Button
              variant="outline"
              size="icon"
              onClick={shareProduct}
              className="h-12 w-12 flex-shrink-0"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer
        open={cartDrawerOpen}
        onOpenChange={setCartDrawerOpen}
        onCheckout={() => {
          setCartDrawerOpen(false);
          setCheckoutOpen(true);
        }}
        primaryColor={primaryColor}
      />

      {/* Checkout Dialog */}
      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        storeId={store.id}
        deliveryFee={0}
        isServicePaused={storeStatus.isPaused}
        scheduledOrdersEnabled={storeStatus.scheduledOrdersEnabled}
      />

      {/* Customer Auth Dialog */}
      {store && storeSlug && (
        <CustomerAuthDialog
          open={showAuthDialog}
          onOpenChange={setShowAuthDialog}
          storeId={store.id}
          storeSlug={storeSlug}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {/* Customer Register Dialog */}
      {store && (
        <CustomerRegisterDialog
          open={customerRegisterOpen}
          onOpenChange={(open) => {
            setCustomerRegisterOpen(open);
            // Atualizar nome quando fechar o diálogo
            if (!open && store?.id) {
              const savedProfile = localStorage.getItem(`customer_${store.id}`);
              if (savedProfile) {
                try {
                  const profile = JSON.parse(savedProfile);
                  setCustomerName(profile.name || null);
                } catch (error) {
                  console.error('Erro ao carregar perfil:', error);
                }
              }
            }
          }}
          storeId={store.id}
        />
      )}

      {/* Schema.org structured data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          "name": product.name,
          "description": product.description,
          "image": product.image_url,
           "offers": {
             "@type": "Offer",
             "price": currentFinalPrice,
             "priceCurrency": "BRL",
             "availability": "https://schema.org/InStock",
             "seller": {
               "@type": "Organization",
               "name": store.name
             }
           },
           "category": product.category?.name || "Produto",
          "brand": {
            "@type": "Brand",
            "name": store.name
          }
        })}
      </script>
    </div>
  );
};

export default ProductPage;