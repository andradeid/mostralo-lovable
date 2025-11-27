import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from 'lucide-react';

export const DailyDisciplineCalendar = () => {
  const { data: disciplineData = [] } = useQuery({
    queryKey: ['discipline-calendar'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Buscar últimos 30 dias de conclusões
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

      // Agrupar por data
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

      // Adicionar total de tarefas para cada dia
      Object.keys(dailyProgress).forEach(date => {
        dailyProgress[date].total = tasks.length;
      });

      return Object.entries(dailyProgress).map(([date, progress]) => ({
        date,
        is100Percent: progress.completed === progress.total && progress.total > 0
      }));
    }
  });

  // Calcular estatísticas
  const last30Days = disciplineData.length;
  const perfect100Days = disciplineData.filter(d => d.is100Percent).length;
  const consistencyRate = last30Days > 0 ? (perfect100Days / last30Days) * 100 : 0;

  // Gerar últimos 30 dias
  const getLast30Days = () => {
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
        isToday: i === 0
      });
    }
    return days;
  };

  const days = getLast30Days();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendário de Disciplina (Últimos 30 dias)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Estatísticas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {perfect100Days}
              </div>
              <div className="text-sm text-muted-foreground">Dias 100%</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {consistencyRate.toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">Taxa de Consistência</div>
            </div>
          </div>

          {/* Grid de dias */}
          <div className="grid grid-cols-10 gap-2">
            {days.map((day, index) => (
              <div
                key={day.date}
                className={`
                  aspect-square rounded-md flex items-center justify-center text-xs font-medium
                  transition-all duration-200 hover:scale-110
                  ${day.is100Percent 
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' 
                    : 'bg-muted text-muted-foreground'
                  }
                  ${day.isToday ? 'ring-2 ring-primary ring-offset-2' : ''}
                `}
                title={`${day.date}${day.is100Percent ? ' - 100% Completo' : ''}`}
              >
                {day.dayOfMonth}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4 text-sm pt-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span className="text-muted-foreground">100% Completo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted" />
              <span className="text-muted-foreground">Incompleto</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
