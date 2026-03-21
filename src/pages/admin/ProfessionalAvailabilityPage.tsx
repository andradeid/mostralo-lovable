import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MinusCircle,
  PauseCircle,
  Trash2,
  Ban,
  Minimize2,
  Maximize2,
  TrendingUp,
  Plus
} from 'lucide-react';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useBooking, Professional } from '@/hooks/useBooking';
import { ModuleGate } from '@/components/admin/ModuleGate';
import { usePageSEO } from '@/hooks/useSEO';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { NewBookingDialog } from '@/components/admin/booking/NewBookingDialog';
import { PauseServicesDialog } from '@/components/admin/booking/PauseServicesDialog';
import { MobileAvailabilityView } from '@/components/admin/booking/MobileAvailabilityView';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

interface ProfessionalSchedule {
  professional_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
  is_available: boolean;
}

interface ProfessionalBlock {
  id: string;
  professional_id: string;
  block_date: string;
  start_time: string | null;
  end_time: string | null;
  is_all_day: boolean;
  reason: string | null;
}

interface BookingSlot {
  professional_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
}

const ProfessionalAvailabilityPage = () => {
  const { storeId } = useStoreAccess();
  const { professionals, loadingProfessionals } = useBooking(storeId);
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('all');
  const [removingBlockId, setRemovingBlockId] = useState<string | null>(null);
  const [compactMode, setCompactMode] = useState(false);
  const [collapsedProfessionals, setCollapsedProfessionals] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [selectedBookingData, setSelectedBookingData] = useState<{
    date: Date;
    time: string;
    professionalId: string;
  } | null>(null);

  // Update current time every minute for the "now" indicator
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  usePageSEO({
    title: 'Disponibilidade - Profissionais',
    description: 'Visualize a disponibilidade semanal dos profissionais',
    keywords: 'disponibilidade, agenda, profissionais, horários'
  });

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { locale: ptBR, weekStartsOn: 0 });
    const end = endOfWeek(selectedDate, { locale: ptBR, weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];

  const { data: schedules = [], isLoading: loadingSchedules } = useQuery({
    queryKey: ['professional-schedules-all', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from('professional_schedules')
        .select('*')
        .in('professional_id', professionals.map(p => p.id));
      if (error) throw error;
      return data as ProfessionalSchedule[];
    },
    enabled: !!storeId && professionals.length > 0
  });

  const { data: blocks = [], isLoading: loadingBlocks } = useQuery({
    queryKey: ['professional-blocks-week', storeId, format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from('professional_blocks')
        .select('id, professional_id, block_date, start_time, end_time, is_all_day, reason')
        .in('professional_id', professionals.map(p => p.id))
        .gte('block_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('block_date', format(weekEnd, 'yyyy-MM-dd'));
      if (error) throw error;
      return data as ProfessionalBlock[];
    },
    enabled: !!storeId && professionals.length > 0
  });

  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['bookings-week', storeId, format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from('bookings')
        .select('professional_id, booking_date, start_time, end_time, status, customer_name')
        .eq('store_id', storeId)
        .gte('booking_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('booking_date', format(weekEnd, 'yyyy-MM-dd'))
        .not('status', 'eq', 'cancelled');
      if (error) throw error;
      return data as BookingSlot[];
    },
    enabled: !!storeId
  });

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = 7; hour <= 21; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }, []);

  const filteredProfessionals = useMemo(() => {
    const active = professionals.filter(p => p.is_active);
    if (selectedProfessionalId === 'all') return active;
    return active.filter(p => p.id === selectedProfessionalId);
  }, [professionals, selectedProfessionalId]);

  const blocksByProfessional = useMemo(() => {
    const map = new Map<string, ProfessionalBlock[]>();
    blocks.forEach(block => {
      const existing = map.get(block.professional_id) || [];
      if (!existing.find(b => b.id === block.id)) {
        existing.push(block);
      }
      map.set(block.professional_id, existing);
    });
    return map;
  }, [blocks]);

  const getSlotBlock = (professional: Professional, day: Date, time: string): ProfessionalBlock | null => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const block = blocks.find(b => 
      b.professional_id === professional.id && 
      b.block_date === dateStr
    );
    if (!block) return null;
    if (block.is_all_day) return block;
    if (block.start_time && block.end_time) {
      const blockStart = block.start_time.slice(0, 5);
      const blockEnd = block.end_time.slice(0, 5);
      if (time >= blockStart && time < blockEnd) return block;
    }
    return null;
  };

  const getSlotStatus = (professional: Professional, day: Date, time: string): 'available' | 'busy' | 'blocked' | 'off' | 'past' => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const slotDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    
    if (slotDate < today) return 'past';
    
    if (slotDate.getTime() === today.getTime()) {
      const [hours, minutes] = time.split(':').map(Number);
      const slotDateTime = new Date(day);
      slotDateTime.setHours(hours, minutes, 0, 0);
      if (slotDateTime <= now) return 'past';
    }
    
    const dayOfWeek = day.getDay();
    const dateStr = format(day, 'yyyy-MM-dd');
    
    const block = blocks.find(b => 
      b.professional_id === professional.id && 
      b.block_date === dateStr
    );
    
    if (block) {
      if (block.is_all_day) return 'blocked';
      if (block.start_time && block.end_time) {
        const blockStart = block.start_time.slice(0, 5);
        const blockEnd = block.end_time.slice(0, 5);
        if (time >= blockStart && time < blockEnd) return 'blocked';
      }
    }
    
    const schedule = schedules.find(s => 
      s.professional_id === professional.id && 
      s.day_of_week === dayOfWeek
    );
    
    if (!schedule || !schedule.is_available) return 'off';
    
    const scheduleStart = schedule.start_time.slice(0, 5);
    const scheduleEnd = schedule.end_time.slice(0, 5);
    
    if (time < scheduleStart || time >= scheduleEnd) return 'off';
    
    if (schedule.break_start && schedule.break_end) {
      const breakStart = schedule.break_start.slice(0, 5);
      const breakEnd = schedule.break_end.slice(0, 5);
      if (time >= breakStart && time < breakEnd) return 'off';
    }
    
    const booking = bookings.find(b => 
      b.professional_id === professional.id && 
      b.booking_date === dateStr &&
      time >= b.start_time.slice(0, 5) && 
      time < b.end_time.slice(0, 5)
    );
    
    if (booking) return 'busy';
    
    return 'available';
  };

  const getSlotColor = (status: 'available' | 'busy' | 'blocked' | 'off' | 'past') => {
    switch (status) {
      case 'available': return 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200/70 dark:border-emerald-500/25';
      case 'busy': return 'bg-rose-50 dark:bg-rose-500/15 border-rose-200/70 dark:border-rose-500/25';
      case 'blocked': return 'bg-amber-50 dark:bg-amber-500/15 border-amber-200/70 dark:border-amber-500/25';
      case 'off': return 'bg-muted/30 border-border/30';
      case 'past': return 'bg-muted/15 border-border/20 opacity-35';
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

  const goToThisWeek = () => {
    setSelectedDate(new Date());
  };

  const isLoading = loadingProfessionals || loadingSchedules || loadingBlocks || loadingBookings;

  const handleSlotClick = (professional: Professional, day: Date, time: string, status: string) => {
    if (status !== 'available') return;
    setSelectedBookingData({ date: day, time, professionalId: professional.id });
    setBookingDialogOpen(true);
  };

  const handleRemoveBlock = async (blockId: string) => {
    setRemovingBlockId(blockId);
    try {
      const { error } = await supabase.from('professional_blocks').delete().eq('id', blockId);
      if (error) throw error;
      toast.success('Bloqueio removido com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['professional-blocks-week'] });
    } catch (err: any) {
      console.error('Erro ao remover bloqueio:', err);
      toast.error('Erro ao remover bloqueio');
    } finally {
      setRemovingBlockId(null);
    }
  };

  const handleRemoveAllBlocks = async (professionalId: string) => {
    const profBlocks = blocksByProfessional.get(professionalId) || [];
    if (profBlocks.length === 0) return;
    setRemovingBlockId(professionalId);
    try {
      const { error } = await supabase.from('professional_blocks').delete().in('id', profBlocks.map(b => b.id));
      if (error) throw error;
      toast.success('Todos os bloqueios removidos!');
      queryClient.invalidateQueries({ queryKey: ['professional-blocks-week'] });
    } catch (err: any) {
      console.error('Erro ao remover bloqueios:', err);
      toast.error('Erro ao remover bloqueios');
    } finally {
      setRemovingBlockId(null);
    }
  };

  const handleBookingSuccess = () => {
    setBookingDialogOpen(false);
    setSelectedBookingData(null);
    queryClient.invalidateQueries({ queryKey: ['bookings-week'] });
  };

  const toggleProfessionalCollapse = (id: string) => {
    setCollapsedProfessionals(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Per-professional stats
  const getProfessionalStats = (professional: Professional) => {
    let total = 0, available = 0, busy = 0, blocked = 0;
    weekDays.forEach(day => {
      timeSlots.forEach(time => {
        const status = getSlotStatus(professional, day, time);
        if (status !== 'off' && status !== 'past') total++;
        if (status === 'available') available++;
        if (status === 'busy') busy++;
        if (status === 'blocked') blocked++;
      });
    });
    const occupancy = total > 0 ? Math.round((busy / total) * 100) : 0;
    return { total, available, busy, blocked, occupancy };
  };

  const stats = useMemo(() => {
    let totalSlots = 0, availableSlots = 0, busySlots = 0, blockedSlots = 0;
    filteredProfessionals.forEach(prof => {
      weekDays.forEach(day => {
        timeSlots.forEach(time => {
          const status = getSlotStatus(prof, day, time);
          if (status !== 'off') totalSlots++;
          if (status === 'available') availableSlots++;
          if (status === 'busy') busySlots++;
          if (status === 'blocked') blockedSlots++;
        });
      });
    });
    return { totalSlots, availableSlots, busySlots, blockedSlots };
  }, [filteredProfessionals, weekDays, timeSlots, schedules, blocks, bookings]);

  const formatBlockDescription = (block: ProfessionalBlock): string => {
    const date = format(new Date(block.block_date + 'T12:00:00'), 'dd/MM (EEE)', { locale: ptBR });
    if (block.is_all_day) return `${date} — Dia inteiro`;
    return `${date} — ${block.start_time?.slice(0, 5)} às ${block.end_time?.slice(0, 5)}`;
  };

  const occupancyRate = stats.totalSlots > 0 ? Math.round((stats.busySlots / stats.totalSlots) * 100) : 0;

  // Mobile: compute single-day stats for the selected date
  const mobileDayStats = useMemo(() => {
    if (!isMobile) return stats;
    let totalSlots = 0, availableSlots = 0, busySlots = 0, blockedSlots = 0;
    filteredProfessionals.forEach(prof => {
      timeSlots.forEach(time => {
        const status = getSlotStatus(prof, selectedDate, time);
        if (status !== 'off') totalSlots++;
        if (status === 'available') availableSlots++;
        if (status === 'busy') busySlots++;
        if (status === 'blocked') blockedSlots++;
      });
    });
    return { totalSlots, availableSlots, busySlots, blockedSlots };
  }, [isMobile, filteredProfessionals, selectedDate, timeSlots, schedules, blocks, bookings]);

  const mobileOccupancyRate = mobileDayStats.totalSlots > 0 ? Math.round((mobileDayStats.busySlots / mobileDayStats.totalSlots) * 100) : 0;

  // Current time position for "now" line
  const nowHour = currentTime.getHours() + currentTime.getMinutes() / 60;
  const showNowLine = nowHour >= 7 && nowHour <= 22;
  const nowLineIndex = nowHour - 7; // relative to first slot (7:00)

  return (
    <ModuleGate moduleKey="booking" storeId={storeId}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">Disponibilidade</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Central de controle de horários</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard/booking">
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                Agenda
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard/booking/professionals">
                <Users className="h-3.5 w-3.5 mr-1.5" />
                Profissionais
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPauseDialogOpen(true)}
              className="border-amber-300 dark:border-amber-500/50 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10"
            >
              <PauseCircle className="h-3.5 w-3.5 mr-1.5" />
              Pausar
            </Button>
          </div>
        </div>

        {/* Mobile View */}
        {isMobile ? (
          <MobileAvailabilityView
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            professionals={professionals}
            filteredProfessionals={filteredProfessionals}
            selectedProfessionalId={selectedProfessionalId}
            onProfessionalChange={setSelectedProfessionalId}
            stats={mobileDayStats}
            occupancyRate={mobileOccupancyRate}
            isLoading={isLoading}
            timeSlots={timeSlots}
            getSlotStatus={getSlotStatus}
            blocks={blocks}
            bookings={bookings as any}
            blocksByProfessional={blocksByProfessional}
            onSlotClick={handleSlotClick}
            onRemoveBlock={handleRemoveBlock}
            onRemoveAllBlocks={handleRemoveAllBlocks}
            removingBlockId={removingBlockId}
            formatBlockDescription={formatBlockDescription}
          />
        ) : (
        <>
        {/* Stats with occupancy bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { label: 'Disponível', value: stats.availableSlots, icon: CheckCircle2, colorClass: 'text-emerald-600 dark:text-emerald-400', bgClass: 'bg-emerald-50 dark:bg-emerald-500/10' },
            { label: 'Ocupado', value: stats.busySlots, icon: XCircle, colorClass: 'text-rose-600 dark:text-rose-400', bgClass: 'bg-rose-50 dark:bg-rose-500/10' },
            { label: 'Bloqueado', value: stats.blockedSlots, icon: AlertCircle, colorClass: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-50 dark:bg-amber-500/10' },
            { label: 'Ocupação', value: `${occupancyRate}%`, icon: TrendingUp, colorClass: 'text-primary', bgClass: 'bg-primary/10', isOccupancy: true },
          ].map(item => (
            <Card key={item.label} className="border-border/50 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-3.5">
                <div className="flex items-center gap-2.5">
                  <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", item.bgClass)}>
                    <item.icon className={cn("h-4.5 w-4.5", item.colorClass)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{item.label}</p>
                    <p className={cn("text-xl font-bold leading-tight", item.colorClass)}>{item.value}</p>
                  </div>
                </div>
                {(item as any).isOccupancy && (
                  <div className="mt-2.5">
                    <Progress value={occupancyRate} className="h-1.5" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Controls Bar */}
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Week Navigation */}
              <div className="flex items-center gap-1.5 flex-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigateWeek('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1 text-center">
                  <button onClick={goToThisWeek} className="text-[10px] text-primary font-semibold uppercase tracking-wider hover:underline transition-colors">
                    Hoje
                  </button>
                  <div className="text-sm font-semibold text-foreground leading-tight">
                    {format(weekStart, "dd MMM", { locale: ptBR })} — {format(weekEnd, "dd MMM yyyy", { locale: ptBR })}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigateWeek('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-2.5 py-1.5">
                  {compactMode ? <Minimize2 className="h-3 w-3 text-muted-foreground" /> : <Maximize2 className="h-3 w-3 text-muted-foreground" />}
                  <span className="text-[10px] font-medium text-muted-foreground">Compacto</span>
                  <Switch 
                    checked={compactMode} 
                    onCheckedChange={setCompactMode}
                    className="scale-75"
                  />
                </div>

                <Select value={selectedProfessionalId} onValueChange={setSelectedProfessionalId}>
                  <SelectTrigger className="w-full sm:w-[180px] h-8 text-xs">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos profissionais</SelectItem>
                    {professionals.filter(p => p.is_active).map(prof => (
                      <SelectItem key={prof.id} value={prof.id}>{prof.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Legenda</span>
          {[
            { bg: 'bg-emerald-400', label: 'Disponível' },
            { bg: 'bg-rose-400', label: 'Ocupado' },
            { bg: 'bg-amber-400', label: 'Bloqueado' },
            { bg: 'bg-muted-foreground/25', label: 'Não atende' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1">
              <div className={cn("h-2.5 w-2.5 rounded-[3px]", item.bg)} />
              <span className="text-[11px] text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Availability Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Carregando disponibilidade...</p>
            </div>
          </div>
        ) : filteredProfessionals.length === 0 ? (
          <Card className="border-border/50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                <Users className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium text-sm">Nenhum profissional ativo</p>
              <p className="text-xs text-muted-foreground mt-0.5">Cadastre profissionais para visualizar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredProfessionals.map(professional => {
              const profBlocks = blocksByProfessional.get(professional.id) || [];
              const profStats = getProfessionalStats(professional);
              const isCollapsed = collapsedProfessionals.has(professional.id);
              
              return (
                <Card key={professional.id} className="border-border/50 shadow-sm overflow-hidden">
                  {/* Collapsible Professional Header */}
                  <button
                    onClick={() => toggleProfessionalCollapse(professional.id)}
                    className="w-full text-left"
                  >
                    <CardHeader className="py-3 px-4 bg-muted/15 hover:bg-muted/25 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/25 to-primary/5 border border-primary/15 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                            {professional.name.charAt(0).toUpperCase()}
                          </div>
                           <div className="min-w-0 flex-1 overflow-hidden">
                             <div className="flex items-center gap-2 flex-wrap">
                               <span className="font-semibold text-sm text-foreground truncate max-w-[150px] sm:max-w-none">{professional.name}</span>
                               {professional.specialty && (
                                 <Badge variant="secondary" className="text-[10px] font-normal h-5 px-1.5 shrink-0 max-w-[200px] truncate">
                                   {professional.specialty}
                                 </Badge>
                               )}
                               {profBlocks.length > 0 && (
                                 <Badge variant="outline" className="text-[10px] font-medium h-5 px-1.5 border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-500/10 shrink-0">
                                   <Ban className="h-2.5 w-2.5 mr-0.5" />
                                   {profBlocks.length}
                                 </Badge>
                               )}
                             </div>
                             {/* Mini stats row */}
                             <div className="flex items-center gap-3 mt-0.5 overflow-hidden">
                               <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">{profStats.available} livres</span>
                               <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium whitespace-nowrap">{profStats.busy} ocupados</span>
                               <span className="text-[10px] text-muted-foreground whitespace-nowrap">{profStats.occupancy}% ocupação</span>
                             </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Mini occupancy bar */}
                          <div className="hidden sm:block w-20">
                            <Progress value={profStats.occupancy} className="h-1" />
                          </div>
                          <ChevronDown className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform",
                            !isCollapsed && "rotate-180"
                          )} />
                        </div>
                      </div>
                    </CardHeader>
                  </button>

                  {!isCollapsed && (
                    <CardContent className="pb-4 pt-3 px-4 space-y-3">
                      {/* Block Alerts */}
                      {profBlocks.length > 0 && (
                        <Alert className="border-amber-200/80 dark:border-amber-500/25 bg-amber-50/40 dark:bg-amber-500/5 py-2.5">
                          <PauseCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                          <AlertDescription>
                            <div className="space-y-1.5">
                              <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">Pausados nesta semana:</p>
                              {profBlocks.map(block => (
                                <div key={block.id} className="flex items-center justify-between gap-2 text-xs bg-amber-100/50 dark:bg-amber-500/10 rounded-md px-2.5 py-1.5">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <Ban className="h-3 w-3 text-amber-600 shrink-0" />
                                    <span className="truncate text-foreground">
                                      {formatBlockDescription(block)}
                                      {block.reason && <span className="text-muted-foreground ml-1">— {block.reason}</span>}
                                    </span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-1.5 text-[10px] text-rose-600 hover:text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-500/10 shrink-0"
                                    onClick={(e) => { e.stopPropagation(); handleRemoveBlock(block.id); }}
                                    disabled={removingBlockId === block.id}
                                  >
                                    {removingBlockId === block.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                  </Button>
                                </div>
                              ))}
                              {profBlocks.length > 1 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-[10px] h-6 border-rose-200 dark:border-rose-500/30 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 w-full"
                                  onClick={() => handleRemoveAllBlocks(professional.id)}
                                  disabled={removingBlockId === professional.id}
                                >
                                  {removingBlockId === professional.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}
                                  Remover todos
                                </Button>
                              )}
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Schedule Grid */}
                      <div className="overflow-x-auto -mx-4 px-4">
                        <TooltipProvider delayDuration={100}>
                          <div className="min-w-[600px]">
                            {/* Days header */}
                            <div className="grid grid-cols-[48px_repeat(7,1fr)] gap-0 mb-1">
                              <div className="sticky left-0 z-10 bg-card flex items-end justify-center pb-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                              </div>
                              {weekDays.map(day => {
                                const dateStr = format(day, 'yyyy-MM-dd');
                                const dayBlocked = blocks.some(b => 
                                  b.professional_id === professional.id && 
                                  b.block_date === dateStr && 
                                  b.is_all_day
                                );
                                const isTodayDate = isToday(day);
                                return (
                                  <div 
                                    key={day.toISOString()} 
                                    className={cn(
                                      "text-center py-1.5 px-0.5 rounded-lg transition-colors relative",
                                      isTodayDate && "bg-primary/8 ring-1 ring-primary/20",
                                      dayBlocked && !isTodayDate && "bg-amber-50/60 dark:bg-amber-500/5"
                                    )}
                                  >
                                    {isTodayDate && (
                                      <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[7px] font-bold uppercase tracking-widest text-primary bg-card px-1 rounded">
                                        Hoje
                                      </span>
                                    )}
                                    <div className={cn(
                                      "text-[9px] uppercase tracking-wider font-semibold",
                                      isTodayDate ? "text-primary" : "text-muted-foreground"
                                    )}>
                                      {format(day, 'EEE', { locale: ptBR })}
                                    </div>
                                    <div className={cn(
                                      "text-xs font-bold w-7 h-7 mx-auto flex items-center justify-center rounded-full mt-0.5",
                                      isTodayDate && "bg-primary text-primary-foreground"
                                    )}>
                                      {format(day, 'dd')}
                                    </div>
                                    {dayBlocked && (
                                      <div className="text-[7px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mt-0.5">
                                        Pausado
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            
                            {/* Time slots grid with "now" indicator */}
                            <div className="rounded-xl border border-border/50 overflow-hidden relative">
                              {/* Now line */}
                              {showNowLine && weekDays.some(d => isToday(d)) && (
                                <div 
                                  className="absolute left-0 right-0 z-20 pointer-events-none"
                                  style={{ 
                                    top: `${(nowLineIndex / timeSlots.length) * 100}%` 
                                  }}
                                >
                                  <div className="flex items-center">
                                    <div className="w-[48px] flex justify-end pr-0.5">
                                      <div className="w-2 h-2 rounded-full bg-primary shadow-sm shadow-primary/30" />
                                    </div>
                                    <div className="flex-1 h-[2px] bg-primary/60" style={{
                                      background: 'linear-gradient(to right, hsl(var(--primary)/0.7), hsl(var(--primary)/0.1))'
                                    }} />
                                  </div>
                                </div>
                              )}

                              {timeSlots.map((time, idx) => (
                                <div 
                                  key={time} 
                                  className={cn(
                                    "grid grid-cols-[48px_repeat(7,1fr)] gap-0",
                                    idx !== timeSlots.length - 1 && "border-b border-border/30"
                                  )}
                                >
                                  <div className={cn(
                                    "sticky left-0 z-10 bg-card text-[10px] text-muted-foreground font-mono font-semibold flex items-center justify-center border-r border-border/30",
                                    compactMode ? "py-0.5" : "py-1"
                                  )}>
                                    {time}
                                  </div>
                                  {weekDays.map((day) => {
                                    const status = getSlotStatus(professional, day, time);
                                    const block = status === 'blocked' ? getSlotBlock(professional, day, time) : null;
                                    const isTodayCol = isToday(day);
                                    
                                    const tooltipLines = [
                                      format(day, "EEEE, dd/MM", { locale: ptBR }),
                                      `${time}h`,
                                      '',
                                      status === 'available' ? '✅ Disponível — Clique para agendar' :
                                      status === 'busy' ? '🔴 Horário ocupado' :
                                      status === 'blocked' ? `🚫 Bloqueado${block?.reason ? `: ${block.reason}` : ''}` :
                                      status === 'past' ? '⏰ Horário passado' : '⬜ Não atende'
                                    ];

                                    return (
                                      <Tooltip key={day.toISOString()}>
                                        <TooltipTrigger asChild>
                                          <button 
                                            onClick={() => handleSlotClick(professional, day, time, status)}
                                            disabled={status !== 'available'}
                                            className={cn(
                                              "flex items-center justify-center transition-all",
                                              compactMode ? "h-5" : "h-7",
                                              getSlotColor(status),
                                              isTodayCol && status !== 'past' && "ring-1 ring-inset ring-primary/10",
                                              status === 'available' && "hover:bg-emerald-100 dark:hover:bg-emerald-500/25 cursor-pointer active:scale-95",
                                              status !== 'available' && "cursor-default"
                                            )}
                                          >
                                            {status === 'busy' && <MinusCircle className={cn("text-rose-500/70", compactMode ? "h-2.5 w-2.5" : "h-3 w-3")} />}
                                            {status === 'blocked' && <Ban className={cn("text-amber-600/70", compactMode ? "h-2.5 w-2.5" : "h-3 w-3")} />}
                                            {status === 'available' && !compactMode && (
                                              <Plus className="h-2.5 w-2.5 text-emerald-500/0 group-hover:text-emerald-500/50 transition-colors" />
                                            )}
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="text-xs p-2.5 max-w-[220px]">
                                          <p className="font-semibold">{tooltipLines[0]}</p>
                                          <p className="text-muted-foreground">{tooltipLines[1]}</p>
                                          <p className="mt-1">{tooltipLines[3]}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          </div>
                        </TooltipProvider>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
        </>
        )}
      </div>

      <NewBookingDialog
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        storeId={storeId}
        defaultDate={selectedBookingData?.date}
        defaultProfessionalId={selectedBookingData?.professionalId}
        defaultTime={selectedBookingData?.time}
        onSuccess={handleBookingSuccess}
      />

      <PauseServicesDialog
        open={pauseDialogOpen}
        onOpenChange={setPauseDialogOpen}
        storeId={storeId}
        professionals={professionals}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['professional-blocks-week'] });
        }}
      />
    </ModuleGate>
  );
};

export default ProfessionalAvailabilityPage;
