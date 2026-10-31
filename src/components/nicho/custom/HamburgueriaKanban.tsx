import { ArrowRight, Check, Flame, Package } from 'lucide-react';

// Trecho único da página de Hamburguerias: status de pedido animado (Kanban visual).
export const HamburgueriaKanban = () => {
  return (
    <div className="w-full py-16 px-4 bg-zinc-900/50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Visualize o fluxo perfeito da sua operação
          </h2>
          <p className="text-zinc-400 text-lg">
            Acompanhe cada pedido em tempo real no seu KDS
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Entrada */}
          <div className="relative">
            <div className="bg-zinc-800 rounded-xl p-6 border-2 border-orange-500/30 animate-[pulse_3s_ease-in-out_infinite]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-white">ENTRADA</h3>
              </div>
              <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-orange-500 font-bold">#42</span>
                  <span className="text-xs text-zinc-500">Agora</span>
                </div>
                <p className="text-white text-sm font-medium">Smash Duplo + Bacon</p>
                <p className="text-zinc-500 text-xs mt-1">Ponto: Ao ponto</p>
              </div>
            </div>
            <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2">
              <ArrowRight className="w-6 h-6 text-orange-500 animate-pulse" />
            </div>
          </div>

          {/* Preparo */}
          <div className="relative">
            <div className="bg-zinc-800 rounded-xl p-6 border-2 border-orange-500/60">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-500/30 rounded-full flex items-center justify-center animate-pulse">
                  <Flame className="w-5 h-5 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-white">NA CHAPA</h3>
              </div>
              <div className="bg-zinc-900 rounded-lg p-4 border border-orange-500/50 shadow-lg shadow-orange-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-orange-500 font-bold">#41</span>
                  <span className="text-xs text-orange-400">2 min</span>
                </div>
                <p className="text-white text-sm font-medium">Combo Burger Premium</p>
                <p className="text-zinc-500 text-xs mt-1">Ponto: Bem passado</p>
                <div className="mt-2 h-1 bg-zinc-700 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full animate-[progress_2s_ease-in-out_infinite]" style={{ width: '60%' }} />
                </div>
              </div>
            </div>
            <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2">
              <ArrowRight className="w-6 h-6 text-orange-500 animate-pulse" />
            </div>
          </div>

          {/* Saída */}
          <div>
            <div className="bg-zinc-800 rounded-xl p-6 border-2 border-green-500/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-white">SAÍDA</h3>
              </div>
              <div className="bg-zinc-900 rounded-lg p-4 border border-green-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-500 font-bold">#40</span>
                  <span className="text-xs text-green-400">Pronto!</span>
                </div>
                <p className="text-white text-sm font-medium">Classic Burger</p>
                <p className="text-zinc-500 text-xs mt-1">Aguardando entregador</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
