import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { addMonths, addQuarters, addYears } from "date-fns";
import type { ExternalClient } from "./useExternalClients";
import type { ExternalService } from "./useExternalServices";

export interface ExternalInvoice {
  id: string;
  invoice_number: string | null;
  client_id: string;
  service_id: string | null;
  description: string;
  amount: number;
  due_date: string;
  is_recurring: boolean;
  recurrence_type: "once" | "monthly" | "quarterly" | "yearly" | null;
  recurrence_count: number | null;
  recurrence_current: number;
  parent_invoice_id: string | null;
  next_due_date: string | null;
  payment_status: "pending" | "paid" | "overdue" | "cancelled";
  paid_at: string | null;
  payment_method: string | null;
  pix_txid: string | null;
  pix_copia_cola: string | null;
  pix_qrcode_base64: string | null;
  pix_expires_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  client?: ExternalClient;
  service?: ExternalService;
}

export interface CreateExternalInvoiceParams {
  client_id: string;
  service_id?: string;
  description: string;
  amount: number;
  due_date: string;
  is_recurring?: boolean;
  recurrence_type?: "once" | "monthly" | "quarterly" | "yearly";
  recurrence_count?: number | null;
  notes?: string;
}

export interface UpdateExternalInvoiceParams {
  id: string;
  description?: string;
  amount?: number;
  due_date?: string;
  payment_status?: "pending" | "paid" | "overdue" | "cancelled";
  paid_at?: string;
  payment_method?: string;
  notes?: string;
}

function calculateNextDueDate(dueDate: string, recurrenceType: string): string {
  const date = new Date(dueDate);
  switch (recurrenceType) {
    case "monthly":
      return addMonths(date, 1).toISOString().split("T")[0];
    case "quarterly":
      return addQuarters(date, 1).toISOString().split("T")[0];
    case "yearly":
      return addYears(date, 1).toISOString().split("T")[0];
    default:
      return dueDate;
  }
}

export function useExternalInvoices(filters?: { clientId?: string; status?: string }) {
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading, error, refetch } = useQuery({
    queryKey: ["external-invoices", filters],
    queryFn: async () => {
      let query = supabase
        .from("external_invoices")
        .select(`
          *,
          client:external_clients(*),
          service:external_services(*)
        `)
        .order("due_date", { ascending: false });

      if (filters?.clientId) {
        query = query.eq("client_id", filters.clientId);
      }
      if (filters?.status) {
        query = query.eq("payment_status", filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ExternalInvoice[];
    },
  });

  const createInvoice = useMutation({
    mutationFn: async (params: CreateExternalInvoiceParams) => {
      const { data: user } = await supabase.auth.getUser();
      
      const nextDueDate = params.is_recurring && params.recurrence_type !== "once"
        ? calculateNextDueDate(params.due_date, params.recurrence_type || "monthly")
        : null;

      const { data, error } = await supabase
        .from("external_invoices")
        .insert({
          ...params,
          next_due_date: nextDueDate,
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-invoices"] });
      toast.success("Fatura criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar fatura: ${error.message}`);
    },
  });

  const updateInvoice = useMutation({
    mutationFn: async ({ id, ...params }: UpdateExternalInvoiceParams) => {
      const { data, error } = await supabase
        .from("external_invoices")
        .update(params)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-invoices"] });
      toast.success("Fatura atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar fatura: ${error.message}`);
    },
  });

  const markAsPaid = useMutation({
    mutationFn: async ({ id, payment_method }: { id: string; payment_method?: string }) => {
      const { data, error } = await supabase
        .from("external_invoices")
        .update({
          payment_status: "paid",
          paid_at: new Date().toISOString(),
          payment_method: payment_method || "manual",
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-invoices"] });
      toast.success("Fatura marcada como paga!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao marcar como paga: ${error.message}`);
    },
  });

  const cancelInvoice = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("external_invoices")
        .update({ payment_status: "cancelled" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-invoices"] });
      toast.success("Fatura cancelada!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cancelar fatura: ${error.message}`);
    },
  });

  const deleteInvoice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("external_invoices")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-invoices"] });
      toast.success("Fatura removida com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover fatura: ${error.message}`);
    },
  });

  return {
    invoices,
    isLoading,
    error,
    refetch,
    createInvoice,
    updateInvoice,
    markAsPaid,
    cancelInvoice,
    deleteInvoice,
  };
}
