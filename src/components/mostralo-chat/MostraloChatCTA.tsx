import { ArrowRight, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function MostraloChatCTA() {
  return (
    <section id="mostralo-chat-cta" className="py-16 md:py-24 bg-gray-900 relative overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(#F0702E 1px, transparent 1px), linear-gradient(90deg, #F0702E 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      <div className="container mx-auto px-4 relative z-10 text-center space-y-8">
        <div className="inline-flex items-center gap-2 bg-[#F0702E]/20 border border-[#F0702E]/30 rounded-full px-4 py-2">
          <MessageCircle className="h-4 w-4 text-[#F0702E]" />
          <span className="text-sm font-semibold text-[#F0702E]">Mostralo Chat</span>
        </div>

        <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white max-w-3xl mx-auto leading-tight">
          O próximo nível do seu negócio{' '}
          <span className="text-[#F0702E]">não aceita amadorismo.</span>
        </h2>

        <p className="text-lg text-gray-400 max-w-xl mx-auto">
          Seja o protagonista da sua escala. Transforme o atendimento do seu delivery hoje.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <Link to="/signup">
            <Button
              className="h-14 px-10 text-base font-bold rounded-xl shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
              style={{ backgroundColor: '#F0702E', color: '#fff' }}
            >
              SOLICITAR DEMONSTRAÇÃO DO MOSTRALO CHAT
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>

        <p className="text-xs text-gray-500">
          Sem compromisso • Setup em minutos • Suporte dedicado
        </p>
      </div>
    </section>
  );
}
