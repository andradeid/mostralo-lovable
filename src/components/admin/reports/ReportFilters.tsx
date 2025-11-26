import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange } from '@/components/admin/reports/types';
import { subDays, startOfMonth, endOfMonth, startOfYear, subMonths } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ReportFiltersProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export function ReportFilters({ dateRange, onDateRangeChange }: ReportFiltersProps) {
  const handlePeriodChange = (value: string) => {
    const now = new Date();
    let from = now;
    let to = now;

    switch (value) {
      case 'today':
        from = new Date(now.setHours(0, 0, 0, 0));
        to = new Date();
        break;
      case '7days':
        from = subDays(now, 7);
        break;
      case '30days':
        from = subDays(now, 30);
        break;
      case 'thisMonth':
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      case 'lastMonth':
        from = startOfMonth(subMonths(now, 1));
        to = endOfMonth(subMonths(now, 1));
        break;
      case '90days':
        from = subDays(now, 90);
        break;
      case 'thisYear':
        from = startOfYear(now);
        break;
    }

    onDateRangeChange({ from, to });
  };

  const exportToCSV = () => {
    // Implementar exportação CSV
    console.log('Exportando para CSV...');
  };

  const exportToPDF = () => {
    // Implementar exportação PDF
    console.log('Exportando para PDF...');
  };

  return (
    <div className="flex gap-2 flex-wrap items-center">
      <Select defaultValue="30days" onValueChange={handlePeriodChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Hoje</SelectItem>
          <SelectItem value="7days">Últimos 7 dias</SelectItem>
          <SelectItem value="30days">Últimos 30 dias</SelectItem>
          <SelectItem value="thisMonth">Este mês</SelectItem>
          <SelectItem value="lastMonth">Mês passado</SelectItem>
          <SelectItem value="90days">Últimos 3 meses</SelectItem>
          <SelectItem value="thisYear">Este ano</SelectItem>
        </SelectContent>
      </Select>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("justify-start text-left font-normal")}>
            <Calendar className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd/MM/yy", { locale: ptBR })} -{" "}
                  {format(dateRange.to, "dd/MM/yy", { locale: ptBR })}
                </>
              ) : (
                format(dateRange.from, "dd/MM/yy", { locale: ptBR })
              )
            ) : (
              <span>Selecionar datas</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <CalendarComponent
            initialFocus
            mode="range"
            selected={{ from: dateRange.from, to: dateRange.to }}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                onDateRangeChange({ from: range.from, to: range.to });
              }
            }}
            numberOfMonths={2}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
      
      <Button variant="outline" size="sm" onClick={exportToPDF}>
        <Download className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">PDF</span>
      </Button>
      
      <Button variant="outline" size="sm" onClick={exportToCSV}>
        <FileSpreadsheet className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">CSV</span>
      </Button>
    </div>
  );
}
