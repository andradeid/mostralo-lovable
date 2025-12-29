import { Smartphone, Zap, Truck, Quote } from 'lucide-react';

const solutions = [
  {
    icon: Smartphone,
    title: 'Entrada Inteligente',
    description: 'Totem de Autoatendimento e Comanda Digital eliminam filas e erros humanos.',
  },
  {
    icon: Zap,
    title: 'Processamento Real-Time',
    description: 'Sincronização em milissegundos entre balcão, cozinha e financeiro.',
  },
  {
    icon: Truck,
    title: 'Saída Estratégica',
    description: 'Gestão de entrega e KDS que garante o padrão de qualidade.',
  },
];

export const ScienceOfAgility = () => {
  return (
    <section className="py-20 bg-secondary/30 relative overflow-hidden">
      {/* Animated background decoration */}
      <div 
        className="absolute top-0 right-0 w-96 h-96 rounded-full animate-orb-float"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.1) 0%, transparent 70%)',
        }}
      />
      <div 
        className="absolute bottom-0 left-0 w-64 h-64 rounded-full animate-orb-float-reverse"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)',
        }}
      />
      
      <div className="container relative z-10">
        {/* Title with animation */}
        <div className="text-center mb-12 animate-section-entry">
          <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-foreground mb-4">
            Onde sua empresa está{' '}
            <span className="text-destructive relative">
              perdendo dinheiro
              <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none">
                <path 
                  d="M2 6C40 2 80 2 100 4C120 6 160 6 198 2" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth="2" 
                  strokeLinecap="round"
                  strokeDasharray="200"
                  strokeDashoffset="200"
                  className="animate-underline-draw"
                />
              </svg>
            </span>{' '}
            hoje?
          </h2>
        </div>
        
        {/* Quote with floating effect */}
        <div className="max-w-3xl mx-auto mb-16 relative animate-section-entry" style={{ animationDelay: '0.1s' }}>
          <Quote className="absolute -top-4 -left-4 w-12 h-12 text-primary/20 animate-float" />
          <blockquote className="text-center bg-background/30 backdrop-blur-sm rounded-2xl p-8 border border-border/30">
            <p className="text-lg md:text-xl text-muted-foreground italic leading-relaxed">
              "Com minha experiência em mercados como a <span className="text-foreground font-medium">Suíça</span> e{' '}
              <span className="text-foreground font-medium">Massachusetts</span>, identifiquei que o gargalo 
              não é a produção, mas a <span className="text-primary font-semibold">comunicação entre as etapas</span>."
            </p>
            <footer className="mt-6">
              <cite className="not-italic">
                <span className="text-foreground font-display font-bold">Marcos Andrade</span>
                <span className="text-muted-foreground block text-sm mt-1">
                  30 anos de experiência internacional
                </span>
              </cite>
            </footer>
          </blockquote>
          <Quote className="absolute -bottom-4 -right-4 w-12 h-12 text-primary/20 rotate-180 animate-float" style={{ animationDelay: '0.5s' }} />
        </div>
        
        {/* Solutions Grid with staggered animation */}
        <div className="grid md:grid-cols-3 gap-8">
          {solutions.map((solution, index) => {
            const Icon = solution.icon;
            return (
              <div 
                key={solution.title}
                className="group relative text-center p-8 rounded-2xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-[0_0_40px_rgba(var(--primary),0.15)] animate-card-stagger cursor-pointer"
                style={{ animationDelay: `${0.2 + index * 0.1}s` }}
              >
                {/* Hover overlay */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Icon with glow */}
                <div className="relative w-16 h-16 mx-auto mb-6 rounded-xl bg-primary/10 flex items-center justify-center transition-all duration-500 group-hover:shadow-[0_0_40px_rgba(var(--primary),0.4)] group-hover:scale-110 group-hover:bg-primary/20">
                  {/* Pulse effect */}
                  <div className="absolute inset-0 rounded-xl bg-primary/30 opacity-0 group-hover:opacity-100 group-hover:animate-ping" style={{ animationDuration: '2s' }} />
                  
                  <Icon className="relative z-10 w-8 h-8 text-primary transition-transform duration-300 group-hover:scale-110" />
                </div>
                
                {/* Content */}
                <h3 className="relative z-10 font-display font-bold text-xl text-foreground mb-3 transition-colors duration-300 group-hover:text-primary">
                  {solution.title}
                </h3>
                <p className="relative z-10 text-muted-foreground leading-relaxed">
                  {solution.description}
                </p>
                
                {/* Bottom line accent */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary group-hover:w-2/3 transition-all duration-500" />
                
                {/* Number indicator */}
                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm opacity-50 group-hover:opacity-100 transition-opacity duration-300">
                  {index + 1}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes section-entry {
          0% {
            opacity: 0;
            transform: translateY(40px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-section-entry {
          animation: section-entry 0.8s ease-out forwards;
          opacity: 0;
        }

        @keyframes card-stagger {
          0% {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-card-stagger {
          animation: card-stagger 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          opacity: 0;
        }

        @keyframes underline-draw {
          to {
            stroke-dashoffset: 0;
          }
        }

        .animate-underline-draw {
          animation: underline-draw 1s ease-out 0.5s forwards;
        }

        @keyframes orb-float {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(-30px, 20px);
          }
        }

        .animate-orb-float {
          animation: orb-float 15s ease-in-out infinite;
        }

        .animate-orb-float-reverse {
          animation: orb-float 20s ease-in-out infinite reverse;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};
