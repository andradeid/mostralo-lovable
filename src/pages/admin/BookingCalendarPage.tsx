import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useBooking, Booking } from '@/hooks/useBooking';
import { useSalesChannels } from '@/hooks/useSalesChannels';
import { ModuleGate } from '@/components/admin/ModuleGate';
import { usePageSEO } from '@/hooks/useSEO';
import { addDays, addMonths } from 'date-fns';
import { NewBookingDialog } from '@/components/admin/booking/NewBookingDialog';
import { BookingActionsDialog } from '@/components/admin/booking/BookingActionsDialog';
import { useModuleEnabled } from '@/hooks/useModuleEnabled';
import { useIsMobile } from '@/hooks/use-mobile';
import { ActiveBookingsBanner } from '@/components/admin/booking/ActiveBookingsBanner';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { useBookingAutoStatusSetting } from '@/hooks/bookingCalendar/useBookingAutoStatusSetting';
import { useCalendarHeaderActions } from '@/hooks/bookingCalendar/useCalendarHeaderActions';
import { useCalendarBookings } from '@/hooks/bookingCalendar/useCalendarBookings';
import {
  filterCalendarBookings,
  bookingsForDay,
  buildDayTimeSlots,
  weekDaysFor,
  monthGridDaysFor,
  makeCalendarLookups,
  calendarStats,
  type ViewMode,
} from '@/lib/bookingCalendar/calendarGrid';
import type { CalendarHelpers } from '@/components/admin/booking-calendar/page/calendarHelpers';
import { CalendarHeader } from '@/components/admin/booking-calendar/page/CalendarHeader';
import { CalendarKpiCards } from '@/components/admin/booking-calendar/page/CalendarKpiCards';
import { CalendarMobileLayout } from '@/components/admin/booking-calendar/page/CalendarMobileLayout';
import { CalendarDesktopLayout } from '@/components/admin/booking-calendar/page/CalendarDesktopLayout';

