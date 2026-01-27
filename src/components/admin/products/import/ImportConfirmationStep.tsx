import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, Loader2, Package, FolderTree, Layers, RefreshCw, SkipForward } from 'lucide-react';
import { ProductWithVariants } from '@/lib/parseSpreadsheet';
import { DuplicateCheckResult, DuplicateAction } from '@/hooks/useProductImport';

interface ValidationResult {
  missingCategories: string[];
  summary: { totalRows: number };
}

interface ImportConfirmationStepProps {
  products: ProductWithVariants[];
  validationResult: ValidationResult | null;
  duplicateCheckResult: DuplicateCheckResult | null;
  duplicateAction: DuplicateAction;
  createMissingCategories: boolean;
  fileName: string;
  isImporting: boolean;
  onBack: () => void;
  onImport: () => void;
}

export function ImportConfirmationStep({
  products,
  validationResult,
  duplicateCheckResult,
  duplicateAction,
  fileName,
  isImporting,
  onBack,
  onImport,
}: ImportConfirmationStepProps) {
  const totalVariants = products.reduce((acc, p) => acc + (p.variantes?.length || 0), 0);
  const newCategories = validationResult?.missingCategories?.length || 0;
  
  const newProducts = duplicateCheckResult?.newProducts || products.length;
  const existingProducts = duplicateCheckResult?.existingProducts || 0;

  // Calculate what will happen based on duplicate action
  const getActionSummary = () => {
    if (!duplicateCheckResult || existingProducts === 0) {
      return {
        toCreate: products.length,
        toUpdate: 0,
        toSkip: 0,
      };
    }

    switch (duplicateAction) {
      case 'skip':
        return {
          toCreate: newProducts,
          toUpdate: 0,
          toSkip: existingProducts,
        };
      case 'update':
        return {
          toCreate: newProducts,
          toUpdate: existingProducts,
          toSkip: 0,
        };
      case 'create':
      default:
        return {
          toCreate: products.length,
          toUpdate: 0,
          toSkip: 0,
        };
    }
  };

  const summary = getActionSummary();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 text-center bg-primary/10">
          <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold text-primary">{summary.toCreate}</p>
          <p className="text-sm text-muted-foreground">A Criar</p>
        </div>
        {summary.toUpdate > 0 && (
          <div className="border rounded-lg p-4 text-center bg-secondary/50">
            <RefreshCw className="h-8 w-8 mx-auto mb-2 text-secondary-foreground" />
            <p className="text-2xl font-bold">{summary.toUpdate}</p>
            <p className="text-sm text-muted-foreground">A Atualizar</p>
          </div>
        )}
        {summary.toSkip > 0 && (
          <div className="border rounded-lg p-4 text-center bg-muted">
            <SkipForward className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold text-muted-foreground">{summary.toSkip}</p>
            <p className="text-sm text-muted-foreground">A Pular</p>
          </div>
        )}
        <div className="border rounded-lg p-4 text-center">
          <Layers className="h-8 w-8 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{totalVariants}</p>
          <p className="text-sm text-muted-foreground">Variantes</p>
        </div>
        {newCategories > 0 && (
          <div className="border rounded-lg p-4 text-center">
            <FolderTree className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{newCategories}</p>
            <p className="text-sm text-muted-foreground">Novas Categorias</p>
          </div>
        )}
      </div>

      {/* Action Summary */}
      <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
        <p className="text-sm font-medium">Resumo da ação:</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          {summary.toCreate > 0 && (
            <li>• {summary.toCreate} produtos serão <span className="font-medium text-primary">criados</span></li>
          )}
          {summary.toUpdate > 0 && (
            <li>• {summary.toUpdate} produtos serão <span className="font-medium">atualizados</span> (preço, descrição, estoque)</li>
          )}
          {summary.toSkip > 0 && (
            <li>• {summary.toSkip} produtos serão <span className="font-medium text-muted-foreground">pulados</span> (já existentes)</li>
          )}
          {newCategories > 0 && (
            <li>• {newCategories} categorias serão criadas automaticamente</li>
          )}
        </ul>
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
