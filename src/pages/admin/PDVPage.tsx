import { useState } from 'react';
import { usePDV } from '@/hooks/usePDV';
import { PDVProductGrid } from '@/components/pdv/PDVProductGrid';
import { PDVCart } from '@/components/pdv/PDVCart';
import { PDVPaymentModal } from '@/components/pdv/PDVPaymentModal';
import { PDVHistory } from '@/components/pdv/PDVHistory';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Package, History } from 'lucide-react';
import { ModuleGate } from '@/components/admin/ModuleGate';
import { useStoreAccess } from '@/hooks/useStoreAccess';

export default function PDVPage() {
  const { storeId } = useStoreAccess();
  const { cart, subtotal, addToCart, updateCartItemQuantity, removeFromCart, clearCart, finalizeSale, isProcessing } = usePDV();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleFinalize = async (paymentMethod: string, discount: number, paymentDetails?: Record<string, any>) => {
    await finalizeSale(paymentMethod, discount, paymentDetails);
    setPaymentModalOpen(false);
  };

  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Layout Mobile com Tabs
  if (isMobile) {
    return (
      <ModuleGate moduleKey="pdv_comandas" storeId={storeId}>
        <div className="h-[calc(100vh-7rem)] flex flex-col">
        <Tabs defaultValue="products" className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-3 h-14 mx-2 mb-2">
            <TabsTrigger value="products" className="h-12 text-base gap-2">
              <Package className="h-5 w-5" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="cart" className="h-12 text-base gap-2 relative">
              <ShoppingCart className="h-5 w-5" />
              Carrinho
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="h-12 text-base gap-2">
              <History className="h-5 w-5" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="flex-1 overflow-auto px-2 pb-2 mt-0">
            <PDVProductGrid onAddProduct={addToCart} />
          </TabsContent>

          <TabsContent value="cart" className="flex-1 overflow-hidden px-2 pb-2 mt-0">
            <PDVCart
              items={cart}
              subtotal={subtotal}
              onUpdateQuantity={updateCartItemQuantity}
              onRemoveItem={removeFromCart}
              onClearCart={clearCart}
              onFinalize={() => setPaymentModalOpen(true)}
              isProcessing={isProcessing}
            />
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-hidden px-2 pb-2 mt-0">
            <PDVHistory />
          </TabsContent>
        </Tabs>

        {/* Modal de pagamento */}
        <PDVPaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          subtotal={subtotal}
          onConfirm={handleFinalize}
          isProcessing={isProcessing}
        />
        </div>
      </ModuleGate>
    );
  }

  // Layout Desktop com Tabs
  return (
    <ModuleGate moduleKey="pdv_comandas" storeId={storeId}>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        <Tabs defaultValue="pdv" className="flex-1 flex flex-col">
          <TabsList className="w-fit mb-4">
            <TabsTrigger value="pdv" className="gap-2">
              <Package className="h-4 w-4" />
              PDV
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pdv" className="flex-1 overflow-hidden mt-0">
            <div className="h-full flex gap-4">
              {/* Grid de produtos */}
              <div className="flex-1 overflow-auto">
                <PDVProductGrid onAddProduct={addToCart} />
              </div>

              {/* Carrinho lateral */}
              <div className="w-80 lg:w-96 flex-shrink-0">
                <PDVCart
                  items={cart}
                  subtotal={subtotal}
                  onUpdateQuantity={updateCartItemQuantity}
                  onRemoveItem={removeFromCart}
                  onClearCart={clearCart}
                  onFinalize={() => setPaymentModalOpen(true)}
                  isProcessing={isProcessing}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-hidden mt-0">
            <PDVHistory />
          </TabsContent>
        </Tabs>

        {/* Modal de pagamento */}
        <PDVPaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          subtotal={subtotal}
          onConfirm={handleFinalize}
          isProcessing={isProcessing}
        />
      </div>
    </ModuleGate>
  );
}
