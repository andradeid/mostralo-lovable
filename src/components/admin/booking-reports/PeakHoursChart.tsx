import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface PeakHoursChartProps {
  storeId: string;
  dateRange: { from: Date; to: Date };
}

export function PeakHoursChart({ storeId, dateRange }: PeakHoursChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["booking-peak-hours", storeId, dateRange.from, dateRange.to],
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("start_time")
        .eq("store_id", storeId)
        .gte("booking_date", format(dateRange.from, "yyyy-MM-dd"))
        .lte("booking_date", format(dateRange.to, "yyyy-MM-dd"));

      if (error) throw error;

      // Agrupar por hora
      const hourCounts: Record<number, number> = {};
      for (let h = 6; h <= 22; h++) {
        hourCounts[h] = 0;
      }

      bookings?.forEach(b => {
        if (b.start_time) {
          const hour = parseInt(b.start_time.split(":")[0]);
          if (hourCounts[hour] !== undefined) {
            hourCounts[hour]++;
          }
        }
      });

      const chartData = Object.entries(hourCounts).map(([hour, count]) => ({
        hour: `${hour}h`,
        hourNum: parseInt(hour),
        count
      }));

      return chartData;
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

  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <XAxis 
            dataKey="hour" 
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
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
                return (
                  <div className="bg-popover border rounded-lg shadow-lg p-3">
                    <p className="font-medium">{payload[0].payload.hour}</p>
                    <p className="text-sm text-muted-foreground">
                      {payload[0].value} agendamento{Number(payload[0].value) !== 1 ? 's' : ''}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`}
                fill={entry.count === maxCount ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.3)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
