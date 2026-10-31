// Página pública da loja (/loja/:slug). Só orquestra: dados em src/hooks/store/ e peças em
// src/components/store/page/ (topo, cabeçalhos, destaques, lista de produtos, diálogos).
import { useStoreSlug } from '@/contexts/StoreSlugContext';
import { storePath, bookingPath } from '@/lib/storePath';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '@/components/BottomNavigation';
import { StoreCategoryNav } from '@/components/store/StoreCategoryNav';
import { Store as StoreIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/contexts/CartContext';
import { StoreFooter } from '@/components/StoreFooter';
import { useStorePageData } from '@/hooks/store/useStorePageData';
import { useStoreCustomer } from '@/hooks/store/useStoreCustomer';
import { useStorePageUI } from '@/hooks/store/useStorePageUI';
import { useStoreCatalog } from '@/hooks/store/useStoreCatalog';
import type { StorePageProduct } from '@/hooks/store/storePageTypes';
import { StoreTopBars } from '@/components/store/page/StoreTopBars';
import { StoreHeaderMobile } from '@/components/store/page/StoreHeaderMobile';
import { StoreHeaderDesktop } from '@/components/store/page/StoreHeaderDesktop';
import { StoreHighlights } from '@/components/store/page/StoreHighlights';
import { StoreStickyHeader } from '@/components/store/page/StoreStickyHeader';
import { StoreProductList } from '@/components/store/page/StoreProductList';
import { StoreDialogs } from '@/components/store/page/StoreDialogs';

const Store = () => {
  const slug = useStoreSlug();
  const navigate = useNavigate();

  const data = useStorePageData(slug);
  const {
    store, hasBooking, categories, products, setProducts, banners, loading, loadingProducts,
    selectedCategory, setSelectedCategory, searchTerm, setSearchTerm, businessHours, deliveryConfig,
    promotionCount, popupPromotion, showPopupPromotion, setShowPopupPromotion,
    totalProducts, hasMore, setHasMore, currentPageRef,
    storeStatus, scheduledOnly, storeStatusMessage, categoryOrderMap,
  } = data;

  const { toast } = useToast();
  // Mantém a página ligada ao estado de login (re-renderiza quando muda)
  useAuth();
  const { getTotalPrice, getTotalItems } = useCart();

  const { customerName, setCustomerName, pendingOrdersCount } = useStoreCustomer(store?.id, slug);
  const ui = useStorePageUI();

  const catalog = useStoreCatalog({
    storeId: store?.id, products, setProducts, loadingProducts, selectedCategory, setSelectedCategory,
    searchTerm, totalProducts, hasMore, setHasMore, currentPageRef, categoryOrderMap,
  });

  const handleProductClick = (product: StorePageProduct) => {
    // Navigate to individual product page
    navigate(storePath(slug, `/produto/${product.slug}`));
  };

  const goToCustomerArea = () => {
    if (!slug) return;
    if (customerName) {
      navigate(`/painel-cliente/${slug}`);
    } else {
      navigate(`/cliente/${slug}`);
    }
  };

  const handleAuthSuccess = (customerData: any) => {
    setCustomerName(customerData.name);
    ui.setShowAuthDialog(false);

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
        ui.handleOpenCheckout();
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

  const primaryColor = store.configuration?.primary_color || '#3B82F6';
  const secondaryColor = store.configuration?.secondary_color || '#10B981';

  return (
    <div className="min-h-screen bg-background">
      <StoreTopBars
        store={store}
        primaryColor={primaryColor}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        isSearching={catalog.isSearching}
        customerName={customerName}
        businessHours={businessHours}
        storeStatus={storeStatus}
        storeStatusMessage={storeStatusMessage}
        scheduledOnly={scheduledOnly}
        onOpenStoreInfo={() => ui.setStoreInfoDrawerOpen(true)}
        onOpenRegister={() => ui.setCustomerRegisterOpen(true)}
        onGoToCustomerArea={goToCustomerArea}
      />

      <StoreHeaderMobile
        store={store}
        searchTerm={searchTerm}
        storeStatus={storeStatus}
        scheduledOnly={scheduledOnly}
        deliveryConfig={deliveryConfig}
        deferredPrompt={ui.deferredPrompt}
        isIOS={ui.isIOS}
        isStandalone={ui.isStandalone}
        installPWA={ui.installPWA}
      />

      <StoreHeaderDesktop
        store={store}
        primaryColor={primaryColor}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        isSearching={catalog.isSearching}
        customerName={customerName}
        storeStatus={storeStatus}
        deliveryConfig={deliveryConfig}
        totalPrice={getTotalPrice()}
        totalItems={getTotalItems()}
        onOpenRegister={() => ui.setCustomerRegisterOpen(true)}
        onMyOrders={() => navigate(storePath(slug, `/meus-pedidos`))}
        onSignOut={() => {
          localStorage.removeItem("customer_data");
          setCustomerName("");
          toast({
            title: "Sessão encerrada",
            description: "Você foi desconectado",
          });
        }}
        onOpenCart={() => ui.setCartDrawerOpen(true)}
      />

      {/* Navegação de Categorias - Sticky */}
      {!searchTerm && categories.length > 0 && (
        <StoreCategoryNav
          categories={categories}
          selectedCategory={selectedCategory}
          hasFeaturedProducts={catalog.hasFeaturedProducts}
          primaryColor={primaryColor}
          onCategorySelect={catalog.handleCategorySelect}
          showStickyHeader={ui.showStickyHeader}
        />
      )}

      <StoreHighlights
        storeId={store.id}
        searchTerm={searchTerm}
        promotionCount={promotionCount}
        hasBooking={hasBooking}
        banners={banners}
        onOpenPromotions={() => navigate(storePath(slug, `/promocoes`))}
        onOpenBooking={() => navigate(bookingPath(slug))}
      />

      {/* Header Fixo com Logo (aparece ao rolar) */}
      {!searchTerm && ui.showStickyHeader && (
        <StoreStickyHeader
          store={store}
          primaryColor={primaryColor}
          customerName={customerName}
          onGoToCustomerArea={goToCustomerArea}
          onOpenRegister={() => ui.setCustomerRegisterOpen(true)}
        />
      )}

      <StoreProductList
        store={store}
        primaryColor={primaryColor}
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
        products={products}
        categoryProducts={catalog.categoryProducts}
        totalProducts={totalProducts}
        categoryTotal={catalog.categoryTotal}
        loadingProducts={loadingProducts}
        loadingCategoryProducts={catalog.loadingCategoryProducts}
        loadingMore={catalog.loadingMore}
        effectiveHasMore={catalog.effectiveHasMore}
        loadMoreRef={catalog.loadMoreRef}
        storeStatus={storeStatus}
        deliveryConfig={deliveryConfig}
        getProductsByCategory={catalog.getProductsByCategory}
        getRelatedProducts={catalog.getRelatedProducts}
        onProductClick={handleProductClick}
        selectedProduct={ui.selectedProduct}
        showProductDetail={ui.showProductDetail}
        onCloseProductDetail={() => {
          ui.setShowProductDetail(false);
          ui.setSelectedProduct(null);
        }}
        onAuthRequired={() => ui.setShowAuthDialog(true)}
      />

      {/* Carrinho agora está no BottomNavigation */}

      <StoreDialogs
        store={store}
        slug={slug}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        storeStatus={storeStatus}
        deliveryConfig={deliveryConfig}
        businessHours={businessHours}
        customerName={customerName}
        cartDrawerOpen={ui.cartDrawerOpen}
        setCartDrawerOpen={ui.setCartDrawerOpen}
        checkoutDialogOpen={ui.checkoutDialogOpen}
        setCheckoutDialogOpen={ui.setCheckoutDialogOpen}
        showAuthDialog={ui.showAuthDialog}
        setShowAuthDialog={ui.setShowAuthDialog}
        customerRegisterOpen={ui.customerRegisterOpen}
        onCustomerRegisterOpenChange={(open) => {
          ui.setCustomerRegisterOpen(open);
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
        showPopupPromotion={showPopupPromotion}
        popupPromotion={popupPromotion}
        onClosePopupPromotion={() => setShowPopupPromotion(false)}
        onApplyPromotionCode={(code) => {
          toast({
            title: 'Código aplicado!',
            description: `Use o código ${code} no checkout para obter o desconto.`,
          });
        }}
        storeInfoDrawerOpen={ui.storeInfoDrawerOpen}
        setStoreInfoDrawerOpen={ui.setStoreInfoDrawerOpen}
        onOpenCheckout={ui.handleOpenCheckout}
        onAuthSuccess={handleAuthSuccess}
      />

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
        onOpenAuth={() => ui.setCustomerRegisterOpen(true)}
        cartItemsCount={getTotalItems()}
        onCartClick={() => ui.setCartDrawerOpen(true)}
        cartColor={primaryColor}
      />
      )}

    </div>
  );
};

export default Store;
