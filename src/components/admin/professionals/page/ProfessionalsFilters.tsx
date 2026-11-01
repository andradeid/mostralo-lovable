// Abas de status, ordenação e busca da lista de profissionais.
// JSX movido da ProfessionalsPage sem mudança.
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowUpDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import type { ProfessionalsKpis, StatusFilter, SortOption } from '@/lib/professionals/professionalsList';

interface ProfessionalsFiltersProps {
  kpis: ProfessionalsKpis;
  statusFilter: StatusFilter;
  setStatusFilter: (value: StatusFilter) => void;
  sortOption: SortOption;
  setSortOption: (value: SortOption) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

export function ProfessionalsFilters({ kpis, statusFilter, setStatusFilter, sortOption, setSortOption, searchTerm, setSearchTerm }: ProfessionalsFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {([
          { key: 'all', label: 'Todos', count: kpis.total },
          { key: 'active', label: 'Ativos', count: kpis.active },
          { key: 'inactive', label: 'Inativos', count: kpis.inactive },
        ] as { key: StatusFilter; label: string; count: number }[]).map(tab => (
          <Button
            key={tab.key}
            variant={statusFilter === tab.key ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5 h-8"
            onClick={() => setStatusFilter(tab.key)}
          >
            {tab.label}
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] rounded-full">
              {tab.count}
            </Badge>
          </Button>
        ))}

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 h-8 ml-auto">
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ordenar</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="text-xs">Ordenar por</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSortOption('name')} className={sortOption === 'name' ? 'bg-accent' : ''}>
              Nome (A-Z)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOption('most_busy')} className={sortOption === 'most_busy' ? 'bg-accent' : ''}>
              Mais ocupados hoje
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOption('least_busy')} className={sortOption === 'least_busy' ? 'bg-accent' : ''}>
              Menos ocupados hoje
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search */}
      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar profissional..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );
}
