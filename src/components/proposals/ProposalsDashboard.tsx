import { useProposalMetrics } from "@/hooks/useProposalMetrics";
import { ProposalMetricsCards } from "./ProposalMetricsCards";
import { ProposalFunnelChart } from "./ProposalFunnelChart";
import { ProposalTimelineChart } from "./ProposalTimelineChart";
import { SalespersonRankingTable } from "./SalespersonRankingTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ProposalsDashboardProps {
  salespersonId?: string;
  showSalespersonRanking?: boolean;
}

export function ProposalsDashboard({ 
  salespersonId, 
  showSalespersonRanking = true 
}: ProposalsDashboardProps) {
  const { data: metrics, isLoading, error } = useProposalMetrics({
    salesperson_id: salespersonId,
  });

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="flex items-center gap-3 py-6">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">Erro ao carregar métricas</p>
        </CardContent>
      </Card>
    );
  }

  const defaultMetrics = {
    summary: {
      total: 0,
      sent: 0,
      viewed: 0,
      accepted: 0,
      rejected: 0,
      expired: 0,
      draft: 0,
      conversionRate: 0,
      viewRate: 0,
      totalConvertedValue: 0,
      averageTicket: 0,
      pendingCount: 0,
    },
    funnel: [],
    bySalesperson: [],
    byMonth: [],
    timeMetrics: {
      avgViewTimeHours: null,
      avgAcceptTimeHours: null,
    },
  };

  const data = metrics || defaultMetrics;

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <ProposalMetricsCards
        summary={data.summary}
        timeMetrics={data.timeMetrics}
        isLoading={isLoading}
      />

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        <ProposalFunnelChart data={data.funnel} isLoading={isLoading} />
        <ProposalTimelineChart data={data.byMonth} isLoading={isLoading} />
      </div>

      {/* Salesperson Ranking - Only for Master Admin */}
      {showSalespersonRanking && (
        <SalespersonRankingTable data={data.bySalesperson} isLoading={isLoading} />
      )}

      {/* Pending Proposals Alert */}
      {!isLoading && data.summary.pendingCount > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="flex items-center gap-3 py-4">
            <Clock className="h-5 w-5 text-warning" />
            <div>
              <p className="text-sm font-medium">
                {data.summary.pendingCount} proposta{data.summary.pendingCount > 1 ? 's' : ''} aguardando resposta
              </p>
              <p className="text-xs text-muted-foreground">
                {data.summary.sent} enviada{data.summary.sent > 1 ? 's' : ''}, {data.summary.viewed} visualizada{data.summary.viewed > 1 ? 's' : ''}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
