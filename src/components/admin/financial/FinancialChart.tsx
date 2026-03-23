import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, ComposedChart } from 'recharts';

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

interface FinancialChartProps {
  data: MonthlyData[];
  isLoading?: boolean;
}

export function FinancialChart({ data, isLoading }: FinancialChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm">Evolução Financeira</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="h-[280px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground text-sm">Carregando...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm">Evolução Financeira — Últimos 6 Meses</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis
                tickFormatter={formatCurrency}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                width={70}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === 'income' ? 'Receitas' : name === 'expense' ? 'Despesas' : 'Saldo'
                ]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend
                formatter={(value: string) =>
                  value === 'income' ? 'Receitas' : value === 'expense' ? 'Despesas' : 'Saldo'
                }
                wrapperStyle={{ fontSize: '12px' }}
              />
              <Bar dataKey="income" name="income" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="expense" name="expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
              <Line
                type="monotone"
                dataKey="balance"
                name="balance"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3, fill: '#3b82f6' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
