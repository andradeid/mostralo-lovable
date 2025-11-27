import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, ListTodo } from 'lucide-react';
import { useDailyTasks } from '@/hooks/useDailyTasks';
import { useBibleVerses } from '@/hooks/useBibleVerses';
import { getAccountabilityMessage } from '@/utils/accountabilityMessages';
import { BibleVerseBanner } from './BibleVerseBanner';
import { AccountabilityCard } from './AccountabilityCard';
import { TaskCategorySection } from './TaskCategorySection';
import { DailyDisciplineCalendar } from './DailyDisciplineCalendar';

export const DailyTasksChecklist = () => {
  const { tasks, totalTasks, completedTasks, overallProgress, isLoading, toggleTask } = useDailyTasks();
  const { currentVerse } = useBibleVerses(overallProgress);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Carregando tarefas...</div>
        </CardContent>
      </Card>
    );
  }

  const hour = new Date().getHours();
  const accountabilityMessage = currentVerse 
    ? getAccountabilityMessage(hour, overallProgress, completedTasks, totalTasks, currentVerse)
    : null;

  // Agrupar tarefas por categoria
  const tasksByCategory = {
    prospeccao: tasks.filter(t => t.category === 'prospeccao'),
    follow_up: tasks.filter(t => t.category === 'follow_up'),
    marketing: tasks.filter(t => t.category === 'marketing'),
    desenvolvimento: tasks.filter(t => t.category === 'desenvolvimento'),
    fe: tasks.filter(t => t.category === 'fe')
  };

  return (
    <div className="space-y-6">
      {/* Header com Progresso Geral */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-6 w-6" />
              Disciplina Diária do Guerreiro
            </CardTitle>
            <div className="flex items-center gap-2">
              {overallProgress === 100 && (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              )}
              <span className="text-2xl font-bold">
                {completedTasks}/{totalTasks}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={overallProgress} className="h-3" />
            <p className="text-sm text-muted-foreground text-center">
              {overallProgress.toFixed(0)}% das tarefas concluídas
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Versículo Bíblico */}
      {currentVerse && <BibleVerseBanner verse={currentVerse} />}

      {/* Card de Cobrança/Motivação */}
      {accountabilityMessage && <AccountabilityCard message={accountabilityMessage} />}

      {/* Tarefas por Categoria */}
      <div className="grid grid-cols-1 gap-6">
        <TaskCategorySection 
          category="prospeccao" 
          tasks={tasksByCategory.prospeccao} 
          onToggleTask={toggleTask}
        />
        <TaskCategorySection 
          category="follow_up" 
          tasks={tasksByCategory.follow_up} 
          onToggleTask={toggleTask}
        />
        <TaskCategorySection 
          category="marketing" 
          tasks={tasksByCategory.marketing} 
          onToggleTask={toggleTask}
        />
        <TaskCategorySection 
          category="desenvolvimento" 
          tasks={tasksByCategory.desenvolvimento} 
          onToggleTask={toggleTask}
        />
        <TaskCategorySection 
          category="fe" 
          tasks={tasksByCategory.fe} 
          onToggleTask={toggleTask}
        />
      </div>

      {/* Calendário de Disciplina */}
      <DailyDisciplineCalendar />
    </div>
  );
};
