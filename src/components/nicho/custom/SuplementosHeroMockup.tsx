import { Pill, TrendingUp } from 'lucide-react';

// Trecho único da página de Suplementos: mockup de tablet ao lado do texto do hero.
export const SuplementosHeroMockup = () => (
  <div className="flex-1 relative">
    <div className="relative">
      {/* Tablet mockup */}
      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 shadow-2xl">
        <div className="bg-zinc-950 rounded-xl p-6 aspect-[4/3]">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Pill className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold">Whey Protein 900g</div>
              <div className="text-orange-500 font-semibold">R$ 189,90</div>
            </div>
          </div>
          <div className="h-24 bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-lg flex items-end p-4">
            <div className="flex items-end gap-1 w-full">
              {[40, 55, 45, 70, 85, 75, 95].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-orange-500 to-orange-400 rounded-t"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-zinc-500">Vendas da semana</span>
            <span className="text-green-500 font-semibold flex items-center gap-1">
              <TrendingUp className="w-4 h-4" /> +32%
            </span>
          </div>
        </div>
      </div>
      {/* Glow effect */}
      <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/20 to-orange-600/20 blur-3xl -z-10" />
    </div>
  </div>
);
