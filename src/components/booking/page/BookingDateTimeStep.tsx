// Passo 3: calendário e horários livres do dia (com aviso de horário especial e motivo quando não há horário).
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { AlertCircle, Clock, Loader2, Sparkles } from 'lucide-react';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getSpecialDayFor } from '@/lib/specialDays';
import type { Professional, Step } from '@/lib/bookingPage/types';

interface Props {
  businessHours: any;
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  selectedTime: string | null;
  setSelectedTime: (time: string | null) => void;
  maxDate: Date | undefined;
  workingWeekdays: Set<number> | null | undefined;
  loadingSlots: boolean;
  availableSlots: string[];
  getNoSlotsMessage: () => string;
  anyProfessional: boolean;
  setAssignedProfessional: (professional: Professional | null) => void;
  pickProfessionalForTime: (time: string) => Professional | null;
  setCurrentStep: (step: Step) => void;
}

export function BookingDateTimeStep({
  businessHours,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  maxDate,
  workingWeekdays,
  loadingSlots,
  availableSlots,
  getNoSlotsMessage,
  anyProfessional,
  setAssignedProfessional,
  pickProfessionalForTime,
  setCurrentStep,
}: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">Escolha a data e horário</h2>
        <p className="text-sm text-muted-foreground mt-1">Quando fica melhor para você?</p>
      </div>

      <Card className="overflow-hidden rounded-2xl">
        <CardContent className="p-3 sm:p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              setSelectedDate(date);
              setSelectedTime(null);
            }}
            disabled={(date) =>
              isBefore(date, startOfDay(new Date())) ||
              (maxDate ? isAfter(date, maxDate) : false) ||
              (!!workingWeekdays && workingWeekdays.size > 0 && !workingWeekdays.has(date.getDay())) ||
              !!getSpecialDayFor(businessHours, date)?.closed
            }
            locale={ptBR}
            className="rounded-xl border-0 pointer-events-auto mx-auto"
          />
        </CardContent>
      </Card>

      {selectedDate && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">
              {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </h3>
            {startOfDay(selectedDate).getTime() === startOfDay(new Date()).getTime() && (
              <span className="text-xs text-muted-foreground flex items-center gap-1 bg-muted px-2.5 py-1 rounded-full">
                <Clock className="h-3 w-3" />
                Agora: {format(new Date(), 'HH:mm')}
              </span>
            )}
          </div>
          {loadingSlots ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="flex items-start gap-3 text-muted-foreground text-sm bg-muted/50 p-4 rounded-xl">
              <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">{getNoSlotsMessage()}</p>
                <p className="text-xs mt-1">Tente selecionar outra data</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {(() => {
                const sp = selectedDate ? getSpecialDayFor(businessHours, selectedDate) : null;
                return sp && !sp.closed ? (
                  <p className="text-xs rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300 px-3 py-2">
                    Horário especial{sp.name ? ` — ${sp.name}` : ''}: {sp.open} às {sp.close}
                  </p>
                ) : null;
              })()}
              {/* Highlight first available slot */}
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-primary" />
                {availableSlots.length} horário{availableSlots.length > 1 ? 's' : ''} disponíve{availableSlots.length > 1 ? 'is' : 'l'}
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {availableSlots.map((time, index) => (
                  <button
                    key={time}
                    onClick={() => {
                      setSelectedTime(time);
                      if (anyProfessional) setAssignedProfessional(pickProfessionalForTime(time));
                      setTimeout(() => {
                        setCurrentStep('confirm');
                      }, 250);
                    }}
                    className={cn(
                      "relative py-3 px-2 rounded-xl text-sm font-medium transition-all duration-200 text-center",
                      selectedTime === time
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-105"
                        : "bg-card border hover:border-primary/40 hover:bg-primary/5 text-foreground",
                      index === 0 && !selectedTime && "ring-2 ring-primary/20"
                    )}
                  >
                    {time}
                    {index === 0 && !selectedTime && (
                      <span className="absolute -top-1.5 -right-1 text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-semibold">
                        Próx.
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
