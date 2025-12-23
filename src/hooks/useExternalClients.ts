import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ExternalClient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateExternalClientParams {
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  address?: string;
  notes?: string;
}

export interface UpdateExternalClientParams extends Partial<CreateExternalClientParams> {
  id: string;
  is_active?: boolean;
}

export function useExternalClients() {
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading, error, refetch } = useQuery({
    queryKey: ["external-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("external_clients")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data as ExternalClient[];
    },
  });

  const createClient = useMutation({
    mutationFn: async (params: CreateExternalClientParams) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("external_clients")
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
      queryClient.invalidateQueries({ queryKey: ["external-clients"] });
      toast.success("Cliente criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar cliente: ${error.message}`);
    },
  });

  const updateClient = useMutation({
    mutationFn: async ({ id, ...params }: UpdateExternalClientParams) => {
      const { data, error } = await supabase
        .from("external_clients")
        .update(params)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-clients"] });
      toast.success("Cliente atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar cliente: ${error.message}`);
    },
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("external_clients")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-clients"] });
      toast.success("Cliente removido com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover cliente: ${error.message}`);
    },
  });

  return {
    clients,
    isLoading,
    error,
    refetch,
    createClient,
    updateClient,
    deleteClient,
  };
}
