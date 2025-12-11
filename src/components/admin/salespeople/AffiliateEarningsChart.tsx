import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from "recharts";

interface Affiliate {
  id: string;
  full_name: string;
  current_month_earnings: number;
  monthly_earnings_limit: number;
}

interface AffiliateEarningsChartProps {
  affiliates: Affiliate[];
  limit: number;
}

export function AffiliateEarningsChart({ affiliates, limit }: AffiliateEarningsChartProps) {
  if (affiliates.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Nenhum afiliado cadastrado
      </div>
    );
  }

  const data = affiliates
    .sort((a, b) => b.current_month_earnings - a.current_month_earnings)
    .slice(0, 10)
    .map(affiliate => {
      const percentage = (affiliate.current_month_earnings / limit) * 100;
      return {
        name: affiliate.full_name?.split(' ')[0] || 'Afiliado',
        fullName: affiliate.full_name,
        earnings: affiliate.current_month_earnings,
        percentage,
        limit
      };
    });

  const getBarColor = (percentage: number): string => {
    if (percentage >= 80) return 'hsl(var(--destructive))';
    if (percentage >= 50) return 'hsl(45 93% 47%)'; // Amarelo
    return 'hsl(142 76% 36%)'; // Verde
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { fullName: string; earnings: number; percentage: number; limit: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm">{data.fullName}</p>
          <p className="text-sm text-muted-foreground">
            Ganhos: <span className="font-medium text-foreground">R$ {data.earnings.toFixed(2)}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Limite: <span className="font-medium text-foreground">R$ {data.limit.toFixed(2)}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Utilizado: <span className="font-medium text-foreground">{data.percentage.toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis 
            type="number" 
            domain={[0, limit]}
            tickFormatter={(value) => `R$ ${value}`}
            className="text-xs fill-muted-foreground"
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={70}
            className="text-xs fill-muted-foreground"
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine 
            x={limit} 
            stroke="hsl(var(--destructive))" 
            strokeDasharray="5 5" 
            label={{ 
              value: `Limite R$ ${limit}`, 
              position: 'top',
              fill: 'hsl(var(--destructive))',
              fontSize: 12
            }} 
          />
          <Bar dataKey="earnings" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      {/* Legenda */}
      <div className="flex justify-center gap-6 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(142 76% 36%)' }} />
          <span className="text-muted-foreground">&lt;50% do limite</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(45 93% 47%)' }} />
          <span className="text-muted-foreground">50-80% do limite</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-destructive" />
          <span className="text-muted-foreground">≥80% do limite</span>
        </div>
      </div>
    </div>
  );
}
