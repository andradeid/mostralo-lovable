import { useState } from 'react';
import { format, isBefore, startOfDay, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bell, CheckCircle, ChevronLeft, Dog, RotateCcw } from 'lucide-react';
import { BookingConfirmation } from '@/components/booking/BookingConfirmation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

// Trecho único da página de Pet Shops: simulador interativo de agendamento.

// ============ Demo Data ============
const demoServices = [
  { id: 'banho', name: 'Banho Completo', price: 60, duration: 60, icon: '🛁' },
  { id: 'tosa', name: 'Tosa Higiênica', price: 45, duration: 45, icon: '✂️' },
  { id: 'banho-tosa', name: 'Banho + Tosa', price: 90, duration: 90, icon: '🐾', popular: true },
  { id: 'hidratacao', name: 'Hidratação', price: 35, duration: 30, icon: '💧' }
];

const demoPets = [
  { id: 'thor', name: 'Thor', breed: 'Golden Retriever', avatar: '🐕' },
  { id: 'luna', name: 'Luna', breed: 'Shih Tzu', avatar: '🐩' },
  { id: 'max', name: 'Max', breed: 'Bulldog Francês', avatar: '🐶' }
];

const demoTimeSlots = ['08:00', '09:30', '11:00', '14:00', '15:30', '17:00'];

// ============ Interactive Booking Demo ============
export const PetBookingDemo = () => {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedPet, setSelectedPet] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const service = demoServices.find(s => s.id === selectedService);
  const pet = demoPets.find(p => p.id === selectedPet);

  const handleConfirm = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setStep(1);
      setSelectedService(null);
      setSelectedPet(null);
      setSelectedDate(undefined);
      setSelectedTime(null);
    }, 3000);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleReset = () => {
    setStep(1);
    setSelectedService(null);
    setSelectedPet(null);
    setSelectedDate(undefined);
    setSelectedTime(null);
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 relative overflow-hidden">
      {/* Success overlay */}
      {showSuccess && service && pet && selectedDate && selectedTime && (
        <BookingConfirmation
          variant="overlay"
          theme="dark"
          store={{ name: 'Pet Shop Amigo Fiel' }}
          service={{
            name: service.name,
            price: service.price,
            duration_minutes: service.duration
          }}
          pet={{
            name: pet.name,
            avatar: pet.avatar
          }}
          date={selectedDate}
          time={selectedTime}
          customMessage="A ração do Thor acaba em 5 dias. Lembrar?"
        />
      )}

      <CardHeader className="border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Dog className="w-5 h-5 text-orange-500" />
            Pet Shop Amigo Fiel - Agendamento
          </CardTitle>
          {step > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-zinc-400 hover:text-white"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reiniciar
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Progress bar */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                  step >= s
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white"
                    : "bg-zinc-800 text-zinc-500"
                )}
              >
                {s}
              </div>
              {s < 4 && (
                <div className={cn(
                  "w-8 h-1 mx-1 transition-all",
                  step > s ? "bg-gradient-to-r from-orange-500 to-amber-500" : "bg-zinc-800"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Service Selection */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">Escolha o Serviço</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {demoServices.map((svc) => (
                <div
                  key={svc.id}
                  onClick={() => {
                    setSelectedService(svc.id);
                    setStep(2);
                  }}
                  className={cn(
                    "relative bg-zinc-800 rounded-xl p-4 cursor-pointer border-2 transition-all hover:-translate-y-1",
                    selectedService === svc.id
                      ? "border-orange-500"
                      : "border-transparent hover:border-orange-500/50"
                  )}
                >
                  {svc.popular && (
                    <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs">
                      Popular
                    </Badge>
                  )}
                  <div className="text-3xl mb-2 text-center">{svc.icon}</div>
                  <h4 className="text-white font-semibold text-sm text-center">{svc.name}</h4>
                  <p className="text-zinc-400 text-xs text-center">{svc.duration} min</p>
                  <p className="text-orange-500 font-bold mt-2 text-center">R$ {svc.price.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Pet Selection */}
        {step === 2 && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-zinc-400 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </Button>
              <h3 className="text-lg font-semibold text-white">Escolha o Pet</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {demoPets.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedPet(p.id);
                    setStep(3);
                  }}
                  className={cn(
                    "bg-zinc-800 rounded-xl p-4 cursor-pointer border-2 transition-all hover:-translate-y-1 text-center",
                    selectedPet === p.id
                      ? "border-orange-500"
                      : "border-transparent hover:border-orange-500/50"
                  )}
                >
                  <div className="text-5xl mb-2">{p.avatar}</div>
                  <h4 className="text-white font-semibold">{p.name}</h4>
                  <p className="text-zinc-400 text-sm">{p.breed}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Date and Time Selection */}
        {step === 3 && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-zinc-400 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </Button>
              <h3 className="text-lg font-semibold text-white">Escolha Data e Horário</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Calendar */}
              <div className="flex justify-center">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setSelectedTime(null);
                  }}
                  locale={ptBR}
                  disabled={(date) => isBefore(date, startOfDay(new Date())) || isBefore(addDays(new Date(), 30), date)}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg pointer-events-auto"
                  classNames={{
                    day_selected: "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 focus:from-orange-600 focus:to-amber-600",
                    day_today: "border-2 border-orange-500/50 text-orange-400",
                    nav_button: "text-zinc-400 hover:text-white hover:bg-zinc-700",
                    caption: "text-white",
                    head_cell: "text-zinc-400",
                    cell: "text-zinc-300",
                    day: "hover:bg-zinc-700 text-zinc-300",
                    day_outside: "text-zinc-600",
                    day_disabled: "text-zinc-600 opacity-50",
                  }}
                />
              </div>

              {/* Time slots */}
              <div>
                <p className="text-zinc-400 text-sm mb-3">
                  {selectedDate 
                    ? `Horários para ${format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}`
                    : 'Selecione uma data primeiro'
                  }
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {demoTimeSlots.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      disabled={!selectedDate}
                      onClick={() => {
                        setSelectedTime(time);
                        setStep(4);
                      }}
                      className={cn(
                        "text-sm",
                        selectedTime === time
                          ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0"
                          : "border-zinc-700 text-zinc-300 hover:border-orange-500 hover:text-white"
                      )}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && service && pet && selectedDate && selectedTime && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-zinc-400 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </Button>
              <h3 className="text-lg font-semibold text-white">Confirmar Agendamento</h3>
            </div>

            <div className="bg-zinc-800 rounded-xl p-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-700">
                  <span className="text-zinc-400">Pet</span>
                  <span className="text-white font-semibold flex items-center gap-2">
                    {pet.avatar} {pet.name}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-zinc-700">
                  <span className="text-zinc-400">Serviço</span>
                  <span className="text-white font-semibold">{service.name}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-zinc-700">
                  <span className="text-zinc-400">Data</span>
                  <span className="text-white font-semibold">
                    {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-zinc-700">
                  <span className="text-zinc-400">Horário</span>
                  <span className="text-white font-semibold">{selectedTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Valor</span>
                  <span className="text-orange-500 font-bold text-xl">R$ {service.price.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
              <p className="text-amber-400 text-sm flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Você receberá um lembrete no WhatsApp 2h antes do horário!
              </p>
            </div>

            <Button
              onClick={handleConfirm}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-lg py-6"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Confirmar Agendamento
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
