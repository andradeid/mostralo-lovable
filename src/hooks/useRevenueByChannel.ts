import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ChannelRevenue {
  channel: string;
  categoryName: string;
  total: number;
  count: number;
  percentage: number;
  color: string;
  icon: string;
}

export interface MonthlyChannelData {
  month: string;
  online: number;
  totem: number;
  pdv: number;
  mesa: number;
  agendamentos: number;
}

export interface RevenueByChannelData {
  channels: ChannelRevenue[];
  totalRevenue: number;
  monthlyByChannel: MonthlyChannelData[];
}

const CHANNEL_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  'Vendas': { color: '#10b981', icon: 'ShoppingCart', label: 'Pedidos Online' },
  'Vendas Totem': { color: '#f97316', icon: 'Tablet', label: 'Totem' },
  'Vendas PDV': { color: '#3b82f6', icon: 'Store', label: 'PDV/Balcão' },
  'Vendas Mesa': { color: '#8b5cf6', icon: 'UtensilsCrossed', label: 'Mesa' },
  'Agendamentos': { color: '#f59e0b', icon: 'Calendar', label: 'Agendamentos' },
};

export function useRevenueByChannel(storeId: string | null) {
  return useQuery({
    queryKey: ['revenue-by-channel', storeId],
    queryFn: async (): Promise<RevenueByChannelData> => {
      if (!storeId) {
        return { channels: [], totalRevenue: 0, monthlyByChannel: [] };
      }

      // Buscar categorias de receita dos canais
      const { data: categories, error: catError } = await supabase
        .from('financial_categories')
        .select('id, name')
        .eq('type', 'income')
        .in('name', ['Vendas', 'Vendas Totem', 'Vendas PDV', 'Vendas Mesa', 'Agendamentos']);

      if (catError) throw catError;

      const categoryIds = categories?.map(c => c.id) || [];
      const categoryMap = new Map(categories?.map(c => [c.id, c.name]) || []);

      if (categoryIds.length === 0) {
        return { channels: [], totalRevenue: 0, monthlyByChannel: [] };
      }

      // Buscar transações de receita desses canais
      const { data: transactions, error: txError } = await supabase
        .from('financial_transactions')
        .select('amount, category_id, transaction_date')
        .eq('store_id', storeId)
        .eq('type', 'income')
        .in('category_id', categoryIds);

      if (txError) throw txError;

      // Agrupar por categoria
      const channelTotals: Record<string, { total: number; count: number }> = {};
      let totalRevenue = 0;

      (transactions || []).forEach(tx => {
        const categoryName = categoryMap.get(tx.category_id) || 'Outros';
        if (!channelTotals[categoryName]) {
          channelTotals[categoryName] = { total: 0, count: 0 };
        }
        channelTotals[categoryName].total += Number(tx.amount);
        channelTotals[categoryName].count += 1;
        totalRevenue += Number(tx.amount);
      });

      // Montar array de canais
      const channels: ChannelRevenue[] = Object.entries(CHANNEL_CONFIG).map(([name, config]) => ({
        channel: config.label,
        categoryName: name,
        total: channelTotals[name]?.total || 0,
        count: channelTotals[name]?.count || 0,
        percentage: totalRevenue > 0 ? ((channelTotals[name]?.total || 0) / totalRevenue) * 100 : 0,
        color: config.color,
        icon: config.icon,
      }));

      // Calcular dados mensais (últimos 6 meses)
      const monthlyByChannel: MonthlyChannelData[] = [];
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
        const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');

        const monthData: MonthlyChannelData = {
          month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
          online: 0,
          totem: 0,
          pdv: 0,
          mesa: 0,
          agendamentos: 0,
        };

        (transactions || []).forEach(tx => {
          const txMonth = tx.transaction_date?.slice(0, 7);
          if (txMonth === monthKey) {
            const categoryName = categoryMap.get(tx.category_id);
            const amount = Number(tx.amount);
            
            if (categoryName === 'Vendas') monthData.online += amount;
            else if (categoryName === 'Vendas Totem') monthData.totem += amount;
            else if (categoryName === 'Vendas PDV') monthData.pdv += amount;
            else if (categoryName === 'Vendas Mesa') monthData.mesa += amount;
            else if (categoryName === 'Agendamentos') monthData.agendamentos += amount;
          }
        });

        monthlyByChannel.push(monthData);
      }

      return { channels, totalRevenue, monthlyByChannel };
    },
    enabled: !!storeId,
  });
}
