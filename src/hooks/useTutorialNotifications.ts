import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TutorialNotification {
  id: string;
  user_id: string;
  tutorial_id: string;
  category_id: string | null;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
}

// Buscar notificações do usuário atual
export function useMyNotifications() {
  return useQuery({
    queryKey: ["tutorial-notifications"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("tutorial_notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as TutorialNotification[];
    },
  });
}

// Contagem de não lidas
export function useUnreadCount() {
  const { data: notifications } = useMyNotifications();
  return notifications?.filter(n => !n.is_read).length || 0;
}

// Marcar como lida
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("tutorial_notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutorial-notifications"] });
    },
  });
}

// Marcar todas como lidas
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("tutorial_notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutorial-notifications"] });
    },
  });
}
