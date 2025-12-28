import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Clock, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ProfessionalScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professionalId: string;
  professionalName: string;
  onSuccess?: () => void;
}

interface Schedule {
  id?: string;
  professional_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
  is_active: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Segunda', short: 'Seg' },
  { value: 2, label: 'Terça', short: 'Ter' },
  { value: 3, label: 'Quarta', short: 'Qua' },
  { value: 4, label: 'Quinta', short: 'Qui' },
  { value: 5, label: 'Sexta', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
];

const DEFAULT_SCHEDULE: Omit<Schedule, 'professional_id' | 'day_of_week'> = {
  start_time: '09:00',
  end_time: '18:00',
  break_start: '12:00',
  break_end: '13:00',
  is_active: false
};

export function ProfessionalScheduleDialog({
  open,
  onOpenChange,
  professionalId,
  professionalName,
  onSuccess
}: ProfessionalScheduleDialogProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch existing schedules
  useEffect(() => {
    const fetchSchedules = async () => {
      if (!open || !professionalId) return;
      
      setLoading(true);
      try {
        // Use raw fetch to bypass type limitations for new tables
        const { data, error } = await (supabase as any)
          .from('professional_schedules')
          .select('*')
          .eq('professional_id', professionalId);

        if (error) throw error;

        // Initialize all days with defaults
        const existingSchedules = (data || []) as Schedule[];
        const allSchedules = DAYS_OF_WEEK.map(day => {
          const existing = existingSchedules.find(s => s.day_of_week === day.value);
          if (existing) {
            return existing;
          }
          return {
            professional_id: professionalId,
            day_of_week: day.value,
            ...DEFAULT_SCHEDULE
          };
        });

        setSchedules(allSchedules);
      } catch (error) {
        console.error('Error fetching schedules:', error);
        toast.error('Erro ao carregar horários');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [open, professionalId]);

  const updateSchedule = (dayOfWeek: number, field: keyof Schedule, value: string | boolean) => {
    setSchedules(prev => prev.map(s => 
      s.day_of_week === dayOfWeek ? { ...s, [field]: value } : s
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Upsert all schedules
      for (const schedule of schedules) {
        const { id, ...scheduleData } = schedule;
        
        if (id) {
          // Update existing
          const { error } = await (supabase as any)
            .from('professional_schedules')
            .update(scheduleData)
            .eq('id', id);
          if (error) throw error;
        } else if (schedule.is_active) {
          // Only insert if active
          const { error } = await (supabase as any)
            .from('professional_schedules')
            .insert(scheduleData);
          if (error) throw error;
        }
      }

      toast.success('Horários salvos com sucesso!');
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving schedules:', error);
      toast.error('Erro ao salvar horários');
    } finally {
      setSaving(false);
    }
  };

  const copyToAllDays = (sourceDay: number) => {
    const source = schedules.find(s => s.day_of_week === sourceDay);
    if (!source) return;

    setSchedules(prev => prev.map(s => ({
      ...s,
      start_time: source.start_time,
      end_time: source.end_time,
      break_start: source.break_start,
      break_end: source.break_end,
      is_active: s.day_of_week === 0 || s.day_of_week === 6 ? s.is_active : source.is_active
    })));
    
    toast.success('Horários copiados para os dias da semana');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horários de {professionalName}
          </DialogTitle>
          <DialogDescription>
            Configure os dias e horários de trabalho deste profissional
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule, index) => {
              const day = DAYS_OF_WEEK.find(d => d.value === schedule.day_of_week);
              return (
                <div 
                  key={schedule.day_of_week} 
                  className={cn(
                    "border rounded-lg p-4 transition-opacity",
                    !schedule.is_active && "opacity-50 bg-muted/50"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={schedule.is_active}
                        onCheckedChange={(checked) => updateSchedule(schedule.day_of_week, 'is_active', checked)}
                      />
                      <span className="font-medium">{day?.label}</span>
                    </div>
                    {index === 1 && schedule.is_active && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToAllDays(schedule.day_of_week)}
                      >
                        Copiar para todos
                      </Button>
                    )}
                  </div>

                  {schedule.is_active && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs">Início</Label>
                        <Input
                          type="time"
                          value={schedule.start_time}
                          onChange={(e) => updateSchedule(schedule.day_of_week, 'start_time', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Fim</Label>
                        <Input
                          type="time"
                          value={schedule.end_time}
                          onChange={(e) => updateSchedule(schedule.day_of_week, 'end_time', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Intervalo início</Label>
                        <Input
                          type="time"
                          value={schedule.break_start || ''}
                          onChange={(e) => updateSchedule(schedule.day_of_week, 'break_start', e.target.value || null)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Intervalo fim</Label>
                        <Input
                          type="time"
                          value={schedule.break_end || ''}
                          onChange={(e) => updateSchedule(schedule.day_of_week, 'break_end', e.target.value || null)}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            Salvar Horários
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
