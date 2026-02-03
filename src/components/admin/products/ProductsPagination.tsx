import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProductsPaginationProps {
  currentPage: number;
  totalItems: number;
  loadedItems: number;
  pageSize: number;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  mode?: 'infinite' | 'pages';
}

export function ProductsPagination({
  currentPage,
  totalItems,
  loadedItems,
  pageSize,
  hasMore,
  isLoading,
  onLoadMore,
  onPageChange,
  onPageSizeChange,
  mode = 'infinite'
}: ProductsPaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize);
  
  if (mode === 'infinite') {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="text-sm text-muted-foreground">
          Exibindo <strong className="text-foreground">{loadedItems}</strong> de{' '}
          <strong className="text-foreground">{totalItems}</strong> produtos
        </div>
        
        {hasMore && (
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoading}
            className="min-w-[200px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                Carregar mais {pageSize} produtos
              </>
            )}
          </Button>
        )}

        {!hasMore && loadedItems === totalItems && totalItems > 0 && (
          <p className="text-sm text-muted-foreground">
            ✓ Todos os {totalItems} produtos carregados
          </p>
        )}
      </div>
    );
  }

  // Mode: pages
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      <div className="text-sm text-muted-foreground">
        Página <strong>{currentPage + 1}</strong> de <strong>{totalPages}</strong>
        {' • '}
        <strong>{totalItems}</strong> produtos no total
      </div>

      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25 / pág</SelectItem>
              <SelectItem value="50">50 / pág</SelectItem>
              <SelectItem value="100">100 / pág</SelectItem>
            </SelectContent>
          </Select>
        )}

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange?.(0)}
            disabled={currentPage === 0 || isLoading}
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage === 0 || isLoading}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <span className="px-3 py-1 text-sm font-medium">
            {currentPage + 1} / {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage >= totalPages - 1 || isLoading}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange?.(totalPages - 1)}
            disabled={currentPage >= totalPages - 1 || isLoading}
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
