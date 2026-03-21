import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface TodayTimelineProps {
  storeId: string | null;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  confirmed: { label: 'Confirmado', className: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 border-green-200 dark:border-green-800' },
  in_progress: { label: 'Em atendimento', className: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-800' },
  completed: { label: 'Concluído', className: 'bg-muted text-muted-foreground border-muted' },
  pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' },
  no_show: { label: 'Não compareceu', className: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800' },
  cancelled: { label: 'Cancelado', className: 'bg-red-50 text-red-500 dark:bg-red-950/20 dark:text-red-400 border-red-100 dark:border-red-900' },
};

export function TodayTimeline({ storeId }: TodayTimelineProps) {
  const today = new Date().toISOString().split('T')[0];

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['today-timeline', storeId, today],
    queryFn: async () => {
      if (!storeId) return [];
      const { data } = await supabase
        .from('bookings')
        .select(`
          id, status, start_time, end_time, customer_name,
          booking_services!inner(name),
          professionals!inner(name)
        `)
        .eq('store_id', storeId)
        .eq('booking_date', today)
        .not('status', 'eq', 'cancelled')
        .order('start_time', { ascending: true });

      return data || [];
    },
    enabled: !!storeId,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Agenda do Dia
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="h-14 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !bookings || bookings.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">Sem atendimentos hoje</p>
            <NavLink to="/dashboard/booking?new=true" className="text-xs text-primary hover:underline mt-1 inline-block">
              Criar agendamento
            </NavLink>
          </div>
        ) : (
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {bookings.slice(0, 8).map((b: any) => {
              const config = statusConfig[b.status] || statusConfig.pending;
              return (
                <NavLink 
                  key={b.id} 
                  to="/dashboard/booking"
                  className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="text-center shrink-0 w-12">
                    <p className="text-sm font-bold">{b.start_time?.slice(0,5)}</p>
                    <p className="text-[10px] text-muted-foreground">{b.end_time?.slice(0,5)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{b.customer_name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {b.booking_services?.name} • {b.professionals?.name}
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${config.className}`}>
                    {config.label}
                  </Badge>
                </NavLink>
              );
            })}
            {bookings.length > 8 && (
              <NavLink to="/dashboard/booking" className="block text-center text-xs text-primary hover:underline py-1">
                Ver todos ({bookings.length})
              </NavLink>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
