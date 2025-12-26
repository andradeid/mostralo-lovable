import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useKitchenPerformance } from '@/hooks/useKitchenPerformance';
import { Loader2, Clock, Zap, Timer, UtensilsCrossed } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  Tooltip,
  Cell
} from 'recharts';
import { cn } from '@/lib/utils';

export function KitchenPerformance() {
  const { productPerformance, hourlyVolume, kpis, isLoading } = useKitchenPerformance();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getTimeColor = (minutes: number) => {
    if (minutes <= 5) return 'text-green-600 dark:text-green-400';
    if (minutes <= 10) return 'text-yellow-600 dark:text-yellow-400';
    if (minutes <= 15) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getTimeIcon = (minutes: number) => {
    if (minutes <= 5) return '🟢';
    if (minutes <= 10) return '🟡';
    if (minutes <= 15) return '🟠';
    return '🔴';
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{kpis.totalQuantity}</p>
                <p className="text-xs text-muted-foreground">Itens preparados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{kpis.avgPrepTime} min</p>
                <p className="text-xs text-muted-foreground">Tempo médio</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{kpis.slowestTime} min</p>
                <p className="text-xs text-muted-foreground">Mais lento</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{kpis.fastestTime} min</p>
                <p className="text-xs text-muted-foreground">Mais rápido</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de volume por hora */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Volume por Hora</CardTitle>
        </CardHeader>
        <CardContent>
          {hourlyVolume.every(h => h.count === 0) ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <p>Sem dados de hoje ainda</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hourlyVolume}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="hour" 
                  tickFormatter={(h) => `${h}h`}
                  fontSize={12}
                  className="fill-muted-foreground"
                />
                <YAxis fontSize={12} className="fill-muted-foreground" />
                <Tooltip 
                  formatter={(value: number) => [`${value} itens`, 'Quantidade']}
                  labelFormatter={(h) => `${h}:00`}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {hourlyVolume.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.count > 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted))'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Ranking de produtos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ranking por Tempo de Preparo</CardTitle>
        </CardHeader>
        <CardContent>
          {productPerformance.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <p>Sem dados de hoje ainda</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
                <span className="col-span-2">Produto</span>
                <span className="text-center">Qtd</span>
                <span className="text-center">Média</span>
                <span className="text-center">Máx</span>
              </div>
              {productPerformance.slice(0, 10).map((product) => (
                <div 
                  key={product.product_name} 
                  className="grid grid-cols-5 gap-2 items-center py-2 border-b border-border/50 last:border-0"
                >
                  <span className="col-span-2 font-medium truncate flex items-center gap-1">
                    {getTimeIcon(product.avg_prep_time)}
                    {product.product_name}
                  </span>
                  <span className="text-center text-muted-foreground">
                    {product.total_quantity}
                  </span>
                  <span className={cn('text-center font-medium', getTimeColor(product.avg_prep_time))}>
                    {product.avg_prep_time} min
                  </span>
                  <span className={cn('text-center', getTimeColor(product.max_prep_time))}>
                    {product.max_prep_time} min
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
