import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";
import { format, subMonths, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

const chartConfig = {
  leads: {
    label: "Leads",
    color: "hsl(var(--chart-1))",
  },
  clientes: {
    label: "Clientes",
    color: "hsl(var(--chart-2))",
  },
  comissoes: {
    label: "Comissões (R$)",
    color: "hsl(var(--chart-3))",
  },
};

type PeriodFilter = "3" | "6" | "12";

export function SalespersonPerformanceChartSelf() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<PeriodFilter>("6");

  // Buscar salesperson_id
  const { data: salesperson } = useQuery({
    queryKey: ["salesperson-self", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salespeople")
        .select("id")
        .eq("user_id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: chartData, isLoading } = useQuery({
    queryKey: ["salesperson-performance-chart-self", salesperson?.id, period],
    queryFn: async () => {
      const months = parseInt(period);
      const startDate = startOfMonth(subMonths(new Date(), months - 1));
      const startDateStr = format(startDate, "yyyy-MM-dd");

      // Buscar leads por mês
      const { data: leadsData } = await supabase
        .from("leads")
        .select("created_at")
        .eq("salesperson_id", salesperson?.id)
        .gte("created_at", startDateStr);

      // Buscar clientes convertidos por mês
      const { data: clientsData } = await supabase
        .from("payment_approvals")
        .select("approved_at")
        .eq("referred_by_salesperson_id", salesperson?.id)
        .eq("status", "approved")
        .gte("approved_at", startDateStr);

      // Buscar comissões por mês
      const { data: commissionsData } = await supabase
        .from("salesperson_commissions")
        .select("created_at, commission_amount")
        .eq("salesperson_id", salesperson?.id)
        .gte("created_at", startDateStr);

      // Agregar dados por mês
      const monthlyData: Record<string, { leads: number; clientes: number; comissoes: number }> = {};

      // Inicializar todos os meses no período
      for (let i = months - 1; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const key = format(date, "yyyy-MM");
        monthlyData[key] = { leads: 0, clientes: 0, comissoes: 0 };
      }

      // Contar leads
      leadsData?.forEach((lead) => {
        const key = format(new Date(lead.created_at), "yyyy-MM");
        if (monthlyData[key]) {
          monthlyData[key].leads++;
        }
      });

      // Contar clientes
      clientsData?.forEach((client) => {
        if (client.approved_at) {
          const key = format(new Date(client.approved_at), "yyyy-MM");
          if (monthlyData[key]) {
            monthlyData[key].clientes++;
          }
        }
      });

      // Somar comissões
      commissionsData?.forEach((commission) => {
        const key = format(new Date(commission.created_at), "yyyy-MM");
        if (monthlyData[key]) {
          monthlyData[key].comissoes += Number(commission.commission_amount) || 0;
        }
      });

      // Converter para array ordenado
      return Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({
          month: format(new Date(month + "-01"), "MMM/yy", { locale: ptBR }),
          ...data,
        }));
    },
    enabled: !!salesperson?.id,
  });

  const hasData = chartData?.some(d => d.leads > 0 || d.clientes > 0 || d.comissoes > 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">📈 Performance Mensal</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Carregando...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-base font-medium">📈 Performance Mensal</CardTitle>
          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
            <SelectTrigger className="w-[140px] h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Últimos 3 meses</SelectItem>
              <SelectItem value="6">Últimos 6 meses</SelectItem>
              <SelectItem value="12">Últimos 12 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
            <TrendingUp className="h-10 w-10 mb-2 opacity-50" />
            <p className="text-sm font-medium">Ainda não há dados de performance</p>
            <p className="text-xs">Os dados aparecerão conforme você gerar leads e vendas</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 11 }} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 11 }} 
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11 }} 
                tickLine={false}
                axisLine={false}
                width={40}
                tickFormatter={(v) => `R$${v}`}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="leads" 
                stroke="var(--color-leads)" 
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="clientes" 
                stroke="var(--color-clientes)" 
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="comissoes" 
                stroke="var(--color-comissoes)" 
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
