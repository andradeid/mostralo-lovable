import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Phone, RefreshCw, Megaphone, BookOpen, Heart, Plus, Minus } from 'lucide-react';
import { DailyTaskWithProgress } from '@/hooks/useDailyTasks';
import { Button } from '@/components/ui/button';

interface TaskCategorySectionProps {
  category: 'prospeccao' | 'follow_up' | 'marketing' | 'desenvolvimento' | 'fe';
  tasks: DailyTaskWithProgress[];
  onToggleTask: (taskId: string, increment: boolean) => void;
}

const categoryConfig = {
  prospeccao: {
    title: 'Prospecção Ativa',
    icon: Phone,
    color: 'text-blue-600 dark:text-blue-400'
  },
  follow_up: {
    title: 'Follow-up',
    icon: RefreshCw,
    color: 'text-green-600 dark:text-green-400'
  },
  marketing: {
    title: 'Marketing Digital',
    icon: Megaphone,
    color: 'text-purple-600 dark:text-purple-400'
  },
  desenvolvimento: {
    title: 'Autodesenvolvimento',
    icon: BookOpen,
    color: 'text-amber-600 dark:text-amber-400'
  },
  fe: {
    title: 'Fé e Mentalidade',
    icon: Heart,
    color: 'text-pink-600 dark:text-pink-400'
  }
};

export const TaskCategorySection = ({ category, tasks, onToggleTask }: TaskCategorySectionProps) => {
  if (tasks.length === 0) return null;

  const config = categoryConfig[category];
  const Icon = config.icon;
  
  const completedInCategory = tasks.filter(t => t.is_completed).length;
  const progressInCategory = tasks.length > 0 ? (completedInCategory / tasks.length) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${config.color}`} />
            {config.title}
          </CardTitle>
          <span className="text-sm font-semibold">
            {completedInCategory}/{tasks.length}
          </span>
        </div>
        <Progress value={progressInCategory} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.map(task => (
          <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Checkbox
              checked={task.is_completed}
              onCheckedChange={() => onToggleTask(task.id, task.completed_quantity < task.target_quantity)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className={`font-medium ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                </p>
                {task.target_quantity > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onToggleTask(task.id, false)}
                      disabled={task.completed_quantity === 0}
                      className="h-7 w-7 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-semibold min-w-[3rem] text-center">
                      {task.completed_quantity}/{task.target_quantity}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onToggleTask(task.id, true)}
                      disabled={task.is_completed}
                      className="h-7 w-7 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              {task.description && (
                <p className="text-sm text-muted-foreground">{task.description}</p>
              )}
              {task.target_quantity > 1 && (
                <Progress value={task.progress_percentage} className="h-1 mt-2" />
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
