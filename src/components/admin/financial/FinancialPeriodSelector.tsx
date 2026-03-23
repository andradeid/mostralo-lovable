import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type FinancialPeriod = 'today' | '7d' | '30d' | 'month';

interface FinancialPeriodSelectorProps {
  value: FinancialPeriod;
  onChange: (period: FinancialPeriod) => void;
}

const periods: { value: FinancialPeriod; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: 'month', label: 'Este mês' },
];

export function FinancialPeriodSelector({ value, onChange }: FinancialPeriodSelectorProps) {
  return (
    <div className="flex gap-1 bg-muted p-1 rounded-lg">
      {periods.map((p) => (
        <Button
          key={p.value}
          variant={value === p.value ? 'default' : 'ghost'}
          size="sm"
          className={cn(
            'h-7 text-xs px-3',
            value === p.value && 'shadow-sm'
          )}
          onClick={() => onChange(p.value)}
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
}
