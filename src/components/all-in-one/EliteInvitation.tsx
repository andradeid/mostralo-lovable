import { ArrowRight, MessageCircle, Shield, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useRef } from 'react';

export const EliteInvitation = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleConsultation = () => {
    window.open('https://wa.me/5511999999999?text=Olá! Gostaria de uma consultoria sobre o sistema All-in-One do Mostralo.', '_blank');
  };

  return (
    <section ref={sectionRef} className="py-24 bg-background relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0">
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full animate-pulse-glow"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 60%)',
          }}
        />
        <div 
          className="absolute bottom-0 right-0 w-96 h-96 rounded-full animate-float-slow"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)',
          }}
        />
        <div 
          className="absolute top-1/4 left-0 w-64 h-64 rounded-full animate-float-slow-reverse"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.05) 0%, transparent 70%)',
          }}
        />
      </div>
      
      {/* Animated grid pattern */}
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
      
      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Trust badges with animation */}
          <div className={`
            flex justify-center gap-4 mb-8 transition-all duration-700
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
          `}>
            {[
              { Icon: Shield, delay: 0 },
              { Icon: Star, delay: 100 },
              { Icon: Zap, delay: 200 },
            ].map(({ Icon, delay }, i) => (
              <div 
                key={i}
                className="group w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center transition-all duration-500 hover:bg-primary/20 hover:scale-110 hover:shadow-[0_0_30px_rgba(var(--primary),0.4)] cursor-pointer animate-badge-entry"
                style={{ animationDelay: `${delay}ms` }}
              >
                <Icon className="w-6 h-6 text-primary transition-transform duration-300 group-hover:scale-110" />
              </div>
            ))}
          </div>
          
          {/* Title with animation */}
          <h2 className={`
            font-display font-bold text-3xl md:text-4xl lg:text-5xl text-foreground mb-6 transition-all duration-700
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
          `} style={{ transitionDelay: '100ms' }}>
            Sua empresa está pronta para a{' '}
            <span className="text-primary relative inline-block">
              tecnologia de elite?
              
              {/* Animated underline */}
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 250 10" fill="none">
                <path 
                  d="M2 8C50 2 200 2 248 8" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                  className={isVisible ? 'animate-draw-line' : ''}
                  strokeDasharray="250"
                  strokeDashoffset="250"
                />
              </svg>
            </span>
          </h2>
          
          {/* Description */}
          <p className={`
            text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto transition-all duration-700
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
          `} style={{ transitionDelay: '200ms' }}>
            "Não vendemos software. Entregamos a{' '}
            <span className="text-foreground font-semibold">infraestrutura</span> que permite 
            sua empresa <span className="text-primary font-semibold">escalar sem limites</span>."
          </p>
          
          {/* CTA with enhanced effects */}
          <div className={`
            flex flex-col sm:flex-row gap-4 justify-center mb-16 transition-all duration-700
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
          `} style={{ transitionDelay: '300ms' }}>
            <Button 
              size="lg"
              onClick={handleConsultation}
              className="group relative text-lg px-8 py-7 bg-primary hover:bg-primary/90 text-primary-foreground overflow-hidden transition-all duration-300 hover:scale-105 animate-cta-pulse"
            >
              {/* Shine effect */}
              <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700" />
              
              {/* Glow effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
                boxShadow: '0 0 60px rgba(var(--primary), 0.5)',
              }} />
              
              <span className="relative z-10 flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                SOLICITAR CONSULTORIA COM MARCOS ANDRADE
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-2" />
              </span>
            </Button>
          </div>
          
          {/* Author signature with animation */}
          <div className={`
            pt-8 border-t border-border/50 transition-all duration-700
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
          `} style={{ transitionDelay: '400ms' }}>
            <div className="inline-flex items-center gap-4 group cursor-pointer">
              {/* Avatar with glow effect */}
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center transition-all duration-500 group-hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] group-hover:scale-105">
                  <span className="text-primary font-display font-bold text-xl">MA</span>
                </div>
                {/* Pulse ring */}
                <div className="absolute inset-0 rounded-full border-2 border-primary/50 animate-ping-slow opacity-0 group-hover:opacity-100" />
              </div>
              
              <div className="text-left">
                <p className="font-display font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                  Marcos Andrade
                </p>
                <p className="text-muted-foreground text-sm">30 anos de experiência internacional</p>
                <p className="text-primary text-sm font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Suíça • Massachusetts • Brasil
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes badge-entry {
          0% {
            opacity: 0;
            transform: scale(0) rotate(-180deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }

        .animate-badge-entry {
          animation: badge-entry 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes draw-line {
          to {
            stroke-dashoffset: 0;
          }
        }

        .animate-draw-line {
          animation: draw-line 1s ease-out 0.5s forwards;
        }

        @keyframes cta-pulse {
          0%, 100% {
            box-shadow: 0 0 30px rgba(var(--primary), 0.4);
          }
          50% {
            box-shadow: 0 0 50px rgba(var(--primary), 0.6);
          }
        }

        .animate-cta-pulse {
          animation: cta-pulse 2s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.5;
            transform: translate(-50%, 0) scale(1);
          }
          50% {
            opacity: 0.8;
            transform: translate(-50%, 0) scale(1.1);
          }
        }

        .animate-pulse-glow {
          animation: pulse-glow 4s ease-in-out infinite;
        }

        @keyframes float-slow {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(-20px, -30px);
          }
        }

        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }

        .animate-float-slow-reverse {
          animation: float-slow 12s ease-in-out infinite reverse;
        }

        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          75%, 100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </section>
  );
};
