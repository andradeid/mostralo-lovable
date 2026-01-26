import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, Package, RefreshCw } from 'lucide-react';

interface ImportResult {
  success: boolean;
  summary: {
    productsCreated?: number;
    variantsCreated?: number;
    categoriesCreated?: number;
    errors: number;
  };
  errors?: { row: number; message: string }[];
}

interface ImportResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: ImportResult | null;
  onReset: () => void;
  onNavigateToProducts: () => void;
}

export function ImportResultsDialog({
  open,
  onOpenChange,
  result,
  onReset,
  onNavigateToProducts,
}: ImportResultsDialogProps) {
  if (!result) return null;

  const hasErrors = result.summary.errors > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasErrors ? (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            {hasErrors ? 'Importação Parcial' : 'Importação Concluída!'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Success Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-600">
                {result.summary.productsCreated || 0}
              </p>
              <p className="text-sm text-muted-foreground">Produtos criados</p>
            </div>
            <div className="border rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {result.summary.variantsCreated || 0}
              </p>
              <p className="text-sm text-muted-foreground">Variantes</p>
            </div>
          </div>

          {hasErrors && (
            <div className="border border-yellow-200 rounded-lg p-3 bg-yellow-50">
              <p className="text-sm text-yellow-800">
                {result.summary.errors} produtos não foram importados devido a erros.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={onReset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Nova Importação
          </Button>
          <Button onClick={onNavigateToProducts}>
            <Package className="mr-2 h-4 w-4" />
            Ver Produtos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
