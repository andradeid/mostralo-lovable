import { Scissors } from 'lucide-react';

// Trecho único da página Barbearias V2: celular com a agenda no hero.
export const BarbeariaV2PhoneMockup = () => (

        <div className="relative flex justify-center order-1 lg:order-2 mb-8 md:mb-0">
          <div className="relative w-full max-w-[280px] md:max-w-[320px] aspect-[9/18] bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl border-[8px] border-gray-900 overflow-hidden">
            <div className="h-full w-full bg-white flex flex-col">
              <div className="p-4 md:p-6 pt-8 md:pt-12 space-y-4 md:space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <Scissors className="w-5 h-5 md:w-6 md:h-6 text-gray-900" />
                  </div>
                  <div>
                    <p className="font-bold text-xs md:text-sm">Corte & Barba</p>
                    <p className="text-[10px] md:text-xs text-gray-400">Próximo cliente: 14:30h</p>
                  </div>
                </div>
                
                <div className="space-y-2 md:space-y-3">
                  <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-orange-50 border border-orange-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] md:text-[10px] font-bold text-orange-600 uppercase">Confirmado</span>
                      <span className="text-[9px] md:text-[10px] text-gray-400">R$ 75,00</span>
                    </div>
                    <p className="font-bold text-xs md:text-sm text-gray-900">Marcos Silva</p>
                  </div>
                  
                  <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-gray-50 border border-gray-100">
                    <p className="font-bold text-xs md:text-sm text-gray-400">15:15h - Disponível</p>
                  </div>

                  <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-gray-50 border border-gray-100">
                    <p className="font-bold text-xs md:text-sm text-gray-400">16:00h - Disponível</p>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-8 p-3 md:p-4 bg-green-50 rounded-xl md:rounded-2xl border border-green-100">
                  <p className="text-[9px] md:text-[10px] font-bold text-green-600 uppercase">PIX Recebido</p>
                  <p className="text-base md:text-lg font-black text-gray-900">R$ 15,00</p>
                  <p className="text-[9px] md:text-[10px] text-gray-400">Sinal de Agendamento</p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-orange-500/5 rounded-full blur-3xl" />
        </div>
);
