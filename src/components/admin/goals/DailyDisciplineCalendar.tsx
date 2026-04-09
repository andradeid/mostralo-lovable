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

  const calculateStreak = () => {
    let streak = 0;
    for (let i = 0; i <= 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = disciplineData.find(d => d.date === dateStr);
      if (i === 0) {
        if (dayData?.is100Percent) streak++;
        continue;
      }
      if (dayData?.is100Percent) streak++;
      else break;
    }
    return streak;
  };

  const streak = calculateStreak();
  const perfect100Days = disciplineData.filter(d => d.is100Percent).length;

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
    });
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3 h-fit">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-semibold text-xs">30 dias</span>
        </div>
        <div className="flex items-center gap-3">
          {streak > 0 && (
            <div className="flex items-center gap-1 text-orange-500">
              <Flame className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">{streak}🔥</span>
            </div>
          )}
          <span className="text-[10px] text-muted-foreground">
            {perfect100Days} perfeitos
          </span>
        </div>
      </div>

      <div className="grid grid-cols-10 gap-1">
        {days.map((day) => (
          <div
            key={day.date}
            className={cn(
              "aspect-square rounded-sm flex items-center justify-center text-[9px] font-medium transition-all cursor-default",
              day.is100Percent 
                ? "bg-green-500 text-white" 
                : "bg-muted/50 text-muted-foreground",
              day.isToday && "ring-1.5 ring-primary ring-offset-1 ring-offset-background"
            )}
            title={`${day.dayOfMonth} — ${day.is100Percent ? '✓' : '✗'}`}
          >
            {day.dayOfMonth}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm bg-green-500" />
          <span>Completo</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm bg-muted/50" />
          <span>Incompleto</span>
        </div>
      </div>
    </div>
  );
};
