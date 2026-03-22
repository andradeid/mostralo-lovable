import { useState } from "react";
import { StoreReview } from "@/hooks/useBookingReviews";
import { ReviewCard } from "./ReviewCard";
import { MessageSquareOff, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ReviewsListProps {
  reviews: StoreReview[];
  isLoading: boolean;
}

export function ReviewsList({ reviews, isLoading }: ReviewsListProps) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <MessageSquareOff className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground">Ainda não há avaliações neste período</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          Continue incentivando feedback dos clientes após os atendimentos para melhorar a reputação da sua equipe.
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil(reviews.length / perPage);
  const start = (page - 1) * perPage;
  const paginatedReviews = reviews.slice(start, start + perPage);

  // Reset page when perPage changes
  const handlePerPageChange = (value: string) => {
    setPerPage(Number(value));
    setPage(1);
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="space-y-3">
      {paginatedReviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}

      {/* Paginação */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          Mostrando {start + 1}–{Math.min(start + perPage, reviews.length)} de {reviews.length} avaliações
        </p>

        <div className="flex items-center gap-2">
          <Select value={perPage.toString()} onValueChange={handlePerPageChange}>
            <SelectTrigger className="w-[80px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {getPageNumbers().map((p, i) =>
              p === "..." ? (
                <span key={`dots-${i}`} className="px-1 text-xs text-muted-foreground">…</span>
              ) : (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8 text-xs"
                  onClick={() => setPage(p as number)}
                >
                  {p}
                </Button>
              )
            )}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
