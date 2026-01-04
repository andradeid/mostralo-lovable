import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StoreReview } from "@/hooks/useBookingReviews";
import { StarRating } from "./StarRating";
import { Eye, EyeOff, User } from "lucide-react";

interface ReviewCardProps {
  review: StoreReview;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const reviewDate = review.reviewed_at 
    ? format(new Date(review.reviewed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : "";

  const bookingDate = review.booking_date
    ? format(new Date(review.booking_date), "dd/MM/yyyy", { locale: ptBR })
    : "";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {/* Header com estrelas e badge de visibilidade */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <StarRating rating={review.rating} size="lg" />
              <span className="text-xs text-muted-foreground">{reviewDate}</span>
            </div>
            <Badge variant={review.is_public ? "default" : "secondary"} className="gap-1">
              {review.is_public ? (
                <>
                  <Eye className="w-3 h-3" />
                  Pública
                </>
              ) : (
                <>
                  <EyeOff className="w-3 h-3" />
                  Privada
                </>
              )}
            </Badge>
          </div>

          {/* Feedback */}
          {review.feedback && (
            <p className="text-foreground italic">"{review.feedback}"</p>
          )}

          {/* Info do cliente e profissional */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2 border-t">
            {/* Cliente */}
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-muted rounded-full">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{review.customer_name}</span>
                <span className="text-xs text-muted-foreground">Cliente</span>
              </div>
            </div>

            {/* Profissional */}
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={review.professional_photo || undefined} />
                <AvatarFallback className="text-xs">
                  {review.professional_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{review.professional_name}</span>
                <span className="text-xs text-muted-foreground">Profissional</span>
              </div>
            </div>

            {/* Serviço */}
            <div className="flex flex-col sm:ml-auto text-right">
              <span className="text-sm font-medium">{review.service_name}</span>
              <span className="text-xs text-muted-foreground">
                Atendimento em {bookingDate}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
