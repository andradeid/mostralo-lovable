import { useState, useEffect } from "react";
import { AnalysisRecord, AnalysisFilters } from "@/hooks/useConversationAnalysis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, RefreshCw, ChevronLeft, ChevronRight, Search, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface AnalysisTableProps {
  analyses: AnalysisRecord[];
  filters: AnalysisFilters;
  onFiltersChange: (filters: Partial<AnalysisFilters>) => void;
  totalCount: number;
  onViewConversation: (analysis: AnalysisRecord) => void;
  onReprocess: (conversationId: string) => void;
  onDismiss?: (analysisId: string, reason: string) => void;
  isReprocessing: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(date: string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function getConfidenceBadge(score: number) {
  if (score >= 80) return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Alta ({score}%)</Badge>;
  if (score >= 50) return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Média ({score}%)</Badge>;
  return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Baixa ({score}%)</Badge>;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'success': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">✓</Badge>;
    case 'error': return <Badge variant="destructive">Erro</Badge>;
    default: return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pendente</Badge>;
  }
}

function getRowHighlight(a: AnalysisRecord): string {
  if (a.houve_fechamento) return 'border-l-4 border-l-green-400 bg-green-50/30 dark:bg-green-950/10';
  if (a.houve_intencao_compra && !a.houve_fechamento) return 'border-l-4 border-l-amber-400 bg-amber-50/30 dark:bg-amber-950/10';
  return '';
}

export function AnalysisTable({ analyses, filters, onFiltersChange, totalCount, onViewConversation, onReprocess, isReprocessing }: AnalysisTableProps) {
  const totalPages = Math.ceil(totalCount / filters.pageSize);
  const [searchInput, setSearchInput] = useState(filters.search || '');

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFiltersChange({ search: searchInput, page: 1 });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-sm font-medium">Conversas Analisadas</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou número..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={filters.intencao} onValueChange={v => onFiltersChange({ intencao: v as any, page: 1 })}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Intenção" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="yes">Com intenção</SelectItem>
                <SelectItem value="no">Sem intenção</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.fechamento} onValueChange={v => onFiltersChange({ fechamento: v as any, page: 1 })}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Fechamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="yes">Com fechamento</SelectItem>
                <SelectItem value="no">Sem fechamento</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.confidence} onValueChange={v => onFiltersChange({ confidence: v as any, page: 1 })}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Confiança" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="high">Alta (80+)</SelectItem>
                <SelectItem value="medium">Média (50-79)</SelectItem>
                <SelectItem value="low">Baixa (&lt;50)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.canal} onValueChange={v => onFiltersChange({ canal: v as any, page: 1 })}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="sistema">Sistema</SelectItem>
                <SelectItem value="manual_whatsapp">WhatsApp</SelectItem>
                <SelectItem value="indefinido">Indefinido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {analyses.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Nenhuma conversa analisada neste período
          </div>
        ) : (
          <div className="divide-y">
            {analyses.map((a) => (
              <div 
                key={a.id} 
                className={`p-3 hover:bg-muted/50 transition-colors ${getRowHighlight(a)}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">
                        {a.contact_name || a.phone_number}
                      </span>
                      {getStatusBadge(a.analysis_status)}
                      {a.houve_intencao_compra && (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">Intenção</Badge>
                      )}
                      {a.houve_fechamento && (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">Convertida</Badge>
                      )}
                      {a.canal_fechamento === 'manual_whatsapp' && a.houve_fechamento && (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">Não Registrada</Badge>
                      )}
                      {a.houve_intencao_compra && !a.houve_fechamento && (
                        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-xs">Oportunidade</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {a.resumo_comercial || 'Sem resumo'}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{formatDate(a.last_message_at)}</span>
                      {a.valor_estimado > 0 && (
                        <span className="font-medium text-green-600">{formatCurrency(a.valor_estimado)}</span>
                      )}
                      {getConfidenceBadge(a.confidence_score)}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onViewConversation(a)}
                      title="Ver conversa"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onReprocess(a.conversation_id)}
                      disabled={isReprocessing}
                      title="Reprocessar"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isReprocessing ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginação */}
        {totalCount > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Mostrando {((filters.page - 1) * filters.pageSize) + 1}–{Math.min(filters.page * filters.pageSize, totalCount)} de {totalCount}
              </span>
              <Select 
                value={String(filters.pageSize)} 
                onValueChange={v => onFiltersChange({ pageSize: Number(v), page: 1 })}
              >
                <SelectTrigger className="w-[80px] h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={filters.page <= 1}
                  onClick={() => onFiltersChange({ page: 1 })}
                  title="Primeira página"
                >
                  <span className="text-xs font-medium">1</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={filters.page <= 1}
                  onClick={() => onFiltersChange({ page: filters.page - 1 })}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="px-2 text-xs font-medium text-muted-foreground">
                  {filters.page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={filters.page >= totalPages}
                  onClick={() => onFiltersChange({ page: filters.page + 1 })}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={filters.page >= totalPages}
                  onClick={() => onFiltersChange({ page: totalPages })}
                  title="Última página"
                >
                  <span className="text-xs font-medium">{totalPages}</span>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
