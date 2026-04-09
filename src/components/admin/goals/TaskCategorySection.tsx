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
      "rounded-xl border bg-card overflow-hidden transition-all h-fit",
      allDone && "border-green-500/30 bg-green-500/5"
    )}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50 transition-colors"
      >
        <Icon className={cn("h-3.5 w-3.5 shrink-0", config.accent)} />
        <span className="font-semibold text-xs flex-1 text-left">{config.title}</span>
        <span className={cn(
          "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
          allDone ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"
        )}>
          {completedInCategory}/{tasks.length}
        </span>
        <ChevronDown className={cn(
          "h-3 w-3 text-muted-foreground transition-transform",
          !isOpen && "-rotate-90"
        )} />
      </button>

      <div className="px-3 pb-0.5">
        <Progress value={progressInCategory} className={cn("h-0.5", config.progressColor)} />
      </div>

      {isOpen && (
        <div className="px-3 pb-2 pt-1 space-y-0.5">
          {tasks.map(task => (
            <div
              key={task.id}
              className={cn(
                "flex items-center gap-2 py-1.5 px-1.5 rounded-md transition-colors",
                task.is_completed ? "opacity-50" : "hover:bg-muted/40"
              )}
            >
              <Checkbox
                checked={task.is_completed}
                onCheckedChange={() => onToggleTask(task.id, task.completed_quantity < task.target_quantity)}
                className="shrink-0 h-3.5 w-3.5"
              />
              <span className={cn(
                "flex-1 text-xs leading-tight",
                task.is_completed && "line-through text-muted-foreground"
              )}>
                {task.title}
              </span>

              {task.target_quantity > 1 && (
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); onToggleTask(task.id, false); }}
                    disabled={task.completed_quantity === 0}
                    className="h-5 w-5"
                  >
                    <Minus className="h-2.5 w-2.5" />
                  </Button>
                  <span className="text-[10px] font-mono font-bold min-w-[1.5rem] text-center">
                    {task.completed_quantity}/{task.target_quantity}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); onToggleTask(task.id, true); }}
                    disabled={task.is_completed}
                    className="h-5 w-5"
                  >
                    <Plus className="h-2.5 w-2.5" />
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
