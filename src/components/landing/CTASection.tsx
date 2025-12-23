import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Store,
  ArrowRight,
  Check
} from 'lucide-react';

export const CTASection = () => {
  return (
    <section className="py-12 md:py-20 lg:py-32 bg-primary text-primary-foreground">
      <div className="container px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Badge variant="secondary" className="text-base px-4 py-2">
            <Store className="w-4 h-4 mr-2" />
            Comece Hoje Mesmo
          </Badge>
          
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold">
            Pare de Pagar 25% Para Quem
            <br />
            <span className="underline decoration-wavy decoration-primary-foreground/50">
              Não Merece
            </span>
          </h2>
          
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Cada dia que você continua no marketplace é dinheiro saindo do seu bolso e indo para o concorrente.
          </p>

          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              <span>7 dias grátis</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              <span>Sem taxa de setup</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              <span>Cancele quando quiser</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              <span>Suporte 24/7</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button 
                size="lg" 
                variant="secondary" 
                className="text-lg h-14 px-8 shadow-lg hover:shadow-xl transition-shadow group"
              >
                Começar Agora
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/users-demo">
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg h-14 px-8 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
              >
                Ver Demonstração
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
