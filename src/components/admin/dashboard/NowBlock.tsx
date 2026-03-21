import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Zap, Calendar, Clock, ArrowRight, Plus, MessageSquare, ShoppingCart
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface NowBlockProps {
  storeId: string | null;
  bookingEnabled: boolean;
  shopEnabled: boolean;
}

export function NowBlock({ storeId, bookingEnabled, shopEnabled }: NowBlockProps) {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().slice(0, 5);

  const { data } = useQuery({
    queryKey: ['now-block', storeId, today],
    queryFn: async () => {
      if (!storeId) return null;

      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          id, status, start_time, end_time, customer_name,
          booking_services!inner(name),
          professionals!inner(name)
        `)
        .eq('store_id', storeId)
        .eq('booking_date', today)
        .not('status', 'in', '("cancelled")');

      const inProgress = bookings?.filter(b => b.status === 'in_progress') || [];
      const upcoming = bookings?.filter(b => 
        b.start_time > now && (b.status === 'confirmed' || b.status === 'pending')
      ).sort((a, b) => a.start_time.localeCompare(b.start_time)) || [];

      const freeSlots = bookings 
        ? Math.max(0, 8 - bookings.filter(b => b.status !== 'cancelled').length) 
        : 0;

      const recentCancellations = bookings?.filter(b => b.status === 'no_show').length || 0;

      return {
        inProgress,
        nextBooking: upcoming[0] || null,
        upcomingCount: upcoming.length,
        freeSlots,
        recentCancellations,
      };
    },
    enabled: !!storeId && bookingEnabled,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  if (!bookingEnabled) {
    // Ações rápidas para loja
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-2">
            <NavLink to="/dashboard/orders">
              <Button variant="outline" size="sm" className="w-full justify-start h-10 text-xs">
                <ShoppingCart className="w-3.5 h-3.5 mr-2" />
                Pedidos
              </Button>
            </NavLink>
            <NavLink to="/dashboard/products">
              <Button variant="outline" size="sm" className="w-full justify-start h-10 text-xs">
                <Plus className="w-3.5 h-3.5 mr-2" />
                Novo Produto
              </Button>
            </NavLink>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Agora
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Em atendimento */}
        {data?.inProgress && data.inProgress.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              🔥 Em atendimento
            </p>
            {data.inProgress.slice(0, 3).map((b: any) => (
              <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.customer_name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {b.start_time?.slice(0,5)} - {b.end_time?.slice(0,5)} • {(b as any).professionals?.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground">Nenhum atendimento em andamento</p>
          </div>
        )}

        {/* Próximo atendimento */}
        {data?.nextBooking && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              ⏰ Próximo
            </p>
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{(data.nextBooking as any).customer_name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {(data.nextBooking as any).start_time?.slice(0,5)} • {(data.nextBooking as any).professionals?.name}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Resumo */}
        <div className="flex flex-wrap gap-2 pt-1">
          {data?.upcomingCount !== undefined && (
            <Badge variant="outline" className="text-xs">
              {data.upcomingCount} pendentes
            </Badge>
          )}
          {data?.freeSlots !== undefined && (
            <Badge variant="outline" className="text-xs border-green-300 text-green-700 dark:text-green-400">
              {data.freeSlots} horários livres
            </Badge>
          )}
          {(data?.recentCancellations || 0) > 0 && (
            <Badge variant="outline" className="text-xs border-red-300 text-red-700 dark:text-red-400">
              {data?.recentCancellations} não compareceu
            </Badge>
          )}
        </div>

        {/* Ações */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <NavLink to="/dashboard/booking">
            <Button variant="outline" size="sm" className="w-full h-9 text-xs">
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              Ver Agenda
            </Button>
          </NavLink>
          <NavLink to="/dashboard/booking?new=true">
            <Button size="sm" className="w-full h-9 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Novo Agendamento
            </Button>
          </NavLink>
        </div>
      </CardContent>
    </Card>
  );
}
