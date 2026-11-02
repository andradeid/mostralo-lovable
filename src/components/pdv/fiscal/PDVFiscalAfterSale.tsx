// Depois de fechar venda/comanda no PDV: oferece "Emitir cupom fiscal" (só com NFC-e ligada).
// O PDV avisa por notifyFiscalSaleClosed(comandaId) (src/lib/fiscal/saleEvents.ts).
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFiscalFlags } from '@/hooks/fiscal/useFiscalSettings';
import { onFiscalSaleClosed } from '@/lib/fiscal/saleEvents';
import { ComandaFiscalPanel } from './ComandaFiscalPanel';

export function PDVFiscalAfterSale({ storeId }: { storeId: string | null }) {
  const flags = useFiscalFlags(storeId);
  const [comandaId, setComandaId] = useState<string | null>(null);

  useEffect(() => {
    if (!flags.nfce) return;
    return onFiscalSaleClosed((id) => setComandaId(id));
  }, [flags.nfce]);

  if (!storeId || !flags.nfce) return null;
  return (
    <Dialog open={!!comandaId} onOpenChange={(o) => !o && setComandaId(null)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Venda finalizada</DialogTitle>
          <DialogDescription>Quer emitir o cupom fiscal desta venda?</DialogDescription>
        </DialogHeader>
        {comandaId && <ComandaFiscalPanel storeId={storeId} comandaId={comandaId} />}
        <Button variant="outline" onClick={() => setComandaId(null)}>Fechar</Button>
      </DialogContent>
    </Dialog>
  );
}
