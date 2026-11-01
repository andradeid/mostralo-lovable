// Regras da Agenda (calendário do painel de agendamento). Funções puras: mesmo código
// que ficava dentro da BookingCalendarPage, só movido para cá.
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Booking, BookingService, Professional } from '@/hooks/useBooking';

export type ViewMode = 'day' | 'week' | 'month';

/** Período buscado no banco para a visão (mês, semana ou dia). */
export function bookingRangeForView(effectiveMode: ViewMode, selectedDate: Date): { start: Date; end: Date } {
  let start: Date, end: Date;
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
  return { start, end };
}

/** Filtro por profissional e busca por nome/telefone do cliente. */
export function filterCalendarBookings(bookings: Booking[], selectedProfessionalId: string, searchQuery: string): Booking[] {
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
}

/** Agendamentos de um dia. */
export function bookingsForDay(filteredBookings: Booking[], date: Date): Booking[] {
  return filteredBookings.filter(b => {
    const bookingDate = parseISO(b.booking_date);
    return isSameDay(bookingDate, date);
  });
}

/** Horários da visão Dia: 07:00 até 21:30, de 30 em 30 minutos. */
export function buildDayTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 7; hour <= 21; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return slots;
}

/** Linha de 30 min em que o horário cai (ex.: 09:15 → 09:00, 09:45 → 09:30). */
export function slotOfTime(startTime: string): string {
  const [h, m] = String(startTime || '00:00').split(':').map(Number);
  const hh = Number.isFinite(h) ? h : 0;
  const mm = Number.isFinite(m) && m >= 30 ? '30' : '00';
  return `${String(hh).padStart(2, '0')}:${mm}`;
}

/** Agendamentos que começam dentro da linha de 30 min (HH:MM até HH:MM+29). */
export function slotBookingsFor(dayBookings: Booking[], time: string): Booking[] {
  return dayBookings
    .filter(b => slotOfTime(b.start_time) === time)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
}

/** Linhas da visão Dia: as padrão + as de agendamentos fora da faixa (antes das 7h, depois das 21h30). */
export function timeSlotsForDay(baseSlots: string[], dayBookings: Booking[]): string[] {
  const all = new Set(baseSlots);
  for (const b of dayBookings) all.add(slotOfTime(b.start_time));
  return [...all].sort();
}

/** Dias da visão Semana. */
export function weekDaysFor(selectedDate: Date): Date[] {
  const start = startOfWeek(selectedDate, { locale: ptBR });
  const end = endOfWeek(selectedDate, { locale: ptBR });
  return eachDayOfInterval({ start, end });
}

/** Dias da grade do mês (semanas completas). */
export function monthGridDaysFor(selectedDate: Date): Date[] {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const calendarStart = startOfWeek(monthStart, { locale: ptBR });
  const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });
  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
}

// Soft status colors for premium look
export const getStatusStyles = (status: Booking['status']) => {
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

export const getStatusLabel = (status: Booking['status']) => {
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

/** Nome, foto e iniciais do profissional e nome do serviço de um agendamento. */
export function makeCalendarLookups(professionals: Pick<Professional, 'id' | 'name' | 'photo_url'>[], bookingServices: Pick<BookingService, 'id' | 'name'>[]) {
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

  return { getProfessionalName, getProfessionalPhoto, getProfessionalInitials, getServiceName };
}

export type CalendarLookups = ReturnType<typeof makeCalendarLookups>;

/** Título da data no topo do calendário. */
export function calendarDateTitle(viewMode: ViewMode, selectedDate: Date): string {
  if (viewMode === 'month') {
    return format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR });
  } else if (viewMode === 'week') {
    return `${format(startOfWeek(selectedDate, { locale: ptBR }), 'dd/MM')} - ${format(endOfWeek(selectedDate, { locale: ptBR }), 'dd/MM/yyyy')}`;
  } else {
    return format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  }
}

/** Números dos cartões (dia selecionado ou período visível). */
export function calendarStats(
  effectiveViewMode: ViewMode,
  selectedDate: Date,
  filteredBookings: Booking[],
  getBookingsForDay: (date: Date) => Booking[],
) {
  const statsBookings = effectiveViewMode === 'day'
    ? getBookingsForDay(selectedDate)
    : filteredBookings;
  const todayBookings = getBookingsForDay(new Date()); // sem uso (já era assim)
  const pendingCount = statsBookings.filter(b => b.status === 'pending').length;
  const confirmedCount = statsBookings.filter(b => b.status === 'confirmed').length;
  const inProgressCount = statsBookings.filter(b => b.status === 'in_progress').length;
  const completedCount = statsBookings.filter(b => b.status === 'completed').length;
  const cancelledCount = statsBookings.filter(b => b.status === 'cancelled' || b.status === 'no_show').length;
  const statsLabel = effectiveViewMode === 'day' ? 'Dia' : effectiveViewMode === 'week' ? 'Semana' : 'Mês';
  const totalLabel = effectiveViewMode === 'day' && isSameDay(selectedDate, new Date()) ? 'Hoje' : statsLabel;

  return { statsBookings, pendingCount, confirmedCount, inProgressCount, completedCount, cancelledCount, statsLabel, totalLabel };
}

export type CalendarStats = ReturnType<typeof calendarStats>;
