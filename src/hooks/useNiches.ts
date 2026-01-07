import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Niche {
  id: string;
  name: string;
  icon: string | null;
  is_active: boolean | null;
  created_at: string;
}

export function useNiches() {
  return useQuery({
    queryKey: ['niches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('niches')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as Niche[];
    }
  });
}
