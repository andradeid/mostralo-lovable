import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MousePointerClick, MessageCircle, UserPlus, Download, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClicksAnalyticsProps {
  visits: any[];
  loading: boolean;
}

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  click_whatsapp: { label: "WhatsApp", color: "hsl(var(--chart-1))" },
  click_cta_signup: { label: "Cadastro", color: "hsl(var(--chart-2))" },
  click_cta_diagnostico: { label: "Diagnóstico", color: "hsl(var(--chart-3))" },
  click_cta_plans: { label: "Ver Planos", color: "hsl(var(--chart-4))" },
  click_download: { label: "Download", color: "hsl(var(--chart-5))" },
};

export function ClicksAnalytics({ visits, loading }: ClicksAnalyticsProps) {
  // Filtrar apenas eventos de clique (não pageview)
  const clicks = useMemo(
    () => visits.filter((v) => v.event_type && v.event_type !== "pageview"),
    [visits]
  );

  const totalClicks = clicks.length;

  const clicksByType = useMemo(() => {
    const map = new Map<string, number>();
    clicks.forEach((c) => {
      const type = c.event_type || "other";
      map.set(type, (map.get(type) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([type, count]) => ({
        type,
        label: EVENT_LABELS[type]?.label || type,
        count,
        color: EVENT_LABELS[type]?.color || "hsl(var(--muted-foreground))",
      }))
      .sort((a, b) => b.count - a.count);
  }, [clicks]);

  const whatsappClicks = clicksByType.find((c) => c.type === "click_whatsapp")?.count || 0;
  const signupClicks = clicksByType.find((c) => c.type === "click_cta_signup")?.count || 0;
  const downloadClicks = clicksByType.find((c) => c.type === "click_download")?.count || 0;

  // Últimos cliques para tabela detalhada
  const recentClicks = useMemo(
    () => clicks.slice(0, 50),
    [clicks]
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-16" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MousePointerClick className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Cliques</p>
                <p className="text-2xl font-bold">{totalClicks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-1/10">
                <MessageCircle className="h-5 w-5 text-chart-1" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">WhatsApp</p>
                <p className="text-2xl font-bold">{whatsappClicks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-2/10">
                <UserPlus className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cadastro</p>
                <p className="text-2xl font-bold">{signupClicks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-5/10">
                <Download className="h-5 w-5 text-chart-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Downloads</p>
                <p className="text-2xl font-bold">{downloadClicks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gráfico de cliques por tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Cliques por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clicksByType.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum clique registrado no período
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={clicksByType} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" />
                  <YAxis dataKey="label" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--popover-foreground))",
                    }}
                  />
                  <Bar dataKey="count" name="Cliques" radius={[0, 4, 4, 0]}>
                    {clicksByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Tabela de cliques recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cliques Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentClicks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum clique registrado no período
              </p>
            ) : (
              <div className="max-h-[250px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead>Página</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentClicks.map((click: any) => (
                      <TableRow key={click.id}>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {EVENT_LABELS[click.event_type]?.label || click.event_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground truncate max-w-[120px]">
                          {click.event_label || "-"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground truncate max-w-[120px]">
                          {click.page_url}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(click.created_at), "dd/MM HH:mm", { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
