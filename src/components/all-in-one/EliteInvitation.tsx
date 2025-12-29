import { ArrowRight, MessageCircle, Shield, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const EliteInvitation = () => {
  const handleConsultation = () => {
    window.open('https://wa.me/5511999999999?text=Olá! Gostaria de uma consultoria sobre o sistema All-in-One do Mostralo.', '_blank');
  };

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-2xl" />
      </div>
      
      {/* Grid pattern */}
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
          {/* Trust badges */}
          <div className="flex justify-center gap-4 mb-8">
            {[Shield, Star, MessageCircle].map((Icon, i) => (
              <div 
                key={i}
                className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center"
              >
                <Icon className="w-5 h-5 text-primary" />
              </div>
            ))}
          </div>
          
          {/* Title */}
          <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-foreground mb-6">
            Sua empresa está pronta para a{' '}
            <span className="text-primary">tecnologia de elite?</span>
          </h2>
          
          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            "Não vendemos software. Entregamos a{' '}
            <span className="text-foreground font-semibold">infraestrutura</span> que permite 
            sua empresa <span className="text-primary font-semibold">escalar sem limites</span>."
          </p>
          
          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg"
              onClick={handleConsultation}
              className="group text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_30px_rgba(var(--primary),0.4)] hover:shadow-[0_0_50px_rgba(var(--primary),0.6)] transition-all duration-300"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              SOLICITAR CONSULTORIA COM MARCOS ANDRADE
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          
          {/* Author signature */}
          <div className="pt-8 border-t border-border/50">
            <div className="inline-flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                <span className="text-primary font-display font-bold text-xl">MA</span>
              </div>
              <div className="text-left">
                <p className="font-display font-bold text-foreground">Marcos Andrade</p>
                <p className="text-muted-foreground text-sm">30 anos de experiência internacional</p>
                <p className="text-primary text-sm font-medium">Suíça • Massachusetts • Brasil</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
