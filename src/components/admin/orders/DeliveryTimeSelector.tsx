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
import { Clock, CheckCircle, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RescheduleOrderDialog } from '../scheduled-orders/RescheduleOrderDialog';
import { scheduledLabel } from '@/lib/scheduledOrders';

interface DeliveryTimeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (minutes?: number, scheduledAt?: string) => void;
  orderId?: string;
  storeId?: string;
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

export function DeliveryTimeSelector({
  open,
  onOpenChange,
  onConfirm,
  isPickup,
  isLoading = false,
  scheduledFor, orderId, storeId,
}: DeliveryTimeSelectorProps) {
  // Standard mode state
  const [selectedTime, setSelectedTime] = useState<number | null>(30);
  const [customTime, setCustomTime] = useState<string>('');

  const [changing, setChanging] = useState(false);
  const [currentScheduledAt, setCurrentScheduledAt] = useState(scheduledFor);
  const isScheduledMode = !!scheduledFor;
  useEffect(() => { if (open) setCurrentScheduledAt(scheduledFor); }, [open, scheduledFor]);

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
      onConfirm(undefined, currentScheduledAt || scheduledFor || undefined);
    } else {
      if (selectedTime && selectedTime > 0) {
        onConfirm(selectedTime);
      }
    }
  };

  const isConfirmDisabled = isLoading || (!isScheduledMode && (!selectedTime || selectedTime <= 0));

  return (
    <>
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
              {isScheduledMode ? 'Confirmar encomenda' : 'Tempo Estimado'}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isScheduledMode
              ? 'Data e horário escolhidos pelo cliente'
              : `Informe o tempo estimado para ${isPickup ? 'retirada' : 'entrega'} do pedido`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isScheduledMode ? (
            <div className="space-y-3 text-center">
              <p className="font-semibold text-info">{currentScheduledAt && scheduledLabel(currentScheduledAt)}</p>
              {orderId && storeId && <Button variant="outline" onClick={() => setChanging(true)} disabled={isLoading}>Mudar data/horário</Button>}
            </div>
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
                {isScheduledMode ? 'Confirmar encomenda' : 'Confirmar e Aceitar'}
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    {orderId && storeId && <RescheduleOrderDialog open={changing} onOpenChange={setChanging} order={{ id: orderId, store_id: storeId, delivery_type: isPickup ? 'pickup' : 'delivery' }} notify={false} onSuccess={setCurrentScheduledAt} />}
    </>
  );
}
