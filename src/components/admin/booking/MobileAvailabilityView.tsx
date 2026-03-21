import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  PauseCircle,
  Ban,
  Trash2,
  Loader2,
  Users,
  Plus,
} from 'lucide-react';
import { format, addDays, subDays, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Professional } from '@/hooks/useBooking';

// Types matching the parent page
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
  customer_name?: string;
}

interface MobileAvailabilityViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  professionals: Professional[];
  filteredProfessionals: Professional[];
  selectedProfessionalId: string;
  onProfessionalChange: (id: string) => void;
  stats: {
    totalSlots: number;
    availableSlots: number;
    busySlots: number;
    blockedSlots: number;
  };
  occupancyRate: number;
  isLoading: boolean;
  timeSlots: string[];
  getSlotStatus: (professional: Professional, day: Date, time: string) => 'available' | 'busy' | 'blocked' | 'off' | 'past';
  blocks: ProfessionalBlock[];
  bookings: BookingSlot[];
  blocksByProfessional: Map<string, ProfessionalBlock[]>;
  onSlotClick: (professional: Professional, day: Date, time: string, status: string) => void;
  onRemoveBlock: (blockId: string) => void;
  onRemoveAllBlocks: (professionalId: string) => void;
  removingBlockId: string | null;
  formatBlockDescription: (block: ProfessionalBlock) => string;
}

