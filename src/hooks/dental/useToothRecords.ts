import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ToothRecord {
  id: string;
  patient_id: string;
  store_id: string;
  tooth_number: number;
  face: string | null;
  condition: string;
  treatment_done: string | null;
  material: string | null;
  color: string | null;
  notes: string | null;
  registered_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ToothRecordFormData = {
  patient_id: string;
  store_id: string;
  tooth_number: number;
  face?: string;
  condition: string;
  treatment_done?: string;
  material?: string;
  color?: string;
  notes?: string;
};

// Condições disponíveis para os dentes
export const TOOTH_CONDITIONS = {
  healthy: { label: "Saudável", color: "#22c55e" },
  caries: { label: "Cárie", color: "#ef4444" },
  restoration: { label: "Restauração", color: "#3b82f6" },
  extraction: { label: "Extração", color: "#6b7280" },
  missing: { label: "Ausente", color: "#d1d5db" },
  implant: { label: "Implante", color: "#8b5cf6" },
  crown: { label: "Coroa", color: "#f59e0b" },
  endodontic: { label: "Endodontia", color: "#ec4899" },
  prosthesis: { label: "Prótese", color: "#14b8a6" },
  fracture: { label: "Fratura", color: "#f97316" },
  periapical: { label: "Lesão Periapical", color: "#dc2626" },
  mobility: { label: "Mobilidade", color: "#eab308" },
} as const;

// Faces do dente
export const TOOTH_FACES = {
  V: "Vestibular",
  L: "Lingual/Palatina",
  M: "Mesial",
  D: "Distal",
  O: "Oclusal",
  I: "Incisal",
} as const;

export function useToothRecords(patientId: string | null, storeId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const recordsQuery = useQuery({
    queryKey: ['tooth-records', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      
      const { data, error } = await (supabase as any)
        .from('tooth_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('tooth_number', { ascending: true });

      if (error) throw error;
      return data as ToothRecord[];
    },
    enabled: !!patientId,
  });

  const createRecord = useMutation({
    mutationFn: async (recordData: ToothRecordFormData) => {
      const { data, error } = await (supabase as any)
        .from('tooth_records')
        .insert(recordData)
        .select()
        .single();

      if (error) throw error;
      return data as ToothRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tooth-records', patientId] });
      toast({
        title: "Registro salvo",
        description: "O registro do dente foi salvo com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRecord = useMutation({
    mutationFn: async ({ id, ...recordData }: Partial<ToothRecord> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('tooth_records')
        .update(recordData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ToothRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tooth-records', patientId] });
      toast({
        title: "Registro atualizado",
        description: "O registro do dente foi atualizado com sucesso.",
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

  const deleteRecord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('tooth_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tooth-records', patientId] });
      toast({
        title: "Registro removido",
        description: "O registro do dente foi removido com sucesso.",
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

  // Agrupar registros por dente
  const recordsByTooth = recordsQuery.data?.reduce((acc, record) => {
    if (!acc[record.tooth_number]) {
      acc[record.tooth_number] = [];
    }
    acc[record.tooth_number].push(record);
    return acc;
  }, {} as Record<number, ToothRecord[]>) || {};

  return {
    records: recordsQuery.data || [],
    recordsByTooth,
    isLoading: recordsQuery.isLoading,
    error: recordsQuery.error,
    createRecord,
    updateRecord,
    deleteRecord,
    refetch: recordsQuery.refetch,
  };
}
