import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DailyTask {
  id: string;
  admin_id: string;
  category: 'prospeccao' | 'follow_up' | 'marketing' | 'desenvolvimento' | 'fe';
  title: string;
  description: string | null;
  target_quantity: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface TaskCompletion {
  id: string;
  task_id: string;
  date: string;
  completed_quantity: number;
  completed_at: string | null;
  notes: string | null;
}

export interface DailyTaskWithProgress extends DailyTask {
  completed_quantity: number;
  is_completed: boolean;
  progress_percentage: number;
}

export const useDailyTasks = (date?: Date) => {
  const queryClient = useQueryClient();
  const targetDate = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  // Buscar tarefas do admin
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ['daily-tasks'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('admin_id', user.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as DailyTask[];
    }
  });

  // Buscar conclusões do dia
  const { data: completions = [], isLoading: isLoadingCompletions } = useQuery({
    queryKey: ['task-completions', targetDate],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('daily_task_completions')
        .select('*')
        .eq('admin_id', user.id)
        .eq('date', targetDate);

      if (error) throw error;
      return data as TaskCompletion[];
    }
  });

  // Combinar tarefas com progresso
  const tasksWithProgress: DailyTaskWithProgress[] = tasks.map(task => {
    const completion = completions.find(c => c.task_id === task.id);
    const completed_quantity = completion?.completed_quantity || 0;
    const progress_percentage = (completed_quantity / task.target_quantity) * 100;
    
    return {
      ...task,
      completed_quantity,
      is_completed: completed_quantity >= task.target_quantity,
      progress_percentage: Math.min(progress_percentage, 100)
    };
  });

  // Estatísticas gerais
  const totalTasks = tasks.length;
  const completedTasks = tasksWithProgress.filter(t => t.is_completed).length;
  const overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Marcar tarefa como completa
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, increment }: { taskId: string; increment: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Tarefa não encontrada');

      const completion = completions.find(c => c.task_id === taskId);
      const currentQuantity = completion?.completed_quantity || 0;
      const newQuantity = increment 
        ? Math.min(currentQuantity + 1, task.target_quantity)
        : Math.max(currentQuantity - 1, 0);

      const { error } = await supabase
        .from('daily_task_completions')
        .upsert({
          admin_id: user.id,
          task_id: taskId,
          date: targetDate,
          completed_quantity: newQuantity,
          completed_at: newQuantity >= task.target_quantity ? new Date().toISOString() : null
        }, {
          onConflict: 'task_id,date'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-completions', targetDate] });
      queryClient.invalidateQueries({ queryKey: ['discipline-calendar'] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar tarefa: ' + error.message);
    }
  });

  return {
    tasks: tasksWithProgress,
    totalTasks,
    completedTasks,
    overallProgress,
    isLoading: isLoadingTasks || isLoadingCompletions,
    toggleTask: (taskId: string, increment: boolean = true) => 
      toggleTaskMutation.mutate({ taskId, increment })
  };
};
