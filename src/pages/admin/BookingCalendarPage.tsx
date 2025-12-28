import { useState, useEffect, useMemo, useCallback } from 'react';
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
  Settings,
  ExternalLink,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useBooking, Booking, Professional } from '@/hooks/useBooking';
import { ModuleGate } from '@/components/admin/ModuleGate';
import { usePageSEO } from '@/hooks/useSEO';
import { 
  format, 
  addDays, 
  addMonths,
  startOfWeek, 
  endOfWeek, 
  startOfMonth,
  endOfMonth,
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth,
  isToday 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { NewBookingDialog } from '@/components/admin/booking/NewBookingDialog';
import { BookingActionsDialog } from '@/components/admin/booking/BookingActionsDialog';
import { supabase } from '@/integrations/supabase/client';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

type ViewMode = 'day' | 'week' | 'month';

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
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [storeSlug, setStoreSlug] = useState<string | null>(null);
  
  // Selected booking for actions dialog
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isActionsDialogOpen, setIsActionsDialogOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Fetch store slug for public link
  useEffect(() => {
    const fetchStoreSlug = async () => {
      if (!storeId) return;
      const { data } = await supabase
        .from('stores')
        .select('slug')
        .eq('id', storeId)
        .single();
      if (data) setStoreSlug(data.slug);
    };
    fetchStoreSlug();
  }, [storeId]);

  usePageSEO({
    title: 'Agenda - Agendamentos',
    description: 'Visualize e gerencie os agendamentos do seu estabelecimento',
    keywords: 'agenda, agendamento, calendário, profissionais'
  });

  // Refetch function for use after updates
  const refetchBookings = useCallback(async () => {
    if (!storeId) return;
    
    setLoadingBookings(true);
    try {
      let start: Date, end: Date;
      
      if (viewMode === 'month') {
        start = startOfMonth(selectedDate);
        end = endOfMonth(selectedDate);
      } else if (viewMode === 'week') {
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
  }, [storeId, selectedDate, viewMode, fetchBookings]);

  // Fetch bookings when date/view changes
  useEffect(() => {
    refetchBookings();
  }, [refetchBookings]);

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

  // Get days for month view (including days from prev/next months to fill the grid)
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const calendarStart = startOfWeek(monthStart, { locale: ptBR });
    const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [selectedDate]);

  const navigateDate = (direction: 'prev' | 'next') => {
    if (viewMode === 'month') {
      setSelectedDate(prev => addMonths(prev, direction === 'next' ? 1 : -1));
    } else {
      const days = viewMode === 'week' ? 7 : 1;
      setSelectedDate(prev => addDays(prev, direction === 'next' ? days : -days));
    }
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

  // Handle booking click
  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking({
      ...booking,
      professional_name: getProfessionalName(booking.professional_id),
      service_name: getServiceName(booking.service_id)
    } as Booking & { professional_name?: string; service_name?: string });
    setIsActionsDialogOpen(true);
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
            {timeSlots.map((time) => (
              <div key={time} className="h-16 relative">
                {/* Render bookings that start at this time */}
                {dayBookings
                  .filter(b => b.start_time.startsWith(time.split(':')[0] + ':' + time.split(':')[1]))
                  .map(booking => (
                    <div
                      key={booking.id}
                      onClick={() => handleBookingClick(booking)}
                      className={cn(
                        "absolute left-1 right-1 rounded-md p-2 text-white text-xs z-10 cursor-pointer hover:opacity-90 transition-opacity",
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
                "p-3 text-center cursor-pointer hover:bg-muted/50 transition-colors",
                isToday(day) && "bg-primary/10",
                isSameDay(day, selectedDate) && "bg-primary/5"
              )}
              onClick={() => {
                setSelectedDate(day);
                setViewMode('day');
              }}
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
              <div key={day.toISOString()} className="p-2 space-y-1 max-h-[400px] overflow-y-auto">
                {dayBookings.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    Sem agendamentos
                  </div>
                ) : (
                  dayBookings.map(booking => (
                    <div
                      key={booking.id}
                      onClick={() => handleBookingClick(booking)}
                      className={cn(
                        "rounded p-1.5 text-white text-xs cursor-pointer hover:opacity-90 transition-opacity",
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

  const renderMonthView = () => {
    return (
      <div className="bg-card border rounded-lg overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 divide-x border-b bg-muted/30">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        
        {/* Days grid */}
        <div className="grid grid-cols-7 divide-x">
          {monthDays.map((day, index) => {
            const dayBookings = getBookingsForDay(day);
            const isCurrentMonth = isSameMonth(day, selectedDate);
            
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[100px] p-1 border-b cursor-pointer hover:bg-muted/30 transition-colors",
                  !isCurrentMonth && "bg-muted/10 opacity-60"
                )}
                onClick={() => {
                  setSelectedDate(day);
                  setViewMode('day');
                }}
              >
                <div className={cn(
                  "text-sm font-medium mb-1 flex items-center justify-center w-7 h-7 rounded-full",
                  isToday(day) && "bg-primary text-primary-foreground",
                  !isToday(day) && isCurrentMonth && "text-foreground"
                )}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5">
                  {dayBookings.slice(0, 3).map(booking => (
                    <div
                      key={booking.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookingClick(booking);
                      }}
                      className={cn(
                        "rounded px-1 py-0.5 text-white text-[10px] truncate cursor-pointer hover:opacity-90",
                        getStatusColor(booking.status)
                      )}
                    >
                      {booking.start_time.slice(0, 5)} {booking.customer_name}
                    </div>
                  ))}
                  {dayBookings.length > 3 && (
                    <div className="text-[10px] text-muted-foreground px-1">
                      +{dayBookings.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getDateTitle = () => {
    if (viewMode === 'month') {
      return format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR });
    } else if (viewMode === 'week') {
      return `${format(startOfWeek(selectedDate, { locale: ptBR }), 'dd/MM')} - ${format(endOfWeek(selectedDate, { locale: ptBR }), 'dd/MM/yyyy')}`;
    } else {
      return format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    }
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
          <div className="flex flex-wrap gap-2">
            {storeSlug && (
              <Button variant="outline" asChild>
                <a href={`/agendar/${storeSlug}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Página Pública
                </a>
              </Button>
            )}
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
            <Button onClick={() => setIsNewBookingOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </div>
        </div>

        {/* Tutorial Card - Status Legend */}
        <Collapsible open={isHelpOpen} onOpenChange={setIsHelpOpen}>
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                  <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Entenda a Agenda</CardTitle>
                  </div>
                  {isHelpOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Legenda de Status:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-yellow-500" />
                        <span className="text-muted-foreground">Pendente</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500" />
                        <span className="text-muted-foreground">Confirmado</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-blue-500" />
                        <span className="text-muted-foreground">Em Atendimento</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-gray-500" />
                        <span className="text-muted-foreground">Concluído</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-orange-500" />
                        <span className="text-muted-foreground">Não Compareceu</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500" />
                        <span className="text-muted-foreground">Cancelado</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground border-t pt-3">
                    <p><span className="font-medium text-foreground">Dica:</span> Clique em um agendamento para ver opções como confirmar, iniciar atendimento, marcar como concluído ou cancelar.</p>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* New Booking Dialog */}
        <NewBookingDialog
          open={isNewBookingOpen}
          onOpenChange={setIsNewBookingOpen}
          storeId={storeId}
          defaultDate={selectedDate}
          defaultProfessionalId={selectedProfessionalId !== 'all' ? selectedProfessionalId : undefined}
          onSuccess={refetchBookings}
        />

        {/* Booking Actions Dialog */}
        <BookingActionsDialog
          open={isActionsDialogOpen}
          onOpenChange={setIsActionsDialogOpen}
          booking={selectedBooking as any}
          onSuccess={refetchBookings}
        />

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
                <span className="text-lg font-semibold ml-2 capitalize">
                  {getDateTitle()}
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
                    className="rounded-none border-x"
                  >
                    Semana
                  </Button>
                  <Button
                    variant={viewMode === 'month' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('month')}
                    className="rounded-l-none"
                  >
                    Mês
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
          <>
            {viewMode === 'day' && renderDayView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'month' && renderMonthView()}
          </>
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
