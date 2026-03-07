import { ArrowRight, MessageCircle, Bot, User, Sparkles, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';


export function MostraloChatHero() {
  const scrollToCTA = () => {
    document.getElementById('mostralo-chat-cta')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative py-12 md:py-20 lg:py-24 w-full overflow-hidden">
      {/* Background Tecnológico - mesmo da home */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Header com Logo */}
      <div className="relative container px-4 md:px-6 max-w-7xl mx-auto mb-8">
        <div className="flex items-center py-4">
          <div className="flex items-center space-x-3">
            <Store className="w-10 h-10 sm:w-12 sm:h-12 text-orange-500" />
            <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">Mostralo</span>
          </div>
        </div>
      </div>

      <div className="relative container px-4 md:px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left - Copy */}
          <div className="flex flex-col space-y-6 text-center lg:text-left">
            <Badge className="w-fit mx-auto lg:mx-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm px-4 py-2 border-0">
              <Sparkles className="w-4 h-4 mr-2" />
              Sistema Invisível • Zero Treinamento
            </Badge>

            <div className="space-y-4">
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white">
                Seu WhatsApp é um balcão de negócios ou um{' '}
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 mt-2">
                  ralo de dinheiro?
                </span>
              </h1>
              <p className="text-lg md:text-xl text-zinc-300 max-w-xl mx-auto lg:mx-0">
                Pare de ser escravo da operação. Transforme o WhatsApp Web que sua equipe já ama em um{' '}
                <strong className="text-orange-400">Vendedor de Elite</strong> que tira pedidos, transcreve áudios e gera
                relatórios de lucro em tempo real.{' '}
                <strong className="text-green-400">Sem treinamento. Sem resistência.</strong>
              </p>
            </div>

            {/* Benefícios */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-sm text-zinc-300">
              <span className="flex items-center gap-2">✅ Sem instalação</span>
              <span className="flex items-center gap-2">✅ Funciona hoje</span>
              <span className="flex items-center gap-2">✅ 100% invisível</span>
            </div>

            <Button
              onClick={scrollToCTA}
              size="lg"
              className="w-full sm:w-auto text-lg h-14 px-8 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all mx-auto lg:mx-0"
            >
              QUERO TRANSFORMAR MEU ATENDIMENTO AGORA
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>

          {/* Right - Chat Mockup */}
          <div className="flex justify-center lg:justify-end mt-8 lg:mt-0">
            <div className="w-full max-w-sm bg-zinc-800/60 backdrop-blur rounded-2xl shadow-2xl border border-zinc-700 overflow-hidden">
              {/* Chat Header */}
              <div className="bg-[#075E54] text-white px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Cliente João</p>
                  <p className="text-xs opacity-75">online</p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="p-4 space-y-3 min-h-[320px] bg-zinc-900/50">
                {/* Customer message */}
                <div className="flex justify-start">
                  <div className="bg-zinc-700/80 rounded-xl rounded-tl-sm px-3 py-2 max-w-[80%] shadow-sm">
                    <p className="text-sm text-zinc-200">🎤 <em className="text-zinc-400">Áudio (1:32)</em></p>
                  </div>
                </div>

                {/* AI transcription */}
                <div className="flex justify-end">
                  <div className="bg-[#DCF8C6]/90 rounded-xl rounded-tr-sm px-3 py-2 max-w-[80%] shadow-sm">
                    <div className="flex items-center gap-1 mb-1">
                      <Bot className="w-3 h-3 text-orange-500" />
                      <span className="text-[10px] text-orange-600 font-semibold">IA Mostralo</span>
                    </div>
                    <p className="text-sm text-gray-800">
                      Entendi! Você quer: <strong>2x Hambúrguer Artesanal + 1 Coca 600ml</strong>. Confirmo o pedido?
                    </p>
                  </div>
                </div>

                {/* Customer confirms */}
                <div className="flex justify-start">
                  <div className="bg-zinc-700/80 rounded-xl rounded-tl-sm px-3 py-2 max-w-[80%] shadow-sm">
                    <p className="text-sm text-zinc-200">Isso! Manda aí 👍</p>
                  </div>
                </div>

                {/* System action */}
                <div className="flex justify-end">
                  <div className="bg-[#DCF8C6]/90 rounded-xl rounded-tr-sm px-3 py-2 max-w-[80%] shadow-sm">
                    <div className="flex items-center gap-1 mb-1">
                      <Bot className="w-3 h-3 text-orange-500" />
                      <span className="text-[10px] text-orange-600 font-semibold">IA Mostralo</span>
                    </div>
                    <p className="text-sm text-gray-800">
                      ✅ Pedido #427 criado! Total: <strong>R$ 67,90</strong>. Previsão: 35 min. 🛵
                    </p>
                  </div>
                </div>
              </div>

              {/* Injected buttons bar */}
              <div className="border-t border-zinc-700 bg-zinc-800/80 px-3 py-2 flex gap-2">
                <button className="flex-1 text-xs font-semibold py-2 rounded-lg border-2 border-orange-500/60 text-orange-400 hover:bg-orange-500/10 transition-colors">
                  📋 Tirar Pedido
                </button>
                <button className="flex-1 text-xs font-semibold py-2 rounded-lg border-2 border-orange-500/60 text-orange-400 hover:bg-orange-500/10 transition-colors">
                  🔍 Buscar Produto
                </button>
                <button className="flex-1 text-xs font-semibold py-2 rounded-lg border-2 border-zinc-600 text-zinc-400 hover:bg-zinc-700/50 transition-colors">
                  ⏸ Pausar IA
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
