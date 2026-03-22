import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { ReviewsStats } from "@/hooks/useBookingReviews";

interface RatingDistributionProps {
  stats: ReviewsStats | undefined;
}

export function RatingDistribution({ stats }: RatingDistributionProps) {
  if (!stats || stats.totalReviews === 0) return null;

  const maxCount = Math.max(...stats.ratingDistribution.map(d => d.count), 1);

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          Distribuição por Estrelas
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 space-y-2">
        {stats.ratingDistribution.map((item) => {
          const pct = stats.totalReviews > 0 ? Math.round((item.count / stats.totalReviews) * 100) : 0;
          const barWidth = (item.count / maxCount) * 100;

          return (
            <div key={item.rating} className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground w-4 text-right">
                {item.rating}
              </span>
              <span className="text-yellow-400 text-xs">★</span>
              <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-10 text-right">
                {item.count} ({pct}%)
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
