// Cupom fiscal de uma venda do PDV: CPF opcional, emitir NFC-e, status (processando → autorizada)
// e botão para abrir o DANFE em nova aba (sem imprimir sozinho). CNPJ → NF-e (pede endereço).
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Receipt } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useFiscalFlags } from '@/hooks/fiscal/useFiscalSettings';
import { useFiscalDocuments } from '@/hooks/fiscal/useFiscalDocuments';
import { canEmit, currentDocument, nfceDocumentHint, onlyDigits } from '@/lib/fiscal/documents';
import { FiscalDocumentList } from '@/components/admin/fiscal/FiscalDocumentList';
import { EnvironmentBadge } from '@/components/admin/fiscal/FiscalStatusBadge';
import { NfeEmitDialog } from '@/components/admin/fiscal/NfeEmitDialog';

export function ComandaFiscalPanel({ storeId, comandaId, customerName }: {
  storeId: string; comandaId: string; customerName?: string | null;
}) {
  const flags = useFiscalFlags(storeId);
  const { userRole } = useAuth();
  const api = useFiscalDocuments({ comandaId }, flags.nfce || flags.nfe);
  const [doc, setDoc] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [nfeOpen, setNfeOpen] = useState(false);
  if (!flags.nfce && !flags.nfe) return null;

  const nfce = currentDocument(api.docs, 'nfce');
  const nfe = currentDocument(api.docs, 'nfe');
  const hasLiveNote = (nfce && !canEmit(nfce)) || (nfe && !canEmit(nfe));
  const hint = nfceDocumentHint(doc);

  const emitNfce = async () => {
    setErrors([]);
    const r = await api.emit.mutateAsync({ store_id: storeId, tipo: 'nfce', comanda_id: comandaId, cpf_cnpj: onlyDigits(doc) || null });
    if (!r.document) {
      setErrors(r.errors.length ? r.errors : [r.message ?? 'Não foi possível emitir.']);
      return;
    }
    if (r.document.status === 'autorizado') toast.success('Cupom fiscal autorizado. Abra o cupom para imprimir.');
    else if (r.document.status === 'erro') toast.error(r.document.error_message ?? 'A SEFAZ recusou o cupom.');
    else toast.info(r.warning ?? 'Cupom enviado. Aguardando a SEFAZ…');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Receipt className="h-4 w-4" />
        <span className="font-medium">Nota fiscal</span>
        <EnvironmentBadge environment={flags.environment} />
      </div>

      {!hasLiveNote && flags.nfce && (
        <div className="space-y-2">
          <Label htmlFor={`cpf-${comandaId}`}>CPF na nota (opcional)</Label>
          <div className="flex gap-2">
            <Input id={`cpf-${comandaId}`} inputMode="numeric" autoComplete="off" placeholder="Somente se o cliente pedir"
              value={doc} onChange={(e) => setDoc(e.target.value)} />
            {hint.kind === 'cnpj' ? (
              <Button onClick={() => setNfeOpen(true)} disabled={!flags.nfe}>Emitir NF-e</Button>
            ) : (
              <Button onClick={emitNfce} disabled={api.emit.isPending || hint.kind === 'invalid'}>
                {api.emit.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Emitir cupom fiscal
              </Button>
            )}
          </div>
          <p className={`text-xs ${hint.kind === 'invalid' ? 'text-destructive' : 'text-muted-foreground'}`}>
            {hint.kind === 'cnpj' && !flags.nfe ? 'Para CNPJ é preciso NF-e. Ligue a NF-e nas configurações fiscais.' : hint.message}
          </p>
        </div>
      )}
      {!hasLiveNote && !flags.nfce && flags.nfe && (
        <Button variant="outline" onClick={() => setNfeOpen(true)}>Emitir NF-e</Button>
      )}

      {errors.length > 0 && (
        <ul className="text-sm text-destructive list-disc pl-5 space-y-1">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
      )}

      <FiscalDocumentList api={api} canCancel={userRole === 'store_admin' || userRole === 'master_admin'} />

      {flags.nfe && (
        <NfeEmitDialog open={nfeOpen} onOpenChange={setNfeOpen} storeId={storeId} comandaId={comandaId} api={api}
          initial={{ document: doc, name: customerName ?? '' }} />
      )}
    </div>
  );
}
