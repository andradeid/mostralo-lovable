import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { startOrderPayment } from '@/lib/storeCheckout/onlinePayment';

interface Props {
  storeId: string;
  orderId: string;
  customerToken: string;
  /** Chamado quando o servidor responde que o pedido já está pago */
  onPaid?: () => void;
}

/** "Pagar agora" do pedido aguardando pagamento online (Mercado Pago). */
export function OnlinePayButton({ storeId, orderId, customerToken, onPaid }: Props) {
  const [loading, setLoading] = useState(false);
  const pay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    const r = await startOrderPayment({ storeId, orderId, customerToken, returnUrl: window.location.href.split('?')[0] });
    if (r.kind === 'redirect') {
      window.location.href = r.url;
      return;
    }
    setLoading(false);
    if (r.kind === 'paid') {
      toast.success('Pagamento confirmado!');
      onPaid?.();
    } else if (r.kind === 'failed') {
      toast.error(r.message);
    }
  };
  return (
    <Button size="sm" className="mt-2 gap-1.5 text-xs" onClick={pay} disabled={loading}>
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
      Pagar agora (Pix ou cartão)
    </Button>
  );
}
