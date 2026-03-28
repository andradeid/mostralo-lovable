import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SystemAlertConfig {
  id: string;
  is_enabled: boolean;
  alert_phone: string | null;
  alert_country_code: string;
  max_connections_percent: number;
  min_cache_hit_ratio: number;
  max_query_time_ms: number;
  cooldown_minutes: number;
  check_interval_minutes: number;
  last_alert_at: string | null;
  last_alert_type: string | null;
  last_check_at: string | null;
  last_check_status: string | null;
  created_at: string;
  updated_at: string;
}

export function useSystemAlertConfig() {
  const queryClient = useQueryClient();

  const query = useQuery<SystemAlertConfig | null>({
    queryKey: ["system-alert-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_alert_config" as any)
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data as unknown as SystemAlertConfig;
    },
    staleTime: 60000,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<SystemAlertConfig>) => {
      const { error } = await supabase
        .from("system_alert_config" as any)
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq("id", query.data?.id as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-alert-config"] });
      toast.success("Configuração de alerta salva!");
    },
    onError: (err: any) => {
      toast.error("Erro ao salvar: " + err.message);
    },
  });

  const testMutation = useMutation({
    mutationFn: async (updates?: Partial<SystemAlertConfig>) => {
      // Save current config first if updates provided
      if (updates && query.data?.id) {
        const { error: saveError } = await supabase
          .from("system_alert_config" as any)
          .update({ ...updates, updated_at: new Date().toISOString() } as any)
          .eq("id", query.data.id as any);
        if (saveError) throw new Error("Erro ao salvar antes do teste: " + saveError.message);
      }

      const { data, error } = await supabase.functions.invoke("system-health-alert", {
        body: { test: true },
      });
      if (error) throw new Error(error.message || "Falha no teste");
      if (!data?.success) throw new Error(data?.reason || "Falha desconhecida");
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.status === "test_sent" ? "Alerta de teste enviado!" : "Sistema saudável, teste enviado!");
      queryClient.invalidateQueries({ queryKey: ["system-alert-config"] });
    },
    onError: (err: any) => {
      toast.error("Erro no teste: " + err.message);
    },
  });

  return {
    config: query.data ?? null,
    isLoading: query.isLoading,
    save: updateMutation.mutate,
    isSaving: updateMutation.isPending,
    testAlert: testMutation.mutate,
    isTesting: testMutation.isPending,
  };
}
