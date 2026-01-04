import { useQuery } from "@tanstack/react-query";
import { Calendar, CheckCircle2, XCircle, Star, DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface PerformanceKPICardsProps {
  professionalId: string;
  startDate: Date;
  endDate: Date;
}

export function PerformanceKPICards({ professionalId, startDate, endDate }: PerformanceKPICardsProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["professional-performance-kpis", professionalId, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      // Buscar bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("id, status, price")
        .eq("professional_id", professionalId)
        .gte("booking_date", startDate.toISOString().split("T")[0])
        .lte("booking_date", endDate.toISOString().split("T")[0]);

      if (bookingsError) throw bookingsError;

      // Buscar avaliações
      const { data: reviews, error: reviewsError } = await supabase
        .from("booking_reviews")
        .select("rating")
        .eq("professional_id", professionalId)
        .not("reviewed_at", "is", null);

      if (reviewsError) throw reviewsError;

      // Buscar comissões
      const { data: commissions, error: commissionsError } = await supabase
        .from("professional_commissions")
        .select("commission_amount, status")
        .eq("professional_id", professionalId)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      if (commissionsError) throw commissionsError;

      // Calcular estatísticas
      const total = bookings?.length || 0;
      const completed = bookings?.filter(b => b.status === "completed").length || 0;
      const cancelled = bookings?.filter(b => b.status === "cancelled").length || 0;
      const noShow = bookings?.filter(b => b.status === "no_show").length || 0;
      const revenue = bookings?.filter(b => b.status === "completed").reduce((sum, b) => sum + (b.price || 0), 0) || 0;

      const avgRating = reviews?.length 
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
        : 0;

      const totalCommissions = commissions?.reduce((sum, c) => sum + (c.commission_amount || 0), 0) || 0;
      const paidCommissions = commissions?.filter(c => c.status === "paid").reduce((sum, c) => sum + (c.commission_amount || 0), 0) || 0;

      return {
        total,
        completed,
        cancelled,
        noShow,
        attendanceRate: total > 0 ? (completed / total) * 100 : 0,
        revenue,
        avgRating,
        totalReviews: reviews?.length || 0,
        totalCommissions,
        paidCommissions,
      };
    },
    enabled: !!professionalId,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const kpis = [
    {
      title: "Atendimentos",
      value: stats?.total || 0,
      icon: Calendar,
      color: "text-blue-500",
    },
    {
      title: "Comparecimento",
      value: `${(stats?.attendanceRate || 0).toFixed(0)}%`,
      icon: CheckCircle2,
      color: "text-green-500",
    },
    {
      title: "Cancelamentos",
      value: stats?.cancelled || 0,
      icon: XCircle,
      color: "text-red-500",
    },
    {
      title: "Nota Média",
      value: stats?.avgRating ? stats.avgRating.toFixed(1) : "-",
      icon: Star,
      color: "text-yellow-500",
      subtitle: stats?.totalReviews ? `${stats.totalReviews} avaliações` : undefined,
    },
    {
      title: "Receita",
      value: new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(stats?.revenue || 0),
      icon: DollarSign,
      color: "text-emerald-500",
    },
    {
      title: "Comissões",
      value: new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(stats?.paidCommissions || 0),
      icon: TrendingUp,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.title}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-4 w-4 ${kpi.color}`} />
                <span className="text-xs text-muted-foreground">{kpi.title}</span>
              </div>
              <p className="text-xl font-bold">{kpi.value}</p>
              {kpi.subtitle && (
                <p className="text-xs text-muted-foreground">{kpi.subtitle}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
