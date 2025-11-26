import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EarningsSummary {
  pending: number;
  paidThisMonth: number;
  totalYear: number;
}

interface Earning {
  id: string;
  driver_id: string;
  store_id: string;
  order_id: string;
  delivery_fee: number;
  earnings_amount: number;
  payment_type: 'fixed' | 'commission';
  commission_percentage?: number;
  payment_status: string;
  paid_at?: string;
  payment_reference?: string;
  delivered_at: string;
  created_at: string;
}

interface Filters {
  startDate?: Date;
  endDate?: Date;
  paymentStatus?: 'pending' | 'paid' | 'all';
}

export function useDriverEarnings(driverId: string | null, filters?: Filters) {
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [summary, setSummary] = useState<EarningsSummary>({
    pending: 0,
    paidThisMonth: 0,
    totalYear: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchEarnings = async () => {
    if (!driverId) {
      setEarnings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('driver_earnings')
        .select('*')
        .eq('driver_id', driverId)
        .order('delivered_at', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('delivered_at', filters.startDate.toISOString());
      }

      if (filters?.endDate) {
        query = query.lte('delivered_at', filters.endDate.toISOString());
      }

      if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
        query = query.eq('payment_status', filters.paymentStatus);
      }

      const { data, error } = await query;

      if (error) throw error;

      setEarnings(data || []);

      // Calcular resumo
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayOfYear = new Date(now.getFullYear(), 0, 1);

      const pending = (data || [])
        .filter(e => e.payment_status === 'pending')
        .reduce((sum, e) => sum + parseFloat(e.earnings_amount.toString()), 0);

      const paidThisMonth = (data || [])
        .filter(e => 
          e.payment_status === 'paid' && 
          e.paid_at && 
          new Date(e.paid_at) >= firstDayOfMonth
        )
        .reduce((sum, e) => sum + parseFloat(e.earnings_amount.toString()), 0);

      const totalYear = (data || [])
        .filter(e => 
          e.payment_status === 'paid' && 
          e.paid_at && 
          new Date(e.paid_at) >= firstDayOfYear
        )
        .reduce((sum, e) => sum + parseFloat(e.earnings_amount.toString()), 0);

      setSummary({ pending, paidThisMonth, totalYear });
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, [driverId, filters?.startDate, filters?.endDate, filters?.paymentStatus]);

  return { earnings, summary, loading, refetch: fetchEarnings };
}
