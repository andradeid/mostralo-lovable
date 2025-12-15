import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface MediaFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedNiche: string;
  onNicheChange: (value: string) => void;
  showActiveFilter?: boolean;
  activeFilter?: string;
  onActiveFilterChange?: (value: string) => void;
}

const CATEGORIES = [
  { value: 'all', label: 'Todas Categorias' },
  { value: 'video', label: '🎬 Vídeos' },
  { value: 'audio', label: '🎵 Áudios' },
  { value: 'imagem', label: '🖼️ Imagens' },
  { value: 'pdf', label: '📄 PDFs' },
  { value: 'outro', label: '📁 Outros' },
];

const NICHES = [
  { value: 'all', label: 'Todos os Nichos' },
  { value: 'geral', label: 'Geral' },
  { value: 'pizzaria', label: 'Pizzaria' },
  { value: 'hamburgueria', label: 'Hamburgueria' },
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'acougue', label: 'Açougue' },
  { value: 'farmacia', label: 'Farmácia' },
  { value: 'supermercado', label: 'Supermercado' },
  { value: 'petshop', label: 'Pet Shop' },
  { value: 'loja', label: 'Loja' },
  { value: 'feira', label: 'Feira/Importados' },
  { value: 'suplementos', label: 'Suplementos' },
];

export function MediaFilters({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedNiche,
  onNicheChange,
  showActiveFilter = false,
  activeFilter = 'all',
  onActiveFilterChange,
}: MediaFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar mídia..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      
      {/* Category Filter */}
      <Select value={selectedCategory} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((cat) => (
            <SelectItem key={cat.value} value={cat.value}>
              {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Niche Filter */}
      <Select value={selectedNiche} onValueChange={onNicheChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Nicho" />
        </SelectTrigger>
        <SelectContent>
          {NICHES.map((niche) => (
            <SelectItem key={niche.value} value={niche.value}>
              {niche.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Active Filter (admin only) */}
      {showActiveFilter && onActiveFilterChange && (
        <Select value={activeFilter} onValueChange={onActiveFilterChange}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

export { CATEGORIES, NICHES };
