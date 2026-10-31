import { useState } from 'react';
import { Calendar, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Trecho único da página de Arenas: grade de horários interativa.

export const ArenaCourtSchedule = () => {
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);
  
  const courts = [
    { id: 'beach1', name: 'Beach Tennis 1', type: 'beach', emoji: '🎾' },
    { id: 'beach2', name: 'Beach Tennis 2', type: 'beach', emoji: '🎾' },
    { id: 'padel1', name: 'Padel 1', type: 'padel', emoji: '🏸' },
    { id: 'society1', name: 'Society 1', type: 'society', emoji: '⚽' }
  ];

  const timeSlots = ['07:00', '08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  const schedule: Record<string, Record<string, { status: 'livre' | 'reservado' | 'ocupado'; cliente?: string }>> = {
    beach1: {
      '07:00': { status: 'reservado', cliente: 'João Silva' },
      '08:00': { status: 'ocupado' },
      '09:00': { status: 'livre' },
      '10:00': { status: 'livre' },
      '11:00': { status: 'reservado', cliente: 'Maria Santos' },
      '14:00': { status: 'livre' },
      '15:00': { status: 'reservado', cliente: 'Pedro Costa' },
      '16:00': { status: 'livre' },
      '17:00': { status: 'reservado', cliente: 'Ana Oliveira' },
      '18:00': { status: 'ocupado' },
      '19:00': { status: 'reservado', cliente: 'Carlos Lima' },
      '20:00': { status: 'livre' }
    },
    beach2: {
      '07:00': { status: 'livre' },
      '08:00': { status: 'reservado', cliente: 'Turma do Beach' },
      '09:00': { status: 'ocupado' },
      '10:00': { status: 'livre' },
      '11:00': { status: 'livre' },
      '14:00': { status: 'reservado', cliente: 'Lucas Mendes' },
      '15:00': { status: 'livre' },
      '16:00': { status: 'reservado', cliente: 'Julia Ferreira' },
      '17:00': { status: 'livre' },
      '18:00': { status: 'livre' },
      '19:00': { status: 'ocupado' },
      '20:00': { status: 'reservado', cliente: 'Equipe Pro' }
    },
    padel1: {
      '07:00': { status: 'livre' },
      '08:00': { status: 'livre' },
      '09:00': { status: 'reservado', cliente: 'Dupla Padel' },
      '10:00': { status: 'ocupado' },
      '11:00': { status: 'livre' },
      '14:00': { status: 'livre' },
      '15:00': { status: 'reservado', cliente: 'Torneio Interno' },
      '16:00': { status: 'reservado', cliente: 'Torneio Interno' },
      '17:00': { status: 'reservado', cliente: 'Torneio Interno' },
      '18:00': { status: 'livre' },
      '19:00': { status: 'livre' },
      '20:00': { status: 'livre' }
    },
    society1: {
      '07:00': { status: 'livre' },
      '08:00': { status: 'livre' },
      '09:00': { status: 'livre' },
      '10:00': { status: 'reservado', cliente: 'Time Amigos' },
      '11:00': { status: 'ocupado' },
      '14:00': { status: 'livre' },
      '15:00': { status: 'livre' },
      '16:00': { status: 'livre' },
      '17:00': { status: 'reservado', cliente: 'Pelada Semanal' },
      '18:00': { status: 'reservado', cliente: 'Pelada Semanal' },
      '19:00': { status: 'livre' },
      '20:00': { status: 'reservado', cliente: 'Jogo Noturno' }
    }
  };

  // Calcular horários livres por quadra
  const getAvailableCount = (courtId: string) => {
    const courtSchedule = schedule[courtId] || {};
    return Object.values(courtSchedule).filter(s => s.status === 'livre').length;
  };

  return (
    <section className="py-20 bg-zinc-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/30 mb-4">
            <Calendar className="w-4 h-4 mr-2" />
            Grade de Horários
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Visualize sua <span className="text-orange-400">arena</span> em tempo real
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Interface intuitiva para você e seus clientes verem disponibilidade.
          </p>
        </div>

        {/* Court Selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {courts.map((court) => {
            const availableCount = getAvailableCount(court.id);
            const isSelected = selectedCourt === court.id;
            
            return (
              <button
                key={court.id}
                onClick={() => setSelectedCourt(isSelected ? null : court.id)}
                className={`p-4 rounded-xl font-medium transition-all text-left ${
                  isSelected
                    ? 'bg-gradient-to-r from-orange-500 to-lime-500 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{court.emoji}</span>
                  <span className="font-semibold text-sm md:text-base truncate">{court.name}</span>
                </div>
                <div className={`text-xs ${isSelected ? 'text-white/80' : 'text-lime-400'}`}>
                  {availableCount} horários livres
                </div>
              </button>
            );
          })}
        </div>

        {/* Schedule Grid - Mobile First */}
        <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-4 md:p-6">
          {selectedCourt ? (
            <>
              {/* Selected Court Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {courts.find(c => c.id === selectedCourt)?.emoji}
                  </span>
                  <div>
                    <h3 className="text-white font-bold text-lg">
                      {courts.find(c => c.id === selectedCourt)?.name}
                    </h3>
                    <p className="text-zinc-500 text-sm">Hoje - {new Date().toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCourt(null)}
                  className="text-zinc-400 hover:text-white text-sm flex items-center gap-1"
                >
                  ← Voltar
                </button>
              </div>

              {/* Time Slots Grid - Responsive */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {timeSlots.map((time) => {
                  const slot = schedule[selectedCourt]?.[time] || { status: 'livre' };
                  
                  return (
                    <div
                      key={time}
                      className={`p-4 rounded-xl border transition-all ${
                        slot.status === 'livre' 
                          ? 'bg-lime-500/10 border-lime-500/30 hover:bg-lime-500/20 cursor-pointer' 
                          : slot.status === 'reservado'
                          ? 'bg-orange-500/10 border-orange-500/30'
                          : 'bg-zinc-800/50 border-zinc-700/30'
                      }`}
                    >
                      <div className={`font-bold text-lg mb-2 ${
                        slot.status === 'livre' ? 'text-lime-400' :
                        slot.status === 'reservado' ? 'text-orange-400' : 'text-zinc-500'
                      }`}>
                        {time}
                      </div>
                      <div className="flex items-center gap-2">
                        {slot.status === 'livre' ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-lime-400" />
                            <span className="text-lime-400 text-sm">Disponível</span>
                          </>
                        ) : slot.status === 'reservado' ? (
                          <>
                            <Calendar className="w-4 h-4 text-orange-400" />
                            <span className="text-orange-400 text-sm truncate">{slot.cliente}</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 text-zinc-500" />
                            <span className="text-zinc-500 text-sm">Em uso</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Overview - All Courts Summary */
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-white font-bold text-xl mb-2">Selecione uma quadra</h3>
              <p className="text-zinc-400 mb-6">Clique em uma quadra acima para ver os horários disponíveis</p>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
                {courts.map((court) => {
                  const available = getAvailableCount(court.id);
                  const total = timeSlots.length;
                  const percentage = Math.round((available / total) * 100);
                  
                  return (
                    <div 
                      key={court.id}
                      onClick={() => setSelectedCourt(court.id)}
                      className="bg-zinc-800/50 rounded-xl p-4 cursor-pointer hover:bg-zinc-800 transition-all border border-zinc-700/50 hover:border-lime-500/30"
                    >
                      <span className="text-2xl">{court.emoji}</span>
                      <p className="text-white font-medium text-sm mt-2 truncate">{court.name}</p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <span className="text-lime-400 font-bold">{available}</span>
                        <span className="text-zinc-500 text-xs">/{total} livres</span>
                      </div>
                      <div className="w-full bg-zinc-700 rounded-full h-1.5 mt-2">
                        <div 
                          className="bg-gradient-to-r from-lime-500 to-lime-400 h-1.5 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-6 pt-6 border-t border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-lime-500/20 border border-lime-500/30" />
              <span className="text-zinc-400 text-sm">Livre</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-500/20 border border-orange-500/30" />
              <span className="text-zinc-400 text-sm">Reservado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-zinc-700/50 border border-zinc-600/30" />
              <span className="text-zinc-400 text-sm">Em uso</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
