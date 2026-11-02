// Emitir NF-e (pedido, ou venda do PDV para CNPJ): pede o destinatário e manda para a Focus.
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { emptyRecipient, recipientErrors, recipientPayload, type RecipientForm } from '@/lib/fiscal/documents';
import type { useFiscalDocuments } from '@/hooks/fiscal/useFiscalDocuments';
import { RecipientFields } from './RecipientFields';

type DocsApi = ReturnType<typeof useFiscalDocuments>;

export function NfeEmitDialog({ open, onOpenChange, storeId, comandaId, orderId, initial, api, onEmitted }: {
  open: boolean; onOpenChange: (open: boolean) => void; storeId: string;
  comandaId?: string | null; orderId?: string | null; initial?: Partial<RecipientForm>;
  api: DocsApi; onEmitted?: () => void;
}) {
  const [form, setForm] = useState<RecipientForm>(() => emptyRecipient(initial));
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setForm(emptyRecipient(initial));
      setErrors([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async () => {
    const recipient = recipientPayload(form);
    const local = recipientErrors(recipient);
    if (local.length) return setErrors(local);
    const r = await api.emit.mutateAsync({
      store_id: storeId, tipo: 'nfe', comanda_id: comandaId ?? undefined, order_id: orderId ?? undefined, destinatario: recipient,
    });
    if (!r.document) return setErrors(r.errors.length ? r.errors : [r.message ?? 'Não foi possível emitir.']);
    if (r.document.status === 'erro') toast.error(r.document.error_message ?? 'A SEFAZ recusou a nota.');
    else toast.success(r.document.status === 'autorizado' ? 'NF-e autorizada' : 'NF-e enviada. Aguardando a SEFAZ…');
    onOpenChange(false);
    onEmitted?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Emitir NF-e</DialogTitle>
          <DialogDescription>Confira os dados de quem recebe a nota. A NF-e exige endereço completo.</DialogDescription>
        </DialogHeader>
        <RecipientFields value={form} onChange={(p) => setForm((f) => ({ ...f, ...p }))} />
        {errors.length > 0 && (
          <ul className="text-sm text-destructive list-disc pl-5 space-y-1">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={api.emit.isPending}>Voltar</Button>
          <Button onClick={submit} disabled={api.emit.isPending}>
            {api.emit.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Emitir NF-e
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
