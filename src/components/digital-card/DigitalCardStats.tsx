import { Eye, MousePointerClick, TrendingUp, Percent } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCardStats } from '@/hooks/useDigitalCard';
import { Skeleton } from '@/components/ui/skeleton';

interface DigitalCardStatsProps {
  cardId: string;
}

const CLICK_TYPE_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  phone: 'Telefone',
  email: 'Email',
  website: 'Site',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  youtube: 'YouTube',
  cta: 'CTA Principal',
  custom_link: 'Link Custom',
};

export function DigitalCardStats({ cardId }: DigitalCardStatsProps) {
  const { stats, loading } = useCardStats(cardId);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const conversionRate = stats.totalViews > 0 
    ? ((stats.totalClicks / stats.totalViews) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Cards de métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total de acessos ao cartão</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cliques</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total de interações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Cliques / Views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tendência</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.recentClicks.reduce((sum, d) => sum + d.count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Cliques nos últimos 7 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de cliques por dia */}
      <Card>
        <CardHeader>
          <CardTitle>Cliques por Dia (Últimos 7 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40 flex items-end justify-between gap-2">
            {stats.recentClicks.map(({ date, count }) => {
              const maxCount = Math.max(...stats.recentClicks.map(d => d.count), 1);
              const height = (count / maxCount) * 100;
              const dayName = new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' });
              
              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground">{count}</span>
                  <div 
                    className="w-full bg-primary rounded-t transition-all"
                    style={{ height: `${Math.max(height, 5)}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{dayName}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Cliques por tipo */}
      <Card>
        <CardHeader>
          <CardTitle>Cliques por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(stats.clicksByType).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum clique registrado ainda
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.clicksByType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const percentage = (count / stats.totalClicks) * 100;
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{CLICK_TYPE_LABELS[type] || type}</span>
                        <span className="font-medium">{count} ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
