import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  Ban
} from 'lucide-react';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useBooking, Professional } from '@/hooks/useBooking';
import { ModuleGate } from '@/components/admin/ModuleGate';
import { usePageSEO } from '@/hooks/useSEO';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
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

  // Fetch schedules for all professionals
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

  // Fetch blocks for the week (incluindo id e reason)
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

  // Fetch bookings for the week
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

  // Agrupar bloqueios por profissional para exibir alertas
  const blocksByProfessional = useMemo(() => {
    const map = new Map<string, ProfessionalBlock[]>();
    blocks.forEach(block => {
      const existing = map.get(block.professional_id) || [];
      // Evitar duplicatas
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
      case 'available': return 'bg-green-500/20 border-green-500/40';
      case 'busy': return 'bg-red-500/20 border-red-500/40';
      case 'blocked': return 'bg-orange-500/20 border-orange-500/40';
      case 'off': return 'bg-muted/50 border-muted';
      case 'past': return 'bg-muted/30 border-muted/40 opacity-50';
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

  const goToThisWeek = () => {
    setSelectedDate(new Date());
  };

  const isLoading = loadingProfessionals || loadingSchedules || loadingBlocks || loadingBookings;

  // Handle slot click to open booking modal
  const handleSlotClick = (professional: Professional, day: Date, time: string, status: string) => {
    if (status !== 'available') return;
    
    setSelectedBookingData({
      date: day,
      time: time,
      professionalId: professional.id
    });
    setBookingDialogOpen(true);
  };

  // Remover bloqueio
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

  // Remover todos os bloqueios de um profissional nesta semana
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

  // Handle booking success
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

  // Formatar descrição do bloqueio
  const formatBlockDescription = (block: ProfessionalBlock): string => {
    const date = format(new Date(block.block_date + 'T12:00:00'), 'dd/MM (EEE)', { locale: ptBR });
    if (block.is_all_day) {
      return `${date} — Dia inteiro`;
    }
    return `${date} — ${block.start_time?.slice(0, 5)} às ${block.end_time?.slice(0, 5)}`;
  };

  return (
    <ModuleGate moduleKey="booking" storeId={storeId}>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Disponibilidade</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Visualize os horários vagos e ocupados dos profissionais
          </p>
          
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard/booking">
                <Calendar className="h-4 w-4 mr-2" />
                Ver Agenda
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard/booking/professionals">
                <Users className="h-4 w-4 mr-2" />
                Profissionais
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPauseDialogOpen(true)}
              className="ml-auto border-orange-500/50 text-orange-600 hover:bg-orange-500/10 hover:text-orange-700"
            >
              <PauseCircle className="h-4 w-4 mr-2" />
              Pausar Serviços
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <Card className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Disponível</p>
                <p className="text-lg font-bold text-green-600">{stats.availableSlots}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-xs text-muted-foreground">Ocupado</p>
                <p className="text-lg font-bold text-red-600">{stats.busySlots}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">Bloqueado</p>
                <p className="text-lg font-bold text-orange-600">{stats.blockedSlots}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Taxa Ocupação</p>
                <p className="text-lg font-bold">
                  {stats.totalSlots > 0 ? Math.round((stats.busySlots / stats.totalSlots) * 100) : 0}%
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Week Navigation */}
              <div className="flex items-center gap-2 flex-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateWeek('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1 text-center">
                  <Button variant="ghost" size="sm" onClick={goToThisWeek} className="text-xs text-muted-foreground">
                    Esta semana
                  </Button>
                  <div className="text-sm font-semibold">
                    {format(weekStart, 'dd/MM')} - {format(weekEnd, 'dd/MM/yyyy')}
                  </div>
                </div>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateWeek('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
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
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-green-500/30 border border-green-500/50" />
            <span>Disponível</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-red-500/30 border border-red-500/50" />
            <span>Ocupado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-orange-500/30 border border-orange-500/50" />
            <span>Bloqueado/Pausado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-muted/50 border border-muted" />
            <span>Não atende</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-muted/30 border border-muted/40 opacity-50" />
            <span>Passado</span>
          </div>
        </div>

        {/* Availability Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredProfessionals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Nenhum profissional ativo encontrado
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredProfessionals.map(professional => {
              const profBlocks = blocksByProfessional.get(professional.id) || [];
              
              return (
                <Card key={professional.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
                        {professional.name.charAt(0)}
                      </div>
                      {professional.name}
                      {professional.specialty && (
                        <Badge variant="secondary" className="text-xs font-normal">
                          {professional.specialty}
                        </Badge>
                      )}
                      {profBlocks.length > 0 && (
                        <Badge variant="outline" className="text-xs font-normal border-orange-500/50 text-orange-600">
                          <Ban className="h-3 w-3 mr-1" />
                          {profBlocks.length} bloqueio{profBlocks.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4 space-y-3">
                    {/* Alerta de bloqueios ativos */}
                    {profBlocks.length > 0 && (
                      <Alert className="border-orange-500/30 bg-orange-500/5">
                        <PauseCircle className="h-4 w-4 text-orange-500" />
                        <AlertDescription>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
                              Serviços pausados nesta semana:
                            </p>
                            {profBlocks.map(block => (
                              <div key={block.id} className="flex items-center justify-between gap-2 text-sm bg-orange-500/10 rounded-md px-3 py-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Ban className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                                  <span className="truncate">
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
                                  className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-500/10 shrink-0"
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
                                className="text-xs border-red-500/30 text-red-600 hover:bg-red-500/10 w-full mt-1"
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

                    <div className="overflow-x-auto">
                      <TooltipProvider delayDuration={200}>
                        <div className="min-w-[600px]">
                          {/* Days header */}
                          <div className="grid grid-cols-8 gap-1 mb-1">
                            <div className="text-xs text-muted-foreground p-1">Hora</div>
                            {weekDays.map(day => {
                              const dateStr = format(day, 'yyyy-MM-dd');
                              const dayBlocked = blocks.some(b => 
                                b.professional_id === professional.id && 
                                b.block_date === dateStr && 
                                b.is_all_day
                              );
                              return (
                                <div 
                                  key={day.toISOString()} 
                                  className={cn(
                                    "text-xs text-center p-1 rounded",
                                    isSameDay(day, new Date()) && "bg-primary/10 font-semibold text-primary",
                                    dayBlocked && "bg-orange-500/15 border border-orange-500/30"
                                  )}
                                >
                                  <div>{format(day, 'EEE', { locale: ptBR })}</div>
                                  <div className="font-medium">{format(day, 'dd')}</div>
                                  {dayBlocked && (
                                    <div className="text-[9px] text-orange-600 font-medium mt-0.5">
                                      PAUSADO
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Time slots grid */}
                          {timeSlots.map(time => (
                            <div key={time} className="grid grid-cols-8 gap-1 mb-0.5">
                              <div className="text-xs text-muted-foreground p-1 flex items-center">
                                {time}
                              </div>
                              {weekDays.map(day => {
                                const status = getSlotStatus(professional, day, time);
                                const block = status === 'blocked' ? getSlotBlock(professional, day, time) : null;
                                const tooltipText = status === 'blocked' && block?.reason
                                  ? `Bloqueado: ${block.reason}`
                                  : status === 'available' ? 'Clique para agendar'
                                  : status === 'busy' ? 'Ocupado'
                                  : status === 'blocked' ? 'Bloqueado'
                                  : status === 'past' ? 'Horário passado' : 'Não atende';

                                return (
                                  <Tooltip key={day.toISOString()}>
                                    <TooltipTrigger asChild>
                                      <button 
                                        onClick={() => handleSlotClick(professional, day, time, status)}
                                        disabled={status !== 'available'}
                                        className={cn(
                                          "h-6 rounded border text-[10px] flex items-center justify-center transition-all",
                                          getSlotColor(status),
                                          status === 'available' && "hover:bg-green-500/40 hover:scale-105 cursor-pointer",
                                          status !== 'available' && "cursor-default"
                                        )}
                                      >
                                        {status === 'busy' && <MinusCircle className="h-3 w-3 text-red-500" />}
                                        {status === 'blocked' && <Ban className="h-3 w-3 text-orange-500" />}
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">
                                      <p>{format(day, 'dd/MM')} {time} — {tooltipText}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                );
                              })}
                            </div>
                          ))}
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
