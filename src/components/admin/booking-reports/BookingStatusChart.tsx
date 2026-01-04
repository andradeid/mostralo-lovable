import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface BookingStatusChartProps {
  storeId: string;
  dateRange: { from: Date; to: Date };
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "hsl(217, 91%, 60%)" },
  confirmed: { label: "Confirmado", color: "hsl(142, 76%, 36%)" },
  completed: { label: "Realizado", color: "hsl(142, 76%, 36%)" },
  cancelled: { label: "Cancelado", color: "hsl(0, 84%, 60%)" },
  no_show: { label: "No-Show", color: "hsl(38, 92%, 50%)" }
};

export function BookingStatusChart({ storeId, dateRange }: BookingStatusChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["booking-status-chart", storeId, dateRange.from, dateRange.to],
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("status")
        .eq("store_id", storeId)
        .gte("booking_date", format(dateRange.from, "yyyy-MM-dd"))
        .lte("booking_date", format(dateRange.to, "yyyy-MM-dd"));

      if (error) throw error;

      // Contar por status
      const statusCounts: Record<string, number> = {};
      bookings?.forEach(b => {
        const status = b.status || "pending";
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      const total = bookings?.length || 0;

      return Object.entries(statusCounts)
        .map(([status, count]) => ({
          status,
          label: STATUS_CONFIG[status]?.label || status,
          count,
          color: STATUS_CONFIG[status]?.color || "hsl(var(--muted))",
          percentage: total > 0 ? (count / total) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count);
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
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="count"
            nameKey="label"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-popover border rounded-lg shadow-lg p-3">
                    <p className="font-medium">{data.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {data.count} agendamento{data.count !== 1 ? 's' : ''} ({data.percentage.toFixed(1)}%)
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend 
            formatter={(value) => <span className="text-sm">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
