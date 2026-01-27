import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  Package, 
  RefreshCw, 
  Copy,
  AlertTriangle,
  Sparkles
} from 'lucide-react';

export type DuplicateAction = 'skip' | 'update' | 'create';

export interface ImageOptions {
  updateFromSpreadsheet: boolean;
  searchMissing: boolean;
  replaceAll: boolean;
}

export interface DuplicateCheckResult {
  newProducts: number;
  existingProducts: number;
  duplicates: Array<{
    productName: string;
    category: string;
    existingId: string;
    existingPrice: number;
    newPrice: number;
  }>;
}

interface DuplicateAnalysisStepProps {
  isChecking: boolean;
  checkResult: DuplicateCheckResult | null;
  duplicateAction: DuplicateAction;
  imageOptions: ImageOptions;
  onDuplicateActionChange: (action: DuplicateAction) => void;
  onImageOptionsChange: (options: ImageOptions) => void;
  onBack: () => void;
  onNext: () => void;
}

export function DuplicateAnalysisStep({
  isChecking,
  checkResult,
  duplicateAction,
  imageOptions,
  onDuplicateActionChange,
  onImageOptionsChange,
  onBack,
  onNext,
}: DuplicateAnalysisStepProps) {
  const [showDuplicatesList, setShowDuplicatesList] = useState(false);

  if (isChecking) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium">Analisando duplicatas...</p>
        <p className="text-sm text-muted-foreground">
          Verificando produtos existentes na loja
        </p>
      </div>
    );
  }

  if (!checkResult) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">Erro ao verificar duplicatas</p>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  const totalProducts = checkResult.newProducts + checkResult.existingProducts;
  const hasExisting = checkResult.existingProducts > 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 text-center">
          <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-2xl font-bold">{totalProducts}</p>
          <p className="text-sm text-muted-foreground">Total na Planilha</p>
        </div>
        <div className="border rounded-lg p-4 text-center bg-primary/10">
          <Sparkles className="h-8 w-8 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold text-primary">{checkResult.newProducts}</p>
          <p className="text-sm text-muted-foreground">Novos Produtos</p>
        </div>
        <div className={`border rounded-lg p-4 text-center ${hasExisting ? 'bg-destructive/10' : ''}`}>
          <Copy className="h-8 w-8 mx-auto mb-2 text-destructive" />
          <p className={`text-2xl font-bold ${hasExisting ? 'text-destructive' : ''}`}>
            {checkResult.existingProducts}
          </p>
          <p className="text-sm text-muted-foreground">Já Existentes</p>
        </div>
      </div>

      {/* Duplicate Action Selection */}
      {hasExisting && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-medium">
              Como tratar os {checkResult.existingProducts} produtos existentes?
            </h3>
          </div>

          <RadioGroup
            value={duplicateAction}
            onValueChange={(value) => onDuplicateActionChange(value as DuplicateAction)}
            className="space-y-3"
          >
            <div className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="skip" id="skip" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="skip" className="font-medium cursor-pointer">
                  Pular (Importar apenas novos)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Importa apenas os {checkResult.newProducts} produtos novos. 
                  Produtos existentes serão ignorados.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-muted/50 cursor-pointer border-primary bg-primary/5">
              <RadioGroupItem value="update" id="update" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="update" className="font-medium cursor-pointer">
                  Atualizar existentes + criar novos
                </Label>
                <p className="text-sm text-muted-foreground">
                  Atualiza preço, descrição e estoque dos {checkResult.existingProducts} existentes 
                  e cria os {checkResult.newProducts} novos.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="create" id="create" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="create" className="font-medium cursor-pointer">
                  Criar mesmo assim (pode gerar duplicatas)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Importa todos os {totalProducts} produtos, mesmo que já existam. 
                  Use com cuidado.
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>
      )}

      {/* Image Options */}
      {(duplicateAction === 'update' || !hasExisting) && (
        <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
          <h4 className="font-medium flex items-center gap-2">
            🖼️ Opções de Imagem
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="updateFromSpreadsheet"
                checked={imageOptions.updateFromSpreadsheet}
                onCheckedChange={(checked) =>
                  onImageOptionsChange({
                    ...imageOptions,
                    updateFromSpreadsheet: checked === true,
                  })
                }
              />
              <Label htmlFor="updateFromSpreadsheet" className="text-sm cursor-pointer">
                Atualizar imagens quando a planilha trouxer nova URL
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="searchMissing"
                checked={imageOptions.searchMissing}
                onCheckedChange={(checked) =>
                  onImageOptionsChange({
                    ...imageOptions,
                    searchMissing: checked === true,
                  })
                }
              />
              <Label htmlFor="searchMissing" className="text-sm cursor-pointer">
                Buscar imagens automaticamente para produtos SEM imagem
              </Label>
            </div>

            {duplicateAction === 'update' && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="replaceAll"
                  checked={imageOptions.replaceAll}
                  onCheckedChange={(checked) =>
                    onImageOptionsChange({
                      ...imageOptions,
                      replaceAll: checked === true,
                    })
                  }
                />
                <Label htmlFor="replaceAll" className="text-sm cursor-pointer text-destructive">
                  Substituir TODAS as imagens dos produtos atualizados
                </Label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Duplicates List Toggle */}
      {hasExisting && checkResult.duplicates.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <button
            onClick={() => setShowDuplicatesList(!showDuplicatesList)}
            className="w-full px-4 py-3 flex items-center justify-between bg-muted/50 hover:bg-muted transition-colors"
          >
            <span className="font-medium">
              Ver lista de produtos existentes ({checkResult.existingProducts})
            </span>
            <ArrowRight className={`h-4 w-4 transition-transform ${showDuplicatesList ? 'rotate-90' : ''}`} />
          </button>
          
          {showDuplicatesList && (
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left">Produto</th>
                    <th className="px-4 py-2 text-left">Categoria</th>
                    <th className="px-4 py-2 text-right">Preço Atual</th>
                    <th className="px-4 py-2 text-right">Novo Preço</th>
                  </tr>
                </thead>
                <tbody>
                  {checkResult.duplicates.slice(0, 50).map((dup, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-2">{dup.productName}</td>
                      <td className="px-4 py-2 text-muted-foreground">{dup.category}</td>
                      <td className="px-4 py-2 text-right">
                        R$ {dup.existingPrice.toFixed(2)}
                      </td>
                      <td className={`px-4 py-2 text-right ${
                        dup.newPrice !== dup.existingPrice ? 'text-destructive font-medium' : ''
                      }`}>
                        R$ {dup.newPrice.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {checkResult.duplicates.length > 50 && (
                <p className="px-4 py-2 text-sm text-muted-foreground text-center border-t">
                  ... e mais {checkResult.duplicates.length - 50} produtos
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button onClick={onNext}>
          Continuar
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
