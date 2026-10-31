// Conteúdo principal da loja: contador, lista de produtos no layout configurado (grade, carrossel
// ou lista), gatilho da rolagem infinita e o detalhe do produto.
import { lazy, Suspense, type Ref } from 'react';
import { Loader2 } from 'lucide-react';
import { LoadMoreIndicator } from '@/components/store/LoadMoreIndicator';
import { ProductsCounter } from '@/components/store/ProductsCounter';
import { ProductCardWithPromotion } from '@/components/ProductCardWithPromotion';
import type { StorePageProduct, StorePageStore } from '@/hooks/store/storePageTypes';

const ProductDetail = lazy(() => import('@/components/ProductDetail'));

interface Props {
  store: StorePageStore;
  primaryColor: string;
  searchTerm: string;
  selectedCategory: string | null;
  products: StorePageProduct[];
  categoryProducts: StorePageProduct[] | null;
  totalProducts: number;
  categoryTotal: number;
  loadingProducts: boolean;
  loadingCategoryProducts: boolean;
  loadingMore: boolean;
  effectiveHasMore: boolean;
  loadMoreRef: Ref<HTMLDivElement>;
  storeStatus: any;
  deliveryConfig: any;
  getProductsByCategory: (categoryId: string | null) => StorePageProduct[];
  getRelatedProducts: (p: StorePageProduct) => StorePageProduct[];
  onProductClick: (p: StorePageProduct) => void;
  selectedProduct: StorePageProduct | null;
  showProductDetail: boolean;
  onCloseProductDetail: () => void;
  onAuthRequired: () => void;
}

export function StoreProductList({
  store, primaryColor, searchTerm, selectedCategory, products, categoryProducts, totalProducts, categoryTotal,
  loadingProducts, loadingCategoryProducts, loadingMore, effectiveHasMore, loadMoreRef, storeStatus, deliveryConfig,
  getProductsByCategory, getRelatedProducts, onProductClick, selectedProduct, showProductDetail,
  onCloseProductDetail, onAuthRequired,
}: Props) {
  const handleProductClick = onProductClick;
  return (
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
                onClose={() => onCloseProductDetail()}
                onProductSelect={handleProductClick}
                storeStatus={storeStatus}
                scheduledOnly={deliveryConfig?.scheduled_orders?.enabled === true && deliveryConfig?.scheduled_orders?.hide_asap === true}
                onAuthRequired={() => onAuthRequired()}
              />
            </Suspense>
          )}
        </div>
      </div>
  );
}
