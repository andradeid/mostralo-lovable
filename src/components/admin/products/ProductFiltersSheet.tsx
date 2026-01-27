import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { 
  Filter, 
  X
} from 'lucide-react';
import { ProductFilters, defaultFilters } from './ProductFilters';
import { useState } from 'react';

interface CategoryOption {
  id: string;
  name: string;
}

interface ProductFiltersSheetProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  categories: CategoryOption[];
  maxPrice: number;
  activeFilterCount: number;
}

export const ProductFiltersSheet = ({
  filters,
  onFiltersChange,
  categories,
  maxPrice,
  activeFilterCount
}: ProductFiltersSheetProps) => {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<ProductFilters>(filters);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setLocalFilters(filters);
    }
    setOpen(isOpen);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const clearAllFilters = () => {
    setLocalFilters(defaultFilters);
  };

  const updateLocalFilter = <K extends keyof ProductFilters>(
    key: K, 
    value: ProductFilters[K]
  ) => {
    setLocalFilters({ ...localFilters, [key]: value });
  };

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = localFilters.categories.includes(categoryId)
      ? localFilters.categories.filter(id => id !== categoryId)
      : [...localFilters.categories, categoryId];
    updateLocalFilter('categories', newCategories);
  };

  const handlePriceChange = (values: number[]) => {
    const [min, max] = values;
    updateLocalFilter('priceRange', {
      min: min === 0 ? null : min,
      max: max === maxPrice ? null : max
    });
  };

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <Filter className="w-4 h-4 mr-2" />
          Filtros
          {activeFilterCount > 0 && (
            <Badge variant="default" className="ml-2 h-5 px-1.5 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center justify-between">
            <span>Filtros de Produtos</span>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-muted-foreground"
              >
                <X className="w-4 h-4 mr-1" />
                Limpar tudo
              </Button>
            )}
          </SheetTitle>
          <SheetDescription>
            Refine a lista de produtos
          </SheetDescription>
        </SheetHeader>

        <div className="overflow-y-auto flex-1 space-y-6 pb-20">
          {/* Status */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Status</Label>
            <RadioGroup 
              value={localFilters.status} 
              onValueChange={(v) => updateLocalFilter('status', v as ProductFilters['status'])}
              className="grid grid-cols-2 gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="status-all" />
                <Label htmlFor="status-all" className="text-sm">Todos</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="available" id="status-available" />
                <Label htmlFor="status-available" className="text-sm">Disponíveis</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="unavailable" id="status-unavailable" />
                <Label htmlFor="status-unavailable" className="text-sm">Indisponíveis</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hidden" id="status-hidden" />
                <Label htmlFor="status-hidden" className="text-sm">Ocultos</Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Estoque */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Estoque</Label>
            <RadioGroup 
              value={localFilters.stock} 
              onValueChange={(v) => updateLocalFilter('stock', v as ProductFilters['stock'])}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="stock-all" />
                <Label htmlFor="stock-all" className="text-sm">Todos</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="out_of_stock" id="stock-out" />
                <Label htmlFor="stock-out" className="text-sm">Sem estoque</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="low_stock" id="stock-low" />
                <Label htmlFor="stock-low" className="text-sm">Estoque baixo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="normal" id="stock-normal" />
                <Label htmlFor="stock-normal" className="text-sm">Estoque normal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no_tracking" id="stock-no-track" />
                <Label htmlFor="stock-no-track" className="text-sm">Sem controle</Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Faixa de Preço */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Faixa de Preço</Label>
              {(localFilters.priceRange.min !== null || localFilters.priceRange.max !== null) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => updateLocalFilter('priceRange', { min: null, max: null })}
                >
                  Limpar
                </Button>
              )}
            </div>
            <Slider
              value={[
                localFilters.priceRange.min ?? 0, 
                localFilters.priceRange.max ?? maxPrice
              ]}
              min={0}
              max={maxPrice}
              step={10}
              onValueChange={handlePriceChange}
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>R$ {localFilters.priceRange.min ?? 0}</span>
              <span>R$ {localFilters.priceRange.max ?? maxPrice}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => updateLocalFilter('priceRange', { min: null, max: 50 })}
              >
                Até R$ 50
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => updateLocalFilter('priceRange', { min: 50, max: 100 })}
              >
                R$ 50-100
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => updateLocalFilter('priceRange', { min: 100, max: null })}
              >
                +R$ 100
              </Button>
            </div>
          </div>

          <Separator />

          {/* Promoção */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Promoção</Label>
            <RadioGroup 
              value={localFilters.promotion} 
              onValueChange={(v) => updateLocalFilter('promotion', v as ProductFilters['promotion'])}
              className="grid grid-cols-3 gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="promo-all" />
                <Label htmlFor="promo-all" className="text-sm">Todos</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="on_sale" id="promo-sale" />
                <Label htmlFor="promo-sale" className="text-sm">Em promoção</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="regular" id="promo-regular" />
                <Label htmlFor="promo-regular" className="text-sm">Normal</Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Categorias */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Categorias</Label>
              {localFilters.categories.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => updateLocalFilter('categories', [])}
                >
                  Limpar ({localFilters.categories.length})
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`mobile-cat-${category.id}`}
                    checked={localFilters.categories.includes(category.id)}
                    onCheckedChange={() => handleCategoryToggle(category.id)}
                  />
                  <Label 
                    htmlFor={`mobile-cat-${category.id}`} 
                    className="text-sm cursor-pointer truncate"
                  >
                    {category.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Imagem */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Imagem</Label>
            <RadioGroup 
              value={localFilters.hasImage} 
              onValueChange={(v) => updateLocalFilter('hasImage', v as ProductFilters['hasImage'])}
              className="grid grid-cols-3 gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="img-all" />
                <Label htmlFor="img-all" className="text-sm">Todas</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="with_image" id="img-with" />
                <Label htmlFor="img-with" className="text-sm">Com imagem</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="without_image" id="img-without" />
                <Label htmlFor="img-without" className="text-sm">Sem imagem</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
          <Button onClick={applyFilters} className="w-full">
            Aplicar Filtros
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
