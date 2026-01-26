import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, Loader2, Package, FolderTree, Layers } from 'lucide-react';
import { ProductWithVariants } from '@/lib/parseSpreadsheet';

interface ValidationResult {
  missingCategories: string[];
  summary: { totalRows: number };
}

interface ImportConfirmationStepProps {
  products: ProductWithVariants[];
  validationResult: ValidationResult | null;
  createMissingCategories: boolean;
  fileName: string;
  isImporting: boolean;
  onBack: () => void;
  onImport: () => void;
}

export function ImportConfirmationStep({
  products,
  validationResult,
  createMissingCategories,
  fileName,
  isImporting,
  onBack,
  onImport,
}: ImportConfirmationStepProps) {
  const totalVariants = products.reduce((acc, p) => acc + (p.variantes?.length || 0), 0);
  const newCategories = validationResult?.missingCategories?.length || 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 text-center">
          <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{products.length}</p>
          <p className="text-sm text-muted-foreground">Produtos</p>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <Layers className="h-8 w-8 mx-auto mb-2 text-blue-500" />
          <p className="text-2xl font-bold">{totalVariants}</p>
          <p className="text-sm text-muted-foreground">Variantes</p>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <FolderTree className="h-8 w-8 mx-auto mb-2 text-green-500" />
          <p className="text-2xl font-bold">{newCategories}</p>
          <p className="text-sm text-muted-foreground">Novas Categorias</p>
        </div>
      </div>

      {/* File Info */}
      <div className="border rounded-lg p-4 bg-muted/30">
        <p className="text-sm text-muted-foreground">Arquivo:</p>
        <p className="font-medium">{fileName}</p>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isImporting}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button onClick={onImport} disabled={isImporting} size="lg">
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importando...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Importar Produtos
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
