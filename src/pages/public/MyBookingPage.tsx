import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar, Clock, User, Scissors, Store, MapPin, Loader2, AlertTriangle, CheckCircle, XCircle, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { BookingNavigationButtons } from '@/components/booking/BookingNavigationButtons';
import { buildBookingThemeStyle } from '@/lib/colorUtils';
import { cn } from '@/lib/utils';

interface BookingData {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  price: number;
  customer_name: string;
  customer_phone: string;
  notes: string | null;
  professional: { id: string; name: string } | null;
  service: { id: string; name: string; duration_minutes: number } | null;
  store: { id: string; name: string; slug: string; logo_url: string | null; address?: string | null; city?: string | null; latitude?: number | null; longitude?: number | null; google_maps_link?: string | null } | null;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  confirmed: { label: 'Confirmado', variant: 'default', icon: <CheckCircle className="h-4 w-4" /> },
  pending: { label: 'Pendente', variant: 'secondary', icon: <Clock className="h-4 w-4" /> },
  completed: { label: 'Concluído', variant: 'outline', icon: <CheckCircle className="h-4 w-4" /> },
  cancelled: { label: 'Cancelado', variant: 'destructive', icon: <XCircle className="h-4 w-4" /> },
  no_show: { label: 'Não compareceu', variant: 'destructive', icon: <Ban className="h-4 w-4" /> },
};

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

