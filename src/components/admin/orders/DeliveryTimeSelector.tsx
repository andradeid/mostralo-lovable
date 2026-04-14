import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Clock, CheckCircle, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInMinutes, parseISO, setHours, setMinutes, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DeliveryTimeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (minutes: number) => void;
  isPickup: boolean;
  isLoading?: boolean;
  scheduledFor?: string | null;
}

const TIME_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1h30' },
];

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00',
];

export function DeliveryTimeSelector({
  open,
  onOpenChange,
  onConfirm,
  isPickup,
  isLoading = false,
  scheduledFor,
}: DeliveryTimeSelectorProps) {
  // Standard mode state
  const [selectedTime, setSelectedTime] = useState<number | null>(30);
  const [customTime, setCustomTime] = useState<string>('');

  // Scheduled mode state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');

  const isScheduledMode = !!scheduledFor;

  // Pre-fill date/time from scheduledFor
  useEffect(() => {
    if (open && scheduledFor) {
      try {
        const scheduled = parseISO(scheduledFor);
        setSelectedDate(scheduled);
        const hours = scheduled.getHours().toString().padStart(2, '0');
        const mins = scheduled.getMinutes() < 30 ? '00' : '30';
        setSelectedTimeSlot(`${hours}:${mins}`);
      } catch {
        setSelectedDate(new Date());
        setSelectedTimeSlot('');
      }
    }
  }, [open, scheduledFor]);

  const handleCustomTimeChange = (value: string) => {
    setCustomTime(value);
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      setSelectedTime(numValue);
    }
  };

  const handleSelectPreset = (minutes: number) => {
    setSelectedTime(minutes);
    setCustomTime('');
  };

  const handleConfirm = () => {
    if (isScheduledMode) {
      if (!selectedDate || !selectedTimeSlot) return;
      const [h, m] = selectedTimeSlot.split(':').map(Number);
      const deliveryDate = setMinutes(setHours(selectedDate, h), m);
      const minutes = differenceInMinutes(deliveryDate, new Date());
      onConfirm(Math.max(1, minutes));
    } else {
      if (selectedTime && selectedTime > 0) {
        onConfirm(selectedTime);
      }
    }
  };

  const getScheduledPreview = () => {
    if (!selectedDate || !selectedTimeSlot) return null;
    return `${format(selectedDate, "dd 'de' MMMM (EEEE)", { locale: ptBR })} às ${selectedTimeSlot}`;
  };

  const isConfirmDisabled = isScheduledMode
    ? !selectedDate || !selectedTimeSlot || isLoading
    : !selectedTime || selectedTime <= 0 || isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-full", isScheduledMode ? "bg-orange-100" : "bg-primary/10")}>
              {isScheduledMode ? (
                <CalendarIcon className="h-5 w-5 text-orange-600" />
              ) : (
                <Clock className="h-5 w-5 text-primary" />
              )}
            </div>
            <DialogTitle>
              {isScheduledMode ? 'Data de Entrega da Encomenda' : 'Tempo Estimado'}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isScheduledMode
              ? 'Escolha a data e horário de entrega da encomenda'
              : `Informe o tempo estimado para ${isPickup ? 'retirada' : 'entrega'} do pedido`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isScheduledMode ? (
            <>
              {/* Calendário */}
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ptBR}
                  disabled={(date) =>
                    date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                    date > addDays(new Date(), 30)
                  }
                  className="rounded-md border pointer-events-auto"
                />
              </div>

              {/* Seletor de horário */}
              <div>
                <p className="text-sm font-medium mb-2 text-muted-foreground">Horário de entrega</p>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {TIME_SLOTS.map((slot) => (
                    <Button
                      key={slot}
                      type="button"
                      size="sm"
                      variant={selectedTimeSlot === slot ? 'default' : 'outline'}
                      className={cn(
                        'text-xs h-8 font-medium',
                        selectedTimeSlot === slot && 'ring-2 ring-primary ring-offset-1'
                      )}
                      onClick={() => setSelectedTimeSlot(slot)}
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {selectedDate && selectedTimeSlot && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                  <p className="text-sm text-muted-foreground">Entrega agendada para</p>
                  <p className="text-base font-bold text-orange-700 mt-1">
                    {getScheduledPreview()}
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Opções rápidas */}
              <div className="grid grid-cols-3 gap-2">
                {TIME_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={selectedTime === option.value && !customTime ? 'default' : 'outline'}
                    className={cn(
                      'h-12 text-base font-medium transition-all',
                      selectedTime === option.value && !customTime && 'ring-2 ring-primary ring-offset-2'
                    )}
                    onClick={() => handleSelectPreset(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              {/* Tempo customizado */}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Outro tempo (min)"
                    value={customTime}
                    onChange={(e) => handleCustomTimeChange(e.target.value)}
                    min={1}
                    max={999}
                    className="h-12 text-base"
                  />
                </div>
                <span className="text-sm text-muted-foreground">minutos</span>
              </div>

              {/* Preview do tempo selecionado */}
              {selectedTime && selectedTime > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center">
                  <p className="text-sm text-muted-foreground">Tempo selecionado</p>
                  <p className="text-2xl font-bold text-primary">
                    {selectedTime >= 60
                      ? `${Math.floor(selectedTime / 60)}h${selectedTime % 60 > 0 ? ` ${selectedTime % 60}min` : ''}`
                      : `${selectedTime} minutos`}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Confirmando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Confirmar e Aceitar
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
