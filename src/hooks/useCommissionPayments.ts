import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { startOfMonth, endOfMonth, format } from "date-fns";

export interface CommissionWithDetails {
  id: string;
  professional_id: string;
  booking_id: string;
  store_id: string;
  service_price: number;
  commission_type: string;
  commission_value: number;
  commission_amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  professional?: {
    id: string;
    name: string;
    photo_url: string | null;
    specialty: string | null;
  };
  booking?: {
    booking_date: string;
    customer_name: string;
    service?: {
      name: string;
    };
  };
}

export interface ProfessionalSummary {
  id: string;
  name: string;
  photo_url: string | null;
  specialty: string | null;
  pendingAmount: number;
  pendingCount: number;
  paidThisMonth: number;
  paidTotal: number;
  lastPaymentDate: string | null;
}

export interface CommissionFilters {
  startDate?: Date;
  endDate?: Date;
  professionalId?: string;
  status?: "pending" | "paid" | "all";
}

export interface PaymentRecord {
  id: string;
  professional_id: string;
  store_id: string;
  amount: number;
  payment_method: string;
  reference: string | null;
  notes: string | null;
  commission_ids: string[];
  created_at: string;
  created_by: string | null;
}

export function useCommissionPayments(storeId: string | null, filters?: CommissionFilters) {
  const queryClient = useQueryClient();

  // Buscar todas as comissões com detalhes
  const {
    data: commissions,
    isLoading: isLoadingCommissions,
    refetch: refetchCommissions,
  } = useQuery({
    queryKey: ["commission-payments", storeId, filters],
    queryFn: async () => {
      if (!storeId) return [];

      let query = supabase
        .from("professional_commissions")
        .select(`
          *,
          professional:professionals!professional_commissions_professional_id_fkey (
            id, name, photo_url, specialty
          ),
          booking:bookings!professional_commissions_booking_id_fkey (
            booking_date,
            customer_name,
            service:booking_services!bookings_service_id_fkey (name)
          )
        `)
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });

      if (filters?.startDate) {
        query = query.gte("created_at", filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        query = query.lte("created_at", filters.endDate.toISOString());
      }
      if (filters?.professionalId) {
        query = query.eq("professional_id", filters.professionalId);
      }
      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao buscar comissões:", error);
        throw error;
      }

      return (data || []) as CommissionWithDetails[];
    },
    enabled: !!storeId,
  });

  // Buscar resumo por profissional
  const {
    data: professionalSummaries,
    isLoading: isLoadingSummaries,
    refetch: refetchSummaries,
  } = useQuery({
    queryKey: ["professional-commission-summaries", storeId],
    queryFn: async () => {
      if (!storeId) return [];

      // Buscar profissionais
      const { data: professionals, error: profError } = await supabase
        .from("professionals")
        .select("id, name, photo_url, specialty")
        .eq("store_id", storeId)
        .eq("is_active", true);

      if (profError) throw profError;

      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      // Para cada profissional, calcular totais
      const summaries: ProfessionalSummary[] = await Promise.all(
        (professionals || []).map(async (prof) => {
          // Pendentes
          const { data: pending } = await supabase
            .from("professional_commissions")
            .select("commission_amount")
            .eq("professional_id", prof.id)
            .eq("status", "pending");

          const pendingAmount = pending?.reduce((acc, c) => acc + Number(c.commission_amount), 0) || 0;
          const pendingCount = pending?.length || 0;

          // Pagos este mês
          const { data: paidMonth } = await supabase
            .from("professional_commissions")
            .select("commission_amount")
            .eq("professional_id", prof.id)
            .eq("status", "paid")
            .gte("paid_at", monthStart.toISOString())
            .lte("paid_at", monthEnd.toISOString());

          const paidThisMonth = paidMonth?.reduce((acc, c) => acc + Number(c.commission_amount), 0) || 0;

          // Total já pago (histórico)
          const { data: paidTotal } = await supabase
            .from("professional_commissions")
            .select("commission_amount")
            .eq("professional_id", prof.id)
            .eq("status", "paid");

          const totalPaid = paidTotal?.reduce((acc, c) => acc + Number(c.commission_amount), 0) || 0;

          // Último pagamento
          const { data: lastPayment } = await supabase
            .from("professional_commissions")
            .select("paid_at")
            .eq("professional_id", prof.id)
            .eq("status", "paid")
            .order("paid_at", { ascending: false })
            .limit(1)
            .single();

          return {
            ...prof,
            pendingAmount,
            pendingCount,
            paidThisMonth,
            paidTotal: totalPaid,
            lastPaymentDate: lastPayment?.paid_at || null,
          };
        })
      );

      return summaries;
    },
    enabled: !!storeId,
  });

  // Calcular totais gerais
  const totals = {
    totalPending: professionalSummaries?.reduce((acc, p) => acc + p.pendingAmount, 0) || 0,
    totalPaidThisMonth: professionalSummaries?.reduce((acc, p) => acc + p.paidThisMonth, 0) || 0,
    totalPaidAllTime: professionalSummaries?.reduce((acc, p) => acc + p.paidTotal, 0) || 0,
    pendingCount: professionalSummaries?.reduce((acc, p) => acc + p.pendingCount, 0) || 0,
  };

  // Mutation para registrar pagamento
  const payCommissionsMutation = useMutation({
    mutationFn: async ({
      commissionIds,
      paymentMethod,
      reference,
      notes,
      receiptUrl,
    }: {
      commissionIds: string[];
      paymentMethod: string;
      reference?: string;
      notes?: string;
      receiptUrl?: string;
    }) => {
      const now = new Date().toISOString();

      // Atualizar status das comissões
      const { error } = await supabase
        .from("professional_commissions")
        .update({
          status: "paid",
          paid_at: now,
          updated_at: now,
          payment_method: paymentMethod,
          payment_reference: reference || null,
          payment_notes: notes || null,
          payment_receipt_url: receiptUrl || null,
        })
        .in("id", commissionIds);

      if (error) throw error;

      return { success: true, paidAt: now };
    },
    onSuccess: () => {
      toast.success("Pagamento registrado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["commission-payments"] });
      queryClient.invalidateQueries({ queryKey: ["professional-commission-summaries"] });
    },
    onError: (error: any) => {
      console.error("Erro ao registrar pagamento:", error);
      toast.error("Erro ao registrar pagamento");
    },
  });

  // Mutation para reverter pagamento
  const revertPaymentMutation = useMutation({
    mutationFn: async (commissionId: string) => {
      const { error } = await supabase
        .from("professional_commissions")
        .update({
          status: "pending",
          paid_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", commissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pagamento revertido para pendente");
      queryClient.invalidateQueries({ queryKey: ["commission-payments"] });
      queryClient.invalidateQueries({ queryKey: ["professional-commission-summaries"] });
    },
    onError: (error: any) => {
      console.error("Erro ao reverter pagamento:", error);
      toast.error("Erro ao reverter pagamento");
    },
  });

  const refetch = useCallback(() => {
    refetchCommissions();
    refetchSummaries();
  }, [refetchCommissions, refetchSummaries]);

  return {
    commissions: commissions || [],
    professionalSummaries: professionalSummaries || [],
    totals,
    isLoading: isLoadingCommissions || isLoadingSummaries,
    refetch,
    payCommissions: payCommissionsMutation.mutateAsync,
    revertPayment: revertPaymentMutation.mutateAsync,
    isPaying: payCommissionsMutation.isPending,
    isReverting: revertPaymentMutation.isPending,
  };
}

// Função para exportar relatório em CSV
export function exportCommissionsToCSV(
  commissions: CommissionWithDetails[],
  filename: string = "relatorio-comissoes"
) {
  const headers = [
    "Profissional",
    "Cliente",
    "Serviço",
    "Data Agendamento",
    "Valor Serviço",
    "Tipo Comissão",
    "% ou Valor",
    "Valor Comissão",
    "Status",
    "Data Pagamento",
  ];

  const rows = commissions.map((c) => [
    c.professional?.name || "",
    c.booking?.customer_name || "",
    c.booking?.service?.name || "",
    c.booking?.booking_date ? format(new Date(c.booking.booking_date), "dd/MM/yyyy") : "",
    c.service_price.toFixed(2),
    c.commission_type === "percentage" ? "Percentual" : "Fixo",
    c.commission_type === "percentage" ? `${c.commission_value}%` : `R$ ${c.commission_value.toFixed(2)}`,
    c.commission_amount.toFixed(2),
    c.status === "paid" ? "Pago" : "Pendente",
    c.paid_at ? format(new Date(c.paid_at), "dd/MM/yyyy HH:mm") : "",
  ]);

  const csvContent = [
    headers.join(";"),
    ...rows.map((row) => row.join(";")),
  ].join("\n");

  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}-${format(new Date(), "yyyy-MM-dd")}.csv`;
  link.click();
}