// Agenda do painel de agendamento. Só orquestra: busca e ações em src/hooks/bookingCalendar/,
// blocos visuais em src/components/admin/booking-calendar/page/ e regras puras
// (período, filtros, grade de horários, números) em src/lib/bookingCalendar/.
const BookingCalendarPage = () => {
  const { storeId } = useStoreAccess();
  const bookingEnabled = useModuleEnabled('booking');
  const isMobile = useIsMobile();
  const isPageVisible = usePageVisibility();
  const {
    professionals,
    loadingProfessionals,
    bookingServices,
    fetchBookings
  } = useBooking(storeId);

  const { channels, loading: loadingChannels, updating: updatingChannel, updateChannel } = useSalesChannels(storeId);

  // Fetch auto_status_enabled from booking_settings
  const { data: autoStatusEnabled = false } = useBookingAutoStatusSetting(storeId, bookingEnabled);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileViewMode, setMobileViewMode] = useState<'day' | 'week' | 'month'>('day');

  // Selected booking for actions dialog
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isActionsDialogOpen, setIsActionsDialogOpen] = useState(false);

  // Slug da loja (link público) e sincronizar com o Google Calendar
  const { storeSlug, syncingCalendar, handleSyncGoogleCalendar } = useCalendarHeaderActions(storeId);

  usePageSEO({
    title: 'Agenda - Agendamentos',
    description: 'Visualize e gerencie os agendamentos do seu estabelecimento',
    keywords: 'agenda, agendamento, calendário, profissionais'
  });

  // Busca do período visível + atualização a cada 15 s
  const { bookings, loadingBookings, refetchBookings } = useCalendarBookings({
    storeId, bookingEnabled, isMobile, isPageVisible, fetchBookings, selectedDate, viewMode, mobileViewMode,
  });

  // Filter bookings by selected professional and search
  const filteredBookings = useMemo(
    () => filterCalendarBookings(bookings, selectedProfessionalId, searchQuery),
    [bookings, selectedProfessionalId, searchQuery]
  );

  // Get bookings for a specific day
  const getBookingsForDay = (date: Date) => bookingsForDay(filteredBookings, date);

  // Generate time slots for the day view
  const timeSlots = useMemo(() => buildDayTimeSlots(), []);

  // Get days for week view
  const weekDays = useMemo(() => weekDaysFor(selectedDate), [selectedDate]);

  // Get days for month view
  const monthDays = useMemo(() => monthGridDaysFor(selectedDate), [selectedDate]);

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

  const { getProfessionalName, getProfessionalPhoto, getProfessionalInitials, getServiceName } = makeCalendarLookups(professionals, bookingServices);

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking({
      ...booking,
      professional_name: getProfessionalName(booking.professional_id),
      professional_photo_url: getProfessionalPhoto(booking.professional_id),
      service_name: getServiceName(booking.service_id)
    } as Booking & { professional_name?: string; professional_photo_url?: string; service_name?: string });
    setIsActionsDialogOpen(true);
  };

  // DAY VIEW: horários com vários atendimentos podem ser recolhidos
  const [collapsedSlots, setCollapsedSlots] = useState<Record<string, boolean>>({});

  const toggleSlotCollapse = (slotKey: string) => {
    setCollapsedSlots(prev => ({ ...prev, [slotKey]: !prev[slotKey] }));
  };

  const calendar: CalendarHelpers = {
    getProfessionalName, getProfessionalPhoto, getProfessionalInitials, getServiceName,
    getBookingsForDay, handleBookingClick, refetchBookings,
  };

  // Stats — adapt to view mode (day/week/month)
  const effectiveViewMode = isMobile ? mobileViewMode : viewMode;
  const stats = calendarStats(effectiveViewMode, selectedDate, filteredBookings, getBookingsForDay);

  return (
    <ModuleGate moduleKey="booking" storeId={storeId}>
      <div className="space-y-1.5 sm:space-y-2 p-2 sm:p-3 flex flex-col h-full">

        {/* ==================== HEADER ==================== */}
        <CalendarHeader
          storeSlug={storeSlug}
          channels={channels}
          updateChannel={updateChannel}
          loadingChannels={loadingChannels}
          updatingChannel={updatingChannel}
          handleSyncGoogleCalendar={handleSyncGoogleCalendar}
          syncingCalendar={syncingCalendar}
        />

        {/* ==================== KPI CARDS ==================== */}
        <CalendarKpiCards stats={stats} />

        {/* ==================== ACTIVE BOOKINGS BANNER ==================== */}
        <ActiveBookingsBanner
          bookings={bookings}
          getProfessionalName={getProfessionalName}
          getProfessionalPhoto={getProfessionalPhoto}
          getProfessionalInitials={getProfessionalInitials}
          getServiceName={getServiceName}
          onSuccess={refetchBookings}
          onBookingClick={handleBookingClick}
        />

        {/* ==================== MOBILE LAYOUT ==================== */}
        {isMobile ? (
          <CalendarMobileLayout
            mobileViewMode={mobileViewMode}
            setMobileViewMode={setMobileViewMode}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            goToToday={goToToday}
            selectedProfessionalId={selectedProfessionalId}
            setSelectedProfessionalId={setSelectedProfessionalId}
            professionals={professionals}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            loadingBookings={loadingBookings}
            loadingProfessionals={loadingProfessionals}
            filteredBookings={filteredBookings}
            calendar={calendar}
          />
        ) : (
          /* ==================== DESKTOP LAYOUT (unchanged) ==================== */
          <CalendarDesktopLayout
            selectedProfessionalId={selectedProfessionalId}
            setSelectedProfessionalId={setSelectedProfessionalId}
            professionals={professionals}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            viewMode={viewMode}
            setViewMode={setViewMode}
            navigateDate={navigateDate}
            goToToday={goToToday}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            loadingBookings={loadingBookings}
            loadingProfessionals={loadingProfessionals}
            timeSlots={timeSlots}
            weekDays={weekDays}
            monthDays={monthDays}
            collapsedSlots={collapsedSlots}
            toggleSlotCollapse={toggleSlotCollapse}
            calendar={calendar}
          />
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
