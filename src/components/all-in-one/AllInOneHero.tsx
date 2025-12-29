import { ArrowRight, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrderFlowAnimation } from './OrderFlowAnimation';
import { ParticleBackground } from './ParticleBackground';

export const AllInOneHero = () => {
  return (
    <section className="relative min-h-screen bg-background overflow-hidden">
      <ParticleBackground />
      
      {/* Animated grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-5 animate-grid-pulse"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
      
      {/* Top gradient */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-primary/5 to-transparent" />
      
      <div className="container relative z-10 pt-24 pb-16">
        {/* Badge with sparkle animation */}
        <div className="flex justify-center mb-8 animate-hero-entry" style={{ animationDelay: '0.1s' }}>
          <div className="relative inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full group hover:bg-primary/20 transition-colors duration-300 cursor-default">
            <Sparkles className="w-4 h-4 text-primary animate-sparkle" />
            <span className="text-primary font-medium text-sm">Ecossistema All-in-One</span>
            <Zap className="w-4 h-4 text-primary animate-pulse" />
            
            {/* Shine effect */}
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shine" />
            </div>
          </div>
        </div>
        
        {/* Headline with word-by-word animation */}
        <div className="text-center max-w-4xl mx-auto mb-8">
          <h1 className="font-display font-black text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-foreground mb-6">
            <span className="inline-block animate-hero-entry" style={{ animationDelay: '0.15s' }}>
              Sincronia
            </span>{' '}
            <span className="inline-block animate-hero-entry" style={{ animationDelay: '0.2s' }}>
              Total:
            </span>
            <br />
            <span className="text-primary relative inline-block">
              <span className="animate-hero-entry inline-block" style={{ animationDelay: '0.25s' }}>
                Do primeiro clique
              </span>{' '}
              <span className="animate-hero-entry inline-block" style={{ animationDelay: '0.3s' }}>
                ao pedido entregue
              </span>
              
              {/* Animated underline */}
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                <path 
                  d="M2 10C50 2 150 2 298 10" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                  className="animate-draw"
                />
              </svg>
              
              {/* Glow under text */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-primary/20 blur-2xl rounded-full" />
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto animate-hero-entry" style={{ animationDelay: '0.35s' }}>
            Transforme sua operação com a tecnologia usada por gigantes globais. 
            O ecossistema <span className="text-primary font-semibold">All-in-One</span> do Mostralo 
            une <span className="text-foreground font-medium">Totem, KDS, Comanda e Delivery</span> em 
            uma única sinfonia de lucro.
          </p>
        </div>
        
        {/* CTA with enhanced hover effects */}
        <div className="flex justify-center mb-16 animate-hero-entry" style={{ animationDelay: '0.4s' }}>
          <Button 
            size="lg" 
            className="group relative text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_60px_rgba(var(--primary),0.5)]"
          >
            {/* Shine effect on hover */}
            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700" />
            
            <span className="relative z-10 flex items-center">
              QUERO A REVOLUÇÃO NO MEU NEGÓCIO
              <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-2" />
            </span>
          </Button>
        </div>
        
        {/* Order Flow Animation */}
        <div className="animate-hero-entry" style={{ animationDelay: '0.5s' }}>
          <OrderFlowAnimation />
        </div>
        
        {/* Scroll indicator */}
        <div className="flex justify-center mt-12 animate-hero-entry" style={{ animationDelay: '0.6s' }}>
          <div className="flex flex-col items-center gap-2 text-muted-foreground animate-bounce-slow">
            <span className="text-xs uppercase tracking-wider">Role para descobrir</span>
            <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-2">
              <div className="w-1.5 h-2.5 bg-primary rounded-full animate-scroll-indicator" />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes hero-entry {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-hero-entry {
          animation: hero-entry 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          opacity: 0;
        }

        @keyframes draw {
          0% {
            stroke-dasharray: 300;
            stroke-dashoffset: 300;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        .animate-draw {
          animation: draw 1.5s ease-out 0.8s forwards;
          stroke-dasharray: 300;
          stroke-dashoffset: 300;
        }

        @keyframes sparkle {
          0%, 100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.2) rotate(180deg);
          }
        }

        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }

        @keyframes shine {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-shine {
          animation: shine 3s ease-in-out infinite;
        }

        @keyframes grid-pulse {
          0%, 100% {
            opacity: 0.05;
          }
          50% {
            opacity: 0.08;
          }
        }

        .animate-grid-pulse {
          animation: grid-pulse 4s ease-in-out infinite;
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        @keyframes scroll-indicator {
          0% {
            opacity: 0;
            transform: translateY(0);
          }
          40% {
            opacity: 1;
          }
          80%, 100% {
            opacity: 0;
            transform: translateY(8px);
          }
        }

        .animate-scroll-indicator {
          animation: scroll-indicator 1.5s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};
