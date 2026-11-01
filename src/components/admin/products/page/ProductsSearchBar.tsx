// Busca e ordenação da tela de produtos.
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, GripVertical, ArrowDownAZ } from 'lucide-react';
import type { ProductSortMode } from '@/hooks/products/productsPageTypes';

interface Props {
  searchTerm: string;
  debouncedSearch: string;
  setSearchTerm: (value: string) => void;
  sortMode: ProductSortMode;
  setSortMode: (value: ProductSortMode) => void;
}

export function ProductsSearchBar({ searchTerm, debouncedSearch, setSearchTerm, sortMode, setSortMode }: Props) {
  return (
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          {(searchTerm !== debouncedSearch) ? (
            <Loader2 className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground animate-spin" />
          ) : (
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          )}
          <Input
            placeholder="Buscar produtos em todo o catálogo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={sortMode} onValueChange={(v) => setSortMode(v as 'manual' | 'alphabetical')}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Ordenar..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4" />
                Manual
              </div>
            </SelectItem>
            <SelectItem value="alphabetical">
              <div className="flex items-center gap-2">
                <ArrowDownAZ className="w-4 h-4" />
                A-Z
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
  );
}
