import { useQuery } from "@tanstack/react-query";
import { Scissors, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface TopServicesCardProps {
  professionalId: string;
  startDate: Date;
  endDate: Date;
}

export function TopServicesCard({ professionalId, startDate, endDate }: TopServicesCardProps) {
  const { data: services, isLoading } = useQuery({
    queryKey: ["professional-top-services", professionalId, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select(`
          id,
          price,
          status,
          service:booking_services(id, name)
        `)
        .eq("professional_id", professionalId)
        .eq("status", "completed")
        .gte("booking_date", startDate.toISOString().split("T")[0])
        .lte("booking_date", endDate.toISOString().split("T")[0]);

      if (error) throw error;

      // Agregar por serviço
      const serviceMap = new Map<string, { name: string; count: number; revenue: number }>();

      bookings?.forEach(booking => {
        const service = booking.service as { id: string; name: string } | null;
        if (!service) return;

        const existing = serviceMap.get(service.id);
        if (existing) {
          existing.count++;
          existing.revenue += booking.price || 0;
        } else {
          serviceMap.set(service.id, {
            name: service.name,
            count: 1,
            revenue: booking.price || 0,
          });
        }
      });

      // Ordenar por contagem e pegar top 10
      return Array.from(serviceMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    },
    enabled: !!professionalId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Serviços Mais Realizados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const maxCount = services?.[0]?.count || 1;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Scissors className="h-5 w-5 text-primary" />
          <CardTitle>Serviços Mais Realizados</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {!services?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <Scissors className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Nenhum serviço realizado no período</p>
          </div>
        ) : (
          <div className="space-y-4">
            {services.map((service, index) => (
              <div key={service.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                      {index + 1}
                    </span>
                    <span className="font-medium">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>{service.count}x</span>
                    <span className="text-foreground font-medium">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(service.revenue)}
                    </span>
                  </div>
                </div>
                <Progress value={(service.count / maxCount) * 100} className="h-2" />
              </div>
            ))}

            {/* Resumo */}
            <div className="pt-4 border-t flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Total do período</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">
                  {services.reduce((sum, s) => sum + s.count, 0)} atendimentos
                </span>
                <span className="font-medium">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(services.reduce((sum, s) => sum + s.revenue, 0))}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
