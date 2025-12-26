import { Link } from 'react-router-dom';
import { Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FeaturesHero() {
  return (
    <section className="bg-gradient-to-br from-primary/10 via-background to-orange-500/10 dark:from-primary/5 dark:to-orange-500/5 py-16 md:py-24">
      <div className="container mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">Seus dados. Seus clientes. Seu lucro.</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
          Guia Completo: Todas as Funcionalidades
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          Descubra como sair do iFood e ter controle total do seu negócio com o Mostralo
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/signup">
            <Button size="lg" className="gap-2">
              Começar Agora <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/#plans">
            <Button variant="outline" size="lg">Ver Planos</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
