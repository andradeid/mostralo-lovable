import { Card, CardContent } from "@/components/ui/card";
import { Star, MessageSquare, ThumbsUp, Award, Scissors, MessageCircle } from "lucide-react";
import { ReviewsStats } from "@/hooks/useBookingReviews";
import { StarRating } from "./StarRating";
import { StoreReview } from "@/hooks/useBookingReviews";

interface ReviewsKPICardsProps {
  stats: ReviewsStats | undefined;
  isLoading: boolean;
  reviews?: StoreReview[];
}

export function ReviewsKPICards({ stats, isLoading, reviews }: ReviewsKPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-12 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const averageRating = stats?.averageRating || 0;
  const totalReviews = stats?.totalReviews || 0;
  const positivePercentage = stats?.positivePercentage || 0;

  // Profissional melhor avaliado
  const profRatings: Record<string, { name: string; sum: number; count: number }> = {};
  reviews?.forEach(r => {
    if (!profRatings[r.professional_id]) {
      profRatings[r.professional_id] = { name: r.professional_name, sum: 0, count: 0 };
    }
    profRatings[r.professional_id].sum += r.rating;
    profRatings[r.professional_id].count++;
  });
  const bestProfessional = Object.values(profRatings).sort((a, b) =>
    (b.sum / b.count) - (a.sum / a.count) || b.count - a.count
  )[0];

  // Serviço melhor avaliado
  const serviceRatings: Record<string, { name: string; sum: number; count: number }> = {};
  reviews?.forEach(r => {
    if (!serviceRatings[r.service_name]) {
      serviceRatings[r.service_name] = { name: r.service_name, sum: 0, count: 0 };
    }
    serviceRatings[r.service_name].sum += r.rating;
    serviceRatings[r.service_name].count++;
  });
  const bestService = Object.values(serviceRatings).sort((a, b) =>
    (b.sum / b.count) - (a.sum / a.count) || b.count - a.count
  )[0];

  // % com comentário
  const withFeedback = reviews?.filter(r => r.feedback && r.feedback.trim().length > 0).length || 0;
  const feedbackPercentage = totalReviews > 0 ? Math.round((withFeedback / totalReviews) * 100) : 0;

  const kpis = [
    {
      label: "Nota Média",
      value: averageRating.toFixed(1),
      extra: <StarRating rating={Math.round(averageRating)} size="sm" />,
      icon: Star,
      iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
      iconColor: "text-yellow-500",
    },
    {
      label: "Total de Avaliações",
      value: totalReviews.toString(),
      icon: MessageSquare,
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-500",
    },
    {
      label: "Positivas",
      value: `${positivePercentage.toFixed(0)}%`,
      subtitle: "4 e 5 estrelas",
      icon: ThumbsUp,
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-500",
    },
    {
      label: "Melhor Profissional",
      value: bestProfessional?.name || "—",
      subtitle: bestProfessional ? `${(bestProfessional.sum / bestProfessional.count).toFixed(1)} ★` : undefined,
      icon: Award,
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-500",
    },
    {
      label: "Melhor Serviço",
      value: bestService?.name || "—",
      subtitle: bestService ? `${(bestService.sum / bestService.count).toFixed(1)} ★` : undefined,
      icon: Scissors,
      iconBg: "bg-orange-100 dark:bg-orange-900/30",
      iconColor: "text-orange-500",
    },
    {
      label: "Com Comentário",
      value: `${feedbackPercentage}%`,
      subtitle: `${withFeedback} de ${totalReviews}`,
      icon: MessageCircle,
      iconBg: "bg-cyan-100 dark:bg-cyan-900/30",
      iconColor: "text-cyan-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((kpi, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground leading-tight">{kpi.label}</p>
              <div className={`p-1.5 rounded-lg ${kpi.iconBg}`}>
                <kpi.icon className={`w-3.5 h-3.5 ${kpi.iconColor}`} />
              </div>
            </div>
            <p className="text-xl font-bold text-foreground truncate">{kpi.value}</p>
            {kpi.extra && <div className="mt-1">{kpi.extra}</div>}
            {kpi.subtitle && (
              <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
