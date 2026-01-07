import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface DentalQuote {
  id: string;
  patient_id: string;
  treatment_plan_id: string | null;
  store_id: string;
  quote_number: string;
  status: string;
  subtotal: number;
  discount_percentage: number;
  discount_value: number;
  total_value: number;
  valid_until: string | null;
  payment_conditions: string | null;
  installments: number;
  notes: string | null;
  internal_notes: string | null;
  sent_at: string | null;
  sent_via: string | null;
  viewed_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  signature_data: string | null;
  signed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DentalQuoteItem {
  id: string;
  quote_id: string;
  procedure_id: string | null;
  description: string;
  procedure_code: string | null;
  tooth_number: number | null;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  total_price: number;
  notes: string | null;
  sort_order: number;
  created_at: string;
}

export type DentalQuoteFormData = {
  patient_id: string;
  store_id: string;
  treatment_plan_id?: string;
  quote_number: string;
  subtotal: number;
  discount_percentage?: number;
  discount_value?: number;
  total_value: number;
  valid_until?: string;
  payment_conditions?: string;
  installments?: number;
  notes?: string;
  internal_notes?: string;
};

export type DentalQuoteItemFormData = {
  quote_id: string;
  procedure_id?: string;
  description: string;
  procedure_code?: string;
  tooth_number?: number;
  quantity?: number;
  unit_price: number;
  discount_percentage?: number;
  notes?: string;
  sort_order?: number;
};
// Status do orçamento
export const QUOTE_STATUS = {
  draft: { label: "Rascunho", color: "secondary" },
  sent: { label: "Enviado", color: "default" },
  viewed: { label: "Visualizado", color: "warning" },
  approved: { label: "Aprovado", color: "success" },
  rejected: { label: "Recusado", color: "destructive" },
  expired: { label: "Expirado", color: "secondary" },
} as const;

export function useDentalQuotes(patientId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const quotesQuery = useQuery({
    queryKey: ['dental-quotes', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      
      const { data, error } = await (supabase as any)
        .from('dental_quotes')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DentalQuote[];
    },
    enabled: !!patientId,
  });

  const createQuote = useMutation({
    mutationFn: async (quoteData: DentalQuoteFormData) => {
      const { data, error } = await (supabase as any)
        .from('dental_quotes')
        .insert(quoteData)
        .select()
        .single();

      if (error) throw error;
      return data as DentalQuote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dental-quotes', patientId] });
      toast({
        title: "Orçamento criado",
        description: "O orçamento foi criado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar orçamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateQuote = useMutation({
    mutationFn: async ({ id, ...quoteData }: Partial<DentalQuote> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('dental_quotes')
        .update(quoteData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as DentalQuote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dental-quotes', patientId] });
      toast({
        title: "Orçamento atualizado",
        description: "O orçamento foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar orçamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteQuote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('dental_quotes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dental-quotes', patientId] });
      toast({
        title: "Orçamento removido",
        description: "O orçamento foi removido com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover orçamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    quotes: quotesQuery.data || [],
    isLoading: quotesQuery.isLoading,
    error: quotesQuery.error,
    createQuote,
    updateQuote,
    deleteQuote,
    refetch: quotesQuery.refetch,
  };
}

// Hook para listar orçamentos por loja (usado na página de orçamentos)
export function useDentalQuotesByStore(storeId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const quotesQuery = useQuery({
    queryKey: ['dental-quotes-by-store', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      
      const { data, error } = await (supabase as any)
        .from('dental_quotes')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DentalQuote[];
    },
    enabled: !!storeId,
  });

  const createQuote = useMutation({
    mutationFn: async (quoteData: DentalQuoteFormData) => {
      const { data, error } = await (supabase as any)
        .from('dental_quotes')
        .insert(quoteData)
        .select()
        .single();

      if (error) throw error;
      return data as DentalQuote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dental-quotes-by-store', storeId] });
      toast({
        title: "Orçamento criado",
        description: "O orçamento foi criado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar orçamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateQuote = useMutation({
    mutationFn: async ({ id, ...quoteData }: Partial<DentalQuote> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('dental_quotes')
        .update(quoteData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as DentalQuote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dental-quotes-by-store', storeId] });
      toast({
        title: "Orçamento atualizado",
        description: "O orçamento foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar orçamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteQuote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('dental_quotes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dental-quotes-by-store', storeId] });
      toast({
        title: "Orçamento removido",
        description: "O orçamento foi removido com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover orçamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    quotes: quotesQuery.data || [],
    isLoading: quotesQuery.isLoading,
    error: quotesQuery.error,
    createQuote,
    updateQuote,
    deleteQuote,
    refetch: quotesQuery.refetch,
  };
}

export function useDentalQuoteItems(quoteId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const itemsQuery = useQuery({
    queryKey: ['dental-quote-items', quoteId],
    queryFn: async () => {
      if (!quoteId) return [];
      
      const { data, error } = await (supabase as any)
        .from('dental_quote_items')
        .select('*')
        .eq('quote_id', quoteId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as DentalQuoteItem[];
    },
    enabled: !!quoteId,
  });

  const addItem = useMutation({
    mutationFn: async (itemData: DentalQuoteItemFormData) => {
      const totalPrice = (itemData.quantity || 1) * itemData.unit_price * (1 - (itemData.discount_percentage || 0) / 100);
      
      const { data, error } = await (supabase as any)
        .from('dental_quote_items')
        .insert({ ...itemData, total_price: totalPrice })
        .select()
        .single();

      if (error) throw error;
      return data as DentalQuoteItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dental-quote-items', quoteId] });
      toast({
        title: "Item adicionado",
        description: "O item foi adicionado ao orçamento.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('dental_quote_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dental-quote-items', quoteId] });
      toast({
        title: "Item removido",
        description: "O item foi removido do orçamento.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    items: itemsQuery.data || [],
    isLoading: itemsQuery.isLoading,
    error: itemsQuery.error,
    addItem,
    removeItem,
    refetch: itemsQuery.refetch,
  };
}

// Gerar número do orçamento
export async function generateQuoteNumber(storeId: string): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2);
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  
  const { count, error } = await (supabase as any)
    .from('dental_quotes')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .gte('created_at', `${new Date().getFullYear()}-01-01`);

  if (error) throw error;
  
  const sequence = ((count || 0) + 1).toString().padStart(4, '0');
  return `ORC-${year}${month}-${sequence}`;
}
