import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Flame, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { useDailyTasks } from '@/hooks/useDailyTasks';
import { useBibleVerses } from '@/hooks/useBibleVerses';
import { getAccountabilityMessage } from '@/utils/accountabilityMessages';
import { BibleVerseBanner } from './BibleVerseBanner';
import { AccountabilityCard } from './AccountabilityCard';
import { TaskCategorySection } from './TaskCategorySection';
import { DailyDisciplineCalendar } from './DailyDisciplineCalendar';

const getDayStatus = (hour: number, overallProgress: number) => {
  if (overallProgress === 100) {
    return { label: 'Dia Completo! 🏆', color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/30', icon: CheckCircle2 };
  }
  if (hour < 12) {
    return { label: 'Manhã — Bora!', color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/30', icon: Clock };
  }
  if (hour < 18) {
    return { label: 'Tarde — Ainda dá!', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/30', icon: AlertTriangle };
  }
  if (hour < 22) {
    return { label: 'Noite — Corra!', color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/30', icon: Flame };
  }
  return { label: 'Dia quase perdido!', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/30', icon: XCircle };
};

export const DailyTasksChecklist = () => {
  const { tasks, totalTasks, completedTasks, overallProgress, isLoading, toggleTask } = useDailyTasks();
  const { currentVerse } = useBibleVerses(overallProgress);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const hour = new Date().getHours();
  const remaining = totalTasks - completedTasks;
  const dayStatus = getDayStatus(hour, overallProgress);
  const DayIcon = dayStatus.icon;

  const accountabilityMessage = currentVerse 
    ? getAccountabilityMessage(hour, overallProgress, completedTasks, totalTasks, currentVerse)
    : null;

  const tasksByCategory = {
    prospeccao: tasks.filter(t => t.category === 'prospeccao'),
    follow_up: tasks.filter(t => t.category === 'follow_up'),
    marketing: tasks.filter(t => t.category === 'marketing'),
    desenvolvimento: tasks.filter(t => t.category === 'desenvolvimento'),
    fe: tasks.filter(t => t.category === 'fe')
  };

  const categories = ['prospeccao', 'follow_up', 'marketing', 'desenvolvimento', 'fe'] as const;

  return (
    <div className="space-y-4 w-full">
      {/* Row 1: Progress + Status side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Progress card */}
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black tracking-tight leading-none">
                {completedTasks}
              </span>
              <span className="text-lg text-muted-foreground font-medium leading-none mb-0.5">
                / {totalTasks}
              </span>
              {overallProgress === 100 && (
                <CheckCircle2 className="h-6 w-6 text-green-500 mb-0.5" />
              )}
            </div>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${dayStatus.bg} ${dayStatus.color}`}>
              <DayIcon className="h-3.5 w-3.5" />
              {dayStatus.label}
            </div>
          </div>
          <Progress value={overallProgress} className="h-2.5" />
          <p className="text-xs text-muted-foreground">
            {overallProgress === 100 
              ? '🔥 Todas as tarefas concluídas!'
              : remaining === 1 
                ? '⚡ Falta apenas 1 tarefa!'
                : `Faltam ${remaining} tarefas para completar o dia`
            }
          </p>
        </div>

        {/* Verse + Accountability stacked */}
        <div className="space-y-3">
          {currentVerse && <BibleVerseBanner verse={currentVerse} />}
          {accountabilityMessage && <AccountabilityCard message={accountabilityMessage} />}
          {!currentVerse && !accountabilityMessage && (
            <div className="rounded-xl border bg-card p-4 flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">Comece suas tarefas!</p>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Task categories grid + Calendar */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-3">
        {/* Tasks grid */}
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {categories.map(cat => (
            <TaskCategorySection 
              key={cat}
              category={cat} 
              tasks={tasksByCategory[cat]} 
              onToggleTask={toggleTask}
            />
          ))}
        </div>

        {/* Calendar sidebar */}
        <DailyDisciplineCalendar />
      </div>
    </div>
  );
};
