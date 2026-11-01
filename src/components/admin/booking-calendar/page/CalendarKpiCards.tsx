// Cartões de números da Agenda (total, concluídos, a atender, cancelados).
// JSX movido da BookingCalendarPage sem mudança.
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { CalendarStats } from '@/lib/bookingCalendar/calendarGrid';

interface CalendarKpiCardsProps {
  stats: CalendarStats;
}

export function CalendarKpiCards({ stats }: CalendarKpiCardsProps) {
  const { totalLabel, statsBookings, completedCount, inProgressCount, confirmedCount, pendingCount, cancelledCount } = stats;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
      {[
        { label: totalLabel, value: statsBookings.length, color: 'text-foreground' },
        { label: 'Concluídos', value: completedCount, color: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'A atender', value: inProgressCount + confirmedCount + pendingCount, color: 'text-blue-600 dark:text-blue-400' },
        { label: 'Cancelados', value: cancelledCount, color: 'text-red-600 dark:text-red-400' },
      ].map((kpi) => (
        <Card key={kpi.label} className="border-border/50 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">{kpi.label}</p>
            <p className={cn("text-xl sm:text-2xl font-bold mt-0.5 tracking-tight", kpi.color)}>{kpi.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
