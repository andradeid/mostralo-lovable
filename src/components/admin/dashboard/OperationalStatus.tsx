import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { 
  Store, Calendar, MessageSquare, Users, Clock, Zap
} from 'lucide-react';
import { useModuleEnabled } from '@/hooks/useModuleEnabled';
import { useWhatsAppStatus } from '@/hooks/useWhatsAppStatus';
import { useActiveProfessionals } from '@/hooks/useActiveProfessionals';

interface OperationalStatusProps {
  storeId: string | null;
}

export function OperationalStatus({ storeId }: OperationalStatusProps) {
  const bookingEnabled = useModuleEnabled('booking');
  const { hasConnectedWhatsApp } = useWhatsAppStatus(storeId || undefined);
  const { data: professionals } = useActiveProfessionals(storeId);

  // Buscar status da loja (aberta/fechada)
  const { data: storeData } = useQuery({
    queryKey: ['op-status-store', storeId],
    queryFn: async () => {
      if (!storeId) return null;
      const { data } = await supabase
        .from('stores')
        .select('status, business_hours')
        .eq('id', storeId)
        .single();
      return data;
    },
    enabled: !!storeId,
    staleTime: 60_000,
  });

  // Buscar dados de agendamento do dia
  const { data: bookingData } = useQuery({
    queryKey: ['op-status-bookings', storeId],
    queryFn: async () => {
      if (!storeId) return null;
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toTimeString().slice(0, 5);

      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, status, start_time, end_time, professional_id')
        .eq('store_id', storeId)
        .eq('booking_date', today)
        .not('status', 'in', '("cancelled")');

      const inProgress = bookings?.filter(b => b.status === 'in_progress') || [];
      const upcoming = bookings?.filter(b => 
        b.start_time > now && (b.status === 'confirmed' || b.status === 'pending')
      ).sort((a, b) => a.start_time.localeCompare(b.start_time)) || [];

      // Usar profissionais do hook compartilhado
      const activeProfessionals = professionals ?? [];

      // Calcular próximo atendimento
      const nextBooking = upcoming[0];
      let minutesUntilNext = 0;
      if (nextBooking) {
        const [h, m] = nextBooking.start_time.split(':').map(Number);
        const nowDate = new Date();
        const nextDate = new Date();
        nextDate.setHours(h, m, 0, 0);
        minutesUntilNext = Math.max(0, Math.round((nextDate.getTime() - nowDate.getTime()) / 60000));
      }

      return {
        totalToday: bookings?.length || 0,
        inProgress: inProgress.length,
        activeProfessionals: activeProfessionals.length,
        minutesUntilNext,
        hasNextBooking: !!nextBooking,
      };
    },
    enabled: !!storeId && bookingEnabled,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  // Determinar se loja está aberta
  const isStoreOpen = storeData?.status === 'active';

  const indicators = [
    {
      show: true,
      icon: Store,
      label: isStoreOpen ? 'Aberta' : 'Fechada',
      active: isStoreOpen,
    },
    {
      show: bookingEnabled,
      icon: Calendar,
      label: bookingData?.totalToday 
        ? `${bookingData.totalToday} agendamentos` 
        : 'Sem agenda',
      active: (bookingData?.totalToday || 0) > 0,
    },
    {
      show: bookingEnabled,
      icon: Zap,
      label: bookingData?.inProgress 
        ? `${bookingData.inProgress} em atendimento` 
        : 'Nenhum ativo',
      active: (bookingData?.inProgress || 0) > 0,
    },
    {
      show: bookingEnabled && bookingData?.hasNextBooking,
      icon: Clock,
      label: `Próximo em ${bookingData?.minutesUntilNext || 0}min`,
      active: true,
    },
    {
      show: true,
      icon: MessageSquare,
      label: hasConnectedWhatsApp ? 'WhatsApp' : 'WhatsApp off',
      active: hasConnectedWhatsApp,
    },
    {
      show: bookingEnabled,
      icon: Users,
      label: `${bookingData?.activeProfessionals || 0} profissionais`,
      active: (bookingData?.activeProfessionals || 0) > 0,
    },
  ].filter(i => i.show);

  return (
    <div className="flex flex-wrap gap-2">
      {indicators.map((ind, i) => (
        <Badge
          key={i}
          variant="outline"
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
            ind.active
              ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950/30 dark:text-green-400'
              : 'border-muted bg-muted/50 text-muted-foreground'
          }`}
        >
          <ind.icon className="w-3 h-3" />
          {ind.label}
        </Badge>
      ))}
    </div>
  );
}
