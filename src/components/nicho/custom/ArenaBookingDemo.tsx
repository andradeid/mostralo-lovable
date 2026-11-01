import { useState } from 'react';
import { CheckCircle2, Smartphone, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Trecho único da página de Arenas: demonstração interativa de reserva.

export const ArenaBookingDemo = () => {
  const [step, setStep] = useState(1);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const sports = [
    { id: 'beach', name: 'Beach Tennis', emoji: '🎾', color: 'orange' },
    { id: 'padel', name: 'Padel', emoji: '🏸', color: 'lime' },
    { id: 'society', name: 'Society', emoji: '⚽', color: 'cyan' },
    { id: 'tenis', name: 'Tênis', emoji: '🎾', color: 'purple' }
  ];

  const courtsBySport: Record<string, string[]> = {
    beach: ['Beach Tennis 1', 'Beach Tennis 2'],
    padel: ['Padel 1', 'Padel 2'],
    society: ['Society 1'],
    tenis: ['Tênis 1']
  };

  const dates = ['Hoje', 'Amanhã', 'Quarta', 'Quinta', 'Sexta'];
  const times = ['07:00', '08:00', '09:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  const nextStep = () => {
    if (step < 5) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const resetDemo = () => {
    setStep(1);
    setSelectedSport(null);
    setSelectedCourt(null);
    setSelectedDate(null);
    setSelectedTime(null);
  };

  return (
    <section className="py-20 bg-gradient-to-b from-zinc-950 to-zinc-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="bg-lime-500/10 text-lime-400 border-lime-500/30 mb-4">
            <Smartphone className="w-4 h-4 mr-2" />
            Demonstração Interativa
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Veja como seu cliente <span className="text-lime-400">reserva a quadra</span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Processo simples e rápido, direto pelo link da arena.
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          {/* Progress Steps */}
          <div className="flex justify-between mb-8">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  s === step ? 'bg-gradient-to-r from-orange-500 to-lime-500 text-white' :
                  s < step ? 'bg-lime-500 text-white' :
                  'bg-zinc-800 text-zinc-500'
                }`}>
                  {s < step ? <CheckCircle2 className="w-5 h-5" /> : s}
                </div>
                {s < 5 && (
                  <div className={`w-12 sm:w-20 h-1 ${s < step ? 'bg-lime-500' : 'bg-zinc-800'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Phone Mockup */}
          <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500/20 to-lime-500/20 p-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-lime-500 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold">Arena Beach Pro</p>
                  <p className="text-zinc-400 text-sm">Reserva Online</p>
                </div>
              </div>
            </div>

            <CardContent className="p-6">
              {/* Step 1: Sport */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-white font-bold text-lg">Escolha o esporte</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {sports.map((sport) => (
                      <button
                        key={sport.id}
                        onClick={() => { setSelectedSport(sport.id); nextStep(); }}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedSport === sport.id
                            ? 'border-lime-500 bg-lime-500/10'
                            : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                        }`}
                      >
                        <span className="text-3xl mb-2 block">{sport.emoji}</span>
                        <span className="text-white font-medium">{sport.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Court */}
              {step === 2 && selectedSport && (
                <div className="space-y-4">
                  <h3 className="text-white font-bold text-lg">Escolha a quadra</h3>
                  <div className="space-y-3">
                    {courtsBySport[selectedSport]?.map((court) => (
                      <button
                        key={court}
                        onClick={() => { setSelectedCourt(court); nextStep(); }}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                          selectedCourt === court
                            ? 'border-lime-500 bg-lime-500/10'
                            : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                        }`}
                      >
                        <span className="text-white font-medium">{court}</span>
                        <Badge className="bg-lime-500/20 text-lime-400">Disponível</Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Date */}
              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-white font-bold text-lg">Escolha a data</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {dates.map((date, i) => (
                      <button
                        key={date}
                        onClick={() => { setSelectedDate(date); nextStep(); }}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          selectedDate === date
                            ? 'border-lime-500 bg-lime-500/10'
                            : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                        }`}
                      >
                        <span className="text-zinc-400 text-xs block">{['Seg', 'Ter', 'Qua', 'Qui', 'Sex'][i]}</span>
                        <span className="text-white font-medium text-sm">{date}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Time */}
              {step === 4 && (
                <div className="space-y-4">
                  <h3 className="text-white font-bold text-lg">Escolha o horário</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {times.map((time) => (
                      <button
                        key={time}
                        onClick={() => { setSelectedTime(time); nextStep(); }}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          selectedTime === time
                            ? 'border-lime-500 bg-lime-500/10'
                            : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                        }`}
                      >
                        <span className="text-white font-medium text-sm">{time}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 5: Confirmation */}
              {step === 5 && (
                <div className="space-y-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-orange-500 to-lime-500 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xl mb-2">Reserva Confirmada!</h3>
                    <p className="text-zinc-400">A reserva já está na agenda da arena.</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-xl p-4 text-left space-y-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Quadra:</span>
                      <span className="text-white font-medium">{selectedCourt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Data:</span>
                      <span className="text-white font-medium">{selectedDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Horário:</span>
                      <span className="text-white font-medium">{selectedTime}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-zinc-700">
                      <span className="text-zinc-400">Status:</span>
                      <span className="text-lime-400 font-bold">Confirmada</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-orange-500/10 to-lime-500/10 rounded-xl p-4 border border-lime-500/20">
                    <p className="text-zinc-300 text-sm">
                      📱 Confirmação e lembrete enviados no WhatsApp!
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-6 pt-4 border-t border-zinc-800">
                {step > 1 && step < 5 && (
                  <Button variant="outline" onClick={prevStep} className="border-zinc-700 text-zinc-300">
                    Voltar
                  </Button>
                )}
                {step === 5 && (
                  <Button onClick={resetDemo} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white">
                    Reiniciar Demo
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
