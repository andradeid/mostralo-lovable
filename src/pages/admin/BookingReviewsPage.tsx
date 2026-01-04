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
            Acompanhe o feedback dos clientes sobre os atendimentos
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <ReviewsKPICards stats={stats} isLoading={statsLoading} />

      {/* Filtros */}
      <ReviewsFilters
        filters={filters}
        onFiltersChange={setFilters}
        professionals={professionals || []}
        isLoading={professionalsLoading}
      />

      {/* Lista de Avaliações */}
      <ReviewsList reviews={reviews || []} isLoading={reviewsLoading} />
    </div>
  );
}
