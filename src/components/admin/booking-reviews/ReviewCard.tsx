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
    <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
      {/* Left: rating + feedback */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <StarRating rating={review.rating} size="md" />
          <span className="text-[11px] text-muted-foreground">{reviewDate}</span>
          <Badge 
            variant={review.is_public ? "default" : "secondary"} 
            className="gap-1 text-[10px] px-1.5 py-0 h-5"
          >
            {review.is_public ? (
              <><Eye className="w-2.5 h-2.5" /> Pública</>
            ) : (
              <><EyeOff className="w-2.5 h-2.5" /> Privada</>
            )}
          </Badge>
        </div>
        {review.feedback && (
          <p className="text-sm text-foreground/90 italic leading-relaxed">"{review.feedback}"</p>
        )}
      </div>

      {/* Right: people + service */}
      <div className="flex sm:flex-col items-start sm:items-end gap-2 sm:gap-1 flex-shrink-0 sm:min-w-[180px]">
        <div className="flex items-center gap-1.5">
          <User className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs font-medium">{review.customer_name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Avatar className="w-5 h-5">
            <AvatarImage src={review.professional_photo || undefined} />
            <AvatarFallback className="text-[8px]">
              {review.professional_name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium">{review.professional_name}</span>
        </div>
        <div className="flex flex-col items-start sm:items-end">
          <span className="text-xs text-muted-foreground">{review.service_name}</span>
          <span className="text-[10px] text-muted-foreground">em {bookingDate}</span>
        </div>
      </div>
    </div>
  );
}
