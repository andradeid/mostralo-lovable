import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TutorialFavorite {
  id: string;
  user_id: string;
  tutorial_id: string;
  created_at: string;
}

// Buscar favoritos do usuário atual
export function useMyFavorites() {
  return useQuery({
    queryKey: ["tutorial-favorites"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("tutorial_favorites")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TutorialFavorite[];
    },
  });
}

// Verificar se um tutorial é favorito
export function useIsFavorite(tutorialId: string) {
  const { data: favorites } = useMyFavorites();
  return favorites?.some(f => f.tutorial_id === tutorialId) || false;
}

// Toggle favorito
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tutorialId, isFavorite }: { tutorialId: string; isFavorite: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      if (isFavorite) {
        // Remover dos favoritos
        const { error } = await supabase
          .from("tutorial_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("tutorial_id", tutorialId);

        if (error) throw error;
        return { action: "removed" };
      } else {
        // Adicionar aos favoritos
        const { error } = await supabase
          .from("tutorial_favorites")
          .insert({ user_id: user.id, tutorial_id: tutorialId });

        if (error) throw error;
        return { action: "added" };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["tutorial-favorites"] });
      toast.success(
        result.action === "added" 
          ? "Tutorial adicionado aos favoritos!" 
          : "Tutorial removido dos favoritos"
      );
    },
    onError: () => {
      toast.error("Erro ao atualizar favoritos");
    },
  });
}
