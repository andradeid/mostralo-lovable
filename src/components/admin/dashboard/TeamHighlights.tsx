import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Star, TrendingUp } from 'lucide-react';

interface TeamHighlightsProps {
  storeId: string | null;
}

export function TeamHighlights({ storeId }: TeamHighlightsProps) {
  const today = new Date().toISOString().split('T')[0];

  const { data } = useQuery({
    queryKey: ['team-highlights', storeId, today],
    queryFn: async () => {
      if (!storeId) return null;

      const { data: professionals } = await supabase
        .from('professionals')
        .select('id, name, avatar_url')
        .eq('store_id', storeId)
        .eq('is_active', true);

      if (!professionals || professionals.length === 0) return null;

      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, professional_id, status')
        .eq('store_id', storeId)
        .eq('booking_date', today)
        .not('status', 'eq', 'cancelled');

      // Contar por profissional
      const counts: Record<string, number> = {};
      bookings?.forEach(b => {
        counts[b.professional_id] = (counts[b.professional_id] || 0) + 1;
      });

      // Ranking
      const ranked = professionals.map(p => ({
        ...p,
        count: counts[p.id] || 0,
      })).sort((a, b) => b.count - a.count);

      return {
        topProfessional: ranked[0],
        leastBusy: ranked[ranked.length - 1],
        total: professionals.length,
      };
    },
    enabled: !!storeId,
    staleTime: 120_000,
  });

  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Equipe Hoje
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {data.topProfessional && (
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-sm font-bold text-amber-700 dark:text-amber-300">
              {data.topProfessional.name?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{data.topProfessional.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {data.topProfessional.count} atendimentos
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 dark:text-amber-400">
              🔥 Destaque
            </Badge>
          </div>
        )}

        {data.leastBusy && data.leastBusy.id !== data.topProfessional?.id && (
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
              {data.leastBusy.name?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{data.leastBusy.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {data.leastBusy.count} atendimentos
              </p>
            </div>
            <Badge variant="outline" className="text-[10px]">
              Menor carga
            </Badge>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center pt-1">
          {data.total} profissionais ativos
        </p>
      </CardContent>
    </Card>
  );
}
