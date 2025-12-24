import { useState } from 'react';
import { usePDV } from '@/hooks/usePDV';
import { PDVProductGrid } from '@/components/pdv/PDVProductGrid';
import { PDVCart } from '@/components/pdv/PDVCart';
import { PDVPaymentModal } from '@/components/pdv/PDVPaymentModal';

export default function PDVPage() {
  const { cart, subtotal, addToCart, updateCartItemQuantity, removeFromCart, clearCart, finalizeSale, isProcessing } = usePDV();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const handleFinalize = async (paymentMethod: string, discount: number, paymentDetails?: Record<string, any>) => {
    await finalizeSale(paymentMethod, discount, paymentDetails);
    setPaymentModalOpen(false);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
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

      {/* Modal de pagamento */}
      <PDVPaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        subtotal={subtotal}
        onConfirm={handleFinalize}
        isProcessing={isProcessing}
      />
    </div>
  );
}
