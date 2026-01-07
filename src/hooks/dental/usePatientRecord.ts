import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PatientRecord {
  id: string;
  patient_id: string;
  blood_type: string | null;
  weight: number | null;
  height: number | null;
  allergies: string | null;
  allergy_latex: boolean;
  allergy_anesthesia: boolean;
  allergy_penicillin: boolean;
  current_medications: string | null;
  medical_conditions: string | null;
  previous_surgeries: string | null;
  is_pregnant: boolean;
  is_breastfeeding: boolean;
  has_pacemaker: boolean;
  has_heart_condition: boolean;
  has_diabetes: boolean;
  has_hypertension: boolean;
  has_bleeding_disorder: boolean;
  has_hepatitis: boolean;
  has_hiv: boolean;
  is_smoker: boolean;
  smoking_frequency: string | null;
  alcohol_consumption: string | null;
  bruxism: boolean;
  clinical_observations: string | null;
  last_updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export type PatientRecordFormData = Omit<PatientRecord, 'id' | 'created_at' | 'updated_at'>;

export function usePatientRecord(patientId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const recordQuery = useQuery({
    queryKey: ['patient-record', patientId],
    queryFn: async () => {
      if (!patientId) return null;
      
      const { data, error } = await (supabase as any)
        .from('patient_records')
        .select('*')
        .eq('patient_id', patientId)
        .maybeSingle();

      if (error) throw error;
      return data as PatientRecord | null;
    },
    enabled: !!patientId,
  });

  const upsertRecord = useMutation({
    mutationFn: async (recordData: Partial<PatientRecordFormData> & { patient_id: string }) => {
      const { data, error } = await (supabase as any)
        .from('patient_records')
        .upsert(recordData, { onConflict: 'patient_id' })
        .select()
        .single();

      if (error) throw error;
      return data as PatientRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-record', patientId] });
      toast({
        title: "Prontuário atualizado",
        description: "O prontuário foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar prontuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    record: recordQuery.data,
    isLoading: recordQuery.isLoading,
    error: recordQuery.error,
    upsertRecord,
    refetch: recordQuery.refetch,
  };
}
