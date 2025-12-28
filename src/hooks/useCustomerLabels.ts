import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CustomerLabel {
  id: string;
  name: string;
  color: string;
  label_type: string;
  is_system: boolean;
  description?: string;
}

interface CustomerLabelAssignment {
  label_id: string;
  customer_labels: CustomerLabel;
}

export const useCustomerLabels = (storeId: string | null) => {
  const [labels, setLabels] = useState<CustomerLabel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (storeId) {
      fetchLabels();
    }
  }, [storeId]);

  const fetchLabels = async () => {
    if (!storeId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customer_labels')
        .select('*')
        .eq('store_id', storeId)
        .order('label_type')
        .order('name');

      if (error) throw error;
      setLabels(data || []);
    } catch (error) {
      console.error('Error fetching labels:', error);
    } finally {
      setLoading(false);
    }
  };

  return { labels, loading, refetch: fetchLabels };
};

export const useCustomerLabelAssignments = (customerIds: string[], storeId?: string | null) => {
  const [assignments, setAssignments] = useState<Record<string, CustomerLabel[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (customerIds.length > 0) {
      fetchAssignments();
    } else {
      setAssignments({});
      setLoading(false);
    }
  }, [customerIds.join(','), storeId]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('customer_label_assignments')
        .select(`
          customer_id,
          customer_labels (
            id,
            name,
            color,
            label_type,
            is_system
          )
        `)
        .in('customer_id', customerIds);

      // Filtrar por store_id se fornecido
      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Agrupar por customer_id
      const grouped: Record<string, CustomerLabel[]> = {};
      data?.forEach((item: { customer_id: string; customer_labels: CustomerLabel | null }) => {
        if (!grouped[item.customer_id]) {
          grouped[item.customer_id] = [];
        }
        if (item.customer_labels) {
          grouped[item.customer_id].push(item.customer_labels);
        }
      });

      setAssignments(grouped);
    } catch (error) {
      console.error('Error fetching label assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  return { assignments, loading, refetch: fetchAssignments };
};
