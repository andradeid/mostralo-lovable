import { useState } from "react";
import { useStoreAccess } from "@/hooks/useStoreAccess";
import { useConversationAnalysis, DEFAULT_FILTERS, type AnalysisFilters, type AnalysisRecord } from "@/hooks/useConversationAnalysis";
import { useAnalyzeConversations } from "@/hooks/useAnalyzeConversations";
import { AnalysisKPIs } from "@/components/admin/conversation-analysis/AnalysisKPIs";
import { InsightBanner } from "@/components/admin/conversation-analysis/InsightBanner";
import { AnalysisFunnel } from "@/components/admin/conversation-analysis/AnalysisFunnel";
import { AnalysisCharts } from "@/components/admin/conversation-analysis/AnalysisCharts";
import { AnalysisTable } from "@/components/admin/conversation-analysis/AnalysisTable";
import { ConversationDetailModal } from "@/components/admin/conversation-analysis/ConversationDetailModal";
import { LostOpportunities } from "@/components/admin/conversation-analysis/LostOpportunities";
import { TemporalTrend } from "@/components/admin/conversation-analysis/TemporalTrend";
import { ResponseTimeKPI } from "@/components/admin/conversation-analysis/ResponseTimeKPI";
import { SmartAlerts } from "@/components/admin/conversation-analysis/SmartAlerts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Brain, Loader2, Sparkles, Zap } from "lucide-react";

export default function ConversationAnalysisPage() {
  const { storeId } = useStoreAccess();
  const [filters, setFilters] = useState<AnalysisFilters>(DEFAULT_FILTERS);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);

  const { analyses, allSuccessAnalyses, lostOpportunities, kpis, isLoading, totalCount, refetch, dateFilterValue } = useConversationAnalysis(storeId, filters);
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

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setActionModalOpen(true)}
            className="gap-2 text-sm"
          >
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Melhorar Conversão</span>
            <span className="sm:hidden">Ação</span>
          </Button>
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

      {/* Conteúdo principal */}
      {(kpis.totalAnalisadas > 0 || isLoading) && (
        <>
          {/* Insight Banner */}
          <InsightBanner kpis={kpis} />

          {/* KPIs */}
          <AnalysisKPIs kpis={kpis} isLoading={isLoading} />

          {/* Alertas Inteligentes */}
          <SmartAlerts analyses={allSuccessAnalyses as any} />

          {/* Gráficos - Linha 1: Funil + Charts existentes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AnalysisFunnel kpis={kpis} />
            <AnalysisCharts analyses={allSuccessAnalyses as any} />
          </div>

          {/* Gráficos - Linha 2: Tendência + Tempo de Resposta */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <TemporalTrend analyses={allSuccessAnalyses as any} />
            </div>
            <ResponseTimeKPI storeId={storeId} dateFrom={dateFilterValue} />
          </div>

          {/* Oportunidades Perdidas */}
          <LostOpportunities opportunities={lostOpportunities as any} />

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

      {/* Modal de conversa */}
      <ConversationDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        analysis={selectedAnalysis}
        storeId={storeId}
      />

      {/* Modal de ação estratégica */}
      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Melhorar Conversão
            </DialogTitle>
            <DialogDescription>
              Ações recomendadas para aumentar suas vendas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg border space-y-1">
              <p className="text-sm font-medium">🤖 Automação de Follow-up</p>
              <p className="text-xs text-muted-foreground">
                Configure respostas automáticas para clientes com intenção de compra que não fecharam.
              </p>
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs mt-1">Em breve</Badge>
            </div>
            <div className="p-3 rounded-lg border space-y-1">
              <p className="text-sm font-medium">📊 Registro Automático de Vendas</p>
              <p className="text-xs text-muted-foreground">
                Converta vendas manuais no WhatsApp em pedidos registrados automaticamente.
              </p>
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs mt-1">Em breve</Badge>
            </div>
            <div className="p-3 rounded-lg border space-y-1">
              <p className="text-sm font-medium">🎯 Alertas de Oportunidade</p>
              <p className="text-xs text-muted-foreground">
                Receba notificações quando um cliente demonstrar alta intenção de compra.
              </p>
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs mt-1">Em breve</Badge>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
