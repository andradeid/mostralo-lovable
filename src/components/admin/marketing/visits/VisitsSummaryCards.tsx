import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Users, FileText, TrendingDown } from "lucide-react";

interface VisitsSummaryCardsProps {
  totalVisits: number;
  uniqueVisitors: number;
  pagesPerSession: number;
  bounceRate: number;
  loading?: boolean;
}

export function VisitsSummaryCards({
  totalVisits,
  uniqueVisitors,
  pagesPerSession,
  bounceRate,
  loading,
}: VisitsSummaryCardsProps) {
  const cards = [
    {
      title: "Total de Visitas",
      value: totalVisits.toLocaleString("pt-BR"),
      icon: Eye,
      description: "Pageviews no período",
    },
    {
      title: "Visitantes Únicos",
      value: uniqueVisitors.toLocaleString("pt-BR"),
      icon: Users,
      description: "Por sessão única",
    },
    {
      title: "Páginas / Sessão",
      value: pagesPerSession.toFixed(1),
      icon: FileText,
      description: "Média por visita",
    },
    {
      title: "Taxa de Rejeição",
      value: `${bounceRate.toFixed(1)}%`,
      icon: TrendingDown,
      description: "Sessões com 1 página",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : card.value}
            </div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
