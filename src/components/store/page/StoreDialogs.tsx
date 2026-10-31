// Gavetas e diálogos da loja, carregados sob demanda: carrinho, checkout, login do cliente,
// cadastro, popup de promoção e informações da loja.
import { lazy, Suspense } from 'react';
import type { StorePageStore } from '@/hooks/store/storePageTypes';

const CheckoutDialog = lazy(() => import('@/components/checkout/CheckoutDialog').then(m => ({ default: m.CheckoutDialog })));
const CartDrawer = lazy(() => import('@/components/checkout/CartDrawer').then(m => ({ default: m.CartDrawer })));
const CustomerRegisterDialog = lazy(() => import('@/components/checkout/CustomerRegisterDialog').then(m => ({ default: m.CustomerRegisterDialog })));
const CustomerAuthDialog = lazy(() => import('@/components/checkout/CustomerAuthDialog').then(m => ({ default: m.CustomerAuthDialog })));
const StoreInfoDrawer = lazy(() => import('@/components/StoreInfoDrawer').then(m => ({ default: m.StoreInfoDrawer })));
const PromotionPopupDialog = lazy(() => import('@/components/PromotionPopupDialog').then(m => ({ default: m.PromotionPopupDialog })));

interface Props {
  store: StorePageStore;
  slug: string;
  primaryColor: string;
  secondaryColor: string;
  storeStatus: any;
  deliveryConfig: any;
  businessHours: any;
  customerName: string | null;
  cartDrawerOpen: boolean;
  setCartDrawerOpen: (open: boolean) => void;
  checkoutDialogOpen: boolean;
  setCheckoutDialogOpen: (open: boolean) => void;
  showAuthDialog: boolean;
  setShowAuthDialog: (open: boolean) => void;
  customerRegisterOpen: boolean;
  onCustomerRegisterOpenChange: (open: boolean) => void;
  showPopupPromotion: boolean;
  popupPromotion: any;
  onClosePopupPromotion: () => void;
  onApplyPromotionCode: (code: string) => void;
  storeInfoDrawerOpen: boolean;
  setStoreInfoDrawerOpen: (open: boolean) => void;
  onOpenCheckout: () => void;
  onAuthSuccess: (customerData: any) => void;
}

export function StoreDialogs({
  store, slug, primaryColor, secondaryColor, storeStatus, deliveryConfig, businessHours, customerName,
  cartDrawerOpen, setCartDrawerOpen, checkoutDialogOpen, setCheckoutDialogOpen, showAuthDialog, setShowAuthDialog,
  customerRegisterOpen, onCustomerRegisterOpenChange, showPopupPromotion, popupPromotion, onClosePopupPromotion,
  onApplyPromotionCode, storeInfoDrawerOpen, setStoreInfoDrawerOpen, onOpenCheckout, onAuthSuccess,
}: Props) {
  return (
    <>
      {/* Cart Drawer */}
      {cartDrawerOpen && (
        <Suspense fallback={null}>
          <CartDrawer
            open={cartDrawerOpen}
            onOpenChange={setCartDrawerOpen}
            onCheckout={onOpenCheckout}
            primaryColor={primaryColor}
            minOrderValue={Number(store?.min_order_value) || 0}
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
            deliveryConfig={deliveryConfig}
            businessHoursData={businessHours}
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
            onAuthSuccess={onAuthSuccess}
          />
        </Suspense>
      )}

      {/* Customer Register Dialog */}
      {store && customerRegisterOpen && (
        <Suspense fallback={null}>
          <CustomerRegisterDialog
            open={customerRegisterOpen}
            onOpenChange={onCustomerRegisterOpenChange}
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
            onClose={() => onClosePopupPromotion()}
            storeSlug={slug}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            onApplyCode={onApplyPromotionCode}
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
    </>
  );
}
