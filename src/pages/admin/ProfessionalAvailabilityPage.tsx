import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { 
  Calendar,
  ChevronLeft,
  ChevronRight,
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
  TrendingUp
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
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('all');
  const [removingBlockId, setRemovingBlockId] = useState<string | null>(null);
  const [compactMode, setCompactMode] = useState(false);
  
  // States for booking modal
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [selectedBookingData, setSelectedBookingData] = useState<{
    date: Date;
    time: string;
    professionalId: string;
  } | null>(null);

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
        .select('professional_id, booking_date, start_time, end_time, status')
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
    const step = compactMode ? 1 : 1;
    for (let hour = 7; hour <= 21; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }, [compactMode]);

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
      case 'available': return 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30';
      case 'busy': return 'bg-rose-50 dark:bg-rose-500/15 border-rose-200 dark:border-rose-500/30';
      case 'blocked': return 'bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/30';
      case 'off': return 'bg-muted/40 border-border/50';
      case 'past': return 'bg-muted/20 border-border/30 opacity-40';
    }
  };

  const getSlotIcon = (status: string) => {
    switch (status) {
      case 'busy': return <MinusCircle className="h-3 w-3 text-rose-500" />;
      case 'blocked': return <Ban className="h-3 w-3 text-amber-600" />;
      default: return null;
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
    setSelectedBookingData({
      date: day,
      time: time,
      professionalId: professional.id
    });
    setBookingDialogOpen(true);
  };

  const handleRemoveBlock = async (blockId: string) => {
    setRemovingBlockId(blockId);
    try {
      const { error } = await supabase
        .from('professional_blocks')
        .delete()
        .eq('id', blockId);
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
      const { error } = await supabase
        .from('professional_blocks')
        .delete()
        .in('id', profBlocks.map(b => b.id));
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

  const stats = useMemo(() => {
    let totalSlots = 0;
    let availableSlots = 0;
    let busySlots = 0;
    let blockedSlots = 0;

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
    if (block.is_all_day) {
      return `${date} — Dia inteiro`;
    }
    return `${date} — ${block.start_time?.slice(0, 5)} às ${block.end_time?.slice(0, 5)}`;
  };

  const occupancyRate = stats.totalSlots > 0 ? Math.round((stats.busySlots / stats.totalSlots) * 100) : 0;

  return (
    <ModuleGate moduleKey="booking" storeId={storeId}>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Disponibilidade</h1>
                <p className="text-sm text-muted-foreground">
                  Horários vagos e ocupados dos profissionais
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard/booking">
                <Calendar className="h-4 w-4 mr-1.5" />
                Agenda
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard/booking/professionals">
                <Users className="h-4 w-4 mr-1.5" />
                Profissionais
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPauseDialogOpen(true)}
              className="border-amber-300 dark:border-amber-500/50 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10"
            >
              <PauseCircle className="h-4 w-4 mr-1.5" />
              Pausar Serviços
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Disponível</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 leading-tight">{stats.availableSlots}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0">
                  <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Ocupado</p>
                  <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 leading-tight">{stats.busySlots}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Bloqueado</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 leading-tight">{stats.blockedSlots}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Ocupação</p>
                  <p className="text-2xl font-bold text-foreground leading-tight">{occupancyRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls Bar */}
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Week Navigation */}
              <div className="flex items-center gap-2 flex-1">
                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => navigateWeek('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1 text-center">
                  <button 
                    onClick={goToThisWeek} 
                    className="text-xs text-primary font-medium hover:underline transition-colors"
                  >
                    Hoje
                  </button>
                  <div className="text-sm font-semibold text-foreground">
                    {format(weekStart, "dd MMM", { locale: ptBR })} — {format(weekEnd, "dd MMM yyyy", { locale: ptBR })}
                  </div>
                </div>
                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => navigateWeek('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Right controls */}
              <div className="flex items-center gap-3">
                {/* Compact mode toggle */}
                <div className="flex items-center gap-2">
                  <label htmlFor="compact-mode" className="text-xs text-muted-foreground whitespace-nowrap cursor-pointer">
                    {compactMode ? <Minimize2 className="h-3.5 w-3.5 inline mr-1" /> : <Maximize2 className="h-3.5 w-3.5 inline mr-1" />}
                    Compacto
                  </label>
                  <Switch 
                    id="compact-mode"
                    checked={compactMode} 
                    onCheckedChange={setCompactMode}
                    className="scale-90"
                  />
                </div>

                {/* Professional Filter */}
                <Select value={selectedProfessionalId} onValueChange={setSelectedProfessionalId}>
                  <SelectTrigger className="w-full sm:w-[200px]">
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1">
          <span className="text-xs font-medium text-muted-foreground mr-1">Legenda:</span>
          {[
            { color: 'bg-emerald-400 dark:bg-emerald-500', label: 'Disponível' },
            { color: 'bg-rose-400 dark:bg-rose-500', label: 'Ocupado' },
            { color: 'bg-amber-400 dark:bg-amber-500', label: 'Bloqueado' },
            { color: 'bg-muted-foreground/30', label: 'Não atende' },
            { color: 'bg-muted-foreground/15', label: 'Passado' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={cn("h-3 w-3 rounded-sm", item.color)} />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Availability Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Carregando disponibilidade...</p>
            </div>
          </div>
        ) : filteredProfessionals.length === 0 ? (
          <Card className="border-border/60">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-center font-medium">
                Nenhum profissional ativo encontrado
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Cadastre profissionais para visualizar a disponibilidade
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            {filteredProfessionals.map(professional => {
              const profBlocks = blocksByProfessional.get(professional.id) || [];
              
              return (
                <Card key={professional.id} className="border-border/60 shadow-sm overflow-hidden">
                  {/* Professional Header */}
                  <CardHeader className="pb-3 bg-muted/20">
                    <CardTitle className="text-base flex flex-wrap items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {professional.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-foreground">{professional.name}</span>
                        {professional.specialty && (
                          <span className="block text-xs text-muted-foreground font-normal">{professional.specialty}</span>
                        )}
                      </div>
                      {profBlocks.length > 0 && (
                        <Badge variant="outline" className="text-xs font-medium border-amber-300 dark:border-amber-500/50 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10">
                          <Ban className="h-3 w-3 mr-1" />
                          {profBlocks.length} bloqueio{profBlocks.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4 pt-3 space-y-3">
                    {/* Block Alerts */}
                    {profBlocks.length > 0 && (
                      <Alert className="border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/5">
                        <PauseCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                        <AlertDescription>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                              Serviços pausados nesta semana:
                            </p>
                            {profBlocks.map(block => (
                              <div key={block.id} className="flex items-center justify-between gap-2 text-sm bg-amber-100/60 dark:bg-amber-500/10 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Ban className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500 shrink-0" />
                                  <span className="truncate text-foreground">
                                    {formatBlockDescription(block)}
                                    {block.reason && (
                                      <span className="text-muted-foreground ml-1">
                                        — {block.reason}
                                      </span>
                                    )}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-500/10 shrink-0"
                                  onClick={() => handleRemoveBlock(block.id)}
                                  disabled={removingBlockId === block.id}
                                >
                                  {removingBlockId === block.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <>
                                      <Trash2 className="h-3 w-3 mr-1" />
                                      Remover
                                    </>
                                  )}
                                </Button>
                              </div>
                            ))}
                            {profBlocks.length > 1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs border-rose-200 dark:border-rose-500/30 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 w-full mt-1"
                                onClick={() => handleRemoveAllBlocks(professional.id)}
                                disabled={removingBlockId === professional.id}
                              >
                                {removingBlockId === professional.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                  <Trash2 className="h-3 w-3 mr-1" />
                                )}
                                Remover todos os bloqueios
                              </Button>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Schedule Grid */}
                    <div className="overflow-x-auto -mx-3 sm:-mx-6 px-3 sm:px-6">
                      <TooltipProvider delayDuration={150}>
                        <div className="min-w-[640px]">
                          {/* Days header */}
                          <div className="grid grid-cols-8 gap-0.5 mb-1">
                            <div className="sticky left-0 z-10 bg-card text-xs text-muted-foreground font-medium p-2 flex items-end">
                              <Clock className="h-3.5 w-3.5" />
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
                                    "text-center py-2 px-1 rounded-lg transition-colors",
                                    isTodayDate && "bg-primary/10",
                                    dayBlocked && !isTodayDate && "bg-amber-50 dark:bg-amber-500/10"
                                  )}
                                >
                                  <div className={cn(
                                    "text-[10px] uppercase tracking-wider font-medium",
                                    isTodayDate ? "text-primary" : "text-muted-foreground"
                                  )}>
                                    {format(day, 'EEE', { locale: ptBR })}
                                  </div>
                                  <div className={cn(
                                    "text-sm font-bold w-8 h-8 mx-auto flex items-center justify-center rounded-full mt-0.5",
                                    isTodayDate && "bg-primary text-primary-foreground"
                                  )}>
                                    {format(day, 'dd')}
                                  </div>
                                  {dayBlocked && (
                                    <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 mt-1 border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10">
                                      PAUSADO
                                    </Badge>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Time slots grid */}
                          <div className="rounded-xl border border-border/60 overflow-hidden">
                            {timeSlots.map((time, idx) => (
                              <div 
                                key={time} 
                                className={cn(
                                  "grid grid-cols-8 gap-0",
                                  idx !== timeSlots.length - 1 && "border-b border-border/40"
                                )}
                              >
                                <div className={cn(
                                  "sticky left-0 z-10 bg-card text-xs text-muted-foreground font-mono font-medium flex items-center justify-center border-r border-border/40",
                                  compactMode ? "py-1" : "py-1.5"
                                )}>
                                  {time}
                                </div>
                                {weekDays.map((day, dayIdx) => {
                                  const status = getSlotStatus(professional, day, time);
                                  const block = status === 'blocked' ? getSlotBlock(professional, day, time) : null;
                                  const tooltipText = status === 'blocked' && block?.reason
                                    ? `🚫 Bloqueado: ${block.reason}`
                                    : status === 'available' ? '✅ Disponível — Clique para agendar'
                                    : status === 'busy' ? '🔴 Ocupado'
                                    : status === 'blocked' ? '🚫 Bloqueado'
                                    : status === 'past' ? '⏰ Horário passado' : '⬜ Não atende';

                                  return (
                                    <Tooltip key={day.toISOString()}>
                                      <TooltipTrigger asChild>
                                        <button 
                                          onClick={() => handleSlotClick(professional, day, time, status)}
                                          disabled={status !== 'available'}
                                          className={cn(
                                            "flex items-center justify-center transition-all border-r border-border/20 last:border-r-0",
                                            compactMode ? "h-6" : "h-8",
                                            getSlotColor(status),
                                            status === 'available' && "hover:bg-emerald-100 dark:hover:bg-emerald-500/25 cursor-pointer hover:scale-[1.02]",
                                            status !== 'available' && "cursor-default"
                                          )}
                                        >
                                          {getSlotIcon(status)}
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="text-xs max-w-[200px]">
                                        <p className="font-medium">{format(day, "EEEE, dd/MM", { locale: ptBR })}</p>
                                        <p>{time} — {tooltipText}</p>
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
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Dialog */}
      <NewBookingDialog
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        storeId={storeId}
        defaultDate={selectedBookingData?.date}
        defaultProfessionalId={selectedBookingData?.professionalId}
        defaultTime={selectedBookingData?.time}
        onSuccess={handleBookingSuccess}
      />

      {/* Pause Services Dialog */}
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
