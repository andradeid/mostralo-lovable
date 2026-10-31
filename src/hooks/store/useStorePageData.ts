// Dados da página pública da loja: loja, categorias, primeira página de produtos, banners,
// promoções (mini banner e popup), horário/entrega com atualização leve e hooks de SEO/scripts.
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { getStorePromotions, isPromotionInPeriod } from '@/hooks/useStorePromotions';
import { supabase } from '@/integrations/supabase/client';
import { publicSupabase } from '@/integrations/supabase/publicClient';
import { PopupController } from '@/utils/popupController';
import { getStoreStatusMessage } from '@/utils/storeStatus';
import { useStoreStatus } from '@/hooks/useStoreStatus';
import { useCustomerToken } from '@/hooks/useCustomerToken';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { useToast } from '@/hooks/use-toast';
import { useSEO } from '@/hooks/useSEO';
import { useCustomScripts } from '@/hooks/useCustomScripts';
import { STORE_PRODUCT_COLUMNS, withVariantsAndAddons } from './storeProducts';
import {
  PRODUCTS_PER_PAGE,
  type StorePageBanner,
  type StorePageCategory,
  type StorePageProduct,
  type StorePageStore,
} from './storePageTypes';

export function useStorePageData(slug: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [store, setStore] = useState<StorePageStore | null>(null);
  // Loja que também tem agenda (ex.: barbearia com produtos): mostra o atalho "Agendar horário"
  const [hasBooking, setHasBooking] = useState(false);
  useEffect(() => {
    if (!store?.id) { setHasBooking(false); return; }
    let alive = true;
    supabase
      .from('booking_services')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', store.id)
      .eq('is_active', true)
      .then(({ count }) => { if (alive) setHasBooking((count ?? 0) > 0); });
    return () => { alive = false; };
  }, [store?.id]);
  const [categories, setCategories] = useState<StorePageCategory[]>([]);
  const [products, setProducts] = useState<StorePageProduct[]>([]);
  const [banners, setBanners] = useState<StorePageBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingBanners, setLoadingBanners] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [businessHours, setBusinessHours] = useState<any>(null);
  const [deliveryConfig, setDeliveryConfig] = useState<any>(null);
  const [promotionCount, setPromotionCount] = useState(0);
  const [popupPromotion, setPopupPromotion] = useState<any>(null);
  const [showPopupPromotion, setShowPopupPromotion] = useState(false);

  // Estados de paginação
  const [totalProducts, setTotalProducts] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const currentPageRef = useRef(0);

  const { toast } = useToast();
  const isPageVisible = usePageVisibility();

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

  // Loja só por encomenda: agendamento ligado e sem "o mais rápido possível"
  const scheduledOnly = storeStatus.scheduledOrdersEnabled &&
    (deliveryConfig?.scheduled_orders?.hide_asap === true ||
     deliveryConfig?.scheduled_orders?.hide_asap === 'true');

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

  // Polling leve para refletir pausa/horário da loja pública sem manter canal aberto
  const fetchStoreStatusSnapshot = useCallback(async () => {
    if (!slug) return;

    try {
      const { data, error } = await supabase
        .from('public_stores')
        .select('business_hours, delivery_config')
        .eq('slug', slug)
        .maybeSingle();

      if (error || !data) return;

      if (data.business_hours) {
        setBusinessHours(data.business_hours);
      }

      if ((data as Record<string, any>).delivery_config) {
        setDeliveryConfig((data as Record<string, any>).delivery_config);
      }
    } catch (error) {
      console.error('Erro ao atualizar status da loja:', error);
    }
  }, [slug]);

  useEffect(() => {
    if (!slug || !isPageVisible) return;

    fetchStoreStatusSnapshot();

    const interval = window.setInterval(() => {
      fetchStoreStatusSnapshot();
    }, 60000);

    return () => {
      window.clearInterval(interval);
    };
  }, [slug, isPageVisible, fetchStoreStatusSnapshot]);

  const fetchStoreData = async () => {
    try {
      setLoading(true);

      // ETAPA 1: Carregar dados básicos da loja (crítico - mostrar primeiro)
      const { data: storeData, error: storeError } = await publicSupabase
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
        publicSupabase
          .from('public_store_config')
          .select('*')
          .eq('store_id', storeData.id)
          .maybeSingle(),
        publicSupabase
          .from('public_stores')
          .select('*')
          .eq('id', storeData.id)
          .maybeSingle()
      ]);

      // Processar dados da configuração
      const rawConfig = configResult.data;
      const processedStore: StorePageStore = {
        ...storeData,
        min_order_value: storeData.min_order_value,
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
        publicSupabase
          .from('categories')
          .select('*')
          .eq('store_id', storeData.id)
          .eq('is_active', true)
          .order('display_order'),
        // Contagem total de produtos (rápida)
        publicSupabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', storeData.id)
          .eq('is_available', true),
        // Primeira página de produtos (50 produtos)
        publicSupabase
          .from('products')
          .select(STORE_PRODUCT_COLUMNS)
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
          // Variantes e adicionais dos produtos da página atual
          const productsWithVariants = await withVariantsAndAddons(productsResult.data);

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
        publicSupabase
          .from('banners')
          .select('id, title, desktop_image_url, mobile_image_url, link_url, video_url')
          .eq('store_id', storeData.id)
          .order('display_order'),
        (async () => {
          // Reutiliza o cache compartilhado ['store-promotions', storeId]
          const cachedPromos = await getStorePromotions(queryClient, storeData.id).catch(() => []);
          const livePromos = cachedPromos.filter(p => p.status === 'active' && isPromotionInPeriod(p));
          setPromotionCount(livePromos.filter(p => p.is_visible_on_store).length);
          const popupCandidates = livePromos.filter(p => p.show_as_popup);
          // Mantém semântica de maybeSingle(): só exibe se houver exatamente uma
          const popupPromo = popupCandidates.length === 1 ? popupCandidates[0] : null;

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

  return {
    store, hasBooking, categories, products, setProducts, banners,
    loading, loadingProducts, loadingBanners,
    selectedCategory, setSelectedCategory, searchTerm, setSearchTerm,
    businessHours, deliveryConfig, promotionCount, popupPromotion, showPopupPromotion, setShowPopupPromotion,
    totalProducts, hasMore, setHasMore, currentPageRef,
    storeStatus, scheduledOnly, storeStatusMessage, categoryOrderMap,
  };
}
