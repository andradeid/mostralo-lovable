import { useState, useCallback, useMemo } from 'react';
import { 
  addDays, 
  subDays, 
  addWeeks, 
  subWeeks, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type ViewMode = 'day' | 'week' | 'month';

export function useAgendaNavigation(initialDate: Date = new Date()) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [viewMode, setViewMode] = useState<ViewMode>('day');

  const navigate = useCallback((direction: 'prev' | 'next') => {
    setSelectedDate(prev => {
      switch (viewMode) {
        case 'day':
          return direction === 'prev' ? subDays(prev, 1) : addDays(prev, 1);
        case 'week':
          return direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1);
        case 'month':
          return direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1);
        default:
          return prev;
      }
    });
  }, [viewMode]);

  const goToToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
    const end = endOfWeek(selectedDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  const monthDays = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  const dateRangeLabel = useMemo(() => {
    switch (viewMode) {
      case 'day':
        return format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
      case 'week': {
        const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
        const end = endOfWeek(selectedDate, { weekStartsOn: 0 });
        return `${format(start, "d MMM", { locale: ptBR })} - ${format(end, "d MMM yyyy", { locale: ptBR })}`;
      }
      case 'month':
        return format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR });
      default:
        return '';
    }
  }, [selectedDate, viewMode]);

  const dateRange = useMemo(() => {
    switch (viewMode) {
      case 'day':
        return { start: selectedDate, end: selectedDate };
      case 'week': {
        const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
        const end = endOfWeek(selectedDate, { weekStartsOn: 0 });
        return { start, end };
      }
      case 'month': {
        const start = startOfMonth(selectedDate);
        const end = endOfMonth(selectedDate);
        return { start, end };
      }
      default:
        return { start: selectedDate, end: selectedDate };
    }
  }, [selectedDate, viewMode]);

  return {
    selectedDate,
    setSelectedDate,
    viewMode,
    setViewMode,
    navigate,
    goToToday,
    weekDays,
    monthDays,
    dateRangeLabel,
    dateRange,
  };
}
