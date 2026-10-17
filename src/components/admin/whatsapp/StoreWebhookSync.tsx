import { useState } from 'react';
import { CheckCircle, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { syncAllStoreWebhooks, type StoreWebhookSyncResult } from '@/lib/syncStoreWebhooks';
import { toast } from 'sonner';

export function StoreWebhookSync() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<StoreWebhookSyncResult[]>([]);

  const synchronize = async () => {
    setRunning(true);
    setResults([]);
    try {
      const completed = await syncAllStoreWebhooks(setResults);
      const failed = completed.filter(result => !result.success).length;
      if (failed) toast.warning(`${failed} instância(s) não puderam ser sincronizadas.`);
      else toast.success(completed.length ? 'Webhooks das lojas sincronizados.' : 'Nenhuma instância de loja cadastrada.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao sincronizar webhooks.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className="space-y-3" aria-label="Sincronização dos webhooks das lojas">
      <Button variant="outline" onClick={synchronize} disabled={running} className="h-auto min-h-10 whitespace-normal text-left">
        {running ? <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4 shrink-0" />}
        Sincronizar webhooks de todas as lojas
      </Button>
      {results.length > 0 && (
        <ul className="max-h-72 overflow-y-auto divide-y divide-border" aria-live="polite">
          {results.map(result => (
            <li key={`${result.storeId}:${result.instanceName}`} className="flex items-start gap-2 py-2 text-sm">
              {result.success ? <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />}
              <div className="min-w-0 break-words">
                <span className="font-medium">{result.storeName}</span>
                <p className="text-xs text-muted-foreground">
                  {result.success ? (result.events?.includes('messages') ? 'Central: eventos sincronizados' : 'Somente disparos: conexão sincronizada') : result.message}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}