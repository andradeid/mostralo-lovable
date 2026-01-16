import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { useProfessionalData, useProfessionalBookings } from "@/hooks/useProfessionalData";
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function ProfessionalAgenda() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { data: professional } = useProfessionalData();
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const { data: bookings, isLoading } = useProfessionalBookings(professional?.id, dateStr);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

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
          // Invalidate queries to refetch bookings
          queryClient.invalidateQueries({ queryKey: ["professional-bookings"] });
          
          // Show toast notification for new bookings
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

  const handleConfirm = async (bookingId: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", bookingId);

    if (error) {
      toast.error("Erro ao confirmar");
      return;
    }
    toast.success("Confirmado!");
    queryClient.invalidateQueries({ queryKey: ["professional-bookings"] });
  };

  const handleCancel = async (bookingId: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", bookingId);

    if (error) {
      toast.error("Erro ao cancelar");
      return;
    }
    toast.success("Cancelado");
    queryClient.invalidateQueries({ queryKey: ["professional-bookings"] });
  };

  const handleComplete = async (bookingId: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "completed" })
      .eq("id", bookingId);

    if (error) {
      toast.error("Erro ao concluir");
      return;
    }
    toast.success("Serviço concluído!");
    queryClient.invalidateQueries({ queryKey: ["professional-bookings"] });
  };

  const getStatusStyle = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: "bg-yellow-500/10", text: "text-yellow-600", label: "Pendente" },
      confirmed: { bg: "bg-blue-500/10", text: "text-blue-600", label: "Confirmado" },
      completed: { bg: "bg-green-500/10", text: "text-green-600", label: "Concluído" },
      cancelled: { bg: "bg-red-500/10", text: "text-red-600", label: "Cancelado" },
      no_show: { bg: "bg-gray-500/10", text: "text-gray-600", label: "Não Compareceu" },
    };
    return styles[status] || styles.pending;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Minha Agenda</h1>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setSelectedDate(subDays(selectedDate, 7))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-auto">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {format(selectedDate, "MMMM yyyy", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 7))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          
          <Button variant="outline" onClick={() => setSelectedDate(new Date())}>
            Hoje
          </Button>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={cn(
                "flex flex-col items-center p-2 rounded-lg transition-colors",
                isSelected 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted",
                isTodayDate && !isSelected && "ring-2 ring-primary"
              )}
            >
              <span className="text-xs font-medium uppercase">
                {format(day, "EEE", { locale: ptBR })}
              </span>
              <span className="text-lg font-bold">
                {format(day, "d")}
              </span>
            </button>
          );
        })}
      </div>

      {/* Day View */}
      <Card>
        <CardHeader>
          <CardTitle>
            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : bookings && bookings.length > 0 ? (
            <div className="space-y-3">
              {bookings.map((booking: any) => {
                const statusStyle = getStatusStyle(booking.status);
                
                return (
                  <div
                    key={booking.id}
                    className={cn(
                      "p-4 rounded-lg border",
                      statusStyle.bg
                    )}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4" />
                          <span className="font-semibold">
                            {booking.start_time?.slice(0, 5)} - {booking.end_time?.slice(0, 5)}
                          </span>
                          <Badge variant="outline" className={statusStyle.text}>
                            {statusStyle.label}
                          </Badge>
                        </div>
                        <p className="font-medium">{booking.booking_services?.name}</p>
                        <p className="text-sm text-muted-foreground">{booking.customer_name}</p>
                        {booking.customer_phone && (
                          <a 
                            href={`tel:${booking.customer_phone}`}
                            className="text-sm text-primary hover:underline"
                          >
                            {booking.customer_phone}
                          </a>
                        )}
                        {booking.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            Obs: {booking.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {booking.status === "pending" && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleCancel(booking.id)}>
                              <XCircle className="w-4 h-4 mr-1" />
                              Cancelar
                            </Button>
                            <Button size="sm" onClick={() => handleConfirm(booking.id)}>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Confirmar
                            </Button>
                          </>
                        )}
                        {booking.status === "confirmed" && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleCancel(booking.id)}>
                              <XCircle className="w-4 h-4 mr-1" />
                              Cancelar
                            </Button>
                            <Button size="sm" variant="default" onClick={() => handleComplete(booking.id)}>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Concluir
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum agendamento para esta data</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
