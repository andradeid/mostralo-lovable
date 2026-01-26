import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, ArrowRight, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { ProductWithVariants } from '@/lib/parseSpreadsheet';

interface ValidationResult {
  success: boolean;
  errors: { row: number; field: string; message: string }[];
  missingCategories: string[];
  summary: { totalRows: number; validProducts?: number; errors: number; newCategories?: number };
}

interface PreviewValidationStepProps {
  products: ProductWithVariants[];
  validationResult: ValidationResult | null;
  isValidating: boolean;
  createMissingCategories: boolean;
  onCreateMissingCategoriesChange: (value: boolean) => void;
  onValidate: () => void;
  onBack: () => void;
  onNext: () => void;
}

export function PreviewValidationStep({
  products,
  validationResult,
  isValidating,
  createMissingCategories,
  onCreateMissingCategoriesChange,
  onValidate,
  onBack,
  onNext,
}: PreviewValidationStepProps) {
  const canProceed = validationResult?.success || (validationResult && validationResult.errors.length === 0);

  return (
    <div className="space-y-6">
      {/* Options */}
      <div className="flex items-center space-x-2 p-4 border rounded-lg bg-muted/30">
        <Switch
          id="create-categories"
          checked={createMissingCategories}
          onCheckedChange={onCreateMissingCategoriesChange}
        />
        <Label htmlFor="create-categories">
          Criar categorias que não existem automaticamente
        </Label>
      </div>

      {/* Preview Table */}
      <div className="border rounded-lg overflow-auto max-h-[300px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Variantes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.slice(0, 20).map((product, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{product.nome}</TableCell>
                <TableCell>{product.categoria}</TableCell>
                <TableCell>R$ {product.preco?.toFixed(2)}</TableCell>
                <TableCell>
                  {product.variantes?.length ? (
                    <Badge variant="secondary">{product.variantes.length}</Badge>
                  ) : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {products.length > 20 && (
        <p className="text-sm text-muted-foreground text-center">
          Mostrando 20 de {products.length} produtos
        </p>
      )}

      {/* Validation Button */}
      <Button onClick={onValidate} disabled={isValidating} className="w-full">
        {isValidating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Validando...
          </>
        ) : (
          'Validar Produtos'
        )}
      </Button>

      {/* Validation Results */}
      {validationResult && (
        <div className="space-y-4">
          {validationResult.success ? (
            <Alert className="border-primary/20 bg-primary/5">
              <CheckCircle className="h-4 w-4 text-primary" />
              <AlertDescription className="text-foreground">
                Todos os {validationResult.summary.totalRows} produtos estão válidos!
                {validationResult.missingCategories.length > 0 && (
                  <> Serão criadas {validationResult.missingCategories.length} novas categorias.</>
                )}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {validationResult.errors.length} erros encontrados. Corrija a planilha.
              </AlertDescription>
            </Alert>
          )}

          {validationResult.errors.length > 0 && (
            <div className="border rounded-lg p-4 max-h-[150px] overflow-auto">
              <p className="font-medium mb-2">Erros:</p>
              <ul className="text-sm text-destructive space-y-1">
                {validationResult.errors.slice(0, 10).map((err, i) => (
                  <li key={i}>Linha {err.row}: {err.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button onClick={onNext} disabled={!canProceed}>
          Próximo
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
