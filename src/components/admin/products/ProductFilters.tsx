import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Filter, 
  X, 
  Package, 
  DollarSign, 
  Tag, 
  Image, 
  Percent,
  Boxes,
  Star
} from 'lucide-react';
import { ProductFiltersSheet } from './ProductFiltersSheet';

export interface ProductFilters {
  status: 'all' | 'available' | 'unavailable' | 'hidden';
  stock: 'all' | 'out_of_stock' | 'low_stock' | 'normal' | 'no_tracking';
  priceRange: { min: number | null; max: number | null };
  categories: string[];
  promotion: 'all' | 'on_sale' | 'regular';
  hasImage: 'all' | 'with_image' | 'without_image';
  featured: 'all' | 'featured' | 'not_featured';
}

export const defaultFilters: ProductFilters = {
  status: 'all',
  stock: 'all',
  priceRange: { min: null, max: null },
  categories: [],
  promotion: 'all',
  hasImage: 'all',
  featured: 'all'
};

interface CategoryOption {
  id: string;
  name: string;
}

interface ProductFiltersProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  categories: CategoryOption[];
  maxPrice: number;
}

export const ProductFiltersComponent = ({
  filters,
  onFiltersChange,
  categories,
  maxPrice
}: ProductFiltersProps) => {
  const isMobile = useIsMobile();

  const updateFilter = <K extends keyof ProductFilters>(
    key: K, 
    value: ProductFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onFiltersChange(defaultFilters);
  };

  const countActiveFilters = (): number => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.stock !== 'all') count++;
    if (filters.priceRange.min !== null || filters.priceRange.max !== null) count++;
    if (filters.categories.length > 0) count++;
    if (filters.promotion !== 'all') count++;
    if (filters.hasImage !== 'all') count++;
    if (filters.featured !== 'all') count++;
    return count;
  };

  const activeFilterCount = countActiveFilters();

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter(id => id !== categoryId)
      : [...filters.categories, categoryId];
    updateFilter('categories', newCategories);
  };

  const handlePriceChange = (values: number[]) => {
    const [min, max] = values;
    updateFilter('priceRange', {
      min: min === 0 ? null : min,
      max: max === maxPrice ? null : max
    });
  };

  // Mobile: usar sheet
  if (isMobile) {
    return (
      <div className="flex items-center gap-2">
        <ProductFiltersSheet
          filters={filters}
          onFiltersChange={onFiltersChange}
          categories={categories}
          maxPrice={maxPrice}
          activeFilterCount={activeFilterCount}
        />
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-muted-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>
    );
  }

  // Desktop: filtros inline
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 text-sm text-muted-foreground mr-2">
        <Filter className="w-4 h-4" />
        <span>Filtros:</span>
      </div>

      {/* Status */}
      <Select 
        value={filters.status} 
        onValueChange={(v) => updateFilter('status', v as ProductFilters['status'])}
      >
        <SelectTrigger className="w-[140px] h-8 text-xs">
          <Package className="w-3 h-3 mr-1" />
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="available">Disponíveis</SelectItem>
          <SelectItem value="unavailable">Indisponíveis</SelectItem>
          <SelectItem value="hidden">Ocultos</SelectItem>
        </SelectContent>
      </Select>

      {/* Estoque */}
      <Select 
        value={filters.stock} 
        onValueChange={(v) => updateFilter('stock', v as ProductFilters['stock'])}
      >
        <SelectTrigger className="w-[140px] h-8 text-xs">
          <Boxes className="w-3 h-3 mr-1" />
          <SelectValue placeholder="Estoque" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="out_of_stock">Sem estoque</SelectItem>
          <SelectItem value="low_stock">Estoque baixo</SelectItem>
          <SelectItem value="normal">Estoque normal</SelectItem>
          <SelectItem value="no_tracking">Sem controle</SelectItem>
        </SelectContent>
      </Select>

      {/* Preço */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={`h-8 text-xs ${
              (filters.priceRange.min !== null || filters.priceRange.max !== null) 
                ? 'border-primary text-primary' 
                : ''
            }`}
          >
            <DollarSign className="w-3 h-3 mr-1" />
            Preço
            {(filters.priceRange.min !== null || filters.priceRange.max !== null) && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                1
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Faixa de Preço</Label>
              {(filters.priceRange.min !== null || filters.priceRange.max !== null) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => updateFilter('priceRange', { min: null, max: null })}
                >
                  Limpar
                </Button>
              )}
            </div>
            <Slider
              value={[
                filters.priceRange.min ?? 0, 
                filters.priceRange.max ?? maxPrice
              ]}
              min={0}
              max={maxPrice}
              step={10}
              onValueChange={handlePriceChange}
              className="mt-2"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>R$ {filters.priceRange.min ?? 0}</span>
              <span>R$ {filters.priceRange.max ?? maxPrice}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-6 text-xs"
                onClick={() => updateFilter('priceRange', { min: null, max: 50 })}
              >
                Até R$ 50
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-6 text-xs"
                onClick={() => updateFilter('priceRange', { min: 50, max: 100 })}
              >
                R$ 50-100
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-6 text-xs"
                onClick={() => updateFilter('priceRange', { min: 100, max: null })}
              >
                Acima R$ 100
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Promoção */}
      <Select 
        value={filters.promotion} 
        onValueChange={(v) => updateFilter('promotion', v as ProductFilters['promotion'])}
      >
        <SelectTrigger className="w-[130px] h-8 text-xs">
          <Percent className="w-3 h-3 mr-1" />
          <SelectValue placeholder="Promoção" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="on_sale">Em promoção</SelectItem>
          <SelectItem value="regular">Preço normal</SelectItem>
        </SelectContent>
      </Select>

      {/* Categorias */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={`h-8 text-xs ${
              filters.categories.length > 0 ? 'border-primary text-primary' : ''
            }`}
          >
            <Tag className="w-3 h-3 mr-1" />
            Categorias
            {filters.categories.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                {filters.categories.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4" align="start">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Categorias</Label>
              {filters.categories.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => updateFilter('categories', [])}
                >
                  Limpar
                </Button>
              )}
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`cat-${category.id}`}
                    checked={filters.categories.includes(category.id)}
                    onCheckedChange={() => handleCategoryToggle(category.id)}
                  />
                  <Label 
                    htmlFor={`cat-${category.id}`} 
                    className="text-sm cursor-pointer"
                  >
                    {category.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Destaque */}
      <Select 
        value={filters.featured} 
        onValueChange={(v) => updateFilter('featured', v as ProductFilters['featured'])}
      >
        <SelectTrigger className="w-[130px] h-8 text-xs">
          <Star className="w-3 h-3 mr-1" />
          <SelectValue placeholder="Destaque" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="featured">Em destaque</SelectItem>
          <SelectItem value="not_featured">Sem destaque</SelectItem>
        </SelectContent>
      </Select>

      {/* Imagem */}
      <Select 
        value={filters.hasImage} 
        onValueChange={(v) => updateFilter('hasImage', v as ProductFilters['hasImage'])}
      >
        <SelectTrigger className="w-[130px] h-8 text-xs">
          <Image className="w-3 h-3 mr-1" />
          <SelectValue placeholder="Imagem" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          <SelectItem value="with_image">Com imagem</SelectItem>
          <SelectItem value="without_image">Sem imagem</SelectItem>
        </SelectContent>
      </Select>

      {/* Limpar filtros */}
      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="h-8 text-xs text-muted-foreground ml-2"
        >
          <X className="w-3 h-3 mr-1" />
          Limpar ({activeFilterCount})
        </Button>
      )}
    </div>
  );
};
