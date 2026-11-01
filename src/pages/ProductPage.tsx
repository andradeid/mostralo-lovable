// Página do produto na loja: fotos, preço (variação, oferta, promoção, pizza de vários sabores),
// adicionais, observações, pedido pelo WhatsApp e "Adicionar" com upsell.
// Só orquestra: dados e ações em src/hooks/productPage/, regras de preço em src/lib/productPage/
// e blocos visuais em src/components/store/product-page/.
import { useStoreSlug } from '@/contexts/StoreSlugContext';
import { storePath } from '@/lib/storePath';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useStoreStatus } from '@/hooks/useStoreStatus';
import { useProductPromotion } from '@/hooks/useProductPromotion';
import { usePizzaFlavors } from '@/hooks/usePizzaFlavors';
import { PizzaFlavorPicker } from '@/components/store/PizzaFlavorPicker';
import { useCustomScripts } from '@/hooks/useCustomScripts';
import { MessageCircle } from 'lucide-react';
import { displayPrices } from '@/lib/productPage/pricing';
import type { Product } from '@/lib/productPage/types';
import { useProductPageData } from '@/hooks/productPage/useProductPageData';
import { useProductPageUI } from '@/hooks/productPage/useProductPageUI';
import { useProductAddons } from '@/hooks/productPage/useProductAddons';
import { useProductSeo } from '@/hooks/productPage/useProductSeo';
import { useProductGallery } from '@/hooks/productPage/useProductGallery';
import { useProductCartActions } from '@/hooks/productPage/useProductCartActions';
import { ProductLoadingScreen, ProductNotFoundScreen } from '@/components/store/product-page/ProductPageScreens';
import { ProductPageHeader } from '@/components/store/product-page/ProductPageHeader';
import { ProductStoreStatusAlert } from '@/components/store/product-page/ProductStoreStatusAlert';
import { ProductGallery } from '@/components/store/product-page/ProductGallery';
import { ProductSummary } from '@/components/store/product-page/ProductSummary';
import { ProductVariantsList } from '@/components/store/product-page/ProductVariantsList';
import { ProductAddonsList } from '@/components/store/product-page/ProductAddonsList';
import { ProductBottomBar } from '@/components/store/product-page/ProductBottomBar';
import { ProductPageDialogs } from '@/components/store/product-page/ProductPageDialogs';
import { ProductJsonLd } from '@/components/store/product-page/ProductJsonLd';

const ProductPage = () => {
  const { productSlug } = useParams<{ storeSlug: string; productSlug: string }>();
  const storeSlug = useStoreSlug();
  const navigate = useNavigate();
  const { addItem, getTotalPrice, getTotalItems } = useCart();
  const { toast } = useToast();
  const {
    store, product, variants, selectedVariant, setSelectedVariant, loading,
    relatedProducts, addonCategories, businessHours, deliveryConfig,
  } = useProductPageData(storeSlug, productSlug, navigate);
  const ui = useProductPageUI(store, toast);
  const { quantity, setQuantity, observations, setObservations } = ui;
  const { selectedAddons, handleAddonQuantityChange, calculateAddonsPrice, validateRequiredAddons } = useProductAddons(addonCategories, toast);

  const storeStatus = useStoreStatus(businessHours, deliveryConfig);
  const primaryColor = store?.configuration?.primary_color || store?.theme_colors?.primary || '#3B82F6';

  // Hook para injetar scripts personalizados da loja
  useCustomScripts(store?.configuration?.custom_scripts, store?.id, {
    gtmId: (store?.configuration as any)?.gtm_id,
    googleAdsId: (store?.configuration as any)?.google_ads_id,
  });

  // Hook para calcular promoções aplicáveis ao produto
  const { finalPrice: promotionFinalPrice, discountInfo, bestPromotion, eligiblePromotion } = useProductPromotion({
    product: product,
    storeId: store?.id || '',
    quantity: quantity,
    selectedVariantPrice: selectedVariant?.price
  });

  // Pizza com mais de um sabor (meio a meio), quando a categoria permite
  const pf = usePizzaFlavors({ product: product as any, sizeName: selectedVariant?.name ?? null });

  useProductSeo(product, store, selectedVariant);
  const gallery = useProductGallery(product);

  const { handleAddToCart, handleUpsellAccept, handleUpsellDecline, sendWhatsAppMessage, shareProduct } = useProductCartActions({
    store, product, storeSlug, selectedVariant, addonCategories, selectedAddons,
    calculateAddonsPrice, validateRequiredAddons, pf, promotionFinalPrice, discountInfo,
    storeStatus, addItem, ui, toast, navigate,
  });

  if (loading) {
    return <ProductLoadingScreen />;
  }

  if (!product || !store) {
    return <ProductNotFoundScreen onBack={() => navigate('/')} />;
  }

  const addonsPrice = calculateAddonsPrice();
  const { currentFinalPrice, totalPrice } = displayPrices(pf, promotionFinalPrice, selectedVariant, product, addonsPrice);

  const handleRelatedProductClick = (relatedProduct: Product) => {
    navigate(storePath(store.slug, `/produto/${relatedProduct.slug}`));
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Cabeçalho Simplificado */}
      <ProductPageHeader store={store} onBack={() => navigate(storePath(store.slug))} />

      <main className="w-full max-w-[1080px] mx-auto px-4 py-6">

        {/* Alerta quando não está operando normalmente */}
        <ProductStoreStatusAlert storeStatus={storeStatus} />

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <ProductGallery
            product={product}
            images={gallery.images}
            currentImageIndex={gallery.currentImageIndex}
            setCarouselApi={gallery.setCarouselApi}
            handleThumbnailClick={gallery.handleThumbnailClick}
            storeStatus={storeStatus}
          />

          {/* Product Info */}
          <div className="space-y-6">
            <ProductSummary
              product={product}
              selectedVariant={selectedVariant}
              addonCategories={addonCategories}
              pf={pf}
              currentFinalPrice={currentFinalPrice}
              eligiblePromotion={eligiblePromotion}
              bestPromotion={bestPromotion}
              discountInfo={discountInfo}
            />

            {/* Variants */}
            <ProductVariantsList variants={variants} selectedVariant={selectedVariant} setSelectedVariant={setSelectedVariant} />

            {/* Sabores (meio a meio) */}
            <PizzaFlavorPicker
              pf={pf}
              mainName={product.name}
              sizeName={selectedVariant?.name ?? null}
              primaryColor={primaryColor}
            />

            {/* Addons */}
            <ProductAddonsList
              addonCategories={addonCategories}
              selectedAddons={selectedAddons}
              handleAddonQuantityChange={handleAddonQuantityChange}
            />

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
            {store.phone && !(deliveryConfig?.scheduled_orders?.enabled && deliveryConfig?.scheduled_orders?.hide_asap) && (
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
      <ProductBottomBar
        quantity={quantity}
        setQuantity={setQuantity}
        storeStatus={storeStatus}
        primaryColor={primaryColor}
        totalPrice={totalPrice}
        onAddToCart={handleAddToCart}
        onShare={shareProduct}
      />

      <ProductPageDialogs
        store={store}
        storeSlug={storeSlug}
        primaryColor={primaryColor}
        storeStatus={storeStatus}
        deliveryConfig={deliveryConfig}
        businessHours={businessHours}
        ui={ui}
        navigate={navigate}
        handleUpsellAccept={handleUpsellAccept}
        handleUpsellDecline={handleUpsellDecline}
      />

      {/* Schema.org structured data */}
      <ProductJsonLd product={product} store={store} currentFinalPrice={currentFinalPrice} />
    </div>
  );
};

export default ProductPage;
