import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PopularServicesChartProps {
  storeId: string;
  dateRange: { from: Date; to: Date };
}

export function PopularServicesChart({ storeId, dateRange }: PopularServicesChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["booking-popular-services", storeId, dateRange.from, dateRange.to],
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select(`
          service_id,
          price,
          status,
          booking_services!inner(name)
        `)
        .eq("store_id", storeId)
        .gte("booking_date", format(dateRange.from, "yyyy-MM-dd"))
        .lte("booking_date", format(dateRange.to, "yyyy-MM-dd"));

      if (error) throw error;

      // Agrupar por serviço
      const serviceStats: Record<string, { 
        name: string; 
        count: number; 
        revenue: number;
        completed: number;
      }> = {};

      bookings?.forEach(b => {
        const serviceName = (b.booking_services as any)?.name || "Serviço desconhecido";
        if (!serviceStats[serviceName]) {
          serviceStats[serviceName] = { name: serviceName, count: 0, revenue: 0, completed: 0 };
        }
        serviceStats[serviceName].count++;
        if (b.status === "completed") {
          serviceStats[serviceName].revenue += b.price || 0;
          serviceStats[serviceName].completed++;
        }
      });

      const totalCount = Object.values(serviceStats).reduce((sum, s) => sum + s.count, 0);

      return Object.values(serviceStats)
        .map(s => ({
          ...s,
          percentage: totalCount > 0 ? (s.count / totalCount) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    }
  });

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Nenhum serviço agendado no período
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gráfico de barras horizontal */}
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            layout="vertical"
            margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
          >
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={120}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border rounded-lg shadow-lg p-3">
                      <p className="font-medium">{data.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {data.count} agendamento{data.count !== 1 ? 's' : ''}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Receita: R$ {data.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela detalhada */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Serviço</TableHead>
            <TableHead className="text-center">Agendamentos</TableHead>
            <TableHead className="text-center">Realizados</TableHead>
            <TableHead className="text-right">Receita</TableHead>
            <TableHead className="text-right">% do Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((service, index) => (
            <TableRow key={service.name}>
              <TableCell className="font-medium">
                <span className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">#{index + 1}</span>
                  {service.name}
                </span>
              </TableCell>
              <TableCell className="text-center">{service.count}</TableCell>
              <TableCell className="text-center">{service.completed}</TableCell>
              <TableCell className="text-right">
                R$ {service.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-right">{service.percentage.toFixed(1)}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
