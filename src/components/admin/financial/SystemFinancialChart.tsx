import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SystemMonthlyData } from '@/hooks/useSystemFinancialSummary';

export type SystemFinanceView = 'product' | 'full';

interface SystemFinancialChartProps {
  data: SystemMonthlyData[];
  view: SystemFinanceView;
  periodLabel: string;
  isLoading?: boolean;
}

const SERIES_LABELS: Record<string, string> = {
  incomeSubscriptions: 'Receita · Assinaturas',
  incomeExternal: 'Receita · Serviços Externos',
  incomeOther: 'Receita · Outras',
  expense: 'Despesas',
  balance: 'Saldo',
  productBalance: 'Saldo',
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
  }).format(value);

export function SystemFinancialChart({
  data,
  view,
  periodLabel,
  isLoading,
}: SystemFinancialChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm">Evolução Financeira</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground text-sm">Carregando...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const balanceKey = view === 'product' ? 'productBalance' : 'balance';

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm">Evolução Financeira — {periodLabel}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="h-[300px]">
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
                  SERIES_LABELS[name] ?? name,
                ]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend
                formatter={(value: string) => SERIES_LABELS[value] ?? value}
                wrapperStyle={{ fontSize: '12px' }}
              />

              {/* Receita separada por origem (empilhada) */}
              <Bar
                dataKey="incomeSubscriptions"
                name="incomeSubscriptions"
                stackId="income"
                fill="#22c55e"
                barSize={20}
              />
              {view === 'full' && (
                <Bar
                  dataKey="incomeExternal"
                  name="incomeExternal"
                  stackId="income"
                  fill="#0ea5e9"
                  barSize={20}
                />
              )}
              {view === 'full' && (
                <Bar
                  dataKey="incomeOther"
                  name="incomeOther"
                  stackId="income"
                  fill="#a3a3a3"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
              )}

              {/* Despesa como série separada */}
              <Bar
                dataKey="expense"
                name="expense"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />

              <Line
                type="monotone"
                dataKey={balanceKey}
                name={balanceKey}
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
