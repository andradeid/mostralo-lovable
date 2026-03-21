import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, getDay } from "date-fns";
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, Flame, Calendar, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface BookingInsightsProps {
  storeId: string;
  dateRange: { from: Date; to: Date };
}

const WEEKDAY_NAMES = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

interface Insight {
  icon: React.ReactNode;
  text: string;
  type: "success" | "warning" | "info" | "danger";
  action?: { label: string; path: string };
}

export function BookingInsights({ storeId, dateRange }: BookingInsightsProps) {
  const navigate = useNavigate();

  const { data: insights, isLoading } = useQuery({
    queryKey: ["booking-insights", storeId, dateRange.from, dateRange.to],
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("booking_date, status, price, professional_id, start_time")
        .eq("store_id", storeId)
        .gte("booking_date", format(dateRange.from, "yyyy-MM-dd"))
        .lte("booking_date", format(dateRange.to, "yyyy-MM-dd"));

      if (error) throw error;
      if (!bookings || bookings.length === 0) return [];

      const total = bookings.length;
      const completed = bookings.filter(b => b.status === "completed").length;
      const cancelled = bookings.filter(b => b.status === "cancelled").length;
      const noShow = bookings.filter(b => b.status === "no_show").length;
      const revenue = bookings.filter(b => b.status === "completed").reduce((s, b) => s + (b.price || 0), 0);
      const avgTicket = completed > 0 ? revenue / completed : 0;

      const cancelRate = total > 0 ? (cancelled / total) * 100 : 0;
      const noShowRate = total > 0 ? (noShow / total) * 100 : 0;
      const attendanceRate = total > 0 ? (completed / total) * 100 : 0;

      // Busiest weekday
      const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
      bookings.forEach(b => {
        if (b.booking_date) {
          const d = new Date(b.booking_date + "T12:00:00");
          weekdayCounts[getDay(d)]++;
        }
      });
      const busiestDayIdx = weekdayCounts.indexOf(Math.max(...weekdayCounts));
      const quietestDayIdx = weekdayCounts.indexOf(Math.min(...weekdayCounts.filter(c => c > 0)));

      // Peak hour
      const hourCounts: Record<number, number> = {};
      bookings.forEach(b => {
        if (b.start_time) {
          const h = parseInt(b.start_time.split(":")[0]);
          hourCounts[h] = (hourCounts[h] || 0) + 1;
        }
      });
      const peakHour = Object.entries(hourCounts).sort((a, b) => Number(b[1]) - Number(a[1]))[0];

      const generated: Insight[] = [];

      // Busiest day
      if (weekdayCounts[busiestDayIdx] > 0) {
        generated.push({
          icon: <Flame className="h-4 w-4 text-orange-500" />,
          text: `${WEEKDAY_NAMES[busiestDayIdx]} é seu dia com maior movimento (${weekdayCounts[busiestDayIdx]} agendamentos)`,
          type: "info"
        });
      }

      // Quietest day
      if (quietestDayIdx !== busiestDayIdx && weekdayCounts[quietestDayIdx] > 0) {
        generated.push({
          icon: <Calendar className="h-4 w-4 text-blue-500" />,
          text: `${WEEKDAY_NAMES[quietestDayIdx]} tem baixa ocupação — considere criar promoções`,
          type: "warning",
          action: { label: "Ver agenda", path: "/dashboard/booking" }
        });
      }

      // High cancellation
      if (cancelRate > 20) {
        generated.push({
          icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
          text: `${cancelRate.toFixed(0)}% dos atendimentos foram cancelados`,
          type: "danger",
          action: { label: "Configurar lembretes", path: "/dashboard/booking/configuracoes" }
        });
      }

      // High no-show
      if (noShowRate > 10) {
        generated.push({
          icon: <Users className="h-4 w-4 text-amber-500" />,
          text: `Taxa de no-show está em ${noShowRate.toFixed(0)}% — ative confirmação automática`,
          type: "warning",
          action: { label: "Configurar", path: "/dashboard/booking/configuracoes" }
        });
      }

      // Good attendance
      if (attendanceRate >= 85) {
        generated.push({
          icon: <TrendingUp className="h-4 w-4 text-green-500" />,
          text: `Excelente! Taxa de comparecimento em ${attendanceRate.toFixed(0)}%`,
          type: "success"
        });
      }

      // Low attendance
      if (attendanceRate < 60 && attendanceRate > 0) {
        generated.push({
          icon: <TrendingDown className="h-4 w-4 text-red-500" />,
          text: `Comparecimento baixo (${attendanceRate.toFixed(0)}%) — revise horários e lembretes`,
          type: "danger",
          action: { label: "Configurar", path: "/dashboard/booking/configuracoes" }
        });
      }

      // Peak hour insight
      if (peakHour) {
        generated.push({
          icon: <Lightbulb className="h-4 w-4 text-yellow-500" />,
          text: `Horário de pico: ${peakHour[0]}h com ${peakHour[1]} agendamentos`,
          type: "info"
        });
      }

      return generated.slice(0, 4);
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!insights || insights.length === 0) return null;

  const bgColors = {
    success: "bg-green-500/10 border-green-500/20",
    warning: "bg-amber-500/10 border-amber-500/20",
    info: "bg-blue-500/10 border-blue-500/20",
    danger: "bg-red-500/10 border-red-500/20"
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Flame className="h-5 w-5 text-orange-500" />
          <h3 className="font-semibold text-sm">Insights do período</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {insights.map((insight, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-lg border ${bgColors[insight.type]}`}
            >
              <div className="mt-0.5">{insight.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug">{insight.text}</p>
                {insight.action && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 mt-1 text-xs"
                    onClick={() => navigate(insight.action!.path)}
                  >
                    {insight.action.label} →
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
