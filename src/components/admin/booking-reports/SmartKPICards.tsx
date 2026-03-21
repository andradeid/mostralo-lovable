import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  UserCheck,
  UserX,
  XCircle,
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Lightbulb
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, differenceInDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface SmartKPICardsProps {
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

function getKPIStatus(key: string, value: number, variation: number): { emoji: string; text: string; tip?: string } | null {
  switch (key) {
    case "attendance":
      if (value >= 85) return { emoji: "📈", text: "Excelente" };
      if (value >= 70) return { emoji: "✅", text: "Bom" };
      if (value > 0) return { emoji: "⚠️", text: "Baixo comparecimento", tip: "Ative lembrete via WhatsApp" };
      return null;
    case "cancellation":
      if (value > 25) return { emoji: "🔴", text: "Muito alto", tip: "Ative confirmação automática" };
      if (value > 15) return { emoji: "⚠️", text: "Atenção", tip: "Revise política de cancelamento" };
      if (value > 0) return { emoji: "✅", text: "Controlado" };
      return null;
    case "noshow":
      if (value > 15) return { emoji: "🔴", text: "Crítico", tip: "Cobre depósito antecipado" };
      if (value > 8) return { emoji: "⚠️", text: "Atenção", tip: "Envie lembretes antes" };
      if (value > 0) return { emoji: "✅", text: "Normal" };
      return null;
    case "revenue":
      if (variation > 10) return { emoji: "📈", text: "Crescendo" };
      if (variation < -10) return { emoji: "📉", text: "Em queda", tip: "Revise horários disponíveis" };
      return { emoji: "➡️", text: "Estável" };
    case "ticket":
      if (variation > 10) return { emoji: "📈", text: "Subindo" };
      if (variation < -10) return { emoji: "📉", text: "Caindo", tip: "Ofereça combos de serviços" };
      return { emoji: "➡️", text: "Estável" };
    default:
      if (variation > 10) return { emoji: "📈", text: "Crescendo" };
      if (variation < -10) return { emoji: "📉", text: "Em queda" };
      return null;
  }
}

export function SmartKPICards({ storeId, dateRange }: SmartKPICardsProps) {
  const daysDiff = differenceInDays(dateRange.to, dateRange.from) + 1;
  const previousFrom = subDays(dateRange.from, daysDiff);
  const previousTo = subDays(dateRange.to, daysDiff);

  const { data: currentStats, isLoading: loadingCurrent } = useQuery({
    queryKey: ["smart-kpis", storeId, dateRange.from, dateRange.to],
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
      const totalRevenue = data?.filter(b => b.status === "completed").reduce((s, b) => s + (b.price || 0), 0) || 0;
      const avgTicket = completed > 0 ? totalRevenue / completed : 0;
      return { total, completed, cancelled, noShow, totalRevenue, avgTicket };
    }
  });

  const { data: previousStats } = useQuery({
    queryKey: ["smart-kpis-prev", storeId, previousFrom, previousTo],
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
      const totalRevenue = data?.filter(b => b.status === "completed").reduce((s, b) => s + (b.price || 0), 0) || 0;
      const avgTicket = completed > 0 ? totalRevenue / completed : 0;
      return { total, completed, cancelled, noShow, totalRevenue, avgTicket };
    }
  });

  const calcVar = (c: number, p: number) => {
    if (p === 0) return c > 0 ? 100 : 0;
    return ((c - p) / p) * 100;
  };

  const formatVar = (v: number, inverse = false) => {
    const positive = inverse ? v < 0 : v > 0;
    const Icon = positive ? TrendingUp : TrendingDown;
    const color = positive ? "text-green-600" : "text-red-600";
    return (
      <span className={`flex items-center gap-1 text-xs ${color}`}>
        <Icon className="h-3 w-3" />
        {Math.abs(v).toFixed(1)}% vs anterior
      </span>
    );
  };

  if (loadingCurrent) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array(6).fill(0).map((_, i) => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  const kpis = [
    {
      title: "Total Agendamentos",
      value: currentStats?.total || 0,
      icon: Calendar,
      variation: calcVar(currentStats?.total || 0, previousStats?.total || 0),
      format: (v: number) => v.toString(),
      statusKey: "total"
    },
    {
      title: "Comparecimento",
      value: currentStats?.total ? ((currentStats.completed / currentStats.total) * 100) : 0,
      icon: UserCheck,
      variation: calcVar(
        currentStats?.total ? (currentStats.completed / currentStats.total) * 100 : 0,
        previousStats?.total ? (previousStats.completed / previousStats.total) * 100 : 0
      ),
      format: (v: number) => `${v.toFixed(1)}%`,
      statusKey: "attendance"
    },
    {
      title: "Cancelamento",
      value: currentStats?.total ? ((currentStats.cancelled / currentStats.total) * 100) : 0,
      icon: XCircle,
      variation: calcVar(
        currentStats?.total ? (currentStats.cancelled / currentStats.total) * 100 : 0,
        previousStats?.total ? (previousStats.cancelled / previousStats.total) * 100 : 0
      ),
      format: (v: number) => `${v.toFixed(1)}%`,
      inverseVariation: true,
      statusKey: "cancellation"
    },
    {
      title: "No-Show",
      value: currentStats?.total ? ((currentStats.noShow / currentStats.total) * 100) : 0,
      icon: UserX,
      variation: calcVar(
        currentStats?.total ? (currentStats.noShow / currentStats.total) * 100 : 0,
        previousStats?.total ? (previousStats.noShow / previousStats.total) * 100 : 0
      ),
      format: (v: number) => `${v.toFixed(1)}%`,
      inverseVariation: true,
      statusKey: "noshow"
    },
    {
      title: "Receita Total",
      value: currentStats?.totalRevenue || 0,
      icon: DollarSign,
      variation: calcVar(currentStats?.totalRevenue || 0, previousStats?.totalRevenue || 0),
      format: (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      statusKey: "revenue"
    },
    {
      title: "Ticket Médio",
      value: currentStats?.avgTicket || 0,
      icon: CreditCard,
      variation: calcVar(currentStats?.avgTicket || 0, previousStats?.avgTicket || 0),
      format: (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      statusKey: "ticket"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((kpi) => {
        const status = getKPIStatus(kpi.statusKey, kpi.value, kpi.variation);
        return (
          <Card key={kpi.title} className="overflow-hidden">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <kpi.icon className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium truncate">{kpi.title}</span>
              </div>
              <div className="text-xl font-bold truncate">{kpi.format(kpi.value)}</div>
              {previousStats && formatVar(kpi.variation, kpi.inverseVariation)}
              {status && (
                <div className="pt-1 border-t border-border/50 space-y-1">
                  <span className="text-xs text-muted-foreground">
                    {status.emoji} {status.text}
                  </span>
                  {status.tip && (
                    <div className="flex items-start gap-1">
                      <Lightbulb className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                      <span className="text-[10px] text-muted-foreground leading-tight">{status.tip}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
