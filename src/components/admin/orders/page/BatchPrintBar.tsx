// Barra de impressão em lote (aparece com pedidos selecionados). JSX movido da OrdersPage sem mudança.
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  selectedCount: number;
  onToggleSelectAll: () => void;
  onClear: () => void;
  onPrint: () => void;
  isPrinting: boolean;
}

export function BatchPrintBar({ selectedCount, onToggleSelectAll, onClear, onPrint, isPrinting }: Props) {
  return (
    <div className="flex flex-col gap-0">

      {/* Impressão em Lote - sempre visível */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-3">
            <Printer className="h-5 w-5 text-primary" />
            <span className="font-medium">
              {selectedCount} pedido(s) selecionado(s)
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSelectAll}
            >
              Selecionar Todos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
            >
              Limpar
            </Button>
            <Button
              size="sm"
              onClick={onPrint}
              disabled={isPrinting}
            >
              <Printer className="h-4 w-4 mr-2" />
              {isPrinting ? 'Imprimindo...' : 'Imprimir Selecionados'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
