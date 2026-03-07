import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { format, subDays, startOfMonth, startOfWeek } from 'date-fns';
import { Calendar } from 'lucide-react';

interface WhatsAppReportFiltersProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
}

export function WhatsAppReportFilters({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}: WhatsAppReportFiltersProps) {
  const today = format(new Date(), 'yyyy-MM-dd');

  const presets = [
    { label: 'Hoje', from: today, to: today },
    { label: '7 dias', from: format(subDays(new Date(), 7), 'yyyy-MM-dd'), to: today },
    { label: '30 dias', from: format(subDays(new Date(), 30), 'yyyy-MM-dd'), to: today },
    { label: 'Este mês', from: format(startOfMonth(new Date()), 'yyyy-MM-dd'), to: today },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
      <div className="flex items-end gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">De</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="w-[140px] h-9 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Até</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="w-[140px] h-9 text-sm"
          />
        </div>
      </div>
      <div className="flex gap-1 flex-wrap">
        {presets.map((p) => (
          <Button
            key={p.label}
            variant={dateFrom === p.from && dateTo === p.to ? 'default' : 'outline'}
            size="sm"
            className="h-9 text-xs"
            onClick={() => {
              onDateFromChange(p.from);
              onDateToChange(p.to);
            }}
          >
            {p.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
