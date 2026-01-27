import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { ProductFilters, defaultFilters } from './ProductFilters';

interface CategoryOption {
  id: string;
  name: string;
}

interface ActiveFiltersBarProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  categories: CategoryOption[];
  totalProducts: number;
  filteredCount: number;
}

const statusLabels: Record<ProductFilters['status'], string> = {
  all: '',
  available: 'Disponíveis',
  unavailable: 'Indisponíveis',
  hidden: 'Ocultos'
};

const stockLabels: Record<ProductFilters['stock'], string> = {
  all: '',
  out_of_stock: 'Sem estoque',
  low_stock: 'Estoque baixo',
  normal: 'Estoque normal',
  no_tracking: 'Sem controle'
};

const promotionLabels: Record<ProductFilters['promotion'], string> = {
  all: '',
  on_sale: 'Em promoção',
  regular: 'Preço normal'
};

const imageLabels: Record<ProductFilters['hasImage'], string> = {
  all: '',
  with_image: 'Com imagem',
  without_image: 'Sem imagem'
};

const featuredLabels: Record<ProductFilters['featured'], string> = {
  all: '',
  featured: 'Em destaque',
  not_featured: 'Sem destaque'
};

export const ActiveFiltersBar = ({
  filters,
  onFiltersChange,
  categories,
  totalProducts,
  filteredCount
}: ActiveFiltersBarProps) => {
  const hasActiveFilters = 
    filters.status !== 'all' ||
    filters.stock !== 'all' ||
    filters.priceRange.min !== null ||
    filters.priceRange.max !== null ||
    filters.categories.length > 0 ||
    filters.promotion !== 'all' ||
    filters.hasImage !== 'all' ||
    filters.featured !== 'all';

  if (!hasActiveFilters) return null;

  const removeFilter = <K extends keyof ProductFilters>(key: K) => {
    onFiltersChange({ ...filters, [key]: defaultFilters[key] });
  };

  const removeCategory = (categoryId: string) => {
    onFiltersChange({
      ...filters,
      categories: filters.categories.filter(id => id !== categoryId)
    });
  };

  const clearAllFilters = () => {
    onFiltersChange(defaultFilters);
  };

  const getCategoryName = (id: string) => {
    return categories.find(c => c.id === id)?.name || id;
  };

  const formatPriceRange = () => {
    const { min, max } = filters.priceRange;
    if (min !== null && max !== null) {
      return `R$ ${min} - R$ ${max}`;
    }
    if (min !== null) {
      return `A partir de R$ ${min}`;
    }
    if (max !== null) {
      return `Até R$ ${max}`;
    }
    return '';
  };

  return (
    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
      {/* Contador de resultados */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Mostrando <strong className="text-foreground">{filteredCount}</strong> de{' '}
          <strong className="text-foreground">{totalProducts}</strong> produtos
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="h-7 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="w-3 h-3 mr-1" />
          Limpar todos
        </Button>
      </div>

      {/* Chips de filtros ativos */}
      <div className="flex flex-wrap gap-2">
        {/* Status */}
        {filters.status !== 'all' && (
          <Badge 
            variant="secondary" 
            className="cursor-pointer hover:bg-secondary/80 pr-1"
            onClick={() => removeFilter('status')}
          >
            {statusLabels[filters.status]}
            <X className="w-3 h-3 ml-1" />
          </Badge>
        )}

        {/* Estoque */}
        {filters.stock !== 'all' && (
          <Badge 
            variant="secondary" 
            className="cursor-pointer hover:bg-secondary/80 pr-1"
            onClick={() => removeFilter('stock')}
          >
            {stockLabels[filters.stock]}
            <X className="w-3 h-3 ml-1" />
          </Badge>
        )}

        {/* Preço */}
        {(filters.priceRange.min !== null || filters.priceRange.max !== null) && (
          <Badge 
            variant="secondary" 
            className="cursor-pointer hover:bg-secondary/80 pr-1"
            onClick={() => removeFilter('priceRange')}
          >
            {formatPriceRange()}
            <X className="w-3 h-3 ml-1" />
          </Badge>
        )}

        {/* Promoção */}
        {filters.promotion !== 'all' && (
          <Badge 
            variant="secondary" 
            className="cursor-pointer hover:bg-secondary/80 pr-1"
            onClick={() => removeFilter('promotion')}
          >
            {promotionLabels[filters.promotion]}
            <X className="w-3 h-3 ml-1" />
          </Badge>
        )}

        {/* Categorias */}
        {filters.categories.map((categoryId) => (
          <Badge 
            key={categoryId}
            variant="secondary" 
            className="cursor-pointer hover:bg-secondary/80 pr-1"
            onClick={() => removeCategory(categoryId)}
          >
            {getCategoryName(categoryId)}
            <X className="w-3 h-3 ml-1" />
          </Badge>
        ))}

        {/* Imagem */}
        {filters.hasImage !== 'all' && (
          <Badge 
            variant="secondary" 
            className="cursor-pointer hover:bg-secondary/80 pr-1"
            onClick={() => removeFilter('hasImage')}
          >
            {imageLabels[filters.hasImage]}
            <X className="w-3 h-3 ml-1" />
          </Badge>
        )}

        {/* Destaque */}
        {filters.featured !== 'all' && (
          <Badge 
            variant="secondary" 
            className="cursor-pointer hover:bg-secondary/80 pr-1"
            onClick={() => removeFilter('featured')}
          >
            {featuredLabels[filters.featured]}
            <X className="w-3 h-3 ml-1" />
          </Badge>
        )}
      </div>
    </div>
  );
};
