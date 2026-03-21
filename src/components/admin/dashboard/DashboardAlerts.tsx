import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle, Calendar, Users, ArrowRight
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { getDashboardBookingCapacity } from './dashboardBookingCapacity';

interface DashboardAlertsProps {
  storeId: string | null;
  bookingEnabled: boolean;
}

interface Alert {
  id: string;
  icon: any;
  message: string;
  type: 'warning' | 'info' | 'danger';
  cta?: { label: string; to: string };
}

export function DashboardAlerts({ storeId, bookingEnabled }: DashboardAlertsProps) {
  const today = new Date().toISOString().split('T')[0];

  const { data: alerts = [] } = useQuery({
    queryKey: ['dashboard-alerts', storeId, today],
    queryFn: async (): Promise<Alert[]> => {
      if (!storeId) return [];
      const result: Alert[] = [];

      if (bookingEnabled) {
        const [{ data: pending }, { data: bookings }, { data: noShows }, capacity] = await Promise.all([
          supabase
            .from('bookings')
            .select('id')
            .eq('store_id', storeId)
            .eq('booking_date', today)
            .eq('status', 'pending'),
          supabase
            .from('bookings')
            .select('id, professional_id')
            .eq('store_id', storeId)
            .eq('booking_date', today)
            .not('status', 'eq', 'cancelled'),
          supabase
            .from('bookings')
            .select('id')
            .eq('store_id', storeId)
            .eq('booking_date', today)
            .eq('status', 'no_show'),
          getDashboardBookingCapacity(storeId),
        ]);

        if (pending && pending.length > 0) {
          result.push({
            id: 'pending-confirm',
            icon: AlertTriangle,
            message: `${pending.length} cliente(s) ainda não confirmaram`,
            type: 'warning',
            cta: { label: 'Ver agenda', to: '/dashboard/booking' },
          });
        }

        const freeSlots = Math.max(0, capacity.totalSlots - (bookings?.length || 0));

        if (freeSlots > 3) {
          result.push({
            id: 'free-slots',
            icon: Calendar,
            message: `${freeSlots} horários livres hoje`,
            type: 'info',
            cta: { label: 'Criar agendamento', to: '/dashboard/booking?new=true' },
          });
        }

        if (capacity.scheduledProfessionalCount > 0) {
          const profsWithBookings = new Set((bookings || []).map((booking) => booking.professional_id));
          const idleProfs = capacity.scheduledProfessionalIds.filter((professionalId) => !profsWithBookings.has(professionalId));

          if (idleProfs.length > 0) {
            result.push({
              id: 'idle-profs',
              icon: Users,
              message: `${idleProfs.length} profissional(is) sem agenda hoje`,
              type: 'info',
              cta: { label: 'Ver profissionais', to: '/dashboard/booking/profissionais' },
            });
          }
        }

        if (noShows && noShows.length > 0) {
          result.push({
            id: 'no-shows',
            icon: AlertTriangle,
            message: `${noShows.length} cliente(s) não compareceu hoje`,
            type: 'danger',
            cta: { label: 'Ver relatórios', to: '/dashboard/booking/reports' },
          });
        }
      }

      return result;
    },
    enabled: !!storeId,
    staleTime: 120_000,
  });

  if (alerts.length === 0) return null;

  const typeStyles = {
    warning: 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20',
    info: 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20',
    danger: 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20',
  };

  const iconStyles = {
    warning: 'text-amber-600 dark:text-amber-400',
    info: 'text-blue-600 dark:text-blue-400',
    danger: 'text-red-600 dark:text-red-400',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Atenção
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {alerts.slice(0, 4).map((alert) => (
          <div
            key={alert.id}
            className={`flex items-center gap-3 p-3 rounded-lg border ${typeStyles[alert.type]}`}
          >
            <alert.icon className={`w-4 h-4 shrink-0 ${iconStyles[alert.type]}`} />
            <p className="text-sm flex-1">{alert.message}</p>
            {alert.cta && (
              <NavLink to={alert.cta.to}>
                <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0">
                  {alert.cta.label}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </NavLink>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
