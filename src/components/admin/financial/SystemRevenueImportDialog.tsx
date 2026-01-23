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

  useEffect(() => {
    if (!open) return;
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
    setDryRun(false);
  }, [open, defaultStart, defaultEnd]);

  useEffect(() => {
    if (!lastResult) return;
    if (open && !lastResult.dryRun) {
      onClose();
    }
  }, [lastResult, open, onClose]);

  const handleImport = () => {
    importRevenue({ startDate, endDate, dryRun });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar receitas automáticas</DialogTitle>
          <DialogDescription>
            Vai buscar pagamentos confirmados (assinaturas, faturas externas e approvals) e criar lançamentos de receita no
            Financeiro do Sistema.
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
          <Button onClick={handleImport} disabled={isImporting || !startDate || !endDate}>
            {dryRun ? 'Simular importação' : 'Importar receitas'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
