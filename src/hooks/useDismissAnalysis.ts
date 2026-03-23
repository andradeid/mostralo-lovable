import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useDismissAnalysis() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ analysisId, reason }: { analysisId: string; reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const client = supabase as any;
      
      const { error } = await client
        .from('whatsapp_conversation_analysis')
        .update({
          dismissed_at: new Date().toISOString(),
          dismissed_reason: reason,
          dismissed_by: user?.id || null,
        })
        .eq('id', analysisId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Conversa desconsiderada dos KPIs');
      queryClient.invalidateQueries({ queryKey: ['conversation-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['conversation-analysis-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['conversation-analysis-lost'] });
      queryClient.invalidateQueries({ queryKey: ['conversation-analysis-count'] });
      queryClient.invalidateQueries({ queryKey: ['response-time-stats'] });
    },
    onError: () => {
      toast.error('Erro ao desconsiderar conversa');
    },
  });

  return {
    dismissAnalysis: (analysisId: string, reason: string) =>
      mutation.mutate({ analysisId, reason }),
    isDismissing: mutation.isPending,
  };
}
