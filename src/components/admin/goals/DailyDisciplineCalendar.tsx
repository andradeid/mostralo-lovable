import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Flame, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export const DailyDisciplineCalendar = () => {
  const { data: disciplineData = [] } = useQuery({
    queryKey: ['discipline-calendar'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: completions } = await supabase
        .from('daily_task_completions')
        .select('date, task_id, completed_quantity')
        .eq('admin_id', user.id)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

      const { data: tasks } = await supabase
        .from('daily_tasks')
        .select('id, target_quantity')
        .eq('admin_id', user.id)
        .eq('is_active', true);

      if (!completions || !tasks) return [];

      const dailyProgress: Record<string, { completed: number; total: number }> = {};
      
      completions.forEach(completion => {
        const task = tasks.find(t => t.id === completion.task_id);
        if (!task) return;

        if (!dailyProgress[completion.date]) {
          dailyProgress[completion.date] = { completed: 0, total: 0 };
        }

        if (completion.completed_quantity >= task.target_quantity) {
          dailyProgress[completion.date].completed++;
        }
      });

      Object.keys(dailyProgress).forEach(date => {
        dailyProgress[date].total = tasks.length;
      });

      return Object.entries(dailyProgress).map(([date, progress]) => ({
        date,
        is100Percent: progress.completed === progress.total && progress.total > 0
      }));
    }
  });

  // Calculate streak
  const calculateStreak = () => {
    let streak = 0;
    for (let i = 0; i <= 30; i++) {
      const date = new Date();
      // Start from yesterday (today is still in progress)
      date.setDate(date.getDate() - i - (i === 0 ? 0 : 0));
      const dateStr = date.toISOString().split('T')[0];
      const dayData = disciplineData.find(d => d.date === dateStr);
      
      if (i === 0) {
        // Today doesn't break streak, just skip if not done
        if (dayData?.is100Percent) streak++;
        continue;
      }
      
      if (dayData?.is100Percent) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const streak = calculateStreak();
  const perfect100Days = disciplineData.filter(d => d.is100Percent).length;

  // Build last 30 days
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    const dayData = disciplineData.find(d => d.date === dateString);
    days.push({
      date: dateString,
      dayOfMonth: date.getDate(),
      is100Percent: dayData?.is100Percent || false,
      isToday: i === 0,
      weekday: date.toLocaleDateString('pt-BR', { weekday: 'narrow' }),
    });
  }

  return (
    <div className="rounded-2xl border bg-card p-5 space-y-5">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm">Últimos 30 dias</span>
        </div>
        <div className="flex items-center gap-4">
          {streak > 0 && (
            <div className="flex items-center gap-1.5 text-orange-500">
              <Flame className="h-4 w-4" />
              <span className="text-sm font-bold">{streak} dias</span>
            </div>
          )}
          <span className="text-xs text-muted-foreground">
            {perfect100Days} dias perfeitos
          </span>
        </div>
      </div>

      {/* Calendar grid - GitHub-style */}
      <div className="grid grid-cols-15 gap-1" style={{ gridTemplateColumns: 'repeat(15, 1fr)' }}>
        {days.map((day) => (
          <div
            key={day.date}
            className={cn(
              "aspect-square rounded-sm flex items-center justify-center text-[10px] font-medium transition-all cursor-default",
              day.is100Percent 
                ? "bg-green-500 text-white" 
                : "bg-muted/60 text-muted-foreground",
              day.isToday && "ring-2 ring-primary ring-offset-1 ring-offset-background"
            )}
            title={`${day.dayOfMonth} — ${day.is100Percent ? '100% ✓' : 'Incompleto'}`}
          >
            {day.dayOfMonth}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <span>Completo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-muted/60" />
          <span>Incompleto</span>
        </div>
      </div>
    </div>
  );
};
