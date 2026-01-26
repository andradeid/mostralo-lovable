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
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { useSystemFinanceImportRevenue, ImportRevenueSources } from '@/hooks/useSystemFinanceImportRevenue';
import { CreditCard, FileText, CheckCircle } from 'lucide-react';

interface SystemRevenueImportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SystemRevenueImportDialog({ open, onClose }: SystemRevenueImportDialogProps) {
  const { importRevenue, isImporting, lastResult } = useSystemFinanceImportRevenue();

  const defaultEnd = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const defaultStart = useMemo(
    () => format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    []
  );

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [dryRun, setDryRun] = useState(false);
  const [sources, setSources] = useState<ImportRevenueSources>({
    subscription_invoices: true,
    external_invoices: true,
    payment_approvals: true,
  });

  useEffect(() => {
    if (!open) return;
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
    setDryRun(false);
    setSources({
      subscription_invoices: true,
      external_invoices: true,
      payment_approvals: true,
    });
  }, [open, defaultStart, defaultEnd]);

  useEffect(() => {
    if (!lastResult) return;
    if (open && !lastResult.dryRun) {
      onClose();
    }
  }, [lastResult, open, onClose]);

  const handleImport = () => {
    importRevenue({ startDate, endDate, dryRun, sources });
  };

  const atLeastOneSourceSelected =
    sources.subscription_invoices || sources.external_invoices || sources.payment_approvals;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar receitas automáticas</DialogTitle>
          <DialogDescription>
            Vai buscar pagamentos confirmados e criar lançamentos de receita no Financeiro do Sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start-date">Data inicial</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end-date">Data final</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border p-3 space-y-3">
            <p className="text-sm font-medium">Fontes de receita</p>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={sources.subscription_invoices}
                  onCheckedChange={(checked) =>
                    setSources((s) => ({ ...s, subscription_invoices: !!checked }))
                  }
                />
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Assinaturas (pagamentos de planos)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={sources.external_invoices}
                  onCheckedChange={(checked) =>
                    setSources((s) => ({ ...s, external_invoices: !!checked }))
                  }
                />
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Faturas externas (clientes externos)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={sources.payment_approvals}
                  onCheckedChange={(checked) =>
                    setSources((s) => ({ ...s, payment_approvals: !!checked }))
                  }
                />
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Approvals (comprovantes aprovados)</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Simular (dry run)</p>
              <p className="text-xs text-muted-foreground">
                Não grava no banco, apenas calcula quantos lançamentos seriam importados.
              </p>
            </div>
            <Switch checked={dryRun} onCheckedChange={setDryRun} aria-label="Ativar simulação" />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isImporting}>
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={isImporting || !startDate || !endDate || !atLeastOneSourceSelected}
          >
            {dryRun ? 'Simular importação' : 'Importar receitas'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}