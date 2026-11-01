// Janelas da página do produto: carrinho, checkout, login/cadastro do cliente e upsell.
import type { NavigateFunction } from 'react-router-dom';
import { storePath } from '@/lib/storePath';
import { CartDrawer } from '@/components/checkout/CartDrawer';
import { CheckoutDialog } from '@/components/checkout/CheckoutDialog';
import { CustomerAuthDialog } from '@/components/checkout/CustomerAuthDialog';
import { CustomerRegisterDialog } from '@/components/checkout/CustomerRegisterDialog';
import { UpsellModal } from '@/components/upsell/UpsellModal';
import type { Store } from '@/lib/productPage/types';
import type { ProductPageUI } from '@/hooks/productPage/useProductPageUI';

interface Props {
  store: Store;
  storeSlug: string | null | undefined;
  primaryColor: string;
  storeStatus: { isPaused: boolean; scheduledOrdersEnabled: boolean };
  deliveryConfig: any;
  businessHours: any;
  ui: ProductPageUI;
  navigate: NavigateFunction;
  handleUpsellAccept: (upsellProduct: { id: string; name: string; price: number; image_url: string | null; quantity: number }) => void;
  handleUpsellDecline: () => void;
}

export function ProductPageDialogs({
  store,
  storeSlug,
  primaryColor,
  storeStatus,
  deliveryConfig,
  businessHours,
  ui,
  navigate,
  handleUpsellAccept,
  handleUpsellDecline,
}: Props) {
  const {
    cartDrawerOpen, setCartDrawerOpen,
    checkoutOpen, setCheckoutOpen,
    showAuthDialog, setShowAuthDialog,
    customerRegisterOpen, setCustomerRegisterOpen,
    setCustomerName,
    showUpsellModal, setShowUpsellModal,
    upsellTriggerProductId, setUpsellTriggerProductId,
    handleAuthSuccess,
  } = ui;

  return (
    <>
      {/* Cart Drawer */}
      <CartDrawer
        open={cartDrawerOpen}
        onOpenChange={setCartDrawerOpen}
        onCheckout={() => {
          setCartDrawerOpen(false);
          setCheckoutOpen(true);
        }}
        primaryColor={primaryColor}
        storeId={store?.id}
        minOrderValue={Number((store as any)?.min_order_value) || 0}
      />

      {/* Checkout Dialog */}
      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        storeId={store.id}
        deliveryFee={0}
        isServicePaused={storeStatus.isPaused}
        scheduledOrdersEnabled={storeStatus.scheduledOrdersEnabled}
        deliveryConfig={deliveryConfig}
        businessHoursData={businessHours}
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

      {/* Upsell Modal */}
      <UpsellModal
        open={showUpsellModal}
        onOpenChange={(open) => {
          setShowUpsellModal(open);
          if (!open) {
            setUpsellTriggerProductId(null);
            navigate(storePath(storeSlug));
          }
        }}
        storeId={store.id}
        triggerProductId={upsellTriggerProductId || ''}
        onAccept={handleUpsellAccept}
        onDecline={handleUpsellDecline}
        themeColor={primaryColor}
      />
    </>
  );
}
