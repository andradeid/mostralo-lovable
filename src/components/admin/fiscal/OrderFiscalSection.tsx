// Detalhe do pedido: notas fiscais do pedido e botão "Emitir NF-e" (só com NF-e ligada na loja).
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileText } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useFiscalFlags } from '@/hooks/fiscal/useFiscalSettings';
import { useFiscalDocuments } from '@/hooks/fiscal/useFiscalDocuments';
import { canEmit, currentDocument } from '@/lib/fiscal/documents';
import { FiscalDocumentList } from './FiscalDocumentList';
import { NfeEmitDialog } from './NfeEmitDialog';

interface OrderLike {
  id: string;
  store_id: string;
  status: string;
  customer_name: string | null;
  customer_email: string | null;
}

export function OrderFiscalSection({ order }: { order: OrderLike }) {
  const flags = useFiscalFlags(order.store_id);
  const { userRole } = useAuth();
  const api = useFiscalDocuments({ orderId: order.id }, flags.nfe);
  const [open, setOpen] = useState(false);
  if (!flags.nfe) return null;

  const current = currentDocument(api.docs, 'nfe');
  const showEmit = order.status !== 'cancelado' && canEmit(current);

  return (
    <>
    <Separator />
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-lg flex items-center gap-2"><FileText className="h-5 w-5" />Nota fiscal</h3>
        {showEmit && (
          <Button size="sm" onClick={() => setOpen(true)}>{current ? 'Emitir NF-e de novo' : 'Emitir NF-e'}</Button>
        )}
      </div>
      {!api.docs.length && <p className="text-sm text-muted-foreground">Nenhuma nota emitida para este pedido.</p>}
      <FiscalDocumentList api={api} canCancel={userRole === 'store_admin' || userRole === 'master_admin'} />
      <NfeEmitDialog
        open={open}
        onOpenChange={setOpen}
        storeId={order.store_id}
        orderId={order.id}
        initial={{ name: order.customer_name ?? '', email: order.customer_email ?? '' }}
        api={api}
      />
    </div>
    </>
  );
}
