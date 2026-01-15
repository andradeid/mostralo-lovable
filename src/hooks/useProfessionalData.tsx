import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProfessionalData {
  id: string;
  store_id: string;
  user_id: string;
  name: string;
  slug: string | null;
  photo_url: string | null;
  specialty: string | null;
  description: string | null;
  is_active: boolean;
  commission_type: string | null;
  commission_value: number | null;
  stores?: {
    name: string;
    slug: string;
  };
}

export function useProfessionalData() {
  return useQuery({
    queryKey: ["professional-data"],
    queryFn: async (): Promise<ProfessionalData | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("professionals")
        .select(`
          id,
          store_id,
          user_id,
          name,
          slug,
          photo_url,
          specialty,
          description,
          is_active,
          commission_type,
          commission_value,
          stores:store_id (name, slug)
        `)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar dados do profissional:", error);
        throw error;
      }

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useProfessionalBookings(professionalId: string | undefined, date?: string) {
  return useQuery({
    queryKey: ["professional-bookings", professionalId, date],
    queryFn: async () => {
      if (!professionalId) return [];

      let query = supabase
        .from("bookings")
        .select(`
          *,
          booking_services:service_id (name, duration_minutes)
        `)
        .eq("professional_id", professionalId)
        .order("booking_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (date) {
        query = query.eq("booking_date", date);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao buscar agendamentos:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!professionalId,
  });
}

export function useProfessionalCommissions(professionalId: string | undefined) {
  return useQuery({
    queryKey: ["professional-commissions", professionalId],
    queryFn: async () => {
      if (!professionalId) return [];

      const { data, error } = await supabase
        .from("professional_commissions")
        .select(`
          *,
          bookings:booking_id (
            booking_date,
            customer_name,
            booking_services:service_id (name)
          )
        `)
        .eq("professional_id", professionalId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar comissões:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!professionalId,
  });
}

export function useProfessionalSchedules(professionalId: string | undefined) {
  return useQuery({
    queryKey: ["professional-schedules", professionalId],
    queryFn: async () => {
      if (!professionalId) return [];

      const { data, error } = await supabase
        .from("professional_schedules")
        .select("*")
        .eq("professional_id", professionalId)
        .order("day_of_week", { ascending: true });

      if (error) {
        console.error("Erro ao buscar horários:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!professionalId,
  });
}

export function useProfessionalBlocks(professionalId: string | undefined) {
  return useQuery({
    queryKey: ["professional-blocks", professionalId],
    queryFn: async () => {
      if (!professionalId) return [];

      const { data, error } = await supabase
        .from("professional_blocks")
        .select("*")
        .eq("professional_id", professionalId)
        .gte("block_date", new Date().toISOString().split("T")[0])
        .order("block_date", { ascending: true });

      if (error) {
        console.error("Erro ao buscar bloqueios:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!professionalId,
  });
}

export function useProfessionalStats(professionalId: string | undefined) {
  return useQuery({
    queryKey: ["professional-stats", professionalId],
    queryFn: async () => {
      if (!professionalId) return null;

      const today = new Date().toISOString().split("T")[0];
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const startOfMonth = new Date();
      startOfMonth.setDate(1);

      // Agendamentos de hoje
      const { count: todayCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("professional_id", professionalId)
        .eq("booking_date", today)
        .not("status", "in", '("cancelled","no_show")');

      // Agendamentos da semana
      const { count: weekCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("professional_id", professionalId)
        .gte("booking_date", startOfWeek.toISOString().split("T")[0])
        .lte("booking_date", today)
        .not("status", "in", '("cancelled","no_show")');

      // Agendamentos do mês
      const { count: monthCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("professional_id", professionalId)
        .gte("booking_date", startOfMonth.toISOString().split("T")[0])
        .not("status", "in", '("cancelled","no_show")');

      // Comissões pendentes
      const { data: pendingCommissions } = await supabase
        .from("professional_commissions")
        .select("commission_amount")
        .eq("professional_id", professionalId)
        .eq("status", "pending");

      // Comissões pagas (do mês)
      const { data: paidCommissions } = await supabase
        .from("professional_commissions")
        .select("commission_amount")
        .eq("professional_id", professionalId)
        .eq("status", "paid")
        .gte("created_at", startOfMonth.toISOString());

      const pendingTotal = pendingCommissions?.reduce((acc, c) => acc + Number(c.commission_amount), 0) || 0;
      const paidTotal = paidCommissions?.reduce((acc, c) => acc + Number(c.commission_amount), 0) || 0;

      return {
        todayCount: todayCount || 0,
        weekCount: weekCount || 0,
        monthCount: monthCount || 0,
        pendingCommissions: pendingTotal,
        paidCommissions: paidTotal,
      };
    },
    enabled: !!professionalId,
  });
}
