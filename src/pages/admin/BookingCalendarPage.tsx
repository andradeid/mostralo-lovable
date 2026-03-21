import { useState, useEffect, useMemo, useCallback, Fragment } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Globe,
  RefreshCw,
  Search,
  MoreHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useBooking, Booking, Professional } from '@/hooks/useBooking';
import { useSalesChannels } from '@/hooks/useSalesChannels';
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
  isToday,
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { NewBookingDialog } from '@/components/admin/booking/NewBookingDialog';
import { BookingActionsDialog } from '@/components/admin/booking/BookingActionsDialog';
import { supabase } from '@/integrations/supabase/client';
import { useModuleEnabled } from '@/hooks/useModuleEnabled';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileBookingsList } from '@/components/admin/booking/MobileBookingsList';
import { MobileMonthView } from '@/components/admin/booking/MobileMonthView';

type ViewMode = 'day' | 'week' | 'month';

const BookingCalendarPage = () => {
  const { storeId } = useStoreAccess();
  const bookingEnabled = useModuleEnabled('booking');
  const isMobile = useIsMobile();
  const { 
    professionals, 
    loadingProfessionals,
    bookingServices,
    fetchBookings
  } = useBooking(storeId);
  
  const { channels, loading: loadingChannels, updating: updatingChannel, updateChannel } = useSalesChannels(storeId);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('all');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [storeSlug, setStoreSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileViewMode, setMobileViewMode] = useState<'day' | 'month'>('day');
  
  // Selected booking for actions dialog
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isActionsDialogOpen, setIsActionsDialogOpen] = useState(false);
  const [syncingCalendar, setSyncingCalendar] = useState(false);

  // Sync all bookings with Google Calendar
  const handleSyncGoogleCalendar = async () => {
    if (!storeId) return;
    
    setSyncingCalendar(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { action: 'sync_all', store_id: storeId }
      });
      
      if (error) throw error;
      
      if (data?.synced_count > 0) {
        toast.success(`${data.synced_count} agendamento(s) sincronizado(s) com Google Calendar`);
      } else if (data?.message) {
        toast.info(data.message);
      } else {
        toast.info('Nenhum agendamento pendente para sincronizar');
      }
    } catch (err: any) {
      console.error('Erro ao sincronizar com Google Calendar:', err);
      toast.error('Erro ao sincronizar. Verifique se há profissionais conectados ao Google Calendar.');
    } finally {
      setSyncingCalendar(false);
    }
  };

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
      
      // Determine effective view mode (mobile uses its own toggle)
      const effectiveMode = isMobile ? mobileViewMode : viewMode;
      
      if (effectiveMode === 'month') {
        start = startOfMonth(selectedDate);
        end = endOfMonth(selectedDate);
      } else if (effectiveMode === 'week') {
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

  // Real-time subscription for bookings (guard por módulo)
  useEffect(() => {
    if (!storeId || !bookingEnabled) return;

    const channel = supabase
      .channel(`bookings-realtime-${storeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `store_id=eq.${storeId}`
        },
        (payload) => {
          console.log('📅 Booking realtime update:', payload.eventType);
          refetchBookings();
        }
      )
      .subscribe((status) => {
        console.log('📡 Bookings subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId, bookingEnabled, refetchBookings]);

  // Filter bookings by selected professional and search
  const filteredBookings = useMemo(() => {
    let result = bookings;
    if (selectedProfessionalId !== 'all') {
      result = result.filter(b => b.professional_id === selectedProfessionalId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b => 
        b.customer_name.toLowerCase().includes(q) ||
        b.customer_phone?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [bookings, selectedProfessionalId, searchQuery]);

  // Get bookings for a specific day
  const getBookingsForDay = (date: Date) => {
    return filteredBookings.filter(b => {
      const bookingDate = parseISO(b.booking_date);
      return isSameDay(bookingDate, date);
    });
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

  // Get days for month view
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

  // Soft status colors for premium look
  const getStatusStyles = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed': return { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-l-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' };
      case 'pending': return { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-l-amber-500', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' };
      case 'in_progress': return { bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-l-blue-500', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' };
      case 'completed': return { bg: 'bg-slate-50 dark:bg-slate-950/30', border: 'border-l-slate-400', text: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-400' };
      case 'cancelled': return { bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-l-red-400', text: 'text-red-600 dark:text-red-400', dot: 'bg-red-400' };
      case 'no_show': return { bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-l-orange-400', text: 'text-orange-600 dark:text-orange-400', dot: 'bg-orange-400' };
      default: return { bg: 'bg-slate-50 dark:bg-slate-950/30', border: 'border-l-slate-300', text: 'text-slate-500', dot: 'bg-slate-300' };
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

  const getProfessionalName = (id: string) => {
    const prof = professionals.find(p => p.id === id);
    return prof?.name || 'Não atribuído';
  };

  const getProfessionalPhoto = (id: string) => {
    const prof = professionals.find(p => p.id === id);
    return prof?.photo_url || null;
  };

  const getProfessionalInitials = (id: string) => {
    const name = getProfessionalName(id);
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getServiceName = (id: string) => {
    const service = bookingServices.find(s => s.id === id);
    return service?.name || 'Serviço';
  };

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking({
      ...booking,
      professional_name: getProfessionalName(booking.professional_id),
      professional_photo_url: getProfessionalPhoto(booking.professional_id),
      service_name: getServiceName(booking.service_id)
    } as Booking & { professional_name?: string; professional_photo_url?: string; service_name?: string });
    setIsActionsDialogOpen(true);
  };

  // ========================
  // BOOKING CARD (Shared)
  // ========================
  const BookingCard = ({ booking, compact = false }: { booking: Booking; compact?: boolean }) => {
    const styles = getStatusStyles(booking.status);
    
    if (compact) {
      return (
        <div
          onClick={(e) => { e.stopPropagation(); handleBookingClick(booking); }}
          className={cn(
            "rounded-lg border-l-[3px] px-2 py-1.5 cursor-pointer transition-all duration-200",
            "hover:shadow-md hover:scale-[1.02]",
            styles.bg, styles.border
          )}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-foreground">{booking.start_time.slice(0, 5)}</span>
            <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", styles.dot)} />
          </div>
          <div className="text-xs font-medium text-foreground truncate mt-0.5">{booking.customer_name}</div>
          <div className="text-[10px] text-muted-foreground truncate">{getProfessionalName(booking.professional_id)}</div>
        </div>
      );
    }

    return (
      <div
        onClick={() => handleBookingClick(booking)}
        className={cn(
          "group rounded-xl border-l-[3px] p-3 cursor-pointer transition-all duration-200",
          "hover:shadow-md hover:scale-[1.01] bg-card border border-border/50",
          styles.border
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-semibold text-foreground">
                {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
              </span>
              <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5 font-medium", styles.text)}>
                {getStatusLabel(booking.status)}
              </Badge>
            </div>
            <p className="text-sm font-medium text-foreground truncate">{booking.customer_name}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{getServiceName(booking.service_id)}</p>
          </div>
          <Avatar className="h-8 w-8 border border-border flex-shrink-0">
            <AvatarImage src={getProfessionalPhoto(booking.professional_id) || undefined} />
            <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
              {getProfessionalInitials(booking.professional_id)}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <User className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{getProfessionalName(booking.professional_id)}</span>
        </div>
      </div>
    );
  };

  // ========================
  // DAY VIEW
  // ========================
  const [collapsedSlots, setCollapsedSlots] = useState<Record<string, boolean>>({});

  const toggleSlotCollapse = (slotKey: string) => {
    setCollapsedSlots(prev => ({ ...prev, [slotKey]: !prev[slotKey] }));
  };

  const renderDayView = () => {
    const dayBookings = getBookingsForDay(selectedDate);
    
    return (
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="divide-y divide-border/30">
          {timeSlots.map((time) => {
            const slotBookings = dayBookings.filter(
              b => b.start_time.startsWith(time.split(':')[0] + ':' + time.split(':')[1])
            );
            const hasMultiple = slotBookings.length > 1;
            const isCollapsed = hasMultiple && collapsedSlots[time];

            return (
              <div key={time} className="flex">
                {/* Time label */}
                <div className="w-[72px] flex-shrink-0 px-2 py-2 text-[11px] text-muted-foreground/70 text-right pr-3 pt-3 border-r border-border/50">
                  {time}
                </div>

                {/* Bookings area */}
                <div className="flex-1 min-h-[56px] p-1.5">
                  {slotBookings.length === 0 ? null : hasMultiple ? (
                    <div className="space-y-1.5">
                      {/* Collapse toggle header */}
                      <button
                        onClick={() => toggleSlotCollapse(time)}
                        className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors w-full"
                      >
                        <ChevronDown className={cn(
                          "h-3.5 w-3.5 transition-transform",
                          isCollapsed && "-rotate-90"
                        )} />
                        <span className="font-medium">{slotBookings.length} atendimentos</span>
                      </button>

                      {/* First booking always visible */}
                      {(() => {
                        const booking = slotBookings[0];
                        const styles = getStatusStyles(booking.status);
                        return (
                          <div
                            key={booking.id}
                            onClick={() => handleBookingClick(booking)}
                            className={cn(
                              "rounded-lg border-l-[3px] p-2 cursor-pointer",
                              "transition-all duration-200 hover:shadow-md",
                              styles.bg, styles.border, "border border-border/30"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6 border border-border/50 flex-shrink-0">
                                <AvatarImage src={getProfessionalPhoto(booking.professional_id) || undefined} />
                                <AvatarFallback className="text-[8px] bg-muted">
                                  {getProfessionalInitials(booking.professional_id)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-foreground truncate">{booking.customer_name}</div>
                                <div className="text-[10px] text-muted-foreground truncate">
                                  {getServiceName(booking.service_id)} • {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Remaining bookings - collapsible */}
                      {!isCollapsed && slotBookings.slice(1).map(booking => {
                        const styles = getStatusStyles(booking.status);
                        return (
                          <div
                            key={booking.id}
                            onClick={() => handleBookingClick(booking)}
                            className={cn(
                              "rounded-lg border-l-[3px] p-2 cursor-pointer",
                              "transition-all duration-200 hover:shadow-md",
                              styles.bg, styles.border, "border border-border/30"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6 border border-border/50 flex-shrink-0">
                                <AvatarImage src={getProfessionalPhoto(booking.professional_id) || undefined} />
                                <AvatarFallback className="text-[8px] bg-muted">
                                  {getProfessionalInitials(booking.professional_id)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-foreground truncate">{booking.customer_name}</div>
                                <div className="text-[10px] text-muted-foreground truncate">
                                  {getServiceName(booking.service_id)} • {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // Single booking
                    (() => {
                      const booking = slotBookings[0];
                      const styles = getStatusStyles(booking.status);
                      return (
                        <div
                          onClick={() => handleBookingClick(booking)}
                          className={cn(
                            "rounded-lg border-l-[3px] p-2 cursor-pointer",
                            "transition-all duration-200 hover:shadow-md",
                            styles.bg, styles.border, "border border-border/30"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6 border border-border/50 flex-shrink-0">
                              <AvatarImage src={getProfessionalPhoto(booking.professional_id) || undefined} />
                              <AvatarFallback className="text-[8px] bg-muted">
                                {getProfessionalInitials(booking.professional_id)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-foreground truncate">{booking.customer_name}</div>
                              <div className="text-[10px] text-muted-foreground truncate">
                                {getServiceName(booking.service_id)} • {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ========================
  // WEEK VIEW
  // ========================
  const renderWeekView = () => {
    return (
      <div className="rounded-xl border bg-card overflow-hidden flex-1 flex flex-col">
        {/* Day headers */}
        <div className="grid grid-cols-7 divide-x divide-border/50 border-b bg-muted/20">
          {weekDays.map(day => (
            <button
              key={day.toISOString()}
              className={cn(
                "py-3 px-1 text-center cursor-pointer transition-colors hover:bg-muted/40",
                isToday(day) && "bg-primary/5"
              )}
              onClick={() => {
                setSelectedDate(day);
                setViewMode('day');
              }}
            >
              <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                {format(day, 'EEE', { locale: ptBR })}
              </div>
              <div className={cn(
                "text-lg font-bold mt-0.5 w-8 h-8 mx-auto flex items-center justify-center rounded-full transition-colors",
                isToday(day) && "bg-primary text-primary-foreground",
                !isToday(day) && "text-foreground"
              )}>
                {format(day, 'd')}
              </div>
            </button>
          ))}
        </div>
        
        {/* Booking columns */}
        <div className="grid grid-cols-7 divide-x divide-border/30 flex-1">
          {weekDays.map(day => {
            const dayBookings = getBookingsForDay(day);
            return (
              <div key={day.toISOString()} className="p-1.5 space-y-1.5 overflow-y-auto">
                {dayBookings.length === 0 ? (
                  <div className="text-[11px] text-muted-foreground/50 text-center py-6">
                    —
                  </div>
                ) : (
                  dayBookings.map(booking => (
                    <BookingCard key={booking.id} booking={booking} compact />
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ========================
  // MONTH VIEW
  // ========================
  const renderMonthView = () => {
    return (
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 divide-x divide-border/30 border-b bg-muted/20">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="py-2.5 text-center text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              {day}
            </div>
          ))}
        </div>
        
        {/* Days grid */}
        <div className="grid grid-cols-7 divide-x divide-border/20">
          {monthDays.map((day) => {
            const dayBookings = getBookingsForDay(day);
            const isCurrentMonth = isSameMonth(day, selectedDate);
            
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[90px] p-1.5 border-b border-border/20 cursor-pointer transition-colors hover:bg-muted/30",
                  !isCurrentMonth && "opacity-40"
                )}
                onClick={() => {
                  setSelectedDate(day);
                  setViewMode('day');
                }}
              >
                <div className={cn(
                  "text-xs font-medium mb-1 flex items-center justify-center w-6 h-6 rounded-full",
                  isToday(day) && "bg-primary text-primary-foreground",
                  !isToday(day) && isCurrentMonth && "text-foreground"
                )}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5">
                  {dayBookings.slice(0, 3).map(booking => {
                    const styles = getStatusStyles(booking.status);
                    return (
                      <div
                        key={booking.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookingClick(booking);
                        }}
                        className={cn(
                          "rounded-md px-1 py-0.5 text-[10px] cursor-pointer hover:opacity-80 flex items-center gap-1 border-l-2",
                          styles.bg, styles.border
                        )}
                      >
                        <span className="font-medium text-foreground truncate">
                          {booking.start_time.slice(0, 5)} {booking.customer_name}
                        </span>
                      </div>
                    );
                  })}
                  {dayBookings.length > 3 && (
                    <div className="text-[10px] text-muted-foreground px-1 font-medium">
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

  // Stats
  const todayBookings = getBookingsForDay(new Date());
  const pendingCount = filteredBookings.filter(b => b.status === 'pending').length;
  const confirmedCount = filteredBookings.filter(b => b.status === 'confirmed').length;
  const activeProfessionalsCount = professionals.filter(p => p.is_active).length;

  return (
    <ModuleGate moduleKey="booking" storeId={storeId}>
      <div className="space-y-1.5 sm:space-y-2 p-2 sm:p-3 flex flex-col h-full">
        
        {/* ==================== HEADER ==================== */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Agenda</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 hidden sm:block">Gerencie seus agendamentos</p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Online toggle - desktop only */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Online</span>
              <Switch
                checked={channels?.booking_enabled !== false}
                onCheckedChange={(checked) => updateChannel('booking_enabled', checked)}
                disabled={loadingChannels || updatingChannel}
                className="scale-75"
              />
            </div>

            {/* Settings dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {storeSlug && (
                  <DropdownMenuItem asChild>
                    <a href={`/agendar/${storeSlug}`} target="_blank" rel="noopener noreferrer" className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Página Pública
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/booking/professionals" className="gap-2">
                    <User className="h-4 w-4" />
                    Profissionais
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/booking/services" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Serviços
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleSyncGoogleCalendar}
                  disabled={syncingCalendar}
                  className="gap-2"
                >
                  <RefreshCw className={cn("h-4 w-4", syncingCalendar && "animate-spin")} />
                  Sincronizar Google
                </DropdownMenuItem>
                {/* Mobile online toggle */}
                <DropdownMenuSeparator className="sm:hidden" />
                <div className="sm:hidden flex items-center justify-between px-2 py-1.5">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Online</span>
                  </div>
                  <Switch
                    checked={channels?.booking_enabled !== false}
                    onCheckedChange={(checked) => updateChannel('booking_enabled', checked)}
                    disabled={loadingChannels || updatingChannel}
                    className="scale-90"
                  />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ==================== KPI CARDS ==================== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: 'Hoje', value: todayBookings.length, color: 'text-foreground' },
            { label: 'Confirmados', value: confirmedCount, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Pendentes', value: pendingCount, color: 'text-amber-600 dark:text-amber-400' },
            { label: 'Profissionais', value: activeProfessionalsCount, color: 'text-foreground' },
          ].map((kpi) => (
            <Card key={kpi.label} className="border-border/50 shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">{kpi.label}</p>
                <p className={cn("text-xl sm:text-2xl font-bold mt-0.5 tracking-tight", kpi.color)}>{kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ==================== MOBILE LAYOUT ==================== */}
        {isMobile ? (
          <>
            {/* Mobile view mode toggle: Dia | Mês */}
            <div className="flex rounded-lg border bg-muted/30 p-0.5">
              {(['day', 'month'] as const).map((mode) => (
                <Button
                  key={mode}
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileViewMode(mode)}
                  className={cn(
                    "rounded-md text-xs h-8 flex-1 transition-all",
                    mobileViewMode === mode
                      ? "bg-background shadow-sm text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {mode === 'day' ? 'Dia' : 'Mês'}
                </Button>
              ))}
            </div>

            {mobileViewMode === 'day' ? (
              <>
                {/* Mobile date navigator: < 21 MAR 2026 > */}
                <div className="flex items-center justify-between gap-2 py-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 rounded-full" 
                    onClick={() => setSelectedDate(prev => addDays(prev, -1))}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <button 
                    onClick={goToToday} 
                    className="flex-1 text-center"
                  >
                    <div className="text-base font-bold text-foreground uppercase tracking-wide">
                      {format(selectedDate, "dd MMM yyyy", { locale: ptBR })}
                    </div>
                    {isToday(selectedDate) ? (
                      <span className="text-[10px] text-primary font-semibold">HOJE</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Toque para ir a hoje</span>
                    )}
                  </button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 rounded-full" 
                    onClick={() => setSelectedDate(prev => addDays(prev, 1))}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>

                {/* Mobile filters - stacked */}
                <div className="flex flex-col gap-2">
                  <Select value={selectedProfessionalId} onValueChange={setSelectedProfessionalId}>
                    <SelectTrigger className={cn(
                      "w-full h-9 text-sm rounded-lg",
                      selectedProfessionalId !== 'all' && "border-primary bg-primary/5"
                    )}>
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
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Buscar cliente..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-8 h-9 text-sm rounded-lg"
                    />
                  </div>
                </div>

                {/* Mobile bookings list */}
                {loadingBookings || loadingProfessionals ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <MobileBookingsList
                    bookings={getBookingsForDay(selectedDate)}
                    getStatusStyles={getStatusStyles}
                    getStatusLabel={getStatusLabel}
                    getProfessionalName={getProfessionalName}
                    getProfessionalPhoto={getProfessionalPhoto}
                    getProfessionalInitials={getProfessionalInitials}
                    getServiceName={getServiceName}
                    onBookingClick={handleBookingClick}
                  />
                )}
              </>
            ) : (
              /* Mobile Month View */
              loadingBookings ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <MobileMonthView
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  bookings={filteredBookings}
                  onDayClick={(day) => {
                    setSelectedDate(day);
                    setMobileViewMode('day');
                  }}
                />
              )
            )}
          </>
        ) : (
          /* ==================== DESKTOP LAYOUT (unchanged) ==================== */
          <>
            {/* Controls bar */}
            <div className="flex flex-row items-center gap-3">
              {/* Professional filter */}
              <Select value={selectedProfessionalId} onValueChange={setSelectedProfessionalId}>
                <SelectTrigger className={cn(
                  "w-[200px] h-9 text-sm rounded-lg",
                  selectedProfessionalId !== 'all' && "border-primary bg-primary/5"
                )}>
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

              {/* Search */}
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-sm rounded-lg"
                />
              </div>

              <div className="flex-1" />
              
              {/* View Mode Toggle */}
              <div className="flex rounded-lg border bg-muted/30 p-0.5">
                {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
                  <Button
                    key={mode}
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode(mode)}
                    className={cn(
                      "rounded-md text-xs h-8 px-4 transition-all",
                      viewMode === mode 
                        ? "bg-background shadow-sm text-foreground font-semibold" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {mode === 'day' ? 'Dia' : mode === 'week' ? 'Semana' : 'Mês'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Date navigation */}
            <div className="flex items-center justify-center gap-3">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 rounded-lg" 
                onClick={() => navigateDate('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center min-w-[200px]">
                <button 
                  onClick={goToToday} 
                  className="text-[11px] text-primary font-medium hover:underline"
                >
                  Hoje
                </button>
                <div className="text-sm font-semibold text-foreground capitalize">
                  {getDateTitle()}
                </div>
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 rounded-lg" 
                onClick={() => navigateDate('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar view */}
            {loadingBookings || loadingProfessionals ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {viewMode === 'day' && renderDayView()}
                {viewMode === 'week' && renderWeekView()}
                {viewMode === 'month' && renderMonthView()}
              </>
            )}
          </>
        )}

        {/* ==================== FAB - New Booking ==================== */}
        <Button
          onClick={() => setIsNewBookingOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-40"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>

        {/* Dialogs */}
        <NewBookingDialog
          open={isNewBookingOpen}
          onOpenChange={setIsNewBookingOpen}
          storeId={storeId}
          defaultDate={selectedDate}
          defaultProfessionalId={selectedProfessionalId !== 'all' ? selectedProfessionalId : undefined}
          onSuccess={refetchBookings}
        />

        <BookingActionsDialog
          open={isActionsDialogOpen}
          onOpenChange={setIsActionsDialogOpen}
          booking={selectedBooking as any}
          onSuccess={refetchBookings}
        />
      </div>
    </ModuleGate>
  );
};

export default BookingCalendarPage;
