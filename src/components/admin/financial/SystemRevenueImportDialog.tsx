import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { useSystemFinanceImportRevenue } from '@/hooks/useSystemFinanceImportRevenue';
import { CreditCard, FileText } from 'lucide-react';

interface SystemRevenueImportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SystemRevenueImportDialog({ open, onClose }: SystemRevenueImportDialogProps) {
  const { importRevenue, isImporting, lastResult } = useSystemFinanceImportRevenue();

  const defaultSince = useMemo(
    () => format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'),
    []
  );

  const [since, setSince] = useState(defaultSince);
  const [dryRun, setDryRun] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSince(defaultSince);
    setDryRun(false);
  }, [open, defaultSince]);

  const handleImport = () => {
    importRevenue({ since: since || undefined, dryRun });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar receitas das faturas</DialogTitle>
          <DialogDescription>
            Cria lançamentos de receita a partir dos pagamentos já confirmados. Pode ser executado
            quantas vezes quiser — nada é duplicado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border p-3 space-y-2">
            <p className="text-sm font-medium">O que é importado</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              Assinaturas pagas de lojas com cobrança habilitada
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              Faturas pagas de serviços externos
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="since-date">Considerar pagamentos a partir de</Label>
            <Input
              id="since-date"
              type="date"
              value={since}
              onChange={(e) => setSince(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Deixe em branco para importar todo o histórico.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Simular (dry run)</p>
              <p className="text-xs text-muted-foreground">
                Não grava nada, apenas mostra quantos lançamentos seriam criados.
              </p>
            </div>
            <Switch checked={dryRun} onCheckedChange={setDryRun} aria-label="Ativar simulação" />
          </div>

          {lastResult && (
            <div className="rounded-md border bg-muted/40 p-3 space-y-1 text-sm">
              <p className="font-medium">
                {lastResult.dryRun ? 'Resultado da simulação' : 'Resultado da importação'}
              </p>
              <p className="text-muted-foreground">
                {lastResult.dryRun
                  ? `${lastResult.toCreate} lançamento(s) seriam criados`
                  : `${lastResult.created} lançamento(s) criados`}{' '}
                · {lastResult.skipped} já existiam
              </p>
              <p className="text-xs text-muted-foreground">
                Assinaturas encontradas: {lastResult.found.subscription_invoices} · Serviços
                externos: {lastResult.found.external_invoices}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isImporting}>
            Fechar
          </Button>
          <Button onClick={handleImport} disabled={isImporting}>
            {isImporting ? 'Processando...' : dryRun ? 'Simular importação' : 'Importar receitas'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
