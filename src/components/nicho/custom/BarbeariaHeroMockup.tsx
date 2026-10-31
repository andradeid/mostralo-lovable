import { Scissors } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Trecho único da página de Barbearias: mockup (desktop + celular) ao lado do texto do hero.
export const BarbeariaHeroMockup = () => (

        <div className="flex justify-center lg:justify-end">
          <div className="relative">
            {/* Desktop mockup */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl shadow-orange-500/10 p-1 max-w-full sm:max-w-[440px]">
              <div className="bg-zinc-800 rounded-t-xl px-4 py-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 bg-zinc-700 rounded-md px-3 py-1 text-center">
                  <span className="text-zinc-400 text-xs">mostralo.com.br/barbearia-do-joao</span>
                </div>
              </div>
              <div className="bg-zinc-950 rounded-b-xl p-4 space-y-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Scissors className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Barbearia do João</p>
                    <p className="text-green-400 text-xs">● Agendamento aberto</p>
                  </div>
                </div>
                {/* Mini agenda */}
                <div className="space-y-2">
                  {['09:00 - Corte Degradê', '09:30 - Barba Completa', '10:00 - Corte + Barba'].map((slot, i) => (
                    <div key={i} className="flex items-center justify-between bg-zinc-900 rounded-lg px-3 py-2 border border-zinc-800">
                      <span className="text-zinc-300 text-xs">{slot}</span>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">Disponível</Badge>
                    </div>
                  ))}
                  {['10:30 - Lucas M.', '11:00 - Pedro S.'].map((slot, i) => (
                    <div key={i} className="flex items-center justify-between bg-orange-500/10 rounded-lg px-3 py-2 border border-orange-500/20">
                      <span className="text-zinc-300 text-xs">{slot}</span>
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px]">Agendado</Badge>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <div className="flex-1 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
                    <p className="text-green-400 text-[10px] font-semibold">✅ PIX Sinal recebido</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile mockup sobreposto */}
            <div className="absolute -bottom-4 -right-6 w-[140px] bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl p-1 hidden md:block">
              <div className="bg-zinc-800 rounded-t-xl px-2 py-1.5 flex justify-center">
                <div className="w-12 h-1 bg-zinc-600 rounded-full" />
              </div>
              <div className="bg-[#0b141a] rounded-b-xl p-2 space-y-1.5">
                <div className="bg-zinc-800 rounded-lg p-2">
                  <p className="text-white text-[8px] font-semibold">✅ Agendamento confirmado!</p>
                  <p className="text-zinc-400 text-[7px] mt-1">Corte Degradê • 14:30h</p>
                </div>
                <div className="bg-amber-900/40 rounded-lg p-2">
                  <p className="text-[8px] text-white font-semibold">💳 PIX R$15,00</p>
                  <div className="bg-green-600 text-white text-center py-1 rounded text-[7px] mt-1 font-semibold">Pagar</div>
                </div>
              </div>
            </div>
          </div>
        </div>
);
