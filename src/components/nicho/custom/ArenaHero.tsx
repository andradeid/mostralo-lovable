import { useNavigate } from 'react-router-dom';
import { ArrowRight, Monitor, QrCode, Trophy, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MostraloPlansSection } from '@/components/pricing/MostraloPlansSection';
import { useMasterWhatsApp } from '@/hooks/useMasterWhatsApp';

// Trechos próprios da página de Arenas.

/** Botões do hero: o principal abre o WhatsApp comercial; o segundo leva à demonstração. */
export const ArenaHeroCtas = () => {
  const { getWhatsAppLink } = useMasterWhatsApp();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Button
        size="lg"
        className="bg-gradient-to-r from-orange-500 to-lime-500 hover:from-orange-600 hover:to-lime-600 text-white font-bold text-lg px-8 py-6 rounded-xl shadow-lg shadow-orange-500/25 transition-all hover:scale-105"
        onClick={() => window.open(getWhatsAppLink('arena_esportiva'), '_blank')}
      >
        TRANSFORMAR MINHA ARENA
        <ArrowRight className="ml-2 w-5 h-5" />
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 hover:text-white px-8 py-6 rounded-xl"
        onClick={() => navigate('/demo')}
      >
        <Monitor className="mr-2 w-5 h-5" />
        Ver Demonstração
      </Button>
    </div>
  );
};

/** Mockup do painel de quadras ao lado do texto do hero. */
export const ArenaHeroMockup = () => (
  <div className="relative">
    <div className="relative bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-3xl p-6 border border-zinc-700/50 shadow-2xl">
      {/* Phone Frame */}
      <div className="bg-zinc-950 rounded-2xl p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-lime-500 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Arena Beach Pro</p>
              <p className="text-zinc-500 text-xs">Reservas Online</p>
            </div>
          </div>
          <Badge className="bg-lime-500/20 text-lime-400 text-xs">Ao Vivo</Badge>
        </div>

        {/* Court Grid Preview */}
        <div className="space-y-2">
          <p className="text-zinc-400 text-xs">Quadras - Hoje</p>
          <div className="grid grid-cols-3 gap-2">
            {['Beach 1', 'Beach 2', 'Padel 1'].map((court, i) => (
              <div key={i} className={`p-2 rounded-lg text-center text-xs ${
                i === 0 ? 'bg-lime-500/20 border border-lime-500/30 text-lime-400' :
                i === 1 ? 'bg-orange-500/20 border border-orange-500/30 text-orange-400' :
                'bg-zinc-800 border border-zinc-700 text-zinc-400'
              }`}>
                {court}
                <div className="text-[10px] mt-1 opacity-70">
                  {i === 0 ? 'Livre 14h' : i === 1 ? 'Ocupada' : 'Livre 15h'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alert */}
        <div className="bg-gradient-to-r from-orange-500/10 to-lime-500/10 border border-orange-500/30 rounded-xl p-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
              <QrCode className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Nova Reserva!</p>
              <p className="text-zinc-400 text-xs">Beach 1 - 16:00 às 17:00</p>
              <p className="text-lime-400 text-xs mt-1">✅ Confirmação enviada no WhatsApp</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-lime-400">12</p>
            <p className="text-zinc-500 text-xs">Reservas Hoje</p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-orange-400">R$ 1.840</p>
            <p className="text-zinc-500 text-xs">Faturamento</p>
          </div>
        </div>
      </div>
    </div>

    {/* Floating Elements */}
    <div className="absolute -top-4 -right-4 bg-lime-500 text-zinc-900 rounded-full p-3 shadow-lg shadow-lime-500/30 animate-bounce">
      <Trophy className="w-6 h-6" />
    </div>
    <div className="absolute -bottom-4 -left-4 bg-orange-500 text-white rounded-full p-3 shadow-lg shadow-orange-500/30">
      <Zap className="w-6 h-6" />
    </div>
  </div>
);

/** Planos (a seção original também carregava o WhatsApp comercial). */
export const ArenaPlans = () => {
  useMasterWhatsApp();
  return <MostraloPlansSection priority="Agenda" />;
};
