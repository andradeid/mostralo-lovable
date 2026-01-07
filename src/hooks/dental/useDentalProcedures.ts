import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface DentalProcedure {
  id: string;
  store_id: string;
  code: string | null;
  name: string;
  description: string | null;
  category: string | null;
  default_price: number;
  estimated_duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type DentalProcedureFormData = {
  store_id: string;
  code?: string;
  name: string;
  description?: string;
  category?: string;
  default_price: number;
  estimated_duration_minutes?: number;
  is_active?: boolean;
};

// Categorias de procedimentos
export const PROCEDURE_CATEGORIES = [
  { value: "prevention", label: "Prevenção" },
  { value: "restoration", label: "Restauração" },
  { value: "endodontics", label: "Endodontia" },
  { value: "periodontics", label: "Periodontia" },
  { value: "surgery", label: "Cirurgia" },
  { value: "prosthesis", label: "Prótese" },
  { value: "orthodontics", label: "Ortodontia" },
  { value: "aesthetics", label: "Estética" },
  { value: "implant", label: "Implantodontia" },
  { value: "pediatric", label: "Odontopediatria" },
  { value: "other", label: "Outros" },
] as const;

export function useDentalProcedures(storeId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const proceduresQuery = useQuery({
    queryKey: ['dental-procedures', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      
      const { data, error } = await (supabase as any)
        .from('dental_procedures')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as DentalProcedure[];
    },
    enabled: !!storeId,
  });

  const createProcedure = useMutation({
    mutationFn: async (procedureData: DentalProcedureFormData) => {
      const { data, error } = await (supabase as any)
        .from('dental_procedures')
        .insert(procedureData)
        .select()
        .single();

      if (error) throw error;
      return data as DentalProcedure;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dental-procedures', storeId] });
      toast({
        title: "Procedimento criado",
        description: "O procedimento foi cadastrado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar procedimento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProcedure = useMutation({
    mutationFn: async ({ id, ...procedureData }: Partial<DentalProcedure> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('dental_procedures')
        .update(procedureData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as DentalProcedure;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dental-procedures', storeId] });
      toast({
        title: "Procedimento atualizado",
        description: "O procedimento foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar procedimento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteProcedure = useMutation({
    mutationFn: async (id: string) => {
      // Soft delete - apenas desativa
      const { error } = await (supabase as any)
        .from('dental_procedures')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dental-procedures', storeId] });
      toast({
        title: "Procedimento removido",
        description: "O procedimento foi removido com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover procedimento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Agrupar por categoria
  const proceduresByCategory = proceduresQuery.data?.reduce((acc, proc) => {
    const cat = proc.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(proc);
    return acc;
  }, {} as Record<string, DentalProcedure[]>) || {};

  return {
    procedures: proceduresQuery.data || [],
    proceduresByCategory,
    isLoading: proceduresQuery.isLoading,
    error: proceduresQuery.error,
    createProcedure,
    updateProcedure,
    deleteProcedure,
    refetch: proceduresQuery.refetch,
  };
}
