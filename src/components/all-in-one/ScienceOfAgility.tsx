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
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-2xl" />
      
      <div className="container relative z-10">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-foreground mb-4">
            Onde sua empresa está{' '}
            <span className="text-destructive">perdendo dinheiro</span> hoje?
          </h2>
        </div>
        
        {/* Quote */}
        <div className="max-w-3xl mx-auto mb-16 relative">
          <Quote className="absolute -top-4 -left-4 w-12 h-12 text-primary/20" />
          <blockquote className="text-center">
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
        </div>
        
        {/* Solutions Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {solutions.map((solution, index) => {
            const Icon = solution.icon;
            return (
              <div 
                key={solution.title}
                className="group text-center p-8 rounded-2xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(var(--primary),0.15)]"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Icon with glow */}
                <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-primary/10 flex items-center justify-center group-hover:shadow-[0_0_30px_rgba(var(--primary),0.4)] transition-shadow duration-300">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                
                <h3 className="font-display font-bold text-xl text-foreground mb-3">
                  {solution.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {solution.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