export function MobileAvailabilityView({
  selectedDate,
  onDateChange,
  professionals,
  filteredProfessionals,
  selectedProfessionalId,
  onProfessionalChange,
  stats,
  occupancyRate,
  isLoading,
  timeSlots,
  getSlotStatus,
  blocks,
  bookings,
  blocksByProfessional,
  onSlotClick,
  onRemoveBlock,
  onRemoveAllBlocks,
  removingBlockId,
  formatBlockDescription,
}: MobileAvailabilityViewProps) {
  // Track which professionals are expanded to show time slots
  const [expandedProfessionals, setExpandedProfessionals] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedProfessionals(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Navigate single day
  const goToPrevDay = () => onDateChange(subDays(selectedDate, 1));
  const goToNextDay = () => onDateChange(addDays(selectedDate, 1));
  const goToToday = () => onDateChange(new Date());

  // Per-professional stats for the selected day only
  const getProfDayStats = (professional: Professional) => {
    let available = 0, busy = 0, blocked = 0, total = 0;
    timeSlots.forEach(time => {
      const status = getSlotStatus(professional, selectedDate, time);
      if (status !== 'off' && status !== 'past') total++;
      if (status === 'available') available++;
      if (status === 'busy') busy++;
      if (status === 'blocked') blocked++;
    });
    const occupancy = total > 0 ? Math.round((busy / total) * 100) : 0;
    return { available, busy, blocked, occupancy };
  };

  // Find booking info for a slot
  const getBookingForSlot = (professionalId: string, time: string) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return bookings.find(b =>
      b.professional_id === professionalId &&
      b.booking_date === dateStr &&
      time >= b.start_time.slice(0, 5) &&
      time < b.end_time.slice(0, 5)
    );
  };

  // Status label and colors
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'available':
        return { label: 'Disponível', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-400' };
      case 'busy':
        return { label: 'Ocupado', bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', dot: 'bg-rose-400' };
      case 'blocked':
        return { label: 'Bloqueado', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-400' };
      default:
        return { label: 'Indisponível', bg: 'bg-muted/30', text: 'text-muted-foreground', dot: 'bg-muted-foreground/30' };
    }
  };

  return (
    <div className="space-y-3 pb-20">
      {/* Date Selector */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={goToPrevDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 text-center">
              <button onClick={goToToday} className="text-[10px] text-primary font-bold uppercase tracking-wider">
                {isToday(selectedDate) ? 'Hoje' : 'Ir para hoje'}
              </button>
              <p className="text-sm font-bold text-foreground capitalize">
                {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={goToNextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs - 2x2 grid */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Disponível', value: stats.availableSlots, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'Ocupado', value: stats.busySlots, icon: XCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10' },
          { label: 'Bloqueado', value: stats.blockedSlots, icon: AlertCircle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
          { label: 'Ocupação', value: `${occupancyRate}%`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10', showProgress: true },
        ].map(item => (
          <Card key={item.label} className="border-border/50 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", item.bg)}>
                  <item.icon className={cn("h-4 w-4", item.color)} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{item.label}</p>
                  <p className={cn("text-lg font-bold leading-tight", item.color)}>{item.value}</p>
                </div>
              </div>
              {item.showProgress && (
                <Progress value={occupancyRate} className="h-1 mt-2" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Professional Filter (compact) */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <Button
          variant={selectedProfessionalId === 'all' ? 'default' : 'outline'}
          size="sm"
          className="shrink-0 h-8 text-xs rounded-full"
          onClick={() => onProfessionalChange('all')}
        >
          Todos
        </Button>
        {professionals.filter(p => p.is_active).map(prof => (
          <Button
            key={prof.id}
            variant={selectedProfessionalId === prof.id ? 'default' : 'outline'}
            size="sm"
            className="shrink-0 h-8 text-xs rounded-full"
            onClick={() => onProfessionalChange(prof.id)}
          >
            {prof.name.split(' ')[0]}
          </Button>
        ))}
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filteredProfessionals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm font-medium">Nenhum profissional ativo</p>
        </div>
      ) : (
        /* Professional Cards */
        <div className="space-y-2">
          {filteredProfessionals.map(professional => {
            const dayStats = getProfDayStats(professional);
            const isExpanded = expandedProfessionals.has(professional.id);
            const profBlocks = blocksByProfessional.get(professional.id) || [];
            const dayBlocks = profBlocks.filter(b => b.block_date === format(selectedDate, 'yyyy-MM-dd'));

            return (
              <Card key={professional.id} className="border-border/50 shadow-sm overflow-hidden">
                {/* Professional Header - clickable to expand */}
                <button
                  onClick={() => toggleExpand(professional.id)}
                  className="w-full text-left"
                >
                  <CardContent className="p-3.5">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <Avatar className="h-10 w-10 border border-border/50 shrink-0">
                        <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">
                          {professional.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground truncate">
                            {professional.name}
                          </span>
                          {dayBlocks.length > 0 && (
                            <Badge variant="outline" className="text-[9px] h-4 px-1 border-amber-300 text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-500/10 shrink-0">
                              <Ban className="h-2 w-2 mr-0.5" />
                              Pausado
                            </Badge>
                          )}
                        </div>
                        {professional.specialty && (
                          <p className="text-[11px] text-muted-foreground truncate">{professional.specialty}</p>
                        )}
                        {/* Mini stats */}
                        <div className="flex items-center gap-2.5 mt-1">
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{dayStats.available} livres</span>
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">{dayStats.busy} ocupados</span>
                          <span className="text-[10px] text-muted-foreground">{dayStats.occupancy}%</span>
                        </div>
                      </div>

                      {/* Expand chevron */}
                      <ChevronDown className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform shrink-0",
                        isExpanded && "rotate-180"
                      )} />
                    </div>
                  </CardContent>
                </button>

                {/* Expanded: Time Slots List */}
                {isExpanded && (
                  <div className="border-t border-border/40">
                    {/* Day block alerts */}
                    {dayBlocks.length > 0 && (
                      <div className="px-3.5 pt-2.5">
                        <Alert className="border-amber-200/80 dark:border-amber-500/25 bg-amber-50/40 dark:bg-amber-500/5 py-2">
                          <PauseCircle className="h-3.5 w-3.5 text-amber-600" />
                          <AlertDescription>
                            <div className="space-y-1">
                              {dayBlocks.map(block => (
                                <div key={block.id} className="flex items-center justify-between gap-2 text-xs">
                                  <span className="text-foreground truncate">
                                    {block.is_all_day ? 'Dia inteiro' : `${block.start_time?.slice(0, 5)} — ${block.end_time?.slice(0, 5)}`}
                                    {block.reason && <span className="text-muted-foreground ml-1">({block.reason})</span>}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-1.5 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-500/10 shrink-0"
                                    onClick={(e) => { e.stopPropagation(); onRemoveBlock(block.id); }}
                                    disabled={removingBlockId === block.id}
                                  >
                                    {removingBlockId === block.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}

                    {/* Time slots vertical list */}
                    <div className="px-3.5 py-2.5 space-y-1.5">
                      {timeSlots.map(time => {
                        const status = getSlotStatus(professional, selectedDate, time);

                        // Skip "off" and "past" slots to keep the list clean
                        if (status === 'off' || status === 'past') return null;

                        const booking = getBookingForSlot(professional.id, time);
                        const info = getStatusInfo(status);

                        return (
                          <button
                            key={time}
                            onClick={() => onSlotClick(professional, selectedDate, time, status)}
                            disabled={status !== 'available'}
                            className={cn(
                              "w-full rounded-lg p-2.5 flex items-center gap-3 transition-all",
                              "border border-transparent",
                              info.bg,
                              status === 'available' && "active:scale-[0.98] border-emerald-200/50 dark:border-emerald-500/20"
                            )}
                          >
                            {/* Time */}
                            <div className="text-sm font-bold text-foreground font-mono w-12 shrink-0">
                              {time}
                            </div>

                            {/* Status dot + info */}
                            <div className="flex-1 min-w-0 text-left">
                              {status === 'busy' && booking ? (
                                <>
                                  <p className="text-xs font-semibold text-foreground truncate">
                                    {booking.customer_name || 'Cliente'}
                                  </p>
                                  <p className={cn("text-[10px] font-medium", info.text)}>
                                    {info.label}
                                  </p>
                                </>
                              ) : (
                                <p className={cn("text-xs font-medium", info.text)}>
                                  {info.label}
                                </p>
                              )}
                            </div>

                            {/* Action hint for available slots */}
                            {status === 'available' && (
                              <Plus className="h-4 w-4 text-emerald-500/60 shrink-0" />
                            )}

                            {/* Status dot */}
                            <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", info.dot)} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
