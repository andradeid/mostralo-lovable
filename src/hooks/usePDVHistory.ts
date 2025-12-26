import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { startOfDay, subDays } from 'date-fns';

export interface PDVHistoryItem {
  id: string;
  number: string;
  created_at: string;
  closed_at: string | null;
  total: number;
  subtotal: number;
  discount: number;
  payment_method: string | null;
  payment_details: Record<string, any> | null;
  status: string;
  customer_name: string | null;
  items: {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    notes: string | null;
  }[];
}

export function usePDVHistory(daysBack: number = 0) {
  const { storeId } = useStoreAccess();

  const startDate = startOfDay(subDays(new Date(), daysBack)).toISOString();

  return useQuery({
    queryKey: ['pdv-history', storeId, daysBack],
    queryFn: async (): Promise<PDVHistoryItem[]> => {
      if (!storeId) return [];

      const { data, error } = await supabase
        .from('comandas')
        .select(`
          id,
          number,
          created_at,
          closed_at,
          total,
          subtotal,
          discount,
          payment_method,
          payment_details,
          status,
          customer_name,
          comanda_items (
            id,
            product_name,
            quantity,
            unit_price,
            total_price,
            notes
          )
        `)
        .eq('store_id', storeId)
        .eq('type', 'balcao')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Erro ao buscar histórico PDV:', error);
        throw error;
      }

      return (data || []).map(comanda => ({
        ...comanda,
        items: comanda.comanda_items || [],
        payment_details: comanda.payment_details as Record<string, any> | null
      }));
    },
    enabled: !!storeId,
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });
}
