import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { ImageSearchProgress } from './import/ImageSearchProgress';
import { useBulkImageSync, SyncMode, BulkSyncOptions } from '@/hooks/useBulkImageSync';
import { ImagePlus, Loader2, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Category {
  id: string;
  name: string;
}

interface BulkImageSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string | null;
  categories: Category[];
  onComplete?: () => void;
}

export function BulkImageSyncDialog({
  open,
  onOpenChange,
  storeId,
  categories,
  onComplete,
}: BulkImageSyncDialogProps) {
  const [syncMode, setSyncMode] = useState<SyncMode>('all_without_image');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [estimatedCount, setEstimatedCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const [syncLimit, setSyncLimit] = useState<number>(100);

  const {
    isRunning,
    progress,
    startSync,
    cancelSync,
    skipSync,
    getProductsCount,
  } = useBulkImageSync(storeId);

  // Load estimated count when options change
  useEffect(() => {
    if (!open || !storeId) return;

    const loadCount = async () => {
      setIsLoadingCount(true);
      try {
        const options: BulkSyncOptions = {
          mode: syncMode,
          categoryId: syncMode === 'selected_category' ? selectedCategory : undefined,
        };
        const count = await getProductsCount(options);
        setEstimatedCount(count);
      } catch {
        setEstimatedCount(null);
      } finally {
        setIsLoadingCount(false);
      }
    };

    loadCount();
  }, [open, storeId, syncMode, selectedCategory, getProductsCount]);

  // Actual products to sync (limited by slider)
  const actualProductsToSync = estimatedCount !== null 
    ? Math.min(syncLimit, estimatedCount) 
    : 0;

  const handleStartSync = () => {
    const options: BulkSyncOptions = {
      mode: syncMode,
      categoryId: syncMode === 'selected_category' ? selectedCategory : undefined,
      batchSize: 10,
      delayBetweenRequests: 1200, // 1.2 seconds between requests
      limit: syncLimit,
    };
    startSync(options);
  };

  const handleComplete = () => {
    onOpenChange(false);
    onComplete?.();
  };

  const handleCancel = () => {
    cancelSync();
  };

  const handleSkip = () => {
    skipSync();
  };

  // Close dialog handler
  const handleOpenChange = (newOpen: boolean) => {
    if (isRunning && !newOpen) {
      // Don't close while running
      return;
    }
    onOpenChange(newOpen);
  };

  const filteredCategories = categories.filter(c => c.id !== 'uncategorized');

  // Max slider value based on available products
  const maxSliderValue = estimatedCount !== null ? Math.min(1000, estimatedCount) : 1000;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImagePlus className="h-5 w-5 text-primary" />
            Sincronizar Imagens em Massa
          </DialogTitle>
          <DialogDescription>
            Buscar e salvar imagens automaticamente para produtos sem imagem usando a API configurada.
          </DialogDescription>
        </DialogHeader>

        {isRunning ? (
          <div className="space-y-4">
            <ImageSearchProgress
              progress={progress}
              onCancel={handleCancel}
              onSkip={handleSkip}
            />
            
            {progress.current === progress.total && progress.total > 0 && (
              <Button onClick={handleComplete} className="w-full">
                Concluir e Fechar
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Sync Mode Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Como deseja sincronizar?</Label>
              <RadioGroup
                value={syncMode}
                onValueChange={(value) => setSyncMode(value as SyncMode)}
                className="space-y-2"
              >
                <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="all_without_image" id="all_without_image" className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="all_without_image" className="font-medium cursor-pointer">
                      Todos os produtos sem imagem
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Buscar imagens para todos os produtos que não possuem imagem
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="visible_without_image" id="visible_without_image" className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="visible_without_image" className="font-medium cursor-pointer">
                      Apenas produtos visíveis
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Somente produtos ativos e visíveis no cardápio
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="selected_category" id="selected_category" className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="selected_category" className="font-medium cursor-pointer">
                      Por categoria específica
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Sincronizar apenas produtos de uma categoria
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Category Selector */}
            {syncMode === 'selected_category' && (
              <div className="space-y-2">
                <Label>Selecione a categoria</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Quantity Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Quantidade de produtos</Label>
                <span className="text-lg font-bold text-primary">
                  {actualProductsToSync}
                </span>
              </div>
              
              <div className="px-1">
                <Slider
                  value={[syncLimit]}
                  onValueChange={(values) => setSyncLimit(values[0])}
                  min={10}
                  max={maxSliderValue}
                  step={10}
                  className="w-full"
                  disabled={!estimatedCount || estimatedCount === 0}
                />
              </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10</span>
                <span>Arraste para ajustar</span>
                <span>{maxSliderValue}</span>
              </div>

              {/* Quick select buttons */}
              <div className="flex gap-2 flex-wrap">
                {[50, 100, 200, 500].map((value) => (
                  <Button
                    key={value}
                    variant={syncLimit === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSyncLimit(Math.min(value, maxSliderValue))}
                    disabled={!estimatedCount || estimatedCount === 0 || value > maxSliderValue}
                    className="flex-1 min-w-[60px]"
                  >
                    {value}
                  </Button>
                ))}
                {estimatedCount && estimatedCount > 0 && (
                  <Button
                    variant={syncLimit >= estimatedCount ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSyncLimit(estimatedCount)}
                    className="flex-1 min-w-[60px]"
                  >
                    Todos ({estimatedCount})
                  </Button>
                )}
              </div>
            </div>

            {/* Estimated Count Card */}
            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Produtos sem imagem disponíveis:
                  </span>
                  {isLoadingCount ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="font-bold text-lg">
                      {estimatedCount ?? '-'}
                    </span>
                  )}
                </div>
                {actualProductsToSync > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Tempo estimado para {actualProductsToSync} produtos: ~{Math.ceil(actualProductsToSync * 1.2 / 60)} minutos
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Info Alert */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                As imagens são buscadas via SerpAPI/Google e salvas internamente. 
                O processo pode ser cancelado ou pulado a qualquer momento.
              </AlertDescription>
            </Alert>

            {/* Validation for category mode */}
            {syncMode === 'selected_category' && !selectedCategory && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Selecione uma categoria para continuar.
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleStartSync}
                disabled={
                  !estimatedCount || 
                  estimatedCount === 0 || 
                  (syncMode === 'selected_category' && !selectedCategory) ||
                  isLoadingCount
                }
                className="flex-1"
              >
                <ImagePlus className="h-4 w-4 mr-2" />
                Sincronizar {actualProductsToSync} produtos
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
