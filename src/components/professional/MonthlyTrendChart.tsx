import { useQuery } from "@tanstack/react-query";
import { subMonths, format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface MonthlyTrendChartProps {
  professionalId: string;
  months: number;
}

const chartConfig = {
  bookings: {
    label: "Atendimentos",
    color: "hsl(var(--primary))",
  },
  revenue: {
    label: "Receita (R$)",
    color: "hsl(var(--chart-2))",
  },
};

export function MonthlyTrendChart({ professionalId, months }: MonthlyTrendChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["professional-monthly-trend", professionalId, months],
    queryFn: async () => {
      const now = new Date();
      const monthsData = [];

      for (let i = months - 1; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const start = startOfMonth(monthDate);
        const end = endOfMonth(monthDate);

        const { data: bookings } = await supabase
          .from("bookings")
          .select("id, price, status")
          .eq("professional_id", professionalId)
          .gte("booking_date", start.toISOString().split("T")[0])
          .lte("booking_date", end.toISOString().split("T")[0]);

        const completed = bookings?.filter(b => b.status === "completed") || [];
        const revenue = completed.reduce((sum, b) => sum + (b.price || 0), 0);

        monthsData.push({
          month: format(monthDate, "MMM", { locale: ptBR }),
          bookings: bookings?.length || 0,
          revenue: revenue,
        });
      }

      return monthsData;
    },
    enabled: !!professionalId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução Mensal</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                yAxisId="left"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `R$${value}`}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="bookings"
                stroke="var(--color-bookings)"
                strokeWidth={2}
                dot={{ fill: "var(--color-bookings)" }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-revenue)"
                strokeWidth={2}
                dot={{ fill: "var(--color-revenue)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
