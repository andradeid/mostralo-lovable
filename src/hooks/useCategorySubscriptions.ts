import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CategorySubscription {
  id: string;
  user_id: string;
  category_id: string;
  notify_in_app: boolean;
  created_at: string;
}

// Buscar inscrições do usuário atual
export function useMySubscriptions() {
  return useQuery({
    queryKey: ["category-subscriptions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("tutorial_category_subscriptions")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data as CategorySubscription[];
    },
  });
}

// Verificar se está inscrito em uma categoria
export function useIsSubscribed(categoryId: string) {
  const { data: subscriptions } = useMySubscriptions();
  return subscriptions?.some(s => s.category_id === categoryId) || false;
}

// Toggle inscrição em categoria
export function useToggleSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ categoryId, isSubscribed }: { categoryId: string; isSubscribed: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      if (isSubscribed) {
        // Cancelar inscrição
        const { error } = await supabase
          .from("tutorial_category_subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("category_id", categoryId);

        if (error) throw error;
        return { action: "unsubscribed" };
      } else {
        // Inscrever-se
        const { error } = await supabase
          .from("tutorial_category_subscriptions")
          .insert({ user_id: user.id, category_id: categoryId, notify_in_app: true });

        if (error) throw error;
        return { action: "subscribed" };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["category-subscriptions"] });
      toast.success(
        result.action === "subscribed" 
          ? "Você será notificado sobre novos tutoriais desta categoria!" 
          : "Notificações desativadas para esta categoria"
      );
    },
    onError: () => {
      toast.error("Erro ao atualizar inscrição");
    },
  });
}
