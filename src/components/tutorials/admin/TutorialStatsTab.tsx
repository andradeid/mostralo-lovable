import { useTutorialViewsStats } from "@/hooks/useTutorialViews";
import { useTutorials } from "@/hooks/useTutorials";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Eye, Users, CheckCircle, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function TutorialStatsTab() {
  const { data: stats, isLoading } = useTutorialViewsStats();
  const { data: tutorials } = useTutorials(undefined, true);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma estatística disponível ainda.
      </div>
    );
  }

  // Ordenar tutoriais por visualizações
  const tutorialRanking = Object.entries(stats.viewsByTutorial)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalViews}</p>
                <p className="text-sm text-muted-foreground">Visualizações Totais</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
                <p className="text-sm text-muted-foreground">Usuários Únicos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedViews}</p>
                <p className="text-sm text-muted-foreground">Concluídos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/30">
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completionRate}%</p>
                <p className="text-sm text-muted-foreground">Taxa de Conclusão</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ranking de tutoriais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tutoriais Mais Assistidos</CardTitle>
        </CardHeader>
        <CardContent>
          {tutorialRanking.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma visualização registrada ainda.
            </p>
          ) : (
            <div className="space-y-4">
              {tutorialRanking.map(([tutorialId, data], index) => {
                const completionRate = data.count > 0 
                  ? Math.round((data.completed / data.count) * 100) 
                  : 0;

                return (
                  <div key={tutorialId} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{data.title}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-muted-foreground">
                          {data.count} visualizações
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {completionRate}% concluíram
                        </span>
                      </div>
                      <Progress value={completionRate} className="h-1 mt-2" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visualizações recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Visualizações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentViews.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma visualização registrada ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tutorial</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentViews.slice(0, 20).map((view: any) => (
                    <TableRow key={view.id}>
                      <TableCell className="font-medium">
                        {view.tutorials?.title || 'Desconhecido'}
                      </TableCell>
                      <TableCell>
                        {view.profiles?.full_name || view.profiles?.email || 'Anônimo'}
                      </TableCell>
                      <TableCell>
                        {view.completed ? (
                          <Badge variant="default" className="bg-green-500">Concluído</Badge>
                        ) : (
                          <Badge variant="secondary">Em andamento</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(view.viewed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
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
  );
}
