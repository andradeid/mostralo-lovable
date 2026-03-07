import { ArrowRight, MessageCircle, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MostraloChatHero() {
  const scrollToCTA = () => {
    document.getElementById('mostralo-chat-cta')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative bg-white py-16 md:py-24 overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(#F0702E 1px, transparent 1px), linear-gradient(90deg, #F0702E 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Copy */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-[#F0702E]/10 border border-[#F0702E]/20 rounded-full px-4 py-2">
              <MessageCircle className="h-4 w-4 text-[#F0702E]" />
              <span className="text-sm font-semibold text-[#F0702E]">Sistema Invisível • Zero Treinamento</span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Seu WhatsApp é um balcão de negócios ou um{' '}
              <span className="text-[#F0702E]">ralo de dinheiro?</span>
            </h1>

            <p className="text-base md:text-lg text-gray-600 leading-relaxed">
              Pare de ser escravo da operação. Transforme o WhatsApp Web que sua equipe já ama em um{' '}
              <strong className="text-gray-900">Vendedor de Elite</strong> que tira pedidos, transcreve áudios e gera
              relatórios de lucro em tempo real.{' '}
              <span className="text-[#F0702E] font-semibold">Sem treinamento. Sem resistência.</span>
            </p>

            <Button
              onClick={scrollToCTA}
              className="h-14 px-8 text-base font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
              style={{ backgroundColor: '#F0702E', color: '#fff' }}
            >
              QUERO TRANSFORMAR MEU ATENDIMENTO AGORA
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>

            <div className="flex items-center gap-6 pt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">✅ Sem instalação</span>
              <span className="flex items-center gap-1">✅ Funciona hoje</span>
              <span className="flex items-center gap-1">✅ 100% invisível</span>
            </div>
          </div>

          {/* Right - Chat Mockup */}
          <div className="flex justify-center">
            <div className="w-full max-w-sm bg-[#F8F9FA] rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
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
              <div className="p-4 space-y-3 min-h-[320px]">
                {/* Customer message */}
                <div className="flex justify-start">
                  <div className="bg-white rounded-xl rounded-tl-sm px-3 py-2 max-w-[80%] shadow-sm">
                    <p className="text-sm text-gray-800">🎤 <em className="text-gray-500">Áudio (1:32)</em></p>
                  </div>
                </div>

                {/* AI transcription */}
                <div className="flex justify-end">
                  <div className="bg-[#DCF8C6] rounded-xl rounded-tr-sm px-3 py-2 max-w-[80%] shadow-sm">
                    <div className="flex items-center gap-1 mb-1">
                      <Bot className="w-3 h-3 text-[#F0702E]" />
                      <span className="text-[10px] text-[#F0702E] font-semibold">IA Mostralo</span>
                    </div>
                    <p className="text-sm text-gray-800">
                      Entendi! Você quer: <strong>2x Hambúrguer Artesanal + 1 Coca 600ml</strong>. Confirmo o pedido?
                    </p>
                  </div>
                </div>

                {/* Customer confirms */}
                <div className="flex justify-start">
                  <div className="bg-white rounded-xl rounded-tl-sm px-3 py-2 max-w-[80%] shadow-sm">
                    <p className="text-sm text-gray-800">Isso! Manda aí 👍</p>
                  </div>
                </div>

                {/* System action */}
                <div className="flex justify-end">
                  <div className="bg-[#DCF8C6] rounded-xl rounded-tr-sm px-3 py-2 max-w-[80%] shadow-sm">
                    <div className="flex items-center gap-1 mb-1">
                      <Bot className="w-3 h-3 text-[#F0702E]" />
                      <span className="text-[10px] text-[#F0702E] font-semibold">IA Mostralo</span>
                    </div>
                    <p className="text-sm text-gray-800">
                      ✅ Pedido #427 criado! Total: <strong>R$ 67,90</strong>. Previsão: 35 min. 🛵
                    </p>
                  </div>
                </div>
              </div>

              {/* Injected buttons bar */}
              <div className="border-t border-gray-200 bg-white px-3 py-2 flex gap-2">
                <button className="flex-1 text-xs font-semibold py-2 rounded-lg border-2 border-[#F0702E] text-[#F0702E] hover:bg-[#F0702E]/5 transition-colors">
                  📋 Tirar Pedido
                </button>
                <button className="flex-1 text-xs font-semibold py-2 rounded-lg border-2 border-[#F0702E] text-[#F0702E] hover:bg-[#F0702E]/5 transition-colors">
                  🔍 Buscar Produto
                </button>
                <button className="flex-1 text-xs font-semibold py-2 rounded-lg border-2 border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors">
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
