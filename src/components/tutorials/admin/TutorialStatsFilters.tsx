import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { subDays } from 'date-fns';

interface DateRange {
  startDate: Date | null;
  endDate: Date;
}

interface TutorialStatsFiltersProps {
  selectedDays: number;
  onRangeChange: (range: DateRange, days: number) => void;
}

const PRESET_RANGES = [
  { label: '7 dias', days: 7 },
  { label: '30 dias', days: 30 },
  { label: '90 dias', days: 90 },
  { label: 'Todo período', days: 0 }
];

export function TutorialStatsFilters({ selectedDays, onRangeChange }: TutorialStatsFiltersProps) {
  const handleSelect = (days: number) => {
    const endDate = new Date();
    const startDate = days > 0 ? subDays(endDate, days) : null;
    onRangeChange({ startDate, endDate }, days);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {PRESET_RANGES.map(({ label, days }) => (
        <Button
          key={label}
          variant={selectedDays === days ? "default" : "outline"}
          size="sm"
          onClick={() => handleSelect(days)}
        >
          <Calendar className="w-4 h-4 mr-2" />
          {label}
        </Button>
      ))}
    </div>
  );
}
