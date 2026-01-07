import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PeriodontalRecord {
  id: string;
  patient_id: string;
  store_id: string;
  tooth_number: number;
  position: string;
  pocket_depth: number;
  gingival_recession: number;
  bleeding: boolean;
  registered_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePeriodontalRecordInput {
  patient_id: string;
  store_id: string;
  tooth_number: number;
  position: string;
  pocket_depth: number;
  gingival_recession: number;
  bleeding: boolean;
}

export interface UpdatePeriodontalRecordInput {
  id: string;
  pocket_depth?: number;
  gingival_recession?: number;
  bleeding?: boolean;
}

// Classificação periodontal por profundidade de bolsa
export const PERIODONTAL_CLASSIFICATION = {
  healthy: { min: 0, max: 3, color: "#22c55e", label: "Saudável (0-3mm)" },
  moderate: { min: 4, max: 5, color: "#eab308", label: "Moderado (4-5mm)" },
  severe: { min: 6, max: 15, color: "#ef4444", label: "Grave (6mm+)" },
};

export function getPeriodontalClassification(pocketDepth: number) {
  if (pocketDepth <= 3) return PERIODONTAL_CLASSIFICATION.healthy;
  if (pocketDepth <= 5) return PERIODONTAL_CLASSIFICATION.moderate;
  return PERIODONTAL_CLASSIFICATION.severe;
}

export function usePeriodontalRecords(patientId: string, storeId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["periodontal-records", patientId, storeId];

  const { data: records = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("periodontal_records")
        .select("*")
        .eq("patient_id", patientId)
        .eq("store_id", storeId)
        .order("tooth_number", { ascending: true });

      if (error) throw error;
      return data as PeriodontalRecord[];
    },
    enabled: !!patientId && !!storeId,
  });

  // Agrupar registros por dente e posição
  const recordsByToothAndPosition = records.reduce((acc, record) => {
    const key = `${record.tooth_number}-${record.position}`;
    acc[key] = record;
    return acc;
  }, {} as Record<string, PeriodontalRecord>);

  // Agrupar registros por dente
  const recordsByTooth = records.reduce((acc, record) => {
    if (!acc[record.tooth_number]) {
      acc[record.tooth_number] = [];
    }
    acc[record.tooth_number].push(record);
    return acc;
  }, {} as Record<number, PeriodontalRecord[]>);

  const createOrUpdateRecord = useMutation({
    mutationFn: async (input: CreatePeriodontalRecordInput) => {
      const existingKey = `${input.tooth_number}-${input.position}`;
      const existing = recordsByToothAndPosition[existingKey];

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from("periodontal_records")
          .update({
            pocket_depth: input.pocket_depth,
            gingival_recession: input.gingival_recession,
            bleeding: input.bleeding,
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from("periodontal_records")
          .insert(input)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteRecord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("periodontal_records")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const getRecordForPosition = (toothNumber: number, position: string) => {
    return recordsByToothAndPosition[`${toothNumber}-${position}`] || null;
  };

  return {
    records,
    recordsByTooth,
    recordsByToothAndPosition,
    isLoading,
    createOrUpdateRecord,
    deleteRecord,
    getRecordForPosition,
  };
}
