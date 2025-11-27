import { useEffect, useState, useMemo, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { safeLocalStorage } from '@/lib/safeStorage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PopupController } from '@/utils/popupController';
import BottomNavigation from '@/components/BottomNavigation';
import { getStoreStatusMessage } from '@/utils/storeStatus';
import { useStoreStatus } from '@/hooks/useStoreStatus';

// Lazy load de componentes pesados
const ProductDetail = lazy(() => import('@/components/ProductDetail'));
const BannerCarousel = lazy(() => import('@/components/BannerCarousel').then(m => ({ default: m.BannerCarousel })));
const PromotionMiniBanner = lazy(() => import('@/components/PromotionMiniBanner').then(m => ({ default: m.PromotionMiniBanner })));
const PromotionPopupDialog = lazy(() => import('@/components/PromotionPopupDialog').then(m => ({ default: m.PromotionPopupDialog })));
const CheckoutDialog = lazy(() => import('@/components/checkout/CheckoutDialog').then(m => ({ default: m.CheckoutDialog })));
const CartDrawer = lazy(() => import('@/components/checkout/CartDrawer').then(m => ({ default: m.CartDrawer })));
const CustomerRegisterDialog = lazy(() => import('@/components/checkout/CustomerRegisterDialog').then(m => ({ default: m.CustomerRegisterDialog })));
const CustomerAuthDialog = lazy(() => import('@/components/checkout/CustomerAuthDialog').then(m => ({ default: m.CustomerAuthDialog })));
const StoreInfoDrawer = lazy(() => import('@/components/StoreInfoDrawer').then(m => ({ default: m.StoreInfoDrawer })));
import { 
  Store as StoreIcon, 
  Phone, 
  MapPin, 
  Clock,
  MessageCircle,
  Star,
  Loader2,
  Search,
  ShoppingCart,
  Plus,
  User,
  Instagram,
  Facebook,
  Globe,
  Package,
  LogOut,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/contexts/CartContext';
import { useSEO } from '@/hooks/useSEO';
import { DashboardFooter } from '@/components/admin/DashboardFooter';
import { FloatingCartButton } from '@/components/checkout/FloatingCartButton';
import { Badge } from '@/components/ui/badge';
import { ProductCardWithPromotion } from '@/components/ProductCardWithPromotion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Store {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  cover_url?: string;
  phone?: string;
  address?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
  theme_colors: any;
  latitude?: number;
  longitude?: number;
  configuration?: {
    primary_color?: string;
    secondary_color?: string;
    product_display_layout?: string;
  };
}

interface Category {
  id: string;
  name: string;
  description?: string;
  display_order: number;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category_id?: string;
  display_order: number;
  button_text?: string;
  image_gallery?: string[];
  slug: string;
  is_on_offer?: boolean;
  original_price?: number;
  offer_price?: number;
}

interface Banner {
  id: string;
  title: string;
  desktop_image_url: string | null;
  mobile_image_url: string | null;
  link_url: string | null;
  video_url: string | null;
}

const Store = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingBanners, setLoadingBanners] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [customerRegisterOpen, setCustomerRegisterOpen] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [storeInfoDrawerOpen, setStoreInfoDrawerOpen] = useState(false);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [businessHours, setBusinessHours] = useState<any>(null);
  const [deliveryConfig, setDeliveryConfig] = useState<any>(null);
  const [promotionCount, setPromotionCount] = useState(0);
  const [popupPromotion, setPopupPromotion] = useState<any>(null);
  const [showPopupPromotion, setShowPopupPromotion] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();
  const { addItem, getTotalPrice, getTotalItems } = useCart();

  // Hook para gerenciar SEO dinâmico
  useSEO(store, slug);

  // Hook para verificar status da loja (pausado, agendamentos, etc)
  const storeStatus = useStoreStatus(businessHours, deliveryConfig);

  // Memoizar mensagem de status para evitar recálculos desnecessários
  const storeStatusMessage = useMemo(() => {
    return getStoreStatusMessage(businessHours);
  }, [businessHours]);

  // Mapa de ordenação das categorias
  const categoryOrderMap = useMemo(() => {
    const map: Record<string, number> = {};
    categories.forEach(c => {
      map[c.id] = c.display_order ?? 0;
    });
    return map;
  }, [categories]);

  useEffect(() => {
    // Resetar estados quando mudar de loja
    setProducts([]);
    setCategories([]);
    setBanners([]);
    setSelectedCategory(null);
    setSearchTerm('');
    
    if (slug) {
      fetchStoreData();
    }
  }, [slug]);

  // Ouvir evento de autenticação do checkout
  useEffect(() => {
    const handleOpenAuth = () => {
      setShowAuthDialog(true);
    };
    
    window.addEventListener('openCustomerAuth', handleOpenAuth);
    
    return () => {
      window.removeEventListener('openCustomerAuth', handleOpenAuth);
    };
  }, []);
  
  // Realtime subscription para status de serviço pausado
  useEffect(() => {
    if (!slug) return;

    const channel = supabase
      .channel(`store-${slug}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stores',
          filter: `slug=eq.${slug}`,
        },
        (payload: any) => {
          if (payload.new.business_hours) {
            setBusinessHours(payload.new.business_hours);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [slug]);

  // Carregar nome do cliente do localStorage
  // Carregar nome do cliente do localStorage e escutar atualizações
  useEffect(() => {
    const loadCustomerProfile = () => {
      if (store?.id) {
        // Migrar dados antigos para o novo formato usando safeLocalStorage
        const oldCustomerData = safeLocalStorage.getItem('customer_data');
        const oldProfile = safeLocalStorage.getItem(`customerProfile_${store.id}`);
        const currentCustomer = safeLocalStorage.getItem(`customer_${store.id}`);
        
        // Se não existe customer_${storeId}, migrar de customer_data ou customerProfile
        if (!currentCustomer) {
          if (oldCustomerData) {
            safeLocalStorage.setItem(`customer_${store.id}`, oldCustomerData);
          } else if (oldProfile) {
            safeLocalStorage.setItem(`customer_${store.id}`, oldProfile);
          }
        }
        
        // Carregar perfil salvo do localStorage com a nova chave
        const savedProfile = safeLocalStorage.getItem(`customer_${store.id}`);
        if (savedProfile) {
          try {
            const profile = JSON.parse(savedProfile);
            setCustomerName(profile.name || null);
          } catch (error) {
            console.error('Erro ao carregar perfil:', error);
          }
        }
      }
    };

    loadCustomerProfile();

    // Escutar evento de atualização de perfil
    const handleProfileUpdate = (event: CustomEvent) => {
      const profile = event.detail;
      setCustomerName(profile.name || null);
    };

    window.addEventListener('customerProfileUpdated', handleProfileUpdate as EventListener);

    return () => {
      window.removeEventListener('customerProfileUpdated', handleProfileUpdate as EventListener);
    };
  }, [store?.id]);

  // Query para buscar customer_id e pedidos pendentes do cliente autenticado
  const { data: customerData } = useQuery({
    queryKey: ['customer-by-auth', store?.id],
    queryFn: async () => {
      if (!store?.id) return null;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      
      const { data, error } = await supabase
        .from('customers')
        .select('id')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();
      
      if (error || !data) return null;
      return data;
    },
    enabled: !!store?.id,
  });

  const { data: pendingOrdersCount = 0 } = useQuery({
    queryKey: ['customer-pending-orders', customerData?.id],
    queryFn: async () => {
      if (!customerData?.id) return 0;
      
      const { count, error } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', customerData.id)
        .not('status', 'in', '(concluido,cancelado)');
      
      if (error) {
        console.error('Erro ao buscar pedidos pendentes:', error);
        return 0;
      }
      
      return count || 0;
    },
    enabled: !!customerData?.id,
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  // Detectar parâmetro ?auth=true e abrir dialog de autenticação
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'true' && store?.id) {
      // Verificar se já está logado usando safeLocalStorage
      const savedProfile = safeLocalStorage.getItem(`customer_${store.id}`);
      
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session || !savedProfile) {
          // Não está logado, abrir dialog
          setShowAuthDialog(true);
        }
      });
      
      // Limpar parâmetro da URL
      window.history.replaceState({}, '', `/loja/${slug}`);
    }
  }, [store?.id, slug]);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 200;
      setShowStickyHeader(scrolled);
    };

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      
      // ETAPA 1: Carregar dados básicos da loja (crítico - mostrar primeiro)
      const { data: storeData, error: storeError } = await supabase
        .from('public_stores')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (storeError || !storeData) {
        console.error('Erro ao buscar loja:', storeError);
        
        // Verificar se a loja existe mas está bloqueada (assinatura expirada)
        const { data: blockedStore } = await supabase
          .from('stores')
          .select('id, name, subscription_expires_at')
          .eq('slug', slug)
          .maybeSingle();
        
        if (blockedStore) {
          // Loja existe mas está indisponível - redirecionar
          navigate('/loja-indisponivel');
          return;
        }
        
        // Loja realmente não existe - mostrar 404
        toast({
          title: 'Loja não encontrada',
          description: 'Esta loja não existe ou não está mais ativa.',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      // Buscar configuração da loja (usando view pública segura)
      const [configResult, storeConfigResult] = await Promise.all([
        supabase
          .from('public_store_config')
          .select('*')
          .eq('store_id', storeData.id)
          .maybeSingle(),
        supabase
          .from('stores')
          .select('delivery_config, latitude, longitude')
          .eq('id', storeData.id)
          .single()
      ]);

      // Processar dados da configuração
      const processedStore: Store = {
        ...storeData,
        configuration: configResult.data || {
          primary_color: '#3B82F6',
          secondary_color: '#10B981',
          product_display_layout: 'grid'
        }
      };
      
      // Adicionar latitude e longitude se disponíveis
      if (storeConfigResult.data?.latitude && storeConfigResult.data?.longitude) {
        processedStore.latitude = storeConfigResult.data.latitude;
        processedStore.longitude = storeConfigResult.data.longitude;
      }
      
      setStore(processedStore);
      setBusinessHours(storeData.business_hours);
      setDeliveryConfig(storeConfigResult.data?.delivery_config || null);
      
      // Permitir renderização inicial com dados básicos
      setLoading(false);
      
      // ETAPA 2: Carregar categorias e produtos em paralelo (conteúdo principal)
      setLoadingProducts(true);
      Promise.all([
        supabase
          .from('categories')
          .select('*')
          .eq('store_id', storeData.id)
          .eq('is_active', true)
          .order('display_order'),
        supabase
          .from('products')
          .select('id, name, description, price, image_url, image_gallery, category_id, display_order, button_text, slug, is_on_offer, original_price, offer_price')
          .eq('store_id', storeData.id)
          .eq('is_available', true)
          .order('display_order')
      ]).then(async ([categoriesResult, productsResult]) => {
        if (categoriesResult.data) {
          setCategories(categoriesResult.data);
        }

        if (productsResult.data) {
          // Carregar variantes para todos os produtos de uma vez (otimizado)
          // Usar Promise.all com limite de concorrência para não sobrecarregar
          const productsWithVariants = await Promise.all(
            productsResult.data.map(async (product) => {
              const { data: variants } = await supabase
                .from('product_variants')
                .select('*')
                .eq('product_id', product.id)
                .eq('is_available', true)
                .order('display_order')
                .limit(1); // Apenas a variante padrão para otimização

              if (variants && variants.length > 0) {
                const defaultVariant = variants.find(v => v.is_default) || variants[0];
                return {
                  ...product,
                  price: Number(defaultVariant.price),
                  variants: variants
                };
              }

              return {
                ...product,
                variants: []
              };
            })
          );

          // Garantir que não há produtos duplicados (usar Set para remover duplicatas por ID)
          const uniqueProducts = Array.from(
            new Map(productsWithVariants.map(p => [p.id, p])).values()
          );
          setProducts(uniqueProducts);
        }
        setLoadingProducts(false);
      }).catch((error) => {
        console.error('Erro ao carregar produtos:', error);
        setLoadingProducts(false);
      });

      // ETAPA 3: Carregar banners e promoções em background (conteúdo secundário)
      setLoadingBanners(true);
      Promise.all([
        supabase
          .from('banners')
          .select('id, title, desktop_image_url, mobile_image_url, link_url, video_url')
          .eq('store_id', storeData.id)
          .order('display_order'),
        (async () => {
          const now = new Date().toISOString();
          const { count: promotionsCount } = await supabase
            .from('promotions')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', storeData.id)
            .eq('status', 'active')
            .eq('is_visible_on_store', true)
            .lte('start_date', now)
            .or(`end_date.is.null,end_date.gte.${now}`);
          
          setPromotionCount(promotionsCount || 0);

          const { data: popupPromo } = await supabase
            .from('promotions')
            .select('*')
            .eq('store_id', storeData.id)
            .eq('status', 'active')
            .eq('show_as_popup', true)
            .lte('start_date', now)
            .or(`end_date.is.null,end_date.gte.${now}`)
            .maybeSingle();
          
          return popupPromo;
        })()
      ]).then(([bannersResult, popupPromo]) => {
        if (bannersResult.data) {
          setBanners(bannersResult.data);
        }
        
        if (popupPromo) {
          setPopupPromotion(popupPromo);
          
          // Verificar se deve mostrar o popup
          const shouldShow = PopupController.shouldShowPopup({
            storeId: storeData.id,
            promotionId: popupPromo.id,
            frequencyType: popupPromo.popup_frequency_type || 'once_session',
            maxDisplays: popupPromo.popup_max_displays || 1
          });
          
          if (shouldShow) {
            // Delay de 1 segundo para melhor UX
            setTimeout(() => {
              setShowPopupPromotion(true);
              
              // Registrar que o popup foi exibido
              PopupController.markAsShown({
                storeId: storeData.id,
                promotionId: popupPromo.id,
                frequencyType: popupPromo.popup_frequency_type || 'once_session',
                maxDisplays: popupPromo.popup_max_displays || 1
              });
            }, 1000);
          }
        }
        setLoadingBanners(false);
      }).catch((error) => {
        console.error('Erro ao carregar banners/promoções:', error);
        setLoadingBanners(false);
      });

    } catch (error) {
      console.error('Erro ao buscar dados da loja:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao carregar os dados da loja.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getProductsByCategory = (categoryId: string | null) => {
    let filteredProducts = categoryId ? products.filter(p => p.category_id === categoryId) : products;
    
    if (searchTerm) {
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Trabalhar com cópia para evitar mutação
    const copy = [...filteredProducts];
    
    // Funções auxiliares para obter ordem
    const getCategoryOrder = (catId?: string) => 
      catId ? (categoryOrderMap[catId] ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;
    
    const getProductOrder = (p: Product) => p.display_order ?? 0;
    
    if (!categoryId) {
      // "Todas": ordenar por categoria primeiro, depois por produto
      return copy.sort((a, b) => {
        const catOrderA = getCategoryOrder(a.category_id);
        const catOrderB = getCategoryOrder(b.category_id);
        
        if (catOrderA !== catOrderB) {
          return catOrderA - catOrderB;
        }
        
        const prodOrderA = getProductOrder(a);
        const prodOrderB = getProductOrder(b);
        
        if (prodOrderA !== prodOrderB) {
          return prodOrderA - prodOrderB;
        }
        
        return a.name.localeCompare(b.name);
      });
    }
    
    // Categoria específica: ordenar apenas por display_order do produto
    return copy.sort((a, b) => {
      const prodOrderA = getProductOrder(a);
      const prodOrderB = getProductOrder(b);
      
      if (prodOrderA !== prodOrderB) {
        return prodOrderA - prodOrderB;
      }
      
      return a.name.localeCompare(b.name);
    });
  };

  const handleProductClick = (product: Product) => {
    // Navigate to individual product page
    navigate(`/loja/${slug}/produto/${product.slug}`);
  };

  const getRelatedProducts = (currentProduct: Product) => {
    return products
      .filter(p => p.id !== currentProduct.id && p.category_id === currentProduct.category_id)
      .slice(0, 4);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const sendWhatsAppMessage = (productName: string, productPrice: number) => {
    const message = `Olá! Gostaria de pedir: ${productName} - ${formatPrice(productPrice)}`;
    const phone = store?.phone?.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  };

  const isStandalone = () => {
    return window.matchMedia('(display-mode: standalone)').matches || 
           (window.navigator as any)?.standalone;
  };

  const installPWA = async () => {
    // Se já está instalado como PWA
    if (isStandalone()) {
      toast({
        title: 'App já instalado!',
        description: 'O aplicativo já está instalado em seu dispositivo.',
      });
      return;
    }

    if (deferredPrompt) {
      // Instalação direta para browsers que suportam
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          toast({
            title: 'App instalado!',
            description: 'O aplicativo foi instalado com sucesso.',
          });
        } else {
          toast({
            title: 'Instalação cancelada',
            description: 'Você pode instalar o app a qualquer momento.',
          });
        }
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Erro na instalação:', error);
        showManualInstructions();
      }
    } else {
      showManualInstructions();
    }
  };

  const showManualInstructions = () => {
    if (isIOS()) {
      toast({
        title: 'Instalar no iOS',
        description: 'Toque no botão de compartilhar (⬆️) e selecione "Adicionar à Tela de Início".',
        duration: 8000,
      });
    } else {
      // Android/Chrome/Edge
      toast({
        title: 'Instalar App',
        description: 'Toque no menu do navegador (⋮) e selecione "Instalar app" ou "Adicionar à tela inicial".',
        duration: 8000,
      });
    }
  };

  const getCategoryEmoji = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('cozinha') || name.includes('bar')) return '🏗️';
    if (name.includes('futevôlei')) return '⚽';
    if (name.includes('beach tennis') || name.includes('tennis')) return '🎾';
    if (name.includes('vôlei') || name.includes('volei')) return '🏐';
    if (name.includes('funcional')) return '🏃';
    if (name.includes('locação') || name.includes('locacao')) return '🏗️';
    if (name.includes('pratos') || name.includes('prato')) return '🍽️';
    if (name.includes('petiscos') || name.includes('petisco')) return '🍤';
    return '';
  };

  const goToCustomerArea = () => {
    if (!slug) return;
    if (customerName) {
      navigate(`/painel-cliente/${slug}`);
    } else {
      navigate(`/cliente/${slug}`);
    }
  };

  const handleOpenCheckout = async () => {
    // Verificar se cliente está autenticado
    const savedProfile = localStorage.getItem(`customer_${store?.id}`);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!savedProfile || !session) {
      // Cliente NÃO está autenticado
      toast({
        title: '🔒 Login necessário',
        description: 'Faça login ou cadastre-se para finalizar seu pedido',
      });
      setShowAuthDialog(true);
    } else {
      // Cliente está autenticado - navegar para checkout
      // Salvar dados da loja no sessionStorage
      sessionStorage.setItem('checkoutStoreId', store?.id || '');
      sessionStorage.setItem('checkoutDeliveryFee', ((store as any)?.delivery_fee || 10).toString());
      sessionStorage.setItem('checkoutPrimaryColor', primaryColor);
      sessionStorage.setItem('checkoutSecondaryColor', secondaryColor);
      sessionStorage.setItem('checkoutStoreName', store?.name || '');
      
      navigate('/checkout');
    }
  };

  const handleAuthSuccess = (customerData: any) => {
    setCustomerName(customerData.name);
    setShowAuthDialog(false);
    
    toast({
      title: `Bem-vindo(a), ${customerData.name}! 🎉`,
      description: 'Agora você pode finalizar seu pedido',
    });
    
    // Verificar se deve redirecionar para checkout
    const shouldCheckout = sessionStorage.getItem('checkout_redirect');
    if (shouldCheckout === 'true') {
      sessionStorage.removeItem('checkout_redirect');
      
      // Aguardar um pouco para garantir que dados foram salvos
      setTimeout(() => {
        handleOpenCheckout();
      }, 500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <StoreIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Loja não encontrada</h1>
          <p className="text-muted-foreground">Esta loja não existe ou não está mais ativa.</p>
        </div>
      </div>
    );
  }

  const isCardapioLayout = store.configuration?.product_display_layout === 'list';
  const primaryColor = store.configuration?.primary_color || '#3B82F6';
  const secondaryColor = store.configuration?.secondary_color || '#10B981';

  return (
    <div className="min-h-screen bg-background">
      {/* Barra Superior - Mobile */}
      <div 
        className="lg:hidden text-white px-4 py-3"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Menu Hambúrguer */}
          <button 
            onClick={() => setStoreInfoDrawerOpen(true)}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors active:scale-95 mr-2"
            aria-label="Abrir menu da loja"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* Campo de Busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9 text-sm bg-white text-foreground"
            />
          </div>
          
          {/* Ícones de usuário e carrinho */}
            <div className="flex items-center gap-2">
              {!customerName ? (
                <button
                  type="button"
                  onClick={() => setShowAuthDialog(true)}
                  aria-label="Fazer login"
                  className="relative flex items-center"
                >
                  <User className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goToCustomerArea}
                  aria-label="Abrir painel do cliente"
                  className="relative flex items-center"
                >
                  <User className="w-5 h-5" />
                </button>
              )}
            <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setCartDrawerOpen(true)}>
              <div className="bg-black/30 px-2 py-0.5 rounded text-xs font-medium">
                R$ {getTotalPrice().toFixed(2)}
              </div>
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-xs bg-red-500 text-white flex items-center justify-center animate-scale-in">
                    {getTotalItems()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Indicador de Busca Ativa */}
      {searchTerm && (
        <div className="lg:hidden px-4 py-3 bg-muted/30 border-b">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Buscando por: <strong>{searchTerm}</strong>
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm('')}
              className="h-7 text-xs"
            >
              Limpar
            </Button>
          </div>
        </div>
      )}

      {/* Barra Superior - Desktop */}
      <div 
        className="hidden lg:block text-white px-4 py-2"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center justify-between text-sm max-w-[1080px] mx-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>Pedido mínimo: R$ 0,00</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{customerName ? `Olá, ${customerName}` : 'Olá Visitante'}</span>
            </div>
          </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {!businessHours ? (
                <span className="text-muted-foreground">Carregando status...</span>
              ) : (
                <>
                  <span className={!storeStatus.isOpenForBusiness ? 'text-orange-400 font-semibold' : 'text-green-600 font-semibold'}>
                    {storeStatusMessage}
                  </span>
                  {!storeStatus.isOpenForBusiness && (
                    <Badge 
                      variant={storeStatus.scheduledOrdersEnabled ? "default" : "destructive"} 
                      className={storeStatus.scheduledOrdersEnabled ? "" : "animate-pulse"}
                    >
                      {storeStatus.isPaused && '⏸ Pausado'}
                      {storeStatus.isClosed && !storeStatus.isPaused && '🕒 Fechado'}
                    </Badge>
                  )}
                </>
              )}
            </div>
        </div>
      </div>

      {/* Imagem de Capa - Somente Mobile */}
      {!searchTerm && store?.cover_url && (
        <div className="lg:hidden relative">
          <img
            src={store.cover_url}
            alt={`Capa da ${store.name}`}
            className="w-full h-32 object-cover"
          />
          {/* Logo sobreposta - 50% sobre a capa */}
          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 z-10">
            {store?.logo_url ? (
              <img
                src={store.logo_url}
                alt={store.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-4 border-white shadow-lg">
                <StoreIcon className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header Principal - Mobile */}
      {!searchTerm && (
        <div className={`lg:hidden px-4 ${store?.cover_url ? 'pt-12 pb-4' : 'py-4'}`}>
          <Card className="shadow-lg">
            <CardContent className="p-4">
              {/* Logo Centralizada - apenas quando não há capa */}
              {!store?.cover_url && (
                <div className="text-center mb-3">
                  {store?.logo_url ? (
                    <img
                      src={store.logo_url}
                      alt={store.name}
                      className="w-16 h-16 rounded-full object-cover mx-auto"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                      <StoreIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
              )}

              {/* Nome e Descrição */}
              <div className="text-center mb-3">
                <h1 className="text-lg font-bold text-foreground mb-2">{store?.name}</h1>
                {store?.description && (
                  <p className="text-sm text-muted-foreground px-4">
                    {store.description}
                  </p>
                )}
              </div>

              {/* Status Dinâmico da Loja */}
              <div className={`mb-3 flex flex-col items-center justify-center gap-2 py-3 px-4 rounded-lg ${
                storeStatus.isOpenForBusiness 
                  ? 'bg-green-50' 
                  : storeStatus.isPaused 
                    ? 'bg-amber-50' 
                    : 'bg-gray-100'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    {storeStatus.isOpenForBusiness && (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </>
                    )}
                    {storeStatus.isPaused && (
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    )}
                    {storeStatus.isClosed && !storeStatus.isPaused && (
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-500"></span>
                    )}
                  </span>
                  <span className={`text-sm font-medium ${
                    storeStatus.isOpenForBusiness 
                      ? 'text-green-700' 
                      : storeStatus.isPaused 
                        ? 'text-amber-700' 
                        : 'text-gray-700'
                  }`}>
                    {storeStatus.isPaused && '⏸️ Serviço Pausado'}
                    {storeStatus.isClosed && !storeStatus.isPaused && '🕒 Estabelecimento Fechado'}
                    {storeStatus.isOpenForBusiness && '✅ Aberto para Pedidos'}
                  </span>
                </div>

                {/* Próximo horário de abertura */}
                {storeStatus.nextOpeningMessage && (
                  <div className="text-xs text-gray-600 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {storeStatus.nextOpeningMessage}
                  </div>
                )}
              </div>

                {/* Informação sobre agendamentos - Sempre que habilitado */}
                {storeStatus.showSchedulingInfo && (
                  <div className={`mb-3 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border ${
                    storeStatus.isOpenForBusiness 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-blue-100 border-blue-300'
                  }`}>
                    <Calendar className={`h-4 w-4 ${
                      storeStatus.isOpenForBusiness ? 'text-blue-600' : 'text-blue-700'
                    }`} />
                    <span className={`text-xs font-medium ${
                      storeStatus.isOpenForBusiness ? 'text-blue-700' : 'text-blue-800'
                    }`}>
                      {storeStatus.isOpenForBusiness 
                        ? '📅 Também aceita pedidos com agendamento'
                        : '✅ Aceita pedidos com agendamento'
                      }
                    </span>
                  </div>
                )}

              {/* Botão de Instalação Unificado */}
              {(deferredPrompt || isIOS) && !isStandalone && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs mb-3"
                  onClick={installPWA}
                >
                  📱 Instalar Aplicativo
                </Button>
              )}


            </CardContent>
          </Card>
        </div>
      )}

      {/* Header Principal - Desktop */}
      <div className="hidden lg:block bg-white border-b px-4 py-4">
        <div className="flex items-center justify-between max-w-[1080px] mx-auto">
          {/* Logo e Informações da Loja */}
          <div className="flex items-center gap-4">
            {store?.logo_url ? (
              <img
                src={store.logo_url}
                alt={store.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <StoreIcon className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-foreground">{store?.name}</h1>
              <p className="text-sm text-muted-foreground">{store?.description || 'Descrição da Loja'}</p>
            </div>
          </div>

          {/* Barra de Busca e Carrinho */}
          <div className="flex items-center gap-4">
            {/* Barra de Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Digite sua busca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80 bg-background border border-muted rounded-lg"
              />
            </div>

            {/* Botões de login/cadastro e carrinho */}
            <div className="flex items-center gap-3">
              {!customerName ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/cliente/${slug}`)}
                    aria-label="Entrar na sua conta"
                    className="font-medium"
                  >
                    Entrar
                  </Button>
                  <Button
                    onClick={() => setCustomerRegisterOpen(true)}
                    aria-label="Cadastrar-se"
                    className="font-medium"
                    style={{ backgroundColor: primaryColor, color: 'white' }}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Cadastrar
                  </Button>
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      aria-label="Menu da conta"
                      className="font-medium"
                    >
                      <User className="w-4 h-4 mr-2" />
                      {customerName.split(' ')[0]}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate(`/painel-cliente/${slug}`)}>
                      <Package className="w-4 h-4 mr-2" />
                      Meus Pedidos
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        localStorage.removeItem("customer_data");
                        setCustomerName("");
                        toast({
                          title: "Sessão encerrada",
                          description: "Você foi desconectado",
                        });
                      }}
                      className="text-destructive"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              <Button
                variant="outline"
                size="sm"
                className="relative text-white hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                onClick={() => setCartDrawerOpen(true)}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                R$ {getTotalPrice().toFixed(2)}
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-xs bg-red-500 text-white flex items-center justify-center animate-scale-in">
                    {getTotalItems()}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação de Categorias - Sticky */}
      {!searchTerm && categories.length > 0 && (
        <div className={`sticky bg-white border-b px-4 py-2 z-40 shadow-sm transition-all duration-200 ${showStickyHeader ? 'top-[48px]' : 'top-0'}`}>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide max-w-[1080px] mx-auto pb-1">
            <Button
              variant={!selectedCategory ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="whitespace-nowrap"
              style={!selectedCategory ? { backgroundColor: primaryColor, color: 'white' } : { borderColor: primaryColor, color: primaryColor }}
            >
              Todas
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="whitespace-nowrap"
                style={selectedCategory === category.id ? { backgroundColor: primaryColor, color: 'white' } : { borderColor: primaryColor, color: primaryColor }}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      )}


      {/* Mini Banner de Promoções */}
      {!searchTerm && store.id && promotionCount > 0 && (
        <div className="px-4 py-3 bg-background">
          <div className="max-w-[1080px] mx-auto">
            <Suspense fallback={<div className="h-16 bg-muted animate-pulse rounded" />}>
              <PromotionMiniBanner
                promotionCount={promotionCount}
                onClick={() => navigate(`/loja/${slug}/promocoes`)}
              />
            </Suspense>
          </div>
        </div>
      )}

      {/* Banner Carousel */}
      {!searchTerm && banners.length > 0 && (
        <div className="px-4 py-4 bg-background">
          <div className="max-w-[1080px] mx-auto">
            <Suspense fallback={<div className="h-48 bg-muted animate-pulse rounded" />}>
              <BannerCarousel banners={banners} />
            </Suspense>
          </div>
        </div>
      )}

      {/* Header Fixo com Logo (aparece ao rolar) */}
      {!searchTerm && showStickyHeader && (
        <div 
          className="fixed top-0 left-0 right-0 z-50 text-white shadow-lg transition-all duration-300"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="max-w-[1080px] mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {store?.logo_url ? (
                <img
                  src={store.logo_url}
                  alt={store.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <StoreIcon className="w-4 h-4 text-white" />
                </div>
              )}
              <span className="font-semibold text-sm">{store?.name}</span>
            </div>
            <button
              type="button"
              onClick={goToCustomerArea}
              aria-label={customerName ? "Abrir painel do cliente" : "Entrar na sua conta"}
              className="text-xs underline underline-offset-2"
            >
              {customerName ? 'Minha conta' : 'Entrar'}
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <div className="px-4 py-4 pb-24">
        <div className="max-w-[1080px] mx-auto">
          {/* Renderização dinâmica baseada no layout configurado */}
          {(() => {
            const productsToDisplay = getProductsByCategory(selectedCategory);
            const layout = store?.configuration?.product_display_layout || 'grid';

            if (loadingProducts) {
              return (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">
                    Carregando produtos, aguarde...
                  </p>
                </div>
              );
            }

            if (productsToDisplay.length === 0) {
              return (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">
                    {searchTerm ? 'Nenhum produto encontrado para sua busca.' : 'Nenhum produto encontrado.'}
                  </p>
                </div>
              );
            }

            // Layout GRID - Grade vertical responsiva
            if (layout === 'grid') {
              return (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                  {productsToDisplay.map((product) => (
                    <ProductCardWithPromotion
                      key={product.id}
                      product={product}
                      storeId={store.id}
                      primaryColor={primaryColor}
                      layout="grid"
                      onProductClick={handleProductClick}
                      canAddToCart={storeStatus.canAddToCart}
                      shouldShowSchedulingRequired={storeStatus.shouldShowSchedulingRequired}
                    />
                  ))}
                </div>
              );
            }

            // Layout CAROUSEL - Scroll horizontal
            if (layout === 'carousel') {
              return (
                <div className="relative">
                  <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                    {productsToDisplay.map((product) => (
                      <ProductCardWithPromotion
                        key={product.id}
                        product={product}
                        storeId={store.id}
                        primaryColor={primaryColor}
                        layout="carousel"
                        onProductClick={handleProductClick}
                        canAddToCart={storeStatus.canAddToCart}
                        shouldShowSchedulingRequired={storeStatus.shouldShowSchedulingRequired}
                      />
                    ))}
                  </div>
                </div>
              );
            }

            // Layout LIST - Horizontal (padrão atual otimizado)
            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {productsToDisplay.map((product) => (
                  <ProductCardWithPromotion
                    key={product.id}
                    product={product}
                    storeId={store.id}
                    primaryColor={primaryColor}
                    layout="list"
                    onProductClick={handleProductClick}
                    canAddToCart={storeStatus.canAddToCart}
                    shouldShowSchedulingRequired={storeStatus.shouldShowSchedulingRequired}
                  />
                ))}
              </div>
            );
          })()}

          {/* Modal de Detalhes do Produto */}
          {showProductDetail && selectedProduct && (
            <Suspense fallback={null}>
              <ProductDetail
                product={selectedProduct}
                store={store}
                relatedProducts={selectedProduct ? getRelatedProducts(selectedProduct) : []}
                isOpen={showProductDetail}
                onClose={() => {
                  setShowProductDetail(false);
                  setSelectedProduct(null);
                }}
                onProductSelect={handleProductClick}
                storeStatus={storeStatus}
                onAuthRequired={() => setShowAuthDialog(true)}
              />
            </Suspense>
          )}
        </div>
      </div>

      {/* Botão de Carrinho Flutuante */}
      <FloatingCartButton
        totalItems={getTotalItems()}
        totalPrice={getTotalPrice()}
        onClick={() => setCartDrawerOpen(true)}
        primaryColor={primaryColor}
      />


      {/* Cart Drawer */}
      {cartDrawerOpen && (
        <Suspense fallback={null}>
          <CartDrawer
            open={cartDrawerOpen}
            onOpenChange={setCartDrawerOpen}
            onCheckout={handleOpenCheckout}
            primaryColor={primaryColor}
          />
        </Suspense>
      )}

      {/* Customer Auth Dialog */}
      {store && slug && showAuthDialog && (
        <Suspense fallback={null}>
          <CustomerAuthDialog
            open={showAuthDialog}
            onOpenChange={setShowAuthDialog}
            storeId={store.id}
            storeSlug={slug}
            onAuthSuccess={handleAuthSuccess}
          />
        </Suspense>
      )}

      {/* Customer Register Dialog */}
      {store && customerRegisterOpen && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}

      {/* Promotion Popup Dialog */}
      {showPopupPromotion && popupPromotion && (
        <Suspense fallback={null}>
          <PromotionPopupDialog
            promotion={popupPromotion}
            open={showPopupPromotion}
            onClose={() => setShowPopupPromotion(false)}
            storeSlug={slug}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            onApplyCode={(code) => {
              toast({
                title: 'Código aplicado!',
                description: `Use o código ${code} no checkout para obter o desconto.`,
              });
            }}
          />
        </Suspense>
      )}

      {/* Store Info Drawer */}
      {storeInfoDrawerOpen && (
        <Suspense fallback={null}>
          <StoreInfoDrawer
            open={storeInfoDrawerOpen}
            onOpenChange={setStoreInfoDrawerOpen}
            store={store}
            businessHours={businessHours}
            customerName={customerName}
            primaryColor={primaryColor}
            onOpenAuth={() => setShowAuthDialog(true)}
          />
        </Suspense>
      )}

      {/* Espaço para não ficar atrás da navegação inferior */}
      <div className="h-20 md:h-20" aria-hidden />

      {/* Bottom Navigation */}
      {store && slug && (
      <BottomNavigation
        currentRoute="home"
        storeSlug={slug}
        promotionsCount={promotionCount}
        pendingOrdersCount={pendingOrdersCount}
        customerName={customerName}
        onOpenAuth={() => setShowAuthDialog(true)}
      />
      )}

    </div>
  );
};

export default Store;