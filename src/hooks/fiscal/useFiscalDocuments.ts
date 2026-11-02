// Notas fiscais de uma venda (comanda do PDV) ou de um pedido: lista (atualiza a cada 5 s enquanto
// alguma está processando — leitura do banco, o webhook da Focus é quem muda) e ações pelas funções fiscal-*.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { FiscalDocument } from '@/lib/fiscal/documents';
import { cancelFiscal, emitFiscal, refreshFiscal, type EmitBody } from '@/lib/fiscal/fiscalApi';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const COLUMNS =
  'id, store_id, doc_type, environment, comanda_id, order_id, ref, attempt, status, status_sefaz, mensagem_sefaz, numero, ' +
  'serie, chave, protocolo, danfe_url, xml_url, contingencia, error_message, total, recipient_document, recipient_name, ' +
  'cancel_justificativa, created_at, updated_at, authorized_at, cancelled_at';

export interface FiscalSource {
  comandaId?: string | null;
  orderId?: string | null;
}

export const fiscalDocsKey = (s: FiscalSource) => ['fiscal-documents', s.comandaId ?? null, s.orderId ?? null] as const;

export function useFiscalDocuments(source: FiscalSource, enabled = true) {
  const qc = useQueryClient();
  const key = fiscalDocsKey(source);
  const hasSource = !!(source.comandaId || source.orderId);

  const docs = useQuery({
    queryKey: key,
    queryFn: async (): Promise<FiscalDocument[]> => {
      let q = db.from('fiscal_documents').select(COLUMNS).order('created_at', { ascending: false });
      q = source.comandaId ? q.eq('comanda_id', source.comandaId) : q.eq('order_id', source.orderId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as FiscalDocument[];
    },
    enabled: enabled && hasSource,
    retry: false,
    refetchInterval: (query) =>
      ((query.state.data as FiscalDocument[] | undefined) ?? []).some((d) => d.status === 'processando') ? 5000 : false,
  });

  const settle = () => qc.invalidateQueries({ queryKey: key });

  const emit = useMutation({ mutationFn: (body: EmitBody) => emitFiscal(body), onSettled: settle });
  const refresh = useMutation({ mutationFn: (documentId: string) => refreshFiscal(documentId), onSettled: settle });
  const cancel = useMutation({
    mutationFn: ({ documentId, justificativa }: { documentId: string; justificativa: string }) => cancelFiscal(documentId, justificativa),
    onSettled: settle,
  });

  return { docs: docs.data ?? [], loading: docs.isLoading, emit, refresh, cancel };
}
