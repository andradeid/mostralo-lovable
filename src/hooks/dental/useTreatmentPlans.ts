import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TreatmentPlan {
  id: string;
  patient_id: string;
  store_id: string;
  plan_number: string | null;
  name: string;
  description: string | null;
  status: string;
  total_value: number;
  discount_percentage: number;
  discount_value: number;
  final_value: number;
  notes: string | null;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface TreatmentPlanItem {
  id: string;
  plan_id: string;
  procedure_id: string | null;
  procedure_name: string;
  procedure_code: string | null;
  tooth_number: number | null;
  face: string | null;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  total_price: number;
  status: string;
  priority: number;
  notes: string | null;
  scheduled_date: string | null;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TreatmentPlanWithItems extends TreatmentPlan {
  items: TreatmentPlanItem[];
}

export type TreatmentPlanFormData = {
  patient_id: string;
  store_id: string;
  name: string;
  description?: string;
  notes?: string;
};

export type TreatmentPlanItemFormData = {
  plan_id: string;
  procedure_id?: string;
  procedure_name: string;
  procedure_code?: string;
  tooth_number?: number;
  face?: string;
  quantity?: number;
  unit_price: number;
  discount_percentage?: number;
  notes?: string;
  scheduled_date?: string;
};

// Status do plano de tratamento
export const PLAN_STATUS = {
  draft: { label: "Rascunho", color: "secondary" },
  pending_approval: { label: "Aguardando Aprovação", color: "warning" },
  approved: { label: "Aprovado", color: "success" },
  in_progress: { label: "Em Andamento", color: "default" },
  completed: { label: "Concluído", color: "success" },
  cancelled: { label: "Cancelado", color: "destructive" },
} as const;

// Status do item do plano
export const ITEM_STATUS = {
  pending: { label: "Pendente", color: "secondary" },
  scheduled: { label: "Agendado", color: "warning" },
  in_progress: { label: "Em Andamento", color: "default" },
  completed: { label: "Concluído", color: "success" },
  cancelled: { label: "Cancelado", color: "destructive" },
} as const;

export function useTreatmentPlans(patientId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const plansQuery = useQuery({
    queryKey: ['treatment-plans', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      
      const { data, error } = await (supabase as any)
        .from('treatment_plans')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TreatmentPlan[];
    },
    enabled: !!patientId,
  });

  const createPlan = useMutation({
    mutationFn: async (planData: TreatmentPlanFormData) => {
      const { data, error } = await (supabase as any)
        .from('treatment_plans')
        .insert(planData)
        .select()
        .single();

      if (error) throw error;
      return data as TreatmentPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-plans', patientId] });
      toast({
        title: "Plano criado",
        description: "O plano de tratamento foi criado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar plano",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePlan = useMutation({
    mutationFn: async ({ id, ...planData }: Partial<TreatmentPlan> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('treatment_plans')
        .update(planData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as TreatmentPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-plans', patientId] });
      toast({
        title: "Plano atualizado",
        description: "O plano de tratamento foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar plano",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('treatment_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-plans', patientId] });
      toast({
        title: "Plano removido",
        description: "O plano de tratamento foi removido com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover plano",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    plans: plansQuery.data || [],
    isLoading: plansQuery.isLoading,
    error: plansQuery.error,
    createPlan,
    updatePlan,
    deletePlan,
    refetch: plansQuery.refetch,
  };
}

export function useTreatmentPlanItems(planId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const itemsQuery = useQuery({
    queryKey: ['treatment-plan-items', planId],
    queryFn: async () => {
      if (!planId) return [];
      
      const { data, error } = await (supabase as any)
        .from('treatment_plan_items')
        .select('*')
        .eq('plan_id', planId)
        .order('priority', { ascending: true });

      if (error) throw error;
      return data as TreatmentPlanItem[];
    },
    enabled: !!planId,
  });

  const addItem = useMutation({
    mutationFn: async (itemData: TreatmentPlanItemFormData) => {
      const totalPrice = (itemData.quantity || 1) * itemData.unit_price * (1 - (itemData.discount_percentage || 0) / 100);
      
      const { data, error } = await (supabase as any)
        .from('treatment_plan_items')
        .insert({ ...itemData, total_price: totalPrice })
        .select()
        .single();

      if (error) throw error;
      return data as TreatmentPlanItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-plan-items', planId] });
      toast({
        title: "Procedimento adicionado",
        description: "O procedimento foi adicionado ao plano.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...itemData }: Partial<TreatmentPlanItem> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('treatment_plan_items')
        .update(itemData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as TreatmentPlanItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-plan-items', planId] });
      toast({
        title: "Procedimento atualizado",
        description: "O procedimento foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('treatment_plan_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-plan-items', planId] });
      toast({
        title: "Procedimento removido",
        description: "O procedimento foi removido do plano.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calcular totais
  const totals = itemsQuery.data?.reduce(
    (acc, item) => ({
      total: acc.total + item.total_price,
      completed: acc.completed + (item.status === 'completed' ? 1 : 0),
      pending: acc.pending + (item.status === 'pending' ? 1 : 0),
    }),
    { total: 0, completed: 0, pending: 0 }
  ) || { total: 0, completed: 0, pending: 0 };

  return {
    items: itemsQuery.data || [],
    totals,
    isLoading: itemsQuery.isLoading,
    error: itemsQuery.error,
    addItem,
    updateItem,
    removeItem,
    refetch: itemsQuery.refetch,
  };
}
