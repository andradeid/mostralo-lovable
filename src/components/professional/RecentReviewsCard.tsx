import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Star, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useProfessionalReviews } from "@/hooks/useBookingReview";

interface RecentReviewsCardProps {
  professionalId: string;
}

export function RecentReviewsCard({ professionalId }: RecentReviewsCardProps) {
  const { data: reviews, isLoading } = useProfessionalReviews(professionalId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Últimas Avaliações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 border rounded-lg space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const recentReviews = reviews?.slice(0, 10) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <CardTitle>Últimas Avaliações</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {!recentReviews.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Nenhuma avaliação recebida ainda</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentReviews.map((review) => {
              const booking = review.booking as { 
                booking_date: string; 
                customer_name: string; 
                service: { name: string } 
              } | null;

              return (
                <div key={review.id} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < (review.rating || 0)
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                    {review.is_public && (
                      <Badge variant="outline" className="text-xs">
                        Público
                      </Badge>
                    )}
                  </div>

                  {review.feedback && (
                    <p className="text-sm text-foreground">"{review.feedback}"</p>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {booking?.customer_name} • {booking?.service?.name}
                    </span>
                    <span>
                      {review.reviewed_at &&
                        format(new Date(review.reviewed_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
