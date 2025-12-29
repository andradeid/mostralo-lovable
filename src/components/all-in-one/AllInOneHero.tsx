import { ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrderFlowAnimation } from './OrderFlowAnimation';
import { ParticleBackground } from './ParticleBackground';

export const AllInOneHero = () => {
  return (
    <section className="relative min-h-screen bg-background overflow-hidden">
      <ParticleBackground />
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
      
      <div className="container relative z-10 pt-24 pb-16">
        {/* Badge */}
        <div className="flex justify-center mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-primary font-medium text-sm">Ecossistema All-in-One</span>
          </div>
        </div>
        
        {/* Headline */}
        <div className="text-center max-w-4xl mx-auto mb-8">
          <h1 className="font-display font-black text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-foreground mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Sincronia Total:{' '}
            <span className="text-primary relative">
              Do primeiro clique ao pedido entregue
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                <path 
                  d="M2 10C50 2 150 2 298 10" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                  className="animate-draw"
                  style={{
                    strokeDasharray: 300,
                    strokeDashoffset: 300,
                    animation: 'draw 1.5s ease-out 0.8s forwards',
                  }}
                />
              </svg>
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            Transforme sua operação com a tecnologia usada por gigantes globais. 
            O ecossistema <span className="text-primary font-semibold">All-in-One</span> do Mostralo 
            une <span className="text-foreground font-medium">Totem, KDS, Comanda e Delivery</span> em 
            uma única sinfonia de lucro.
          </p>
        </div>
        
        {/* CTA */}
        <div className="flex justify-center mb-16 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <Button 
            size="lg" 
            className="group text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_30px_rgba(var(--primary),0.4)] hover:shadow-[0_0_50px_rgba(var(--primary),0.6)] transition-all duration-300"
          >
            QUERO A REVOLUÇÃO NO MEU NEGÓCIO
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
        
        {/* Order Flow Animation */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <OrderFlowAnimation />
        </div>
      </div>

      <style>{`
        @keyframes draw {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </section>
  );
};
