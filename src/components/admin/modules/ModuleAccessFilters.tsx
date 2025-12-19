import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';

interface ModuleAccessFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'blocked' | 'enabled';
  onStatusFilterChange: (value: 'all' | 'blocked' | 'enabled') => void;
  moduleFilter: string;
  onModuleFilterChange: (value: string) => void;
  modules: { id: string; name: string }[];
}

export function ModuleAccessFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  moduleFilter,
  onModuleFilterChange,
  modules,
}: ModuleAccessFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar loja..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={moduleFilter} onValueChange={onModuleFilterChange}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Filtrar por módulo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os módulos</SelectItem>
          {modules.map((module) => (
            <SelectItem key={module.id} value={module.id}>
              {module.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex gap-2">
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onStatusFilterChange('all')}
        >
          <Filter className="w-4 h-4 mr-1" />
          Todos
        </Button>
        <Button
          variant={statusFilter === 'enabled' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onStatusFilterChange('enabled')}
          className={statusFilter !== 'enabled' ? 'text-green-600 border-green-500/30 hover:bg-green-500/10' : ''}
        >
          Liberados
        </Button>
        <Button
          variant={statusFilter === 'blocked' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onStatusFilterChange('blocked')}
          className={statusFilter !== 'blocked' ? 'text-red-600 border-red-500/30 hover:bg-red-500/10' : ''}
        >
          Bloqueados
        </Button>
      </div>
    </div>
  );
}
