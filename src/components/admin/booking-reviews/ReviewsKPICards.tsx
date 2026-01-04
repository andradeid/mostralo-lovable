import { Card, CardContent } from "@/components/ui/card";
import { Star, MessageSquare, ThumbsUp } from "lucide-react";
import { ReviewsStats } from "@/hooks/useBookingReviews";
import { StarRating } from "./StarRating";

interface ReviewsKPICardsProps {
  stats: ReviewsStats | undefined;
  isLoading: boolean;
}

export function ReviewsKPICards({ stats, isLoading }: ReviewsKPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const averageRating = stats?.averageRating || 0;
  const totalReviews = stats?.totalReviews || 0;
  const positivePercentage = stats?.positivePercentage || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Nota Média */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nota Média</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-3xl font-bold text-foreground">
                  {averageRating.toFixed(1)}
                </span>
                <StarRating rating={Math.round(averageRating)} size="md" />
              </div>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
              <Star className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total de Avaliações */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Avaliações</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {totalReviews}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <MessageSquare className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avaliações Positivas */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avaliações Positivas</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {positivePercentage.toFixed(0)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">4 e 5 estrelas</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <ThumbsUp className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