function formatTime(timeStr: string): string {
  return timeStr.substring(0, 5);
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function MyBookingPage() {
  const { token } = useParams<{ token: string }>();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [bookingSettings, setBookingSettings] = useState<any>(null);
  const [cancellationHoursLimit, setCancellationHoursLimit] = useState(24);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (token) fetchBooking();
  }, [token]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fnError } = await supabase.functions.invoke('booking-magic-link', {
        body: { action: 'resolve', token },
      });

      if (fnError) throw new Error('Erro ao buscar agendamento');

      if (!data?.success) {
        setError(data?.error || 'Link inválido');
        return;
      }

      let resolvedBooking = data.booking as BookingData;

      const missingLocationData = !resolvedBooking.store?.latitude || !resolvedBooking.store?.longitude;
      if (missingLocationData && resolvedBooking.store?.id) {
        const { data: storeData } = await supabase
          .from('public_stores')
          .select('address, city, latitude, longitude, google_maps_link')
          .eq('id', resolvedBooking.store.id)
          .maybeSingle();

        if (storeData) {
          resolvedBooking = {
            ...resolvedBooking,
            store: {
              ...resolvedBooking.store,
              address: storeData.address,
              city: storeData.city,
              latitude: storeData.latitude,
              longitude: storeData.longitude,
              google_maps_link: storeData.google_maps_link,
            },
          };
        }
      }

      setBooking(resolvedBooking);
      setCancellationHoursLimit(data.cancellation_hours_limit || 24);

      // Carregar tema da loja
      if (resolvedBooking.store?.id) {
        const { data: settings } = await supabase
          .from('booking_settings')
          .select('theme_primary_color, theme_background_color, theme_text_color, theme_radius, theme_font_family, theme_mode')
          .eq('store_id', resolvedBooking.store.id)
          .maybeSingle();
        if (settings) setBookingSettings(settings);
      }
    } catch (err) {
      console.error('[MyBookingPage] Erro:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar agendamento');
    } finally {
      setLoading(false);
    }
  };

  const canCancel = (): boolean => {
    if (!booking || booking.status === 'cancelled' || booking.status === 'completed' || booking.status === 'no_show') return false;
    const bookingDateTime = new Date(`${booking.booking_date}T${booking.start_time}`);
    const hoursUntilBooking = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntilBooking >= cancellationHoursLimit;
  };

  const handleCancel = async () => {
    try {
      setCancelling(true);
      const { data, error: fnError } = await supabase.functions.invoke('booking-magic-link', {
        body: { action: 'cancel', token, reason: cancelReason || undefined },
      });

      // supabase.functions.invoke coloca respostas não-200 em error
      if (fnError) {
        // Tentar extrair mensagem do erro
        let errorMsg = 'Erro ao cancelar agendamento';
        try {
          if (typeof fnError === 'object' && fnError.message) {
            errorMsg = fnError.message;
          }
          // Se o corpo do erro tem JSON com campo 'error'
          if (fnError.context?.body) {
            const parsed = JSON.parse(fnError.context.body);
            if (parsed.error) errorMsg = parsed.error;
          }
        } catch {}
        toast.error(errorMsg);
        return;
      }

      if (!data?.success) {
        toast.error(data?.error || 'Erro ao cancelar agendamento');
        return;
      }

      toast.success('Agendamento cancelado com sucesso!');
      await fetchBooking();
    } catch (err) {
      toast.error('Erro ao cancelar agendamento');
    } finally {
      setCancelling(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando agendamento...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">Link inválido</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!booking) return null;

  const status = statusConfig[booking.status] || statusConfig.pending;
  const isPast = new Date(`${booking.booking_date}T${booking.end_time}`) < new Date();

  // Extrair coordenadas da loja
  const storeCoords = (() => {
    if (booking.store?.latitude && booking.store?.longitude) {
      return { lat: booking.store.latitude, lng: booking.store.longitude };
    }
    if (booking.store?.google_maps_link) {
      const match = booking.store.google_maps_link.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
      const match2 = booking.store.google_maps_link.match(/q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (match2) return { lat: parseFloat(match2[1]), lng: parseFloat(match2[2]) };
    }
    return null;
  })();

  return (
    <div className="min-h-screen bg-background">
      {/* Header com logo da loja */}
      <div className="bg-card border-b">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          {booking.store?.logo_url ? (
            <img src={booking.store.logo_url} alt={booking.store.name} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Store className="h-5 w-5 text-primary" />
            </div>
          )}
          <div>
            <h1 className="font-semibold text-foreground">{booking.store?.name || 'Estabelecimento'}</h1>
            <p className="text-sm text-muted-foreground">Meu Agendamento</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Status badge */}
        <div className="flex items-center justify-between">
          <Badge variant={status.variant} className="gap-1.5 text-sm px-3 py-1">
            {status.icon}
            {status.label}
          </Badge>
          {isPast && booking.status !== 'cancelled' && (
            <span className="text-xs text-muted-foreground">Agendamento passado</span>
          )}
        </div>

        {/* Detalhes do agendamento */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Detalhes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Serviço */}
            <div className="flex items-start gap-3">
              <Scissors className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">{booking.service?.name || 'Serviço'}</p>
                {booking.service?.duration_minutes && (
                  <p className="text-sm text-muted-foreground">{booking.service.duration_minutes} minutos</p>
                )}
              </div>
            </div>

            {/* Profissional */}
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">{booking.professional?.name || 'Profissional'}</p>
                <p className="text-sm text-muted-foreground">Profissional</p>
              </div>
            </div>

            {/* Data */}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground capitalize">{formatDate(booking.booking_date)}</p>
              </div>
            </div>

            {/* Horário */}
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</p>
              </div>
            </div>

            {/* Valor */}
            {booking.price > 0 && (
              <div className="pt-3 border-t flex justify-between items-center">
                <span className="text-muted-foreground">Valor</span>
                <span className="text-lg font-semibold text-foreground">{formatCurrency(booking.price)}</span>
              </div>
            )}

            {/* Observações */}
            {booking.notes && (
              <div className="pt-3 border-t">
                <p className="text-sm text-muted-foreground mb-1">Observações</p>
                <p className="text-foreground">{booking.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navegação - Como chegar */}
        {storeCoords && (
          <Card>
            <CardContent className="pt-4 pb-4">
              <BookingNavigationButtons
                latitude={storeCoords.lat}
                longitude={storeCoords.lng}
                storeName={booking.store?.name}
                address={booking.store?.address ? `${booking.store.address}${booking.store.city ? `, ${booking.store.city}` : ''}` : undefined}
              />
            </CardContent>
          </Card>
        )}

        {/* Botão de cancelamento */}
        {canCancel() && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full" size="lg">
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar Agendamento
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancelar agendamento?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. O horário será liberado para outros clientes.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Textarea
                placeholder="Motivo do cancelamento (opcional)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="mt-2"
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Voltar</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancel} disabled={cancelling} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {cancelling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Confirmar Cancelamento
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Mensagem de limite de cancelamento */}
        {!canCancel() && booking.status !== 'cancelled' && booking.status !== 'completed' && booking.status !== 'no_show' && !isPast && (
          <p className="text-sm text-muted-foreground text-center">
            ⏰ Cancelamento permitido até {cancellationHoursLimit}h antes do agendamento.
          </p>
        )}

        {/* Reagendar - link para a loja */}
        {booking.store?.slug && (booking.status === 'cancelled' || isPast) && (
          <Button variant="outline" className="w-full" size="lg" asChild>
            <a href={`/agendar/${booking.store.slug}`}>
              <Calendar className="h-4 w-4 mr-2" />
              Agendar Novamente
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
