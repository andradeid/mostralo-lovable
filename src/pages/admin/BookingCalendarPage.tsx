import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  User,
  Loader2,
  Plus,
  Settings
} from 'lucide-react';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useBooking, Booking, Professional } from '@/hooks/useBooking';
import { ModuleGate } from '@/components/admin/ModuleGate';
import { usePageSEO } from '@/hooks/useSEO';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const BookingCalendarPage = () => {
  const { storeId } = useStoreAccess();
  const { 
    professionals, 
    loadingProfessionals,
    bookingServices,
    fetchBookings
  } = useBooking(storeId);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('all');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  usePageSEO({
    title: 'Agenda - Agendamentos',
    description: 'Visualize e gerencie os agendamentos do seu estabelecimento',
    keywords: 'agenda, agendamento, calendário, profissionais'
  });

  // Fetch bookings when date changes
  useEffect(() => {
    const loadBookings = async () => {
      if (!storeId) return;
      
      setLoadingBookings(true);
      try {
        let start: Date, end: Date;
        
        if (viewMode === 'week') {
          start = startOfWeek(selectedDate, { locale: ptBR });
          end = endOfWeek(selectedDate, { locale: ptBR });
        } else {
          start = selectedDate;
          end = selectedDate;
        }
        
        const data = await fetchBookings(
          format(start, 'yyyy-MM-dd'),
          format(end, 'yyyy-MM-dd')
        );
        setBookings(data);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoadingBookings(false);
      }
    };

    loadBookings();
  }, [storeId, selectedDate, viewMode, fetchBookings]);

  // Filter bookings by selected professional
  const filteredBookings = useMemo(() => {
    if (selectedProfessionalId === 'all') return bookings;
    return bookings.filter(b => b.professional_id === selectedProfessionalId);
  }, [bookings, selectedProfessionalId]);

  // Get bookings for a specific day
  const getBookingsForDay = (date: Date) => {
    return filteredBookings.filter(b => isSameDay(new Date(b.booking_date), date));
  };

  // Generate time slots for the day view
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 7; hour <= 21; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  }, []);

  // Get days for week view
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { locale: ptBR });
    const end = endOfWeek(selectedDate, { locale: ptBR });
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  const navigateDate = (direction: 'prev' | 'next') => {
    const days = viewMode === 'week' ? 7 : 1;
    setSelectedDate(prev => addDays(prev, direction === 'next' ? days : -days));
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'in_progress': return 'bg-blue-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      case 'no_show': return 'bg-orange-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: Booking['status']) => {
    const labels: Record<Booking['status'], string> = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      in_progress: 'Em Atendimento',
      completed: 'Concluído',
      no_show: 'Não Compareceu',
      cancelled: 'Cancelado'
    };
    return labels[status];
  };

  // Get professional name by ID
  const getProfessionalName = (id: string) => {
    const prof = professionals.find(p => p.id === id);
    return prof?.name || 'Não atribuído';
  };

  // Get service name by ID
  const getServiceName = (id: string) => {
    const service = bookingServices.find(s => s.id === id);
    return service?.name || 'Serviço';
  };

  const renderDayView = () => {
    const dayBookings = getBookingsForDay(selectedDate);
    
    return (
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[80px_1fr] divide-x">
          {/* Time column */}
          <div className="divide-y">
            {timeSlots.map(time => (
              <div key={time} className="h-16 px-2 py-1 text-xs text-muted-foreground flex items-start">
                {time}
              </div>
            ))}
          </div>
          
          {/* Events column */}
          <div className="relative divide-y">
            {timeSlots.map((time, index) => (
              <div key={time} className="h-16 relative">
                {/* Render bookings that start at this time */}
                {dayBookings
                  .filter(b => b.start_time.startsWith(time.split(':')[0] + ':' + time.split(':')[1]))
                  .map(booking => (
                    <div
                      key={booking.id}
                      className={cn(
                        "absolute left-1 right-1 rounded-md p-2 text-white text-xs z-10",
                        getStatusColor(booking.status)
                      )}
                      style={{ top: 0 }}
                    >
                      <div className="font-medium truncate">{booking.customer_name}</div>
                      <div className="truncate opacity-90">
                        {getServiceName(booking.service_id)} - {getProfessionalName(booking.professional_id)}
                      </div>
                      <div className="flex items-center gap-1 opacity-80">
                        <Clock className="h-3 w-3" />
                        {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    return (
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 divide-x border-b">
          {weekDays.map(day => (
            <div
              key={day.toISOString()}
              className={cn(
                "p-3 text-center",
                isToday(day) && "bg-primary/10",
                isSameDay(day, selectedDate) && "bg-primary/5"
              )}
            >
              <div className="text-xs text-muted-foreground">
                {format(day, 'EEE', { locale: ptBR })}
              </div>
              <div className={cn(
                "text-lg font-semibold",
                isToday(day) && "text-primary"
              )}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 divide-x min-h-[400px]">
          {weekDays.map(day => {
            const dayBookings = getBookingsForDay(day);
            return (
              <div key={day.toISOString()} className="p-2 space-y-1">
                {dayBookings.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    Sem agendamentos
                  </div>
                ) : (
                  dayBookings.map(booking => (
                    <div
                      key={booking.id}
                      className={cn(
                        "rounded p-1.5 text-white text-xs",
                        getStatusColor(booking.status)
                      )}
                    >
                      <div className="font-medium truncate">{booking.start_time.slice(0, 5)}</div>
                      <div className="truncate">{booking.customer_name}</div>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <ModuleGate moduleKey="booking" storeId={storeId}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-primary" />
              Agenda
            </h1>
            <p className="text-muted-foreground">
              Visualize e gerencie os agendamentos
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/dashboard/booking/professionals">
                <User className="h-4 w-4 mr-2" />
                Profissionais
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard/booking/services">
                <Settings className="h-4 w-4 mr-2" />
                Serviços
              </Link>
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </div>
        </div>

        {/* Filters and Navigation */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              {/* Date Navigation */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => navigateDate('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={goToToday}>
                  Hoje
                </Button>
                <Button variant="outline" size="icon" onClick={() => navigateDate('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <span className="text-lg font-semibold ml-2">
                  {viewMode === 'day' 
                    ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : `${format(startOfWeek(selectedDate, { locale: ptBR }), 'dd/MM')} - ${format(endOfWeek(selectedDate, { locale: ptBR }), 'dd/MM/yyyy')}`
                  }
                </span>
              </div>
              
              {/* View Mode and Filters */}
              <div className="flex items-center gap-2">
                <Select value={selectedProfessionalId} onValueChange={setSelectedProfessionalId}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Todos profissionais" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos profissionais</SelectItem>
                    {professionals.filter(p => p.is_active).map(prof => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex rounded-md border">
                  <Button
                    variant={viewMode === 'day' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('day')}
                    className="rounded-r-none"
                  >
                    Dia
                  </Button>
                  <Button
                    variant={viewMode === 'week' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('week')}
                    className="rounded-l-none"
                  >
                    Semana
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar View */}
        {loadingBookings || loadingProfessionals ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          viewMode === 'day' ? renderDayView() : renderWeekView()
        )}

        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getBookingsForDay(new Date()).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {filteredBookings.filter(b => b.status === 'confirmed').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {filteredBookings.filter(b => b.status === 'pending').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Profissionais Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {professionals.filter(p => p.is_active).length}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ModuleGate>
  );
};

export default BookingCalendarPage;
