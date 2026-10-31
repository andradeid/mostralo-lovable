import { Scissors } from 'lucide-react';

// Trecho único da página de Barbearias: simulação da cobrança PIX no WhatsApp.
export const BarbeariaPixChat = () => (

          <div className="flex justify-center">
            <div className="w-full max-w-[340px] bg-zinc-900 rounded-3xl border border-zinc-700 overflow-hidden shadow-2xl shadow-green-500/10">
              <div className="bg-zinc-800 px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/30 flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Barbearia do João</p>
                  <p className="text-green-400 text-xs">online</p>
                </div>
              </div>

              <div className="p-4 space-y-3 min-h-[320px] bg-[#0b141a]">
                <div className="bg-zinc-800 rounded-xl rounded-tl-sm p-3 max-w-[85%]">
                  <p className="text-white text-sm">
                    ✅ <strong>Agendamento confirmado!</strong>
                  </p>
                  <p className="text-zinc-300 text-sm mt-1">
                    📋 Corte Degradê + Barba<br/>
                    👤 Marcos Silva<br/>
                    📅 Sábado, 22 de Março<br/>
                    🕐 14:30h<br/>
                    💰 R$70,00
                  </p>
                  <p className="text-zinc-500 text-xs mt-2 text-right">14:32</p>
                </div>

                <div className="bg-amber-900/40 border border-amber-500/30 rounded-xl rounded-tl-sm p-3 max-w-[85%]">
                  <p className="text-white text-sm font-semibold">
                    💳 Solicitação de Pagamento
                  </p>
                  <div className="mt-2 bg-zinc-900/50 rounded-lg p-3">
                    <p className="text-zinc-300 text-xs">Sinal para garantir sua vaga</p>
                    <p className="text-2xl font-black text-green-400 mt-1">R$15,00</p>
                    <p className="text-zinc-500 text-xs mt-1">PIX • Barbearia do João</p>
                  </div>
                  <div className="mt-2 bg-green-600 text-white text-center py-2 rounded-lg text-sm font-semibold">
                    Pagar R$15,00
                  </div>
                  <p className="text-zinc-500 text-xs mt-2 text-right">14:32</p>
                </div>

                <div className="bg-green-900/30 rounded-xl rounded-tr-sm p-3 max-w-[75%] ml-auto">
                  <p className="text-white text-sm">Pronto, paguei! ✅</p>
                  <p className="text-zinc-500 text-xs mt-1 text-right">14:33</p>
                </div>
              </div>
            </div>
          </div>
);
