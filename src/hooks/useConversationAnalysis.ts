import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AnalysisFilters {
  period: 'today' | '7days' | '30days' | 'all';
  confidence: 'all' | 'high' | 'medium' | 'low';
  status: 'all' | 'success' | 'error' | 'pending';
  canal: 'all' | 'sistema' | 'manual_whatsapp' | 'indefinido';
  intencao: 'all' | 'yes' | 'no';
  fechamento: 'all' | 'yes' | 'no';
  search: string;
  page: number;
  pageSize: number;
}

export interface AnalysisRecord {
  id: string;
  conversation_id: string;
  remote_jid: string;
  phone_number: string;
  contact_name: string | null;
  houve_intencao_compra: boolean;
  houve_fechamento: boolean;
  valor_estimado: number;
  canal_fechamento: string;
  atendimento_predominante: string;
  precisou_humano: boolean;
  motivo_sem_fechamento: string | null;
  resumo_comercial: string | null;
  confidence_score: number;
  confidence_reason: string | null;
  analysis_status: string;
  analysis_error: string | null;
  retry_count: number;
  prompt_version: string | null;
  total_messages_analyzed: number;
  last_message_at: string | null;
  analyzed_at: string | null;
  created_at: string;
}

export interface AnalysisKPIs {
  totalAnalisadas: number;
  comIntencao: number;
  comFechamento: number;
  vendasForaDoSistema: number;
  faturamentoEstimado: number;
  faturamentoInvisivel: number;
  pendentes: number;
  taxaFechamento: number;
}

export const DEFAULT_FILTERS: AnalysisFilters = {
  period: '30days',
  confidence: 'all',
  status: 'all',
  canal: 'all',
  intencao: 'all',
  fechamento: 'all',
  search: '',
  page: 1,
  pageSize: 10
};

function getDateFilter(period: string): string | null {
  const now = new Date();
  switch (period) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    case '7days':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30days':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return null;
  }
}

export function useConversationAnalysis(storeId: string | undefined, filters: AnalysisFilters = DEFAULT_FILTERS) {
  // Buscar dados analisados com cast para tabela nova
  const { data: analyses, isLoading, refetch } = useQuery({
    queryKey: ['conversation-analysis', storeId, filters],
    queryFn: async () => {
      if (!storeId) return [];

      const client = supabase as any;
      let query = client
        .from('whatsapp_conversation_analysis')
        .select('*')
        .eq('store_id', storeId)
        .neq('analysis_status', 'skipped')
        .order('last_message_at', { ascending: false });

      const dateFilter = getDateFilter(filters.period);
      if (dateFilter) query = query.gte('last_message_at', dateFilter);
      if (filters.status !== 'all') query = query.eq('analysis_status', filters.status);

      if (filters.confidence !== 'all') {
        switch (filters.confidence) {
          case 'high': query = query.gte('confidence_score', 80); break;
          case 'medium': query = query.gte('confidence_score', 50).lt('confidence_score', 80); break;
          case 'low': query = query.lt('confidence_score', 50); break;
        }
      }

      if (filters.canal !== 'all') query = query.eq('canal_fechamento', filters.canal);
      if (filters.intencao !== 'all') query = query.eq('houve_intencao_compra', filters.intencao === 'yes');
      if (filters.fechamento !== 'all') query = query.eq('houve_fechamento', filters.fechamento === 'yes');
      if (filters.search.trim()) {
        const term = filters.search.trim();
        query = query.or(`contact_name.ilike.%${term}%,phone_number.ilike.%${term}%`);
      }

      const from = (filters.page - 1) * filters.pageSize;
      const to = from + filters.pageSize - 1;
      query = query.range(from, to);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as AnalysisRecord[];
    },
    enabled: !!storeId
  });

  // KPIs globais
  const { data: allAnalyses } = useQuery({
    queryKey: ['conversation-analysis-kpis', storeId, filters.period],
    queryFn: async () => {
      if (!storeId) return [];
      const client = supabase as any;
      let query = client
        .from('whatsapp_conversation_analysis')
        .select('houve_intencao_compra, houve_fechamento, valor_estimado, canal_fechamento, analysis_status, atendimento_predominante')
        .eq('store_id', storeId)
        .eq('analysis_status', 'success');

      const dateFilter = getDateFilter(filters.period);
      if (dateFilter) query = query.gte('last_message_at', dateFilter);

      const { data } = await query;
      return (data || []) as Array<{
        houve_intencao_compra: boolean;
        houve_fechamento: boolean;
        valor_estimado: number;
        canal_fechamento: string;
        analysis_status: string;
        atendimento_predominante: string;
      }>;
    },
    enabled: !!storeId
  });

  // Contar pendentes
  const { data: pendingCount } = useQuery({
    queryKey: ['conversation-analysis-pending', storeId],
    queryFn: async () => {
      if (!storeId) return 0;

      const { count: totalConvs } = await supabase
        .from('whatsapp_conversations')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', storeId)
        .not('remote_jid', 'like', '%@g.us');

      const client = supabase as any;
      const { count: analyzedCount } = await client
        .from('whatsapp_conversation_analysis')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', storeId);

      return Math.max(0, (totalConvs || 0) - (analyzedCount || 0));
    },
    enabled: !!storeId
  });

  // Total para paginação
  const { data: totalCount } = useQuery({
    queryKey: ['conversation-analysis-count', storeId, filters],
    queryFn: async () => {
      if (!storeId) return 0;
      const client = supabase as any;
      let query = client
        .from('whatsapp_conversation_analysis')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', storeId)
        .neq('analysis_status', 'skipped');

      const dateFilter = getDateFilter(filters.period);
      if (dateFilter) query = query.gte('last_message_at', dateFilter);
      if (filters.status !== 'all') query = query.eq('analysis_status', filters.status);
      if (filters.canal !== 'all') query = query.eq('canal_fechamento', filters.canal);
      if (filters.intencao !== 'all') query = query.eq('houve_intencao_compra', filters.intencao === 'yes');
      if (filters.fechamento !== 'all') query = query.eq('houve_fechamento', filters.fechamento === 'yes');

      const { count } = await query;
      return count || 0;
    },
    enabled: !!storeId
  });

  const kpis: AnalysisKPIs = useMemo(() => {
    const items = allAnalyses || [];
    const totalAnalisadas = items.length;
    const comIntencao = items.filter(a => a.houve_intencao_compra).length;
    const comFechamento = items.filter(a => a.houve_fechamento).length;
    const vendasForaDoSistema = items.filter(a => a.houve_fechamento && a.canal_fechamento === 'manual_whatsapp').length;
    const faturamentoEstimado = items.reduce((sum, a) => sum + (Number(a.valor_estimado) || 0), 0);
    const faturamentoInvisivel = items
      .filter(a => a.canal_fechamento === 'manual_whatsapp')
      .reduce((sum, a) => sum + (Number(a.valor_estimado) || 0), 0);
    const taxaFechamento = comIntencao > 0 ? (comFechamento / comIntencao) * 100 : 0;

    return {
      totalAnalisadas,
      comIntencao,
      comFechamento,
      vendasForaDoSistema,
      faturamentoEstimado,
      faturamentoInvisivel,
      pendentes: pendingCount || 0,
      taxaFechamento
    };
  }, [allAnalyses, pendingCount]);

  return { analyses: analyses || [], allSuccessAnalyses: allAnalyses || [], kpis, isLoading, totalCount: totalCount || 0, refetch };
}
