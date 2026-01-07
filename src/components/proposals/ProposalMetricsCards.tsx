import { Card, CardContent } from "@/components/ui/card";
import { Send, Eye, CheckCircle, XCircle, Percent, DollarSign, Clock, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricsCardsProps {
  summary: {
    total: number;
    sent: number;
    viewed: number;
    accepted: number;
    rejected: number;
    conversionRate: number;
    viewRate: number;
    totalConvertedValue: number;
    averageTicket: number;
    pendingCount: number;
  };
  timeMetrics: {
    avgViewTimeHours: number | null;
    avgAcceptTimeHours: number | null;
  };
  isLoading?: boolean;
}

export function ProposalMetricsCards({ summary, timeMetrics, isLoading }: MetricsCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatTime = (hours: number | null) => {
    if (hours === null) return "-";
    if (hours < 1) return `${Math.round(hours * 60)}min`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  const metrics = [
    {
      label: "Total Enviadas",
      value: summary.sent + summary.viewed + summary.accepted + summary.rejected,
      icon: Send,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Visualizadas",
      value: summary.viewed + summary.accepted + summary.rejected,
      icon: Eye,
      color: "text-warning",
      bgColor: "bg-warning/10",
      subValue: `${summary.viewRate.toFixed(0)}% taxa`,
    },
    {
      label: "Aceitas",
      value: summary.accepted,
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Rejeitadas",
      value: summary.rejected,
      icon: XCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      label: "Taxa de Conversão",
      value: `${summary.conversionRate.toFixed(1)}%`,
      icon: Percent,
      color: "text-accent-foreground",
      bgColor: "bg-accent",
    },
    {
      label: "Valor Convertido",
      value: formatCurrency(summary.totalConvertedValue),
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Ticket Médio",
      value: formatCurrency(summary.averageTicket),
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Tempo p/ Aceite",
      value: formatTime(timeMetrics.avgAcceptTimeHours),
      icon: Clock,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.label} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={`h-5 w-5 ${metric.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">{metric.label}</p>
                <p className="text-lg font-bold truncate">{metric.value}</p>
                {metric.subValue && (
                  <p className="text-xs text-muted-foreground">{metric.subValue}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
