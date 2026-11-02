// Lista das notas de uma venda/pedido: status, número, erro da SEFAZ e ações
// (abrir DANFE em nova aba, atualizar status, cancelar dentro do prazo).
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileCode, RefreshCw, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { brl } from '@/lib/brl';
import { cancelMinutesLeft, DOC_TYPE_LABEL, formatCpfCnpj, type FiscalDocument } from '@/lib/fiscal/documents';
import type { useFiscalDocuments } from '@/hooks/fiscal/useFiscalDocuments';
import { EnvironmentBadge, FiscalStatusBadge } from './FiscalStatusBadge';
import { FiscalCancelDialog } from './FiscalCancelDialog';

type DocsApi = ReturnType<typeof useFiscalDocuments>;

export function FiscalDocumentList({ api, canCancel }: { api: DocsApi; canCancel: boolean }) {
  const [cancelDoc, setCancelDoc] = useState<FiscalDocument | null>(null);
  const now = new Date();
  if (!api.docs.length) return null;

  const refresh = async (doc: FiscalDocument) => {
    const r = await api.refresh.mutateAsync(doc.id);
    if (r.message) toast.error(r.message);
    else if (r.warning) toast.info(r.warning);
  };
  const confirmCancel = async (justificativa: string) => {
    if (!cancelDoc) return;
    const r = await api.cancel.mutateAsync({ documentId: cancelDoc.id, justificativa });
    if (r.message) toast.error(r.message);
    else {
      toast.success('Nota cancelada');
      setCancelDoc(null);
    }
  };

  return (
    <div className="space-y-2">
      {api.docs.map((d) => {
        const left = cancelMinutesLeft(d, now);
        return (
          <div key={d.id} className="rounded-md border p-3 text-sm space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{DOC_TYPE_LABEL[d.doc_type]}</span>
              {d.numero && <span className="text-muted-foreground">nº {d.numero}{d.serie ? ` · série ${d.serie}` : ''}</span>}
              <FiscalStatusBadge status={d.status} />
              <EnvironmentBadge environment={d.environment} />
              {d.contingencia && <span className="text-xs text-amber-700">Emitida em contingência</span>}
            </div>
            <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3">
              <span>{format(new Date(d.created_at), 'dd/MM/yyyy HH:mm')}</span>
              {d.total !== null && <span>{brl(Number(d.total))}</span>}
              {d.recipient_document && <span>{formatCpfCnpj(d.recipient_document)}</span>}
            </div>
            {(d.status === 'erro' || d.status === 'denegado') && d.error_message && (
              <p className="text-xs text-destructive">{d.error_message}</p>
            )}
            {d.status === 'processando' && d.error_message && <p className="text-xs text-amber-700">{d.error_message}</p>}
            {d.status === 'cancelado' && d.cancel_justificativa && (
              <p className="text-xs text-muted-foreground">Motivo: {d.cancel_justificativa}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {d.danfe_url && d.status !== 'erro' && (
                <Button asChild size="sm" variant={d.status === 'autorizado' ? 'default' : 'outline'}>
                  <a href={d.danfe_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    {d.doc_type === 'nfce' ? 'Abrir cupom (DANFE)' : 'Abrir DANFE'}
                  </a>
                </Button>
              )}
              {d.xml_url && d.status === 'autorizado' && (
                <Button asChild size="sm" variant="outline">
                  <a href={d.xml_url} target="_blank" rel="noopener noreferrer"><FileCode className="h-4 w-4 mr-1" />XML</a>
                </Button>
              )}
              {d.status === 'processando' && (
                <Button size="sm" variant="outline" disabled={api.refresh.isPending} onClick={() => refresh(d)}>
                  <RefreshCw className={`h-4 w-4 mr-1 ${api.refresh.isPending ? 'animate-spin' : ''}`} />
                  Atualizar status
                </Button>
              )}
              {canCancel && left !== null && (
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setCancelDoc(d)}>
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        );
      })}
      <FiscalCancelDialog
        doc={cancelDoc}
        minutesLeft={cancelDoc ? cancelMinutesLeft(cancelDoc, now) : null}
        open={!!cancelDoc}
        onOpenChange={(o) => !o && setCancelDoc(null)}
        onConfirm={confirmCancel}
        busy={api.cancel.isPending}
      />
    </div>
  );
}
