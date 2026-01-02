import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface VariationData {
  variation: string;
  views: number;
  clicks: number;
  conversionRate: number;
}

interface VariationChartProps {
  data: VariationData[];
  bestVariation: string | null;
}

const COLORS = {
  A: 'hsl(var(--primary))',
  B: 'hsl(var(--chart-2))',
  C: 'hsl(var(--chart-3))',
  D: 'hsl(var(--chart-4))'
};

export const VariationChart = ({ data, bestVariation }: VariationChartProps) => {
  const chartData = data.map(item => ({
    name: `Var. ${item.variation}`,
    variation: item.variation,
    taxa: item.conversionRate,
    views: item.views,
    clicks: item.clicks
  }));

  return (
    <Card>
      <CardHeader className="pb-2 md:pb-4">
        <CardTitle className="text-sm md:text-base">Conversão por Variação</CardTitle>
      </CardHeader>
      <CardContent className="p-2 md:p-6 pt-0">
        <div className="h-[180px] md:h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 5, right: 10, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis 
                type="number" 
                domain={[0, 'auto']} 
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 10 }}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={55}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Taxa']}
                labelFormatter={(label) => label}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="taxa" radius={[0, 4, 4, 0]}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.variation}
                    fill={COLORS[entry.variation as keyof typeof COLORS]}
                    opacity={entry.variation === bestVariation ? 1 : 0.6}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
