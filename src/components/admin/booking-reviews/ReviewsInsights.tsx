import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";
import { StoreReview, ReviewsStats } from "@/hooks/useBookingReviews";

interface ReviewsInsightsProps {
  reviews: StoreReview[];
  stats: ReviewsStats | undefined;
}

export function ReviewsInsights({ reviews, stats }: ReviewsInsightsProps) {
  if (!reviews.length || !stats) return null;

  const insights: string[] = [];

  // Profissional destaque
  const profRatings: Record<string, { name: string; sum: number; count: number }> = {};
  reviews.forEach(r => {
    if (!profRatings[r.professional_id]) {
      profRatings[r.professional_id] = { name: r.professional_name, sum: 0, count: 0 };
    }
    profRatings[r.professional_id].sum += r.rating;
    profRatings[r.professional_id].count++;
  });
  const bestProf = Object.values(profRatings).sort((a, b) =>
    (b.sum / b.count) - (a.sum / a.count)
  )[0];
  if (bestProf && bestProf.count >= 3) {
    const avg = (bestProf.sum / bestProf.count).toFixed(1);
    insights.push(`⭐ ${bestProf.name} mantém média ${avg} nas últimas ${bestProf.count} avaliações`);
  }

  // Serviço destaque
  const serviceRatings: Record<string, { name: string; sum: number; count: number }> = {};
  reviews.forEach(r => {
    if (!serviceRatings[r.service_name]) {
      serviceRatings[r.service_name] = { name: r.service_name, sum: 0, count: 0 };
    }
    serviceRatings[r.service_name].sum += r.rating;
    serviceRatings[r.service_name].count++;
  });
  const bestSvc = Object.values(serviceRatings).sort((a, b) =>
    (b.sum / b.count) - (a.sum / a.count)
  )[0];
  if (bestSvc && Object.keys(serviceRatings).length > 1) {
    insights.push(`💈 ${bestSvc.name} tem a melhor nota média entre os serviços`);
  }

  // Sem avaliações negativas
  const negativeCount = reviews.filter(r => r.rating <= 2).length;
  if (negativeCount === 0 && reviews.length >= 5) {
    insights.push("🎉 Nenhuma avaliação negativa no período");
  } else if (negativeCount > 0) {
    const pct = Math.round((negativeCount / reviews.length) * 100);
    insights.push(`⚠️ ${pct}% das avaliações foram negativas (1-2 estrelas)`);
  }

  // % com comentário
  const withFeedback = reviews.filter(r => r.feedback && r.feedback.trim().length > 0).length;
  const feedbackPct = Math.round((withFeedback / reviews.length) * 100);
  if (feedbackPct > 50) {
    insights.push(`💬 ${feedbackPct}% das avaliações vieram com comentário`);
  }

  const displayInsights = insights.slice(0, 3);
  if (displayInsights.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          Insights do período
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <div className="grid gap-2">
          {displayInsights.map((insight, i) => (
            <p key={i} className="text-sm text-foreground/80">{insight}</p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
