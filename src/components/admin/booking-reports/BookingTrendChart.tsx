import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface BookingTrendChartProps {
  storeId: string;
  dateRange: { from: Date; to: Date };
}

export function BookingTrendChart({ storeId, dateRange }: BookingTrendChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["booking-trend", storeId, dateRange.from, dateRange.to],
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("booking_date, status")
        .eq("store_id", storeId)
        .gte("booking_date", format(dateRange.from, "yyyy-MM-dd"))
        .lte("booking_date", format(dateRange.to, "yyyy-MM-dd"));

      if (error) throw error;

      // Criar array com todos os dias do período
      const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
      
      // Contar agendamentos por dia
      const dayCounts: Record<string, { total: number; completed: number }> = {};
      days.forEach(day => {
        const dateKey = format(day, "yyyy-MM-dd");
        dayCounts[dateKey] = { total: 0, completed: 0 };
      });

      bookings?.forEach(b => {
        if (b.booking_date && dayCounts[b.booking_date]) {
          dayCounts[b.booking_date].total++;
          if (b.status === "completed") {
            dayCounts[b.booking_date].completed++;
          }
        }
      });

      return Object.entries(dayCounts).map(([date, counts]) => ({
        date,
        label: format(parseISO(date), "dd/MM", { locale: ptBR }),
        ...counts
      }));
    }
  });

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Nenhum agendamento no período
      </div>
    );
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="label" 
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval={data.length > 14 ? Math.floor(data.length / 7) : 0}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-popover border rounded-lg shadow-lg p-3">
                    <p className="font-medium">{data.label}</p>
                    <p className="text-sm text-muted-foreground">
                      Total: {data.total} agendamento{data.total !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-green-600">
                      Realizados: {data.completed}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area 
            type="monotone" 
            dataKey="total" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            fill="url(#colorTotal)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
