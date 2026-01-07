import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Patient {
  id: string;
  store_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  phone_secondary: string | null;
  cpf: string | null;
  rg: string | null;
  birth_date: string | null;
  gender: string | null;
  occupation: string | null;
  marital_status: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  health_insurance: string | null;
  health_insurance_number: string | null;
  health_insurance_validity: string | null;
  photo_url: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type PatientFormData = Omit<Patient, 'id' | 'created_at' | 'updated_at'>;

interface UsePatientsMutationOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function usePatients(storeId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const patientsQuery = useQuery({
    queryKey: ['patients', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('store_id', storeId)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Patient[];
    },
    enabled: !!storeId,
  });

  const createPatient = useMutation({
    mutationFn: async (patientData: PatientFormData) => {
      const { data, error } = await supabase
        .from('patients')
        .insert(patientData)
        .select()
        .single();

      if (error) throw error;
      return data as Patient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients', storeId] });
      toast({
        title: "Paciente cadastrado",
        description: "O paciente foi cadastrado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cadastrar paciente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePatient = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Patient> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('patients')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as Patient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients', storeId] });
      toast({
        title: "Paciente atualizado",
        description: "Os dados do paciente foram atualizados com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar paciente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePatient = useMutation({
    mutationFn: async (patientId: string) => {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients', storeId] });
      toast({
        title: "Paciente removido",
        description: "O paciente foi removido com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover paciente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    patients: patientsQuery.data ?? [],
    isLoading: patientsQuery.isLoading,
    error: patientsQuery.error,
    createPatient,
    updatePatient,
    deletePatient,
    refetch: patientsQuery.refetch,
  };
}

export function usePatient(patientId: string | null) {
  return useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      if (!patientId) return null;
      
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error) throw error;
      return data as Patient;
    },
    enabled: !!patientId,
  });
}
