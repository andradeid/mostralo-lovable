import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface AnalyzeResult {
  success: boolean;
  processed: number;
  errors: number;
  total: number;
  results?: any[];
}

export function useAnalyzeConversations(storeId: string | undefined) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const queryClient = useQueryClient();

  // Invalida todas as queries relacionadas à análise comercial
  const invalidateAllAnalysisQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['conversation-analysis'] });
    queryClient.invalidateQueries({ queryKey: ['conversation-analysis-kpis'] });
    queryClient.invalidateQueries({ queryKey: ['conversation-analysis-lost'] });
    queryClient.invalidateQueries({ queryKey: ['conversation-analysis-pending'] });
    queryClient.invalidateQueries({ queryKey: ['conversation-analysis-count'] });
    queryClient.invalidateQueries({ queryKey: ['response-time-stats'] });
  };

  const analyzeBatch = async (batchSize = 10): Promise<AnalyzeResult | null> => {
    if (!storeId || isAnalyzing) return null;

    setIsAnalyzing(true);
    setProgress('Processando conversas...');

    try {
      const { data, error } = await supabase.functions.invoke('analyze-whatsapp-conversations', {
        body: { storeId, batchSize }
      });

      if (error) throw error;

      if (data?.processed > 0) {
        toast.success(`${data.processed} conversa(s) analisada(s) com sucesso!`);
      } else {
        toast.info('Nenhuma conversa pendente para analisar');
      }

      if (data?.errors > 0) {
        toast.warning(`${data.errors} conversa(s) com erro na análise`);
      }

      return data as AnalyzeResult;
    } catch (error) {
      console.error('Erro ao analisar conversas:', error);
      toast.error('Erro ao processar conversas');
      return null;
    } finally {
      setIsAnalyzing(false);
      setProgress('');
    }
  };

  const reprocessConversation = async (conversationId: string): Promise<boolean> => {
    if (!storeId || isAnalyzing) return false;

    setIsAnalyzing(true);
    setProgress('Reprocessando conversa...');

    try {
      const { data, error } = await supabase.functions.invoke('analyze-whatsapp-conversations', {
        body: { storeId, conversationId }
      });

      if (error) throw error;

      if (data?.processed > 0) {
        toast.success('Conversa reprocessada com sucesso!');
        return true;
      }

      toast.warning('Não foi possível reprocessar a conversa');
      return false;
    } catch (error) {
      console.error('Erro ao reprocessar:', error);
      toast.error('Erro ao reprocessar conversa');
      return false;
    } finally {
      setIsAnalyzing(false);
      setProgress('');
    }
  };

  return {
    analyzeBatch,
    reprocessConversation,
    isAnalyzing,
    progress
  };
}
