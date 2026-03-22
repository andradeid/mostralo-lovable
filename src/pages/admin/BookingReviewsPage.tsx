import { useState } from "react";
import { useStoreAccess } from "@/hooks/useStoreAccess";
import { 
  useStoreReviews, 
  useReviewsStats, 
  useProfessionalOptions,
  ReviewFilters 
} from "@/hooks/useBookingReviews";
import { ReviewsKPICards } from "@/components/admin/booking-reviews/ReviewsKPICards";
import { ReviewsFilters } from "@/components/admin/booking-reviews/ReviewsFilters";
import { ReviewsList } from "@/components/admin/booking-reviews/ReviewsList";
import { ReviewsInsights } from "@/components/admin/booking-reviews/ReviewsInsights";
import { RatingDistribution } from "@/components/admin/booking-reviews/RatingDistribution";
import { Star } from "lucide-react";

export default function BookingReviewsPage() {
  const { storeId } = useStoreAccess();
  const [filters, setFilters] = useState<ReviewFilters>({});

  const { data: reviews, isLoading: reviewsLoading } = useStoreReviews(storeId, filters);
  const { data: stats, isLoading: statsLoading } = useReviewsStats(storeId);
  const { data: professionals, isLoading: professionalsLoading } = useProfessionalOptions(storeId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
          <Star className="w-6 h-6 text-yellow-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Avaliações dos Profissionais</h1>
          <p className="text-sm text-muted-foreground">
            Central de reputação e feedback dos clientes
          </p>
        </div>
      </div>

      {/* KPIs */}
      <ReviewsKPICards stats={stats} isLoading={statsLoading} reviews={reviews} />

      {/* Insights + Distribuição */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ReviewsInsights reviews={reviews || []} stats={stats} />
        <RatingDistribution stats={stats} />
      </div>

      {/* Filtros */}
      <ReviewsFilters
        filters={filters}
        onFiltersChange={setFilters}
        professionals={professionals || []}
        isLoading={professionalsLoading}
      />

      {/* Lista paginada */}
      <ReviewsList reviews={reviews || []} isLoading={reviewsLoading} />
    </div>
  );
}
