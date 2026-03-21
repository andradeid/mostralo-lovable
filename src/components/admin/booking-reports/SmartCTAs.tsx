import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Calendar, Settings, Users, MessageSquare } from "lucide-react";

interface SmartCTAsProps {
  storeId: string;
  dateRange: { from: Date; to: Date };
}

interface SmartAction {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  path: string;
  color: string;
}

export function SmartCTAs({ storeId, dateRange }: SmartCTAsProps) {
  const navigate = useNavigate();

  const { data: actions } = useQuery({
    queryKey: ["smart-ctas", storeId, dateRange.from, dateRange.to],
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("status, professional_id")
        .eq("store_id", storeId)
        .gte("booking_date", format(dateRange.from, "yyyy-MM-dd"))
        .lte("booking_date", format(dateRange.to, "yyyy-MM-dd"));

      if (error) throw error;
      if (!bookings || bookings.length === 0) return [];

      const total = bookings.length;
      const cancelled = bookings.filter(b => b.status === "cancelled").length;
      const noShow = bookings.filter(b => b.status === "no_show").length;
      const cancelRate = (cancelled / total) * 100;
      const noShowRate = (noShow / total) * 100;

      // Check professional distribution
      const profCounts: Record<string, number> = {};
      bookings.forEach(b => {
        profCounts[b.professional_id] = (profCounts[b.professional_id] || 0) + 1;
      });
      const profValues = Object.values(profCounts);
      const hasIdleProfessional = profValues.length > 1 && Math.min(...profValues) < Math.max(...profValues) * 0.3;

      const result: SmartAction[] = [];

      if (cancelRate > 20) {
        result.push({
          icon: <MessageSquare className="h-5 w-5" />,
          title: "Alto cancelamento detectado",
          description: `${cancelRate.toFixed(0)}% dos agendamentos foram cancelados. Ative confirmação automática via WhatsApp.`,
          actionLabel: "Configurar",
          path: "/dashboard/booking/configuracoes",
          color: "border-red-500/30 bg-red-500/5"
        });
      }

      if (noShowRate > 10) {
        result.push({
          icon: <Settings className="h-5 w-5" />,
          title: "No-show frequente",
          description: `${noShowRate.toFixed(0)}% de no-show. Considere exigir depósito ou lembrete automático.`,
          actionLabel: "Configurar lembretes",
          path: "/dashboard/booking/configuracoes",
          color: "border-amber-500/30 bg-amber-500/5"
        });
      }

      if (hasIdleProfessional) {
        result.push({
          icon: <Users className="h-5 w-5" />,
          title: "Distribuição desigual",
          description: "Alguns profissionais têm muito menos atendimentos. Revise a agenda da equipe.",
          actionLabel: "Ver profissionais",
          path: "/dashboard/booking/professionals",
          color: "border-blue-500/30 bg-blue-500/5"
        });
      }

      if (total < 10) {
        result.push({
          icon: <Calendar className="h-5 w-5" />,
          title: "Baixo volume de agendamentos",
          description: "Considere criar promoções ou divulgar mais sua página de agendamento.",
          actionLabel: "Ver agenda",
          path: "/dashboard/booking",
          color: "border-orange-500/30 bg-orange-500/5"
        });
      }

      return result.slice(0, 3);
    }
  });

  if (!actions || actions.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {actions.map((action, i) => (
        <Card key={i} className={`border ${action.color}`}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold">{action.title}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{action.description}</p>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs"
              onClick={() => navigate(action.path)}
            >
              {action.actionLabel} →
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
