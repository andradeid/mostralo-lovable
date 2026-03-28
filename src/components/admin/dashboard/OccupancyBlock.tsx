import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Clock, Sun } from 'lucide-react';
import { useActiveProfessionals } from '@/hooks/useActiveProfessionals';

interface OccupancyBlockProps {
  storeId: string | null;
}

const restMessages = [
  '☀️ Dia livre! Aproveite para descansar e recarregar as energias.',
  '🌴 Sem atendimentos hoje. Que tal relaxar e voltar ainda melhor amanhã?',
  '😌 Hoje é folga! Use esse tempo para cuidar de você.',
];

export function OccupancyBlock({ storeId }: OccupancyBlockProps) {
  const today = new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date().getDay();
  const { data: activeProfessionals } = useActiveProfessionals(storeId);

  const { data } = useQuery({
    queryKey: ['occupancy-block', storeId, today, dayOfWeek],
    queryFn: async () => {
      if (!storeId) return null;

      const { data: bookings } = await supabase
        .from('bookings')
        .select('start_time, professional_id')
        .eq('store_id', storeId)
        .eq('booking_date', today)
        .not('status', 'in', '("cancelled","no_show")');

      const { data: schedules } = await supabase
        .from('professional_schedules')
        .select('professional_id, start_time, end_time')
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true);

      // Usar profissionais do hook compartilhado
      const professionals = activeProfessionals ?? [];

      const profsWithSchedule = professionals?.filter(p =>
        schedules?.some(s => s.professional_id === p.id)
      ) || [];

      let totalSlots = 0;
      profsWithSchedule.forEach(p => {
        const profSchedules = schedules?.filter(s => s.professional_id === p.id) || [];
        profSchedules.forEach(s => {
          if (s.start_time && s.end_time) {
            const startH = parseInt(s.start_time.split(':')[0]);
            const endH = parseInt(s.end_time.split(':')[0]);
            totalSlots += Math.max(0, endH - startH);
          }
        });
      });

      const bookedCount = bookings?.length || 0;
      const occupancy = totalSlots > 0
        ? Math.min(100, Math.round((bookedCount / totalSlots) * 100))
        : 0;
      const freeSlots = Math.max(0, totalSlots - bookedCount);

      const hourCounts: Record<number, number> = {};
      bookings?.forEach(b => {
        const hour = parseInt(b.start_time?.split(':')[0] || '0');
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      const hours = Object.entries(hourCounts).map(([h, c]) => ({ hour: Number(h), count: c }));
      hours.sort((a, b) => b.count - a.count);

      const peakHour = hours[0];
      const lowHour = hours[hours.length - 1];

      return {
        occupancy,
        freeSlots,
        totalSlots,
        peakHour: peakHour ? `${peakHour.hour}h` : null,
        lowHour: lowHour && lowHour.hour !== peakHour?.hour ? `${lowHour.hour}h` : null,
        bookedCount,
      };
    },
    enabled: !!storeId,
    staleTime: 120_000,
  });

  if (!data) return null;

  // Dia sem atendimento — exibir frase motivacional
  if (data.totalSlots === 0) {
    const msgIndex = new Date().getDate() % restMessages.length;
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Ocupação do Dia
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground text-center py-4">
            {restMessages[msgIndex]}
          </p>
        </CardContent>
      </Card>
    );
  }

  const occupancyColor = data.occupancy > 70 
    ? 'text-green-600 dark:text-green-400' 
    : data.occupancy > 40 
      ? 'text-amber-600 dark:text-amber-400' 
      : 'text-red-600 dark:text-red-400';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Ocupação do Dia
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="text-center">
          <p className={`text-3xl font-bold ${occupancyColor}`}>{data.occupancy}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            {data.bookedCount} agendados • {data.freeSlots} livres
          </p>
          <Progress value={data.occupancy} className="mt-3 h-2" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {data.peakHour && (
            <div className="p-2.5 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 text-center">
              <Sun className="w-4 h-4 mx-auto text-orange-500 mb-1" />
              <p className="text-xs font-medium">Pico às {data.peakHour}</p>
            </div>
          )}
          {data.lowHour && (
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-center">
              <Clock className="w-4 h-4 mx-auto text-blue-500 mb-1" />
              <p className="text-xs font-medium">Baixa às {data.lowHour}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
