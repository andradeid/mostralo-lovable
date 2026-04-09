import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Flame, Target, Clock, AlertTriangle, XCircle } from 'lucide-react';
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
    return { label: 'Manhã — Bora começar!', color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/30', icon: Clock };
  }
  if (hour < 18) {
    return { label: 'Tarde — Ainda dá tempo!', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/30', icon: AlertTriangle };
  }
  if (hour < 22) {
    return { label: 'Noite — Corra, guerreiro!', color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/30', icon: Flame };
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

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Hero Progress */}
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        {/* Status badge */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${dayStatus.bg} ${dayStatus.color}`}>
          <DayIcon className="h-4 w-4" />
          {dayStatus.label}
        </div>

        {/* Big numbers */}
        <div className="flex items-end gap-3">
          <span className="text-5xl font-black tracking-tight">
            {completedTasks}
          </span>
          <span className="text-2xl text-muted-foreground font-medium mb-1">
            / {totalTasks}
          </span>
          {overallProgress === 100 && (
            <CheckCircle2 className="h-8 w-8 text-green-500 mb-1 ml-1" />
          )}
        </div>

        {/* Progress bar */}
        <Progress value={overallProgress} className="h-3" />

        {/* Motivational text */}
        <p className="text-sm text-muted-foreground">
          {overallProgress === 100 
            ? '🔥 Todas as tarefas concluídas! Você é imparável.'
            : remaining === 1 
              ? '⚡ Falta apenas 1 tarefa para completar o dia!'
              : `Faltam ${remaining} tarefas para completar o dia`
          }
        </p>
      </div>

      {/* Bible verse - compact */}
      {currentVerse && <BibleVerseBanner verse={currentVerse} />}

      {/* Accountability - compact */}
      {accountabilityMessage && <AccountabilityCard message={accountabilityMessage} />}

      {/* Tasks by category */}
      <div className="space-y-3">
        {(['prospeccao', 'follow_up', 'marketing', 'desenvolvimento', 'fe'] as const).map(cat => (
          <TaskCategorySection 
            key={cat}
            category={cat} 
            tasks={tasksByCategory[cat]} 
            onToggleTask={toggleTask}
          />
        ))}
      </div>

      {/* Calendar */}
      <DailyDisciplineCalendar />
    </div>
  );
};
