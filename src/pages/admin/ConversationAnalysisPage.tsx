import { useState } from "react";
import { useStoreId } from "@/hooks/useStoreId";
import { useConversationAnalysis, DEFAULT_FILTERS, type AnalysisFilters, type AnalysisRecord } from "@/hooks/useConversationAnalysis";
import { useAnalyzeConversations } from "@/hooks/useAnalyzeConversations";
import { AnalysisKPIs } from "@/components/admin/conversation-analysis/AnalysisKPIs";
import { AnalysisFunnel } from "@/components/admin/conversation-analysis/AnalysisFunnel";
import { AnalysisCharts } from "@/components/admin/conversation-analysis/AnalysisCharts";
import { AnalysisTable } from "@/components/admin/conversation-analysis/AnalysisTable";
import { ConversationDetailModal } from "@/components/admin/conversation-analysis/ConversationDetailModal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Brain, Loader2, Sparkles } from "lucide-react";

export default function ConversationAnalysisPage() {
  const storeId = useStoreId();
  const [filters, setFilters] = useState<AnalysisFilters>(DEFAULT_FILTERS);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { analyses, kpis, isLoading, totalCount, refetch } = useConversationAnalysis(storeId, filters);
  const { analyzeBatch, reprocessConversation, isAnalyzing } = useAnalyzeConversations(storeId);

  const updateFilters = (partial: Partial<AnalysisFilters>) => {
    setFilters(prev => ({ ...prev, ...partial }));
  };

  const handleAnalyze = async () => {
    await analyzeBatch(10);
    refetch();
  };

  const handleReprocess = async (conversationId: string) => {
    const success = await reprocessConversation(conversationId);
    if (success) refetch();
  };

  const handleViewConversation = (analysis: AnalysisRecord) => {
    setSelectedAnalysis(analysis);
    setModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Barra superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Select value={filters.period} onValueChange={v => updateFilters({ period: v as any, page: 1 })}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="7days">7 dias</SelectItem>
              <SelectItem value="30days">30 dias</SelectItem>
              <SelectItem value="all">Todo período</SelectItem>
            </SelectContent>
          </Select>

          {kpis.pendentes > 0 && (
            <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
              {kpis.pendentes} pendente{kpis.pendentes > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        <Button 
          onClick={handleAnalyze} 
          disabled={isAnalyzing}
          className="gap-2"
        >
          {isAnalyzing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Brain className="h-4 w-4" />
          )}
          {isAnalyzing ? 'Processando...' : 'Processar Conversas'}
        </Button>
      </div>

      {/* Estado vazio */}
      {!isLoading && kpis.totalAnalisadas === 0 && kpis.pendentes > 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
          <div className="p-4 rounded-full bg-primary/10">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Análise Comercial com IA</h3>
            <p className="text-muted-foreground text-sm mt-1 max-w-md">
              Processe suas conversas de WhatsApp para identificar intenções de compra, 
              fechamentos e faturamento invisível.
            </p>
          </div>
          <Button onClick={handleAnalyze} disabled={isAnalyzing} size="lg" className="gap-2">
            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            Processar {Math.min(kpis.pendentes, 10)} conversas
          </Button>
        </div>
      )}

      {/* KPIs */}
      {(kpis.totalAnalisadas > 0 || isLoading) && (
        <>
          <AnalysisKPIs kpis={kpis} isLoading={isLoading} />

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AnalysisFunnel kpis={kpis} />
            <AnalysisCharts analyses={analyses} />
          </div>

          {/* Tabela */}
          <AnalysisTable
            analyses={analyses}
            filters={filters}
            onFiltersChange={updateFilters}
            totalCount={totalCount}
            onViewConversation={handleViewConversation}
            onReprocess={handleReprocess}
            isReprocessing={isAnalyzing}
          />
        </>
      )}

      {/* Modal */}
      <ConversationDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        analysis={selectedAnalysis}
        storeId={storeId}
      />
    </div>
  );
}
