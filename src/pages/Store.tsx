import { useEffect, useState, useMemo, lazy, Suspense, useCallback, useRef } from 'react';
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
import { LoadMoreIndicator } from '@/components/store/LoadMoreIndicator';
import { ProductsCounter } from '@/components/store/ProductsCounter';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { StoreCategoryNav } from '@/components/store/StoreCategoryNav';
import { useCustomerToken } from '@/hooks/useCustomerToken';

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
  Calendar,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/contexts/CartContext';
import { useSEO } from '@/hooks/useSEO';
import { useCustomScripts } from '@/hooks/useCustomScripts';
import { StoreFooter } from '@/components/StoreFooter';
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
  segment?: string;
  configuration?: {
    primary_color?: string;
    secondary_color?: string;
    product_display_layout?: string;
    gtm_id?: string | null;
    google_ads_id?: string | null;
    custom_scripts?: {
      head_scripts?: string;
      body_start_scripts?: string;
      body_end_scripts?: string;
    };
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
  is_featured?: boolean;
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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Product[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [customerRegisterOpen, setCustomerRegisterOpen] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [storeInfoDrawerOpen, setStoreInfoDrawerOpen] = useState(false);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [businessHours, setBusinessHours] = useState<any>(null);
  const [deliveryConfig, setDeliveryConfig] = useState<any>(null);
  const [promotionCount, setPromotionCount] = useState(0);
  const [popupPromotion, setPopupPromotion] = useState<any>(null);
  const [showPopupPromotion, setShowPopupPromotion] = useState(false);
  
  // Estados de paginação
  const [totalProducts, setTotalProducts] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [categoryProducts, setCategoryProducts] = useState<Product[] | null>(null);
  const [loadingCategoryProducts, setLoadingCategoryProducts] = useState(false);
  const [categoryTotal, setCategoryTotal] = useState(0);
  const [categoryHasMore, setCategoryHasMore] = useState(false);
  const currentPageRef = useRef(0);
  const categoryPageRef = useRef(0);
  const PRODUCTS_PER_PAGE = 50;
  
  const { toast } = useToast();
  const { profile } = useAuth();
  const { addItem, getTotalPrice, getTotalItems } = useCart();

  // Hook de Magic Link: detecta ?ct=TOKEN e resolve via Edge Function
  useCustomerToken(store?.id);

  // Hook para gerenciar SEO dinâmico
  useSEO(store, slug);

  // Hook para injetar scripts personalizados
  useCustomScripts(store?.configuration?.custom_scripts, store?.id, {
    gtmId: store?.configuration?.gtm_id,
    googleAdsId: store?.configuration?.google_ads_id,
  });

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
    setTotalProducts(0);
    setHasMore(true);
    currentPageRef.current = 0;
    
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
      supabase.removeChannel(channel);
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
    refetchInterval: 60000, // Otimizado: era 30s, agora 60s
  });

  // Detectar parâmetro ?auth=true legado e apenas limpar a URL.
  // O checkout público não deve forçar autenticação automaticamente.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'true' && store?.id) {
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

  // Debounce da busca para fazer server-side
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Busca server-side quando debouncedSearch muda
  useEffect(() => {
    if (!debouncedSearch.trim() || !store?.id) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);

    const searchServerSide = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, description, price, image_url, image_gallery, category_id, display_order, button_text, slug, is_on_offer, original_price, offer_price, is_featured')
          .eq('store_id', store.id)
          .eq('is_available', true)
          .or(`name.ilike.%${debouncedSearch.trim()}%,description.ilike.%${debouncedSearch.trim()}%`)
          .order('display_order')
          .limit(100);

        if (cancelled) return;
        if (error) throw error;

        if (data && data.length > 0) {
          const productIds = data.map(p => p.id);
          const { data: variants } = await supabase
            .from('product_variants')
            .select('*')
            .in('product_id', productIds)
            .eq('is_available', true)
            .order('display_order');

          if (cancelled) return;

          const productsWithVariants = data.map((product) => {
            const productVariants = variants?.filter(v => v.product_id === product.id) || [];
            if (productVariants.length > 0) {
              const defaultVariant = productVariants.find((v: any) => v.is_default) || productVariants[0];
              return { ...product, price: Number(defaultVariant.price), variants: productVariants };
            }
            return { ...product, variants: [] };
          });
          setSearchResults(productsWithVariants);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Erro na busca server-side:', error);
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    };

    searchServerSide();
    return () => { cancelled = true; };
  }, [debouncedSearch, store?.id]);

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
          .from('public_stores')
          .select('*')
          .eq('id', storeData.id)
          .maybeSingle()
      ]);

      // Processar dados da configuração
      const rawConfig = configResult.data;
      const processedStore: Store = {
        ...storeData,
        configuration: {
          primary_color: rawConfig?.primary_color || '#3B82F6',
          secondary_color: rawConfig?.secondary_color || '#10B981',
          product_display_layout: rawConfig?.product_display_layout || 'grid',
          gtm_id: (rawConfig as any)?.gtm_id || null,
          google_ads_id: (rawConfig as any)?.google_ads_id || null,
          custom_scripts: rawConfig?.custom_scripts as { head_scripts?: string; body_start_scripts?: string; body_end_scripts?: string; } | undefined
        }
      };
      
      // Adicionar latitude, longitude e redes sociais se disponíveis
      const extraData = storeConfigResult.data as Record<string, any> | null;
      if (extraData?.latitude && extraData?.longitude) {
        processedStore.latitude = extraData.latitude;
        processedStore.longitude = extraData.longitude;
      }
      if (extraData?.instagram) {
        processedStore.instagram = extraData.instagram;
      }
      if (extraData?.facebook) {
        processedStore.facebook = extraData.facebook;
      }
      if (extraData?.website) {
        processedStore.website = extraData.website;
      }
      
      setStore(processedStore);
      setBusinessHours(storeData.business_hours);
      setDeliveryConfig(extraData?.delivery_config || null);
      
      // Permitir renderização inicial com dados básicos
      setLoading(false);
      
      // ETAPA 2: Carregar categorias e contagem de produtos em paralelo
      setLoadingProducts(true);
      currentPageRef.current = 0;
      
      Promise.all([
        supabase
          .from('categories')
          .select('*')
          .eq('store_id', storeData.id)
          .eq('is_active', true)
          .order('display_order'),
        // Contagem total de produtos (rápida)
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', storeData.id)
          .eq('is_available', true),
        // Primeira página de produtos (50 produtos)
        supabase
          .from('products')
          .select('id, name, description, price, image_url, image_gallery, category_id, display_order, button_text, slug, is_on_offer, original_price, offer_price, is_featured')
          .eq('store_id', storeData.id)
          .eq('is_available', true)
          .order('display_order')
          .range(0, PRODUCTS_PER_PAGE - 1)
      ]).then(async ([categoriesResult, countResult, productsResult]) => {
        if (categoriesResult.data) {
          setCategories(categoriesResult.data);
        }

        // Atualizar contagem total
        const total = countResult.count || 0;
        setTotalProducts(total);
        setHasMore(PRODUCTS_PER_PAGE < total);

        if (productsResult.data) {
          // Buscar variantes e adicionais dos produtos da página atual
          const productIds = productsResult.data.map(p => p.id);
          const categoryIds = [...new Set(productsResult.data.map(p => p.category_id).filter(Boolean))];
          
          const [variantsResult, productAddonsResult, categoryAddonsResult] = await Promise.all([
            supabase
              .from('product_variants')
              .select('*')
              .in('product_id', productIds)
              .eq('is_available', true)
              .order('display_order'),
            supabase
              .from('product_addons')
              .select('product_id')
              .in('product_id', productIds),
            categoryIds.length > 0
              ? supabase
                  .from('category_addon_categories')
                  .select('category_id')
                  .in('category_id', categoryIds)
              : Promise.resolve({ data: [] })
          ]);

          const allVariants = variantsResult.data;
          const productIdsWithAddons = new Set(
            (productAddonsResult.data || []).map((pa: any) => pa.product_id)
          );
          const categoryIdsWithAddons = new Set(
            (categoryAddonsResult.data || []).map((ca: any) => ca.category_id)
          );

          // Mapear variantes e flag de adicionais para cada produto
          const productsWithVariants = productsResult.data.map((product) => {
            const variants = allVariants?.filter(v => v.product_id === product.id) || [];
            const hasAddons = productIdsWithAddons.has(product.id) || 
                              (product.category_id && categoryIdsWithAddons.has(product.category_id));
            
            if (variants.length > 0) {
              const defaultVariant = variants.find(v => v.is_default) || variants[0];
              return {
                ...product,
                price: Number(defaultVariant.price),
                variants: variants,
                hasAddons: !!hasAddons
              };
            }

            return {
              ...product,
              variants: [],
              hasAddons: !!hasAddons
            };
          });

          // Garantir que não há produtos duplicados
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

  // Função para carregar mais produtos (infinite scroll)
  const loadMoreProducts = useCallback(async () => {
    if (!store?.id || loadingMore) return;
    
    // Determinar se estamos em modo categoria ou geral
    const isInCategory = selectedCategory && selectedCategory !== 'featured' && searchResults === null;
    const currentHasMore = isInCategory ? categoryHasMore : hasMore;
    const currentTotal = isInCategory ? categoryTotal : totalProducts;
    
    if (!currentHasMore) return;
    
    setLoadingMore(true);
    const pageRef = isInCategory ? categoryPageRef : currentPageRef;
    const nextPage = pageRef.current + 1;
    const from = nextPage * PRODUCTS_PER_PAGE;
    const to = from + PRODUCTS_PER_PAGE - 1;
    
    try {
      let query = supabase
        .from('products')
        .select('id, name, description, price, image_url, image_gallery, category_id, display_order, button_text, slug, is_on_offer, original_price, offer_price, is_featured')
        .eq('store_id', store.id)
        .eq('is_available', true)
        .order('display_order')
        .range(from, to);
      
      // Adicionar filtro de categoria se necessário
      if (isInCategory) {
        query = query.eq('category_id', selectedCategory);
      }
      
      const { data: newProducts, error } = await query;
      
      if (error) throw error;
      
      if (newProducts && newProducts.length > 0) {
        // Buscar variantes e adicionais dos novos produtos
        const productIds = newProducts.map(p => p.id);
        const categoryIds = [...new Set(newProducts.map(p => p.category_id).filter(Boolean))];
        
        const [variantsResult, productAddonsResult, categoryAddonsResult] = await Promise.all([
          supabase
            .from('product_variants')
            .select('*')
            .in('product_id', productIds)
            .eq('is_available', true)
            .order('display_order'),
          supabase
            .from('product_addons')
            .select('product_id')
            .in('product_id', productIds),
          categoryIds.length > 0
            ? supabase
                .from('category_addon_categories')
                .select('category_id')
                .in('category_id', categoryIds)
            : Promise.resolve({ data: [] })
        ]);

        const productIdsWithAddons = new Set(
          (productAddonsResult.data || []).map((pa: any) => pa.product_id)
        );
        const categoryIdsWithAddons = new Set(
          (categoryAddonsResult.data || []).map((ca: any) => ca.category_id)
        );

        // Mapear variantes
        const productsWithVariants = newProducts.map((product) => {
          const productVariants = variantsResult.data?.filter(v => v.product_id === product.id) || [];
          const hasAddons = productIdsWithAddons.has(product.id) || 
                            (product.category_id && categoryIdsWithAddons.has(product.category_id));
          
          if (productVariants.length > 0) {
            const defaultVariant = productVariants.find(v => v.is_default) || productVariants[0];
            return {
              ...product,
              price: Number(defaultVariant.price),
              variants: productVariants,
              hasAddons: !!hasAddons
            };
          }

          return {
            ...product,
            variants: [],
            hasAddons: !!hasAddons
          };
        });

        // Adicionar ao array correto sem duplicatas
        if (isInCategory) {
          setCategoryProducts(prev => {
            if (!prev) return productsWithVariants;
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNew = productsWithVariants.filter(p => !existingIds.has(p.id));
            return [...prev, ...uniqueNew];
          });
        } else {
          setProducts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNew = productsWithVariants.filter(p => !existingIds.has(p.id));
            return [...prev, ...uniqueNew];
          });
        }
        
        pageRef.current = nextPage;
        
        // Verificar se ainda há mais produtos
        const totalLoaded = (nextPage + 1) * PRODUCTS_PER_PAGE;
        if (isInCategory) {
          setCategoryHasMore(totalLoaded < currentTotal);
        } else {
          setHasMore(totalLoaded < currentTotal);
        }
      } else {
        if (isInCategory) {
          setCategoryHasMore(false);
        } else {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar mais produtos:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar mais produtos. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoadingMore(false);
    }
  }, [store?.id, loadingMore, hasMore, categoryHasMore, totalProducts, categoryTotal, selectedCategory, searchResults, toast]);

  // Determinar hasMore e loading corretos baseado no contexto atual
  const effectiveHasMore = useMemo(() => {
    if (searchResults !== null) return false; // Busca não usa infinite scroll
    if (selectedCategory && selectedCategory !== 'featured') return categoryHasMore;
    return hasMore;
  }, [searchResults, selectedCategory, categoryHasMore, hasMore]);

  // Hook de infinite scroll
  const loadMoreRef = useInfiniteScroll({
    hasMore: effectiveHasMore,
    isLoading: loadingMore,
    onLoadMore: loadMoreProducts,
  });

  // Verificar se há produtos em destaque
  const hasFeaturedProducts = useMemo(() => {
    return products.some(p => p.is_featured === true);
  }, [products]);

  // Handler para seleção de categoria — seta loading e reset SINCRONICAMENTE
  const handleCategorySelect = useCallback((categoryId: string | null) => {
    setSelectedCategory(categoryId);
    if (categoryId && categoryId !== 'featured') {
      // Reset imediato para evitar flash de produtos locais
      setCategoryProducts(null);
      setCategoryTotal(0);
      setCategoryHasMore(false);
      categoryPageRef.current = 0;
      setLoadingCategoryProducts(true);
    } else {
      setCategoryProducts(null);
      setCategoryTotal(0);
      setCategoryHasMore(false);
      categoryPageRef.current = 0;
      setLoadingCategoryProducts(false);
    }
  }, []);

  // Definir aba inicial baseado em produtos em destaque
  useEffect(() => {
    // Só executa quando os produtos foram carregados pela primeira vez
    // e nenhuma categoria foi selecionada manualmente ainda
    if (products.length > 0 && selectedCategory === null && !loadingProducts) {
      if (hasFeaturedProducts) {
        setSelectedCategory('featured');
      }
    }
  }, [products.length, hasFeaturedProducts, loadingProducts]);

  // Se não houver destaques e estiver na aba featured, voltar para Todas
  useEffect(() => {
    if (!hasFeaturedProducts && selectedCategory === 'featured') {
      setSelectedCategory(null);
    }
  }, [hasFeaturedProducts, selectedCategory]);

  // Buscar produtos da categoria selecionada server-side
  useEffect(() => {
    if (!store?.id || !selectedCategory || selectedCategory === 'featured' || searchResults !== null) {
      setCategoryProducts(null);
      setCategoryTotal(0);
      setCategoryHasMore(false);
      categoryPageRef.current = 0;
      return;
    }

    let cancelled = false;
    // loadingCategoryProducts já foi setado no handleCategorySelect
    categoryPageRef.current = 0;

    const fetchCategoryProducts = async () => {
      try {
        // Buscar contagem e produtos da categoria em paralelo
        const [countResult, productsResult] = await Promise.all([
          supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('store_id', store.id)
            .eq('is_available', true)
            .eq('category_id', selectedCategory),
          supabase
            .from('products')
            .select('id, name, description, price, image_url, image_gallery, category_id, display_order, button_text, slug, is_on_offer, original_price, offer_price, is_featured')
            .eq('store_id', store.id)
            .eq('is_available', true)
            .eq('category_id', selectedCategory)
            .order('display_order')
            .range(0, PRODUCTS_PER_PAGE - 1)
        ]);

        if (cancelled) return;

        const total = countResult.count || 0;
        setCategoryTotal(total);
        setCategoryHasMore(PRODUCTS_PER_PAGE < total);

        if (productsResult.data && productsResult.data.length > 0) {
          // Buscar variantes
          const productIds = productsResult.data.map(p => p.id);
          const { data: variants } = await supabase
            .from('product_variants')
            .select('*')
            .in('product_id', productIds)
            .eq('is_available', true)
            .order('display_order');

          if (cancelled) return;

          const productsWithVariants = productsResult.data.map((product) => {
            const productVariants = variants?.filter(v => v.product_id === product.id) || [];
            if (productVariants.length > 0) {
              const defaultVariant = productVariants.find((v: any) => v.is_default) || productVariants[0];
              return { ...product, price: Number(defaultVariant.price), variants: productVariants };
            }
            return { ...product, variants: [] };
          });

          setCategoryProducts(productsWithVariants);
        } else {
          setCategoryProducts([]);
        }
      } catch (error) {
        console.error('Erro ao buscar produtos da categoria:', error);
        if (!cancelled) setCategoryProducts([]);
      } finally {
        if (!cancelled) setLoadingCategoryProducts(false);
      }
    };

    fetchCategoryProducts();
    return () => { cancelled = true; };
  }, [selectedCategory, store?.id, searchResults]);

  const getProductsByCategory = (categoryId: string | null) => {
    // Se há busca ativa, usar resultados do server-side
    const sourceProducts = searchResults !== null ? searchResults : products;

    // Aba "Destaques" selecionada
    if (categoryId === 'featured') {
      const featuredProducts = sourceProducts.filter(p => p.is_featured === true);
      return featuredProducts.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    }
    
    // Categoria específica selecionada - usar produtos buscados server-side
    if (categoryId && searchResults === null) {
      // Se categoryProducts é null, ainda está carregando (retorna vazio, loader será exibido)
      if (categoryProducts === null) {
        return [];
      }
      const copy = [...categoryProducts];
      return copy.sort((a, b) => {
        const prodOrderA = a.display_order ?? 0;
        const prodOrderB = b.display_order ?? 0;
        if (prodOrderA !== prodOrderB) return prodOrderA - prodOrderB;
        return a.name.localeCompare(b.name);
      });
    }

    // Filtrar de busca quando há searchResults + categoria
    if (categoryId && searchResults !== null) {
      const filtered = searchResults.filter(p => p.category_id === categoryId);
      return filtered.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    }
    
    // "Todas" - usar produtos carregados normalmente
    const copy = [...sourceProducts];
    
    // Funções auxiliares para obter ordem
    const getCategoryOrder = (catId?: string) => 
      catId ? (categoryOrderMap[catId] ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;
    
    return copy.sort((a, b) => {
      const catOrderA = getCategoryOrder(a.category_id);
      const catOrderB = getCategoryOrder(b.category_id);
      
      if (catOrderA !== catOrderB) return catOrderA - catOrderB;
      
      const prodOrderA = a.display_order ?? 0;
      const prodOrderB = b.display_order ?? 0;
      
      if (prodOrderA !== prodOrderB) return prodOrderA - prodOrderB;
      
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
    // Abrir o CheckoutDialog diretamente (guest checkout, sem necessidade de login)
    setCartDrawerOpen(false);
    setCheckoutDialogOpen(true);
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
            {isSearching ? (
              <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            )}
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
                  onClick={() => setCustomerRegisterOpen(true)}
                  aria-label="Cadastrar-se"
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
                    deliveryConfig?.scheduled_orders?.hide_asap
                      ? 'bg-amber-50 border-amber-200'
                      : storeStatus.isOpenForBusiness 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-blue-100 border-blue-300'
                  }`}>
                    <Calendar className={`h-4 w-4 ${
                      deliveryConfig?.scheduled_orders?.hide_asap
                        ? 'text-amber-600'
                        : storeStatus.isOpenForBusiness ? 'text-blue-600' : 'text-blue-700'
                    }`} />
                    <span className={`text-xs font-medium ${
                      deliveryConfig?.scheduled_orders?.hide_asap
                        ? 'text-amber-800'
                        : storeStatus.isOpenForBusiness ? 'text-blue-700' : 'text-blue-800'
                    }`}>
                      {deliveryConfig?.scheduled_orders?.hide_asap
                        ? '📦 Somente por encomenda — escolha a data ao finalizar'
                        : storeStatus.isOpenForBusiness 
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
              {isSearching ? (
                <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
              ) : (
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              )}
              <Input
                placeholder="Digite sua busca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80 bg-background border border-muted rounded-lg"
              />
            </div>

            {/* Botões de cadastro e carrinho */}
            <div className="flex items-center gap-3">
              {!customerName ? (
                <div className="flex items-center gap-2">
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
                    <DropdownMenuItem onClick={() => navigate(`/loja/${slug}/meus-pedidos`)}>
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
        <StoreCategoryNav
          categories={categories}
          selectedCategory={selectedCategory}
          hasFeaturedProducts={hasFeaturedProducts}
          primaryColor={primaryColor}
          onCategorySelect={handleCategorySelect}
          showStickyHeader={showStickyHeader}
        />
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
            {customerName ? (
              <button
                type="button"
                onClick={goToCustomerArea}
                aria-label="Abrir painel do cliente"
                className="text-xs underline underline-offset-2"
              >
                Minha conta
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCustomerRegisterOpen(true)}
                aria-label="Cadastrar-se"
                className="text-xs underline underline-offset-2"
              >
                Cadastrar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <div className="px-4 py-4 pb-24">
        <div className="max-w-[1080px] mx-auto">
          {/* Contador de produtos (apenas se não estiver buscando) */}
          {!searchTerm && !loadingProducts && !loadingCategoryProducts && (
            (() => {
              const isInCategory = selectedCategory && selectedCategory !== 'featured';
              const displayLoaded = isInCategory && categoryProducts ? categoryProducts.length : products.length;
              const displayTotal = isInCategory ? categoryTotal : totalProducts;
              return displayTotal > 0 ? (
                <ProductsCounter
                  loaded={displayLoaded}
                  total={displayTotal}
                  isSearching={!!searchTerm}
                />
              ) : null;
            })()
          )}

          {/* Renderização dinâmica baseada no layout configurado */}
          {(() => {
            const productsToDisplay = getProductsByCategory(selectedCategory);
            const layout = store?.configuration?.product_display_layout || 'grid';

            if (loadingProducts || loadingCategoryProducts) {
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
                <>
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
                  {/* Infinite scroll trigger - sempre visível quando há mais produtos */}
                  {effectiveHasMore && (
                    <>
                      <div ref={loadMoreRef} className="h-10" />
                      <LoadMoreIndicator isLoading={loadingMore} hasMore={effectiveHasMore} />
                    </>
                  )}
                </>
              );
            }

            // Layout CAROUSEL - Scroll horizontal
            if (layout === 'carousel') {
              return (
                <>
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
                  {/* Infinite scroll trigger - sempre visível quando há mais produtos */}
                  {effectiveHasMore && (
                    <>
                      <div ref={loadMoreRef} className="h-10" />
                      <LoadMoreIndicator isLoading={loadingMore} hasMore={effectiveHasMore} />
                    </>
                  )}
                </>
              );
            }

            // Layout LIST - Horizontal (padrão atual otimizado)
            return (
              <>
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
                {/* Infinite scroll trigger - sempre visível quando há mais produtos */}
                {effectiveHasMore && (
                  <>
                    <div ref={loadMoreRef} className="h-10" />
                    <LoadMoreIndicator isLoading={loadingMore} hasMore={effectiveHasMore} />
                  </>
                )}
              </>
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

      {/* Carrinho agora está no BottomNavigation */}


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

      {/* Checkout Dialog (Guest Checkout) */}
      {store && checkoutDialogOpen && (
        <Suspense fallback={null}>
          <CheckoutDialog
            open={checkoutDialogOpen}
            onOpenChange={setCheckoutDialogOpen}
            storeId={store.id}
            deliveryFee={(store as any)?.delivery_fee || 0}
            isServicePaused={storeStatus.isPaused}
            scheduledOrdersEnabled={storeStatus.scheduledOrdersEnabled}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />
        </Suspense>
      )}


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
            storeSlug={slug}
            businessHours={businessHours}
            customerName={customerName}
            primaryColor={primaryColor}
            onOpenAuth={() => setShowAuthDialog(true)}
          />
        </Suspense>
      )}

      {/* Footer informativo da loja */}
      {store && (
        <StoreFooter store={store} businessHours={businessHours} />
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
        onOpenAuth={() => setCustomerRegisterOpen(true)}
        cartItemsCount={getTotalItems()}
        onCartClick={() => setCartDrawerOpen(true)}
        cartColor={primaryColor}
      />
      )}

    </div>
  );
};

export default Store;