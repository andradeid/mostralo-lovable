// Agenda no celular: Dia (lista), Semana e Mês, com navegação de data e filtros.
// JSX movido da BookingCalendarPage sem mudança.
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react';
import { format, addDays, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { MobileBookingsList } from '@/components/admin/booking/MobileBookingsList';
import { MobileMonthView } from '@/components/admin/booking/MobileMonthView';
import { MobileWeekView } from '@/components/admin/booking/MobileWeekView';
import { getStatusStyles, getStatusLabel } from '@/lib/bookingCalendar/calendarGrid';
import type { Professional, Booking } from '@/hooks/useBooking';
import type { ViewMode } from '@/lib/bookingCalendar/calendarGrid';
import type { CalendarHelpers } from './calendarHelpers';

interface CalendarMobileLayoutProps {
  mobileViewMode: ViewMode;
  setMobileViewMode: (mode: ViewMode) => void;
  selectedDate: Date;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
  goToToday: () => void;
  selectedProfessionalId: string;
  setSelectedProfessionalId: (id: string) => void;
  professionals: Professional[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  loadingBookings: boolean;
  loadingProfessionals: boolean;
  filteredBookings: Booking[];
  calendar: CalendarHelpers;
}

export function CalendarMobileLayout({ mobileViewMode, setMobileViewMode, selectedDate, setSelectedDate, goToToday, selectedProfessionalId, setSelectedProfessionalId, professionals, searchQuery, setSearchQuery, loadingBookings, loadingProfessionals, filteredBookings, calendar }: CalendarMobileLayoutProps) {
  const { getBookingsForDay, getProfessionalName, getProfessionalPhoto, getProfessionalInitials, getServiceName, handleBookingClick, refetchBookings } = calendar;

  return (
    <>
      {/* Mobile view mode toggle: Dia | Semana | Mês */}
      <div className="flex rounded-lg border bg-muted/30 p-0.5">
        {(['day', 'week', 'month'] as const).map((mode) => (
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
            {mode === 'day' ? 'Dia' : mode === 'week' ? 'Semana' : 'Mês'}
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
              onActionSuccess={refetchBookings}
            />
          )}
        </>
      ) : mobileViewMode === 'week' ? (
        /* Mobile Week View */
        loadingBookings ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <MobileWeekView
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            bookings={filteredBookings}
            onDayClick={(day) => {
              setSelectedDate(day);
              setMobileViewMode('day');
            }}
            getStatusStyles={getStatusStyles}
            getStatusLabel={getStatusLabel}
            getProfessionalName={getProfessionalName}
            getProfessionalPhoto={getProfessionalPhoto}
            getProfessionalInitials={getProfessionalInitials}
            getServiceName={getServiceName}
            onBookingClick={handleBookingClick}
          />
        )
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
  );
}
