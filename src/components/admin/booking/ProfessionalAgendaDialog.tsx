import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Clock, CalendarOff, User, Scissors } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProfessionalAgendaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professionalId: string;
  professionalName: string;
}

interface Schedule {
  day_of_week: number;
  is_available: boolean;
  start_time: string | null;
  end_time: string | null;
  break_start: string | null;
  break_end: string | null;
}

interface Block {
  id: string;
  block_date: string;
  start_time: string | null;
  end_time: string | null;
  is_all_day: boolean;
  reason: string | null;
}

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  customer_name: string;
  status: string;
  service: {
    name: string;
  } | null;
}

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
}

const DAYS_OF_WEEK = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
];

export function ProfessionalAgendaDialog({
  open,
  onOpenChange,
  professionalId,
  professionalName
}: ProfessionalAgendaDialogProps) {
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!open || !professionalId) return;
      
      setLoading(true);
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');

        // Fetch all data in parallel
        const [schedulesRes, blocksRes, bookingsRes, servicesRes] = await Promise.all([
          // Horários semanais
          supabase
            .from('professional_schedules')
            .select('*')
            .eq('professional_id', professionalId)
            .order('day_of_week'),
          
          // Bloqueios futuros
          (supabase as any)
            .from('professional_blocks')
            .select('*')
            .eq('professional_id', professionalId)
            .gte('block_date', today)
            .order('block_date', { ascending: true })
            .limit(10),
          
          // Próximos agendamentos (7 dias)
          supabase
            .from('bookings')
            .select(`
              id,
              booking_date,
              start_time,
              end_time,
              customer_name,
              status,
              service:booking_services(name)
            `)
            .eq('professional_id', professionalId)
            .gte('booking_date', today)
            .lte('booking_date', nextWeek)
            .neq('status', 'cancelled')
            .order('booking_date', { ascending: true })
            .order('start_time', { ascending: true }),
          
          // Serviços vinculados
          supabase
            .from('professional_services')
            .select(`
              service:booking_services(
                id,
                name,
                duration_minutes,
                price
              )
            `)
            .eq('professional_id', professionalId)
        ]);

        if (schedulesRes.error) throw schedulesRes.error;
        if (blocksRes.error) throw blocksRes.error;
        if (bookingsRes.error) throw bookingsRes.error;
        if (servicesRes.error) throw servicesRes.error;

        // Process schedules to have all days
        const allSchedules: Schedule[] = [];
        for (let i = 0; i < 7; i++) {
          const existing = schedulesRes.data?.find((s: Schedule) => s.day_of_week === i);
          if (existing) {
            allSchedules.push(existing);
          } else {
            allSchedules.push({
              day_of_week: i,
              is_available: false,
              start_time: null,
              end_time: null,
              break_start: null,
              break_end: null
            });
          }
        }

        setSchedules(allSchedules);
        setBlocks((blocksRes.data || []) as Block[]);
        setBookings((bookingsRes.data || []).map((b: any) => ({
          ...b,
          service: b.service?.[0] || b.service || null
        })));
        setServices(
          (servicesRes.data || [])
            .map((ps: any) => ps.service)
            .filter((s: any) => s !== null)
        );
      } catch (error) {
        console.error('Error fetching agenda:', error);
        toast.error('Erro ao carregar agenda');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open, professionalId]);

  const formatTime = (time: string | null) => {
    if (!time) return '--:--';
    return time.slice(0, 5);
  };

  const formatBlockDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd/MM (EEEE)", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const formatBookingDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd/MM (EEE)", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Confirmado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pendente</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Concluído</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Agenda de {professionalName}
          </DialogTitle>
          <DialogDescription>
            Visualização completa da disponibilidade e atendimentos
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="schedule" className="flex-1 overflow-hidden">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="schedule" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Horários
              </TabsTrigger>
              <TabsTrigger value="blocks" className="text-xs">
                <CalendarOff className="h-3 w-3 mr-1" />
                Bloqueios
              </TabsTrigger>
              <TabsTrigger value="bookings" className="text-xs">
                <User className="h-3 w-3 mr-1" />
                Agenda
              </TabsTrigger>
              <TabsTrigger value="services" className="text-xs">
                <Scissors className="h-3 w-3 mr-1" />
                Serviços
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 mt-4" style={{ maxHeight: 'calc(70vh - 180px)' }}>
              {/* Horários Semanais */}
              <TabsContent value="schedule" className="mt-0 space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground mb-3">Horários de Atendimento</h4>
                {schedules.map((schedule) => (
                  <div 
                    key={schedule.day_of_week}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      schedule.is_available ? 'bg-background' : 'bg-muted/30'
                    }`}
                  >
                    <span className={`font-medium text-sm ${!schedule.is_available && 'text-muted-foreground'}`}>
                      {DAYS_OF_WEEK[schedule.day_of_week]}
                    </span>
                    {schedule.is_available ? (
                      <div className="text-right text-sm">
                        <span className="text-foreground">
                          {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                        </span>
                        {schedule.break_start && schedule.break_end && (
                          <p className="text-xs text-muted-foreground">
                            Pausa: {formatTime(schedule.break_start)} - {formatTime(schedule.break_end)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Não atende
                      </Badge>
                    )}
                  </div>
                ))}
              </TabsContent>

              {/* Bloqueios */}
              <TabsContent value="blocks" className="mt-0 space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground mb-3">Bloqueios Futuros</h4>
                {blocks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum bloqueio agendado
                  </p>
                ) : (
                  blocks.map((block) => (
                    <div 
                      key={block.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-red-500/5 border-red-500/20"
                    >
                      <div>
                        <p className="font-medium text-sm">{formatBlockDate(block.block_date)}</p>
                        {block.reason && (
                          <p className="text-xs text-muted-foreground">{block.reason}</p>
                        )}
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        {block.is_all_day 
                          ? 'Dia inteiro' 
                          : `${formatTime(block.start_time)} - ${formatTime(block.end_time)}`
                        }
                      </Badge>
                    </div>
                  ))
                )}
              </TabsContent>

              {/* Próximos Agendamentos */}
              <TabsContent value="bookings" className="mt-0 space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground mb-3">Próximos 7 dias</h4>
                {bookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum agendamento nos próximos 7 dias
                  </p>
                ) : (
                  bookings.map((booking) => (
                    <div 
                      key={booking.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{formatBookingDate(booking.booking_date)}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                          </span>
                        </div>
                        <p className="text-sm">{booking.customer_name}</p>
                        {booking.service && (
                          <p className="text-xs text-muted-foreground">{booking.service.name}</p>
                        )}
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                  ))
                )}
              </TabsContent>

              {/* Serviços */}
              <TabsContent value="services" className="mt-0 space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground mb-3">Serviços Vinculados</h4>
                {services.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum serviço vinculado
                  </p>
                ) : (
                  services.map((service) => (
                    <div 
                      key={service.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium text-sm">{service.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {service.duration_minutes} min
                        </p>
                      </div>
                      <Badge variant="secondary">
                        R$ {service.price.toFixed(2)}
                      </Badge>
                    </div>
                  ))
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
