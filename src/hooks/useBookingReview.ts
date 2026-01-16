import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ReviewData {
  id: string;
  token: string;
  booking_id: string;
  store_id: string;
  professional_id: string;
  rating: number | null;
  feedback: string | null;
  is_public: boolean;
  reviewed_at: string | null;
  expires_at: string;
  booking: {
    booking_date: string;
    customer_name: string;
    service: {
      name: string;
    };
  };
  professional: {
    name: string;
    photo_url: string | null;
  };
  store: {
    name: string;
    logo_url: string | null;
  };
}

export function useReviewByToken(token: string | undefined) {
  return useQuery({
    queryKey: ["booking-review", token],
    queryFn: async (): Promise<ReviewData | null> => {
      if (!token) return null;

      const { data, error } = await supabase
        .from("booking_reviews")
        .select(`
          id,
          token,
          booking_id,
          store_id,
          professional_id,
          rating,
          feedback,
          is_public,
          reviewed_at,
          expires_at,
          booking:bookings(
            booking_date,
            customer_name,
            service:booking_services(name)
          ),
          professional:professionals(name, photo_url),
          store:stores(name, logo_url)
        `)
        .eq("token", token)
        .single();

      if (error) {
        console.error("Error fetching review:", error);
        return null;
      }

      return data as unknown as ReviewData;
    },
    enabled: !!token,
  });
}

interface SubmitReviewParams {
  token: string;
  rating: number;
  feedback?: string;
  isPublic?: boolean;
}

export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ token, rating, feedback, isPublic = true }: SubmitReviewParams) => {
      const { data, error } = await supabase
        .from("booking_reviews")
        .update({
          rating,
          feedback: feedback || null,
          is_public: isPublic,
          reviewed_at: new Date().toISOString(),
        })
        .eq("token", token)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["booking-review", variables.token] });
    },
  });
}

function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

interface CreateReviewTokenParams {
  bookingId: string;
  storeId: string;
  professionalId: string;
  customerId?: string;
}

export function useCreateReviewToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, storeId, professionalId, customerId }: CreateReviewTokenParams) => {
      const token = generateToken();
      
      const { data, error } = await supabase
        .from("booking_reviews")
        .insert({
          booking_id: bookingId,
          store_id: storeId,
          professional_id: professionalId,
          customer_id: customerId || null,
          token,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Link de avaliação sempre usa domínio principal do Mostralo
      const siteUrl = import.meta.env.VITE_SITE_URL || 'https://mostralo.com.br';
      
      return {
        ...data,
        reviewUrl: `${siteUrl}/avaliar/${token}`,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking-reviews"] });
    },
  });
}

export function useProfessionalReviews(professionalId: string | undefined) {
  return useQuery({
    queryKey: ["professional-reviews", professionalId],
    queryFn: async () => {
      if (!professionalId) return [];

      const { data, error } = await supabase
        .from("booking_reviews")
        .select(`
          id,
          rating,
          feedback,
          is_public,
          reviewed_at,
          booking:bookings(
            booking_date,
            customer_name,
            service:booking_services(name)
          )
        `)
        .eq("professional_id", professionalId)
        .not("reviewed_at", "is", null)
        .order("reviewed_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!professionalId,
  });
}
