import { ArrowRight, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function MostraloChatCTA() {
  return (
    <section id="mostralo-chat-cta" className="relative py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 to-zinc-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-500/15 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative container mx-auto px-4 text-center space-y-8">
        <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2">
          <MessageCircle className="h-4 w-4 text-orange-400" />
          <span className="text-sm font-semibold text-orange-400">Mostralo Chat</span>
        </div>

        <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white max-w-3xl mx-auto leading-tight">
          O próximo nível do seu negócio{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">não aceita amadorismo.</span>
        </h2>

        <p className="text-lg text-zinc-400 max-w-xl mx-auto">
          Seja o protagonista da sua escala. Transforme o atendimento do seu delivery hoje.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <Link to="/signup">
            <Button
              size="lg"
              className="h-14 px-10 text-base font-bold rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all w-full sm:w-auto text-white"
            >
              SOLICITAR DEMONSTRAÇÃO DO MOSTRALO CHAT
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>

        <p className="text-xs text-zinc-600">
          Sem compromisso • Setup em minutos • Suporte dedicado
        </p>
      </div>
    </section>
  );
}
