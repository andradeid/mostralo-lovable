// Agenda no computador: filtros, troca Dia/Semana/Mês, navegação de data e a visão escolhida.
// JSX movido da BookingCalendarPage sem mudança.
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { calendarDateTitle } from '@/lib/bookingCalendar/calendarGrid';
import { CalendarDayView } from './CalendarDayView';
import { CalendarWeekView } from './CalendarWeekView';
import { CalendarMonthView } from './CalendarMonthView';
import type { Professional } from '@/hooks/useBooking';
import type { ViewMode } from '@/lib/bookingCalendar/calendarGrid';
import type { CalendarHelpers } from './calendarHelpers';

interface CalendarDesktopLayoutProps {
  selectedProfessionalId: string;
  setSelectedProfessionalId: (id: string) => void;
  professionals: Professional[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  navigateDate: (direction: 'prev' | 'next') => void;
  goToToday: () => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  loadingBookings: boolean;
  loadingProfessionals: boolean;
  timeSlots: string[];
  weekDays: Date[];
  monthDays: Date[];
  collapsedSlots: Record<string, boolean>;
  toggleSlotCollapse: (slotKey: string) => void;
  calendar: CalendarHelpers;
}

export function CalendarDesktopLayout({ selectedProfessionalId, setSelectedProfessionalId, professionals, searchQuery, setSearchQuery, viewMode, setViewMode, navigateDate, goToToday, selectedDate, setSelectedDate, loadingBookings, loadingProfessionals, timeSlots, weekDays, monthDays, collapsedSlots, toggleSlotCollapse, calendar }: CalendarDesktopLayoutProps) {
  return (
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
          <div className="text-sm font-semibold text-foreground first-letter:uppercase">
            {calendarDateTitle(viewMode, selectedDate)}
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
          {viewMode === 'day' && (
            <CalendarDayView selectedDate={selectedDate} timeSlots={timeSlots} collapsedSlots={collapsedSlots} toggleSlotCollapse={toggleSlotCollapse} calendar={calendar} />
          )}
          {viewMode === 'week' && (
            <CalendarWeekView weekDays={weekDays} setSelectedDate={setSelectedDate} setViewMode={setViewMode} calendar={calendar} />
          )}
          {viewMode === 'month' && (
            <CalendarMonthView monthDays={monthDays} selectedDate={selectedDate} setSelectedDate={setSelectedDate} setViewMode={setViewMode} calendar={calendar} />
          )}
        </>
      )}
    </>
  );
}
