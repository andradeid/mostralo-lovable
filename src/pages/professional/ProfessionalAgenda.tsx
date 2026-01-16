import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, ChevronLeft, ChevronRight, CalendarDays, CalendarRange, LayoutGrid } from "lucide-react";
import { useProfessionalData } from "@/hooks/useProfessionalData";
import { useAgendaNavigation, ViewMode } from "@/hooks/useAgendaNavigation";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { 
  AgendaDayView, 
  AgendaWeekView, 
  AgendaMonthView 
} from "@/components/professional/agenda";

export default function ProfessionalAgenda() {
  const queryClient = useQueryClient();
  const { data: professional } = useProfessionalData();
  
  const {
    selectedDate,
    setSelectedDate,
    viewMode,
    setViewMode,
    navigate,
    goToToday,
    weekDays,
    dateRangeLabel,
  } = useAgendaNavigation();

  // Get date range based on view mode
  const dateRange = useMemo(() => {
    switch (viewMode) {
      case 'day':
        return {
          start: format(selectedDate, 'yyyy-MM-dd'),
          end: format(selectedDate, 'yyyy-MM-dd'),
        };
      case 'week': {
        const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
        const end = endOfWeek(selectedDate, { weekStartsOn: 0 });
        return {
          start: format(start, 'yyyy-MM-dd'),
          end: format(end, 'yyyy-MM-dd'),
        };
      }
      case 'month': {
        const start = startOfMonth(selectedDate);
        const end = endOfMonth(selectedDate);
        return {
          start: format(start, 'yyyy-MM-dd'),
          end: format(end, 'yyyy-MM-dd'),
        };
      }
      default:
        return {
          start: format(selectedDate, 'yyyy-MM-dd'),
          end: format(selectedDate, 'yyyy-MM-dd'),
        };
    }
  }, [selectedDate, viewMode]);

  // Fetch bookings for the date range
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["professional-bookings-range", professional?.id, dateRange.start, dateRange.end],
    queryFn: async () => {
      if (!professional?.id) return [];

      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          booking_services:service_id (name, duration_minutes)
        `)
        .eq("professional_id", professional.id)
        .gte("booking_date", dateRange.start)
        .lte("booking_date", dateRange.end)
        .order("booking_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Erro ao buscar agendamentos:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!professional?.id,
  });

  // Filter bookings for day view
  const dayBookings = useMemo(() => {
    if (viewMode !== 'day') return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return bookings.filter((b: any) => b.booking_date === dateStr);
  }, [bookings, selectedDate, viewMode]);

  // Real-time subscription for bookings
  useEffect(() => {
    if (!professional?.id) return;

    const channel = supabase
      .channel(`professional-bookings-realtime-${professional.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `professional_id=eq.${professional.id}`
        },
        (payload) => {
          console.log('📅 Professional booking realtime update:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["professional-bookings-range"] });
          
          if (payload.eventType === 'INSERT') {
            toast.info('Novo agendamento recebido!', {
              description: 'Sua agenda foi atualizada automaticamente.'
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Professional bookings subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [professional?.id, queryClient]);

  const handleConfirm = useCallback(async (bookingId: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", bookingId);

    if (error) {
      toast.error("Erro ao confirmar");
      return;
    }
    toast.success("Confirmado!");
    queryClient.invalidateQueries({ queryKey: ["professional-bookings-range"] });
  }, [queryClient]);

  const handleCancel = useCallback(async (bookingId: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", bookingId);

    if (error) {
      toast.error("Erro ao cancelar");
      return;
    }
    toast.success("Cancelado");
    queryClient.invalidateQueries({ queryKey: ["professional-bookings-range"] });
  }, [queryClient]);

  const handleComplete = useCallback(async (bookingId: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "completed" })
      .eq("id", bookingId);

    if (error) {
      toast.error("Erro ao concluir");
      return;
    }
    toast.success("Serviço concluído!");
    queryClient.invalidateQueries({ queryKey: ["professional-bookings-range"] });
  }, [queryClient]);

  const handleDayClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setViewMode('day');
  }, [setSelectedDate, setViewMode]);

  const handleViewModeChange = useCallback((value: string) => {
    setViewMode(value as ViewMode);
  }, [setViewMode]);

  return (
    <div className="space-y-4">
      {/* Header with navigation */}
      <div className="flex flex-col gap-4">
        {/* View Mode Tabs */}
        <Tabs value={viewMode} onValueChange={handleViewModeChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="day" className="gap-2">
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">Dia</span>
            </TabsTrigger>
            <TabsTrigger value="week" className="gap-2">
              <CalendarRange className="w-4 h-4" />
              <span className="hidden sm:inline">Semana</span>
            </TabsTrigger>
            <TabsTrigger value="month" className="gap-2">
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Mês</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Navigation Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-semibold capitalize text-center sm:text-left">
            {dateRangeLabel}
          </h2>
          
          <div className="flex items-center justify-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => navigate('prev')}
              className="h-9 w-9"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-9 px-3">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Ir para</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => navigate('next')}
              className="h-9 w-9"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            
            <Button 
              variant="secondary" 
              onClick={goToToday}
              className="h-9 px-3"
            >
              Hoje
            </Button>
          </div>
        </div>
      </div>

      {/* View Content */}
      <div className="min-h-[400px]">
        {viewMode === 'day' && (
          <AgendaDayView
            date={selectedDate}
            bookings={dayBookings}
            isLoading={isLoading}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            onComplete={handleComplete}
          />
        )}

        {viewMode === 'week' && (
          <AgendaWeekView
            weekDays={weekDays}
            bookings={bookings}
            isLoading={isLoading}
            onDayClick={handleDayClick}
            selectedDate={selectedDate}
          />
        )}

        {viewMode === 'month' && (
          <AgendaMonthView
            selectedDate={selectedDate}
            bookings={bookings}
            isLoading={isLoading}
            onDayClick={handleDayClick}
          />
        )}
      </div>
    </div>
  );
}
