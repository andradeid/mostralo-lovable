import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface DentalPayment {
  id: string;
  quote_id: string;
  patient_id: string;
  store_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  installment_number: number;
  total_installments: number;
  reference_number: string | null;
  notes: string | null;
  attachment_url: string | null;
  registered_by: string | null;
  created_at: string;
  updated_at: string;
}

export type DentalPaymentFormData = {
  quote_id: string;
  patient_id: string;
  store_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  installment_number?: number;
  total_installments?: number;
  reference_number?: string;
  notes?: string;
  attachment_url?: string;
};

export const PAYMENT_METHODS = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  cartao_credito: "Cartão de Crédito",
  cartao_debito: "Cartão de Débito",
  boleto: "Boleto",
  transferencia: "Transferência",
  convenio: "Convênio",
  outro: "Outro",
} as const;

export function usePatientPayments(patientId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const paymentsQuery = useQuery({
    queryKey: ['dental-payments', 'patient', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      
      const { data, error } = await (supabase as any)
        .from('dental_payments')
        .select('*')
        .eq('patient_id', patientId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data as DentalPayment[];
    },
    enabled: !!patientId,
  });

  const createPayment = useMutation({
    mutationFn: async (paymentData: DentalPaymentFormData) => {
      const { data, error } = await (supabase as any)
        .from('dental_payments')
        .insert(paymentData)
        .select()
        .single();

      if (error) throw error;
      return data as DentalPayment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dental-payments', 'patient', patientId] });
      queryClient.invalidateQueries({ queryKey: ['dental-quotes'] });
      toast({
        title: "Pagamento registrado",
        description: "O pagamento foi registrado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao registrar pagamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePayment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('dental_payments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dental-payments', 'patient', patientId] });
      queryClient.invalidateQueries({ queryKey: ['dental-quotes'] });
      toast({
        title: "Pagamento removido",
        description: "O pagamento foi removido com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover pagamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    payments: paymentsQuery.data || [],
    isLoading: paymentsQuery.isLoading,
    error: paymentsQuery.error,
    createPayment,
    deletePayment,
    refetch: paymentsQuery.refetch,
  };
}

export function useQuotePayments(quoteId: string | null) {
  const paymentsQuery = useQuery({
    queryKey: ['dental-payments', 'quote', quoteId],
    queryFn: async () => {
      if (!quoteId) return [];
      
      const { data, error } = await (supabase as any)
        .from('dental_payments')
        .select('*')
        .eq('quote_id', quoteId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data as DentalPayment[];
    },
    enabled: !!quoteId,
  });

  return {
    payments: paymentsQuery.data || [],
    isLoading: paymentsQuery.isLoading,
    totalPaid: paymentsQuery.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
  };
}
