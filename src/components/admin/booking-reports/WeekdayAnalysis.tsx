import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, getDay } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface WeekdayAnalysisProps {
  storeId: string;
  dateRange: { from: Date; to: Date };
}

const WEEKDAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const WEEKDAY_FULL_NAMES = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

export function WeekdayAnalysis({ storeId, dateRange }: WeekdayAnalysisProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["booking-weekday-analysis", storeId, dateRange.from, dateRange.to],
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("booking_date")
        .eq("store_id", storeId)
        .gte("booking_date", format(dateRange.from, "yyyy-MM-dd"))
        .lte("booking_date", format(dateRange.to, "yyyy-MM-dd"));

      if (error) throw error;

      // Inicializar contadores para cada dia da semana
      const weekdayCounts: number[] = [0, 0, 0, 0, 0, 0, 0];

      bookings?.forEach(b => {
        if (b.booking_date) {
          const dayOfWeek = getDay(parseISO(b.booking_date));
          weekdayCounts[dayOfWeek]++;
        }
      });

      // Converter para formato do gráfico (começando por Segunda)
      const orderedData = [1, 2, 3, 4, 5, 6, 0].map(dayIndex => ({
        day: WEEKDAY_NAMES[dayIndex],
        fullDay: WEEKDAY_FULL_NAMES[dayIndex],
        count: weekdayCounts[dayIndex],
        dayIndex
      }));

      return orderedData;
    }
  });

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  if (!data || data.every(d => d.count === 0)) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Nenhum agendamento no período
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count));
  const busiestDay = data.find(d => d.count === maxCount);

  return (
    <div className="space-y-4">
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <XAxis 
              dataKey="day" 
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
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border rounded-lg shadow-lg p-3">
                      <p className="font-medium">{data.fullDay}</p>
                      <p className="text-sm text-muted-foreground">
                        {data.count} agendamento{data.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="count" 
              fill="hsl(var(--primary))" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {busiestDay && busiestDay.count > 0 && (
        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <span className="font-medium text-foreground">{busiestDay.fullDay}</span> é o dia mais movimentado 
          com <span className="font-medium text-foreground">{busiestDay.count}</span> agendamento{busiestDay.count !== 1 ? 's' : ''} no período.
        </div>
      )}
    </div>
  );
}
