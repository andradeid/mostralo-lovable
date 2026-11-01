// Filtros rápidos da tela de cupons (status e tipo) com contador.
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter } from 'lucide-react';

interface Props {
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  filterDiscountType: string;
  setFilterDiscountType: (value: string) => void;
  filteredCount: number;
  totalCount: number;
}

export function CouponsFilterBar({ filterStatus, setFilterStatus, filterDiscountType, setFilterDiscountType, filteredCount, totalCount }: Props) {
  return (
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filtros:
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="scheduled">Agendados</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
            <SelectItem value="expired">Expirados</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterDiscountType} onValueChange={setFilterDiscountType}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="percentage">Porcentagem (%)</SelectItem>
            <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
          </SelectContent>
        </Select>
        {(filterStatus !== 'all' || filterDiscountType !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => { setFilterStatus('all'); setFilterDiscountType('all'); }}
          >
            Limpar filtros
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {filteredCount} de {totalCount} cupons
        </span>
      </div>
  );
}
