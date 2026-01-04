import { Card, CardContent } from "@/components/ui/card";
import { 
  Calendar, 
  UserCheck, 
  UserX, 
  XCircle, 
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, differenceInDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface BookingKPICardsProps {
  storeId: string;
  dateRange: { from: Date; to: Date };
}

interface BookingStats {
  total: number;
  completed: number;
  cancelled: number;
  noShow: number;
  totalRevenue: number;
  avgTicket: number;
}

export function BookingKPICards({ storeId, dateRange }: BookingKPICardsProps) {
  // Período anterior para comparação
  const daysDiff = differenceInDays(dateRange.to, dateRange.from) + 1;
  const previousFrom = subDays(dateRange.from, daysDiff);
  const previousTo = subDays(dateRange.to, daysDiff);

  // Query para período atual
  const { data: currentStats, isLoading: loadingCurrent } = useQuery({
    queryKey: ["booking-kpis", storeId, dateRange.from, dateRange.to],
    queryFn: async (): Promise<BookingStats> => {
      const { data, error } = await supabase
        .from("bookings")
        .select("status, price")
        .eq("store_id", storeId)
        .gte("booking_date", format(dateRange.from, "yyyy-MM-dd"))
        .lte("booking_date", format(dateRange.to, "yyyy-MM-dd"));

      if (error) throw error;

      const total = data?.length || 0;
      const completed = data?.filter(b => b.status === "completed").length || 0;
      const cancelled = data?.filter(b => b.status === "cancelled").length || 0;
      const noShow = data?.filter(b => b.status === "no_show").length || 0;
      const totalRevenue = data
        ?.filter(b => b.status === "completed")
        .reduce((sum, b) => sum + (b.price || 0), 0) || 0;
      const avgTicket = completed > 0 ? totalRevenue / completed : 0;

      return { total, completed, cancelled, noShow, totalRevenue, avgTicket };
    }
  });

  // Query para período anterior
  const { data: previousStats } = useQuery({
    queryKey: ["booking-kpis-prev", storeId, previousFrom, previousTo],
    queryFn: async (): Promise<BookingStats> => {
      const { data, error } = await supabase
        .from("bookings")
        .select("status, price")
        .eq("store_id", storeId)
        .gte("booking_date", format(previousFrom, "yyyy-MM-dd"))
        .lte("booking_date", format(previousTo, "yyyy-MM-dd"));

      if (error) throw error;

      const total = data?.length || 0;
      const completed = data?.filter(b => b.status === "completed").length || 0;
      const cancelled = data?.filter(b => b.status === "cancelled").length || 0;
      const noShow = data?.filter(b => b.status === "no_show").length || 0;
      const totalRevenue = data
        ?.filter(b => b.status === "completed")
        .reduce((sum, b) => sum + (b.price || 0), 0) || 0;
      const avgTicket = completed > 0 ? totalRevenue / completed : 0;

      return { total, completed, cancelled, noShow, totalRevenue, avgTicket };
    }
  });

  const calcVariation = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const formatVariation = (variation: number, inverse: boolean = false): JSX.Element => {
    const isPositive = inverse ? variation < 0 : variation > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const color = isPositive ? "text-green-600" : "text-red-600";
    
    return (
      <span className={`flex items-center gap-1 text-xs ${color}`}>
        <Icon className="h-3 w-3" />
        {Math.abs(variation).toFixed(1)}%
      </span>
    );
  };

  const kpis = [
    {
      title: "Total de Agendamentos",
      value: currentStats?.total || 0,
      icon: Calendar,
      variation: calcVariation(currentStats?.total || 0, previousStats?.total || 0),
      format: (v: number) => v.toString()
    },
    {
      title: "Taxa de Comparecimento",
      value: currentStats?.total ? ((currentStats.completed / currentStats.total) * 100) : 0,
      icon: UserCheck,
      variation: calcVariation(
        currentStats?.total ? (currentStats.completed / currentStats.total) * 100 : 0,
        previousStats?.total ? (previousStats.completed / previousStats.total) * 100 : 0
      ),
      format: (v: number) => `${v.toFixed(1)}%`
    },
    {
      title: "Taxa de Cancelamento",
      value: currentStats?.total ? ((currentStats.cancelled / currentStats.total) * 100) : 0,
      icon: XCircle,
      variation: calcVariation(
        currentStats?.total ? (currentStats.cancelled / currentStats.total) * 100 : 0,
        previousStats?.total ? (previousStats.cancelled / previousStats.total) * 100 : 0
      ),
      format: (v: number) => `${v.toFixed(1)}%`,
      inverseVariation: true
    },
    {
      title: "Taxa de No-Show",
      value: currentStats?.total ? ((currentStats.noShow / currentStats.total) * 100) : 0,
      icon: UserX,
      variation: calcVariation(
        currentStats?.total ? (currentStats.noShow / currentStats.total) * 100 : 0,
        previousStats?.total ? (previousStats.noShow / previousStats.total) * 100 : 0
      ),
      format: (v: number) => `${v.toFixed(1)}%`,
      inverseVariation: true
    },
    {
      title: "Receita Total",
      value: currentStats?.totalRevenue || 0,
      icon: DollarSign,
      variation: calcVariation(currentStats?.totalRevenue || 0, previousStats?.totalRevenue || 0),
      format: (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    },
    {
      title: "Ticket Médio",
      value: currentStats?.avgTicket || 0,
      icon: CreditCard,
      variation: calcVariation(currentStats?.avgTicket || 0, previousStats?.avgTicket || 0),
      format: (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    }
  ];

  if (loadingCurrent) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array(6).fill(0).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.title}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <kpi.icon className="h-4 w-4" />
              <span className="text-xs font-medium truncate">{kpi.title}</span>
            </div>
            <div className="text-2xl font-bold">{kpi.format(kpi.value)}</div>
            {previousStats && formatVariation(kpi.variation, kpi.inverseVariation)}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
