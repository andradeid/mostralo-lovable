import { StoreReview } from "@/hooks/useBookingReviews";
import { ReviewCard } from "./ReviewCard";
import { MessageSquareOff } from "lucide-react";

interface ReviewsListProps {
  reviews: StoreReview[];
  isLoading: boolean;
}

export function ReviewsList({ reviews, isLoading }: ReviewsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MessageSquareOff className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground">Nenhuma avaliação encontrada</h3>
        <p className="text-sm text-muted-foreground mt-1">
          As avaliações dos clientes aparecerão aqui após os atendimentos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}
