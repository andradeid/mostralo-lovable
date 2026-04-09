import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Phone, RefreshCw, Megaphone, BookOpen, Heart, Plus, Minus, ChevronDown } from 'lucide-react';
import { DailyTaskWithProgress } from '@/hooks/useDailyTasks';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface TaskCategorySectionProps {
  category: 'prospeccao' | 'follow_up' | 'marketing' | 'desenvolvimento' | 'fe';
  tasks: DailyTaskWithProgress[];
  onToggleTask: (taskId: string, increment: boolean) => void;
}

const categoryConfig = {
  prospeccao: {
    title: 'Prospecção',
    icon: Phone,
    accent: 'text-blue-500',
    progressColor: '[&>div]:bg-blue-500',
  },
  follow_up: {
    title: 'Follow-up',
    icon: RefreshCw,
    accent: 'text-green-500',
    progressColor: '[&>div]:bg-green-500',
  },
  marketing: {
    title: 'Marketing',
    icon: Megaphone,
    accent: 'text-purple-500',
    progressColor: '[&>div]:bg-purple-500',
  },
  desenvolvimento: {
    title: 'Desenvolvimento',
    icon: BookOpen,
    accent: 'text-amber-500',
    progressColor: '[&>div]:bg-amber-500',
  },
  fe: {
    title: 'Fé',
    icon: Heart,
    accent: 'text-pink-500',
    progressColor: '[&>div]:bg-pink-500',
  }
};

export const TaskCategorySection = ({ category, tasks, onToggleTask }: TaskCategorySectionProps) => {
  const [isOpen, setIsOpen] = useState(true);

  if (tasks.length === 0) return null;

  const config = categoryConfig[category];
  const Icon = config.icon;
  const completedInCategory = tasks.filter(t => t.is_completed).length;
  const allDone = completedInCategory === tasks.length;
  const progressInCategory = (completedInCategory / tasks.length) * 100;

  return (
    <div className={cn(
      "rounded-xl border bg-card overflow-hidden transition-all",
      allDone && "border-green-500/30 bg-green-500/5"
    )}>
      {/* Header - clickable */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <Icon className={cn("h-4 w-4 shrink-0", config.accent)} />
        <span className="font-semibold text-sm flex-1 text-left">{config.title}</span>
        <span className={cn(
          "text-xs font-bold px-2 py-0.5 rounded-full",
          allDone 
            ? "bg-green-500/20 text-green-500" 
            : "bg-muted text-muted-foreground"
        )}>
          {completedInCategory}/{tasks.length}
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 text-muted-foreground transition-transform",
          !isOpen && "-rotate-90"
        )} />
      </button>

      {/* Mini progress */}
      <div className="px-4 pb-1">
        <Progress value={progressInCategory} className={cn("h-1", config.progressColor)} />
      </div>

      {/* Tasks */}
      {isOpen && (
        <div className="px-4 pb-3 pt-2 space-y-1">
          {tasks.map(task => (
            <div
              key={task.id}
              className={cn(
                "flex items-center gap-3 py-2 px-2 rounded-lg transition-colors",
                task.is_completed ? "opacity-60" : "hover:bg-muted/40"
              )}
            >
              <Checkbox
                checked={task.is_completed}
                onCheckedChange={() => onToggleTask(task.id, task.completed_quantity < task.target_quantity)}
                className="shrink-0"
              />
              <span className={cn(
                "flex-1 text-sm",
                task.is_completed && "line-through text-muted-foreground"
              )}>
                {task.title}
              </span>

              {task.target_quantity > 1 && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); onToggleTask(task.id, false); }}
                    disabled={task.completed_quantity === 0}
                    className="h-6 w-6"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-xs font-mono font-bold min-w-[2rem] text-center">
                    {task.completed_quantity}/{task.target_quantity}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); onToggleTask(task.id, true); }}
                    disabled={task.is_completed}
                    className="h-6 w-6"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
