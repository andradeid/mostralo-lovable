import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ViewsByDate {
  date: string;
  views: number;
  completed: number;
}

interface TutorialViewsChartProps {
  data: ViewsByDate[];
}

const chartConfig = {
  views: { 
    label: 'Visualizações', 
    color: 'hsl(var(--chart-1))' 
  },
  completed: { 
    label: 'Concluídos', 
    color: 'hsl(var(--chart-2))' 
  }
};

export function TutorialViewsChart({ data }: TutorialViewsChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const formattedData = data.map(d => ({
    ...d,
    dateLabel: format(new Date(d.date), 'dd/MM', { locale: ptBR })
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Evolução de Visualizações</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="dateLabel" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
                allowDecimals={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area 
                type="monotone" 
                dataKey="views" 
                name="views"
                stroke="hsl(var(--chart-1))" 
                fill="hsl(var(--chart-1))" 
                fillOpacity={0.3} 
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="completed" 
                name="completed"
                stroke="hsl(var(--chart-2))" 
                fill="hsl(var(--chart-2))" 
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
