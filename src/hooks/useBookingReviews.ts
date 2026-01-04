import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StoreReview {
  id: string;
  booking_id: string;
  store_id: string;
  professional_id: string;
  customer_id: string | null;
  rating: number;
  feedback: string | null;
  is_public: boolean;
  reviewed_at: string;
  created_at: string;
  professional_name: string;
  professional_photo: string | null;
  service_name: string;
  booking_date: string;
  customer_name: string;
  customer_phone: string;
}

export interface ReviewsStats {
  totalReviews: number;
  averageRating: number;
  positivePercentage: number;
  ratingDistribution: {
    rating: number;
    count: number;
  }[];
}

export interface ReviewFilters {
  professionalId?: string;
  minRating?: number;
  maxRating?: number;
  startDate?: string;
  endDate?: string;
}

export function useStoreReviews(storeId: string | undefined, filters?: ReviewFilters) {
  return useQuery({
    queryKey: ["store-reviews", storeId, filters],
    queryFn: async (): Promise<StoreReview[]> => {
      if (!storeId) return [];

      let query = supabase
        .from("booking_reviews")
        .select(`
          id,
          booking_id,
          store_id,
          professional_id,
          customer_id,
          rating,
          feedback,
          is_public,
          reviewed_at,
          created_at,
          professionals!inner(name, photo_url),
          bookings!inner(booking_date, customer_name, customer_phone, service_id),
          booking_services:bookings!inner(booking_services!inner(name))
        `)
        .eq("store_id", storeId)
        .not("reviewed_at", "is", null)
        .order("reviewed_at", { ascending: false });

      if (filters?.professionalId) {
        query = query.eq("professional_id", filters.professionalId);
      }

      if (filters?.minRating) {
        query = query.gte("rating", filters.minRating);
      }

      if (filters?.maxRating) {
        query = query.lte("rating", filters.maxRating);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching store reviews:", error);
        throw error;
      }

      return (data || []).map((review: any) => ({
        id: review.id,
        booking_id: review.booking_id,
        store_id: review.store_id,
        professional_id: review.professional_id,
        customer_id: review.customer_id,
        rating: review.rating,
        feedback: review.feedback,
        is_public: review.is_public,
        reviewed_at: review.reviewed_at,
        created_at: review.created_at,
        professional_name: review.professionals?.name || "Profissional",
        professional_photo: review.professionals?.photo_url || null,
        service_name: review.booking_services?.booking_services?.name || "Serviço",
        booking_date: review.bookings?.booking_date || "",
        customer_name: review.bookings?.customer_name || "Cliente",
        customer_phone: review.bookings?.customer_phone || ""
      }));
    },
    enabled: !!storeId
  });
}

export function useReviewsStats(storeId: string | undefined) {
  return useQuery({
    queryKey: ["reviews-stats", storeId],
    queryFn: async (): Promise<ReviewsStats> => {
      if (!storeId) {
        return {
          totalReviews: 0,
          averageRating: 0,
          positivePercentage: 0,
          ratingDistribution: []
        };
      }

      const { data, error } = await supabase
        .from("booking_reviews")
        .select("rating")
        .eq("store_id", storeId)
        .not("reviewed_at", "is", null);

      if (error) {
        console.error("Error fetching reviews stats:", error);
        throw error;
      }

      const reviews = data || [];
      const totalReviews = reviews.length;

      if (totalReviews === 0) {
        return {
          totalReviews: 0,
          averageRating: 0,
          positivePercentage: 0,
          ratingDistribution: [
            { rating: 5, count: 0 },
            { rating: 4, count: 0 },
            { rating: 3, count: 0 },
            { rating: 2, count: 0 },
            { rating: 1, count: 0 }
          ]
        };
      }

      const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
      const averageRating = sum / totalReviews;

      const positiveCount = reviews.filter(r => (r.rating || 0) >= 4).length;
      const positivePercentage = (positiveCount / totalReviews) * 100;

      const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews.forEach(r => {
        const rating = r.rating || 0;
        if (rating >= 1 && rating <= 5) {
          distribution[rating]++;
        }
      });

      const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
        rating,
        count: distribution[rating]
      }));

      return {
        totalReviews,
        averageRating,
        positivePercentage,
        ratingDistribution
      };
    },
    enabled: !!storeId
  });
}

export function useProfessionalOptions(storeId: string | undefined) {
  return useQuery({
    queryKey: ["professional-options", storeId],
    queryFn: async () => {
      if (!storeId) return [];

      const { data, error } = await supabase
        .from("professionals")
        .select("id, name")
        .eq("store_id", storeId)
        .eq("is_active", true)
        .order("name");

      if (error) {
        console.error("Error fetching professionals:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!storeId
  });
}
