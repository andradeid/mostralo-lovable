import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ExternalService {
  id: string;
  name: string;
  description: string | null;
  default_price: number;
  billing_type: "fixed" | "hourly" | "monthly";
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateExternalServiceParams {
  name: string;
  description?: string;
  default_price: number;
  billing_type?: "fixed" | "hourly" | "monthly";
}

export interface UpdateExternalServiceParams extends Partial<CreateExternalServiceParams> {
  id: string;
  is_active?: boolean;
}

export function useExternalServices() {
  const queryClient = useQueryClient();

  const { data: services = [], isLoading, error, refetch } = useQuery({
    queryKey: ["external-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("external_services")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data as ExternalService[];
    },
  });

  const createService = useMutation({
    mutationFn: async (params: CreateExternalServiceParams) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("external_services")
        .insert({
          ...params,
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-services"] });
      toast.success("Serviço criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar serviço: ${error.message}`);
    },
  });

  const updateService = useMutation({
    mutationFn: async ({ id, ...params }: UpdateExternalServiceParams) => {
      const { data, error } = await supabase
        .from("external_services")
        .update(params)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-services"] });
      toast.success("Serviço atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar serviço: ${error.message}`);
    },
  });

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("external_services")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-services"] });
      toast.success("Serviço removido com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover serviço: ${error.message}`);
    },
  });

  return {
    services,
    isLoading,
    error,
    refetch,
    createService,
    updateService,
    deleteService,
  };
}
