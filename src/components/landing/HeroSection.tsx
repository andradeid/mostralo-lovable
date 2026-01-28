import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PromotionBanner } from '@/components/coupons/PromotionBanner';
import { 
  Crown,
  Rocket,
  Play
} from 'lucide-react';

export const HeroSection = () => {
  return (
    <section className="py-12 md:py-20 lg:py-32 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 w-full overflow-x-hidden">
      <div className="container px-4 md:px-6 max-w-full">
        <div className="flex flex-col items-center space-y-8 text-center w-full">
          <Badge className="text-base px-4 py-2 bg-primary/10 text-primary border-primary/20">
            <Crown className="w-4 h-4 mr-2" />
            Você no Controle Total
          </Badge>
          
          <div className="space-y-4 max-w-4xl w-full px-2">
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight break-words">
              SEUS CLIENTES.
              <span className="block text-primary mt-2">SEUS DADOS.</span>
              <span className="block mt-2">SEU LUCRO.</span>
            </h1>
            <p className="text-xl md:text-2xl lg:text-3xl font-bold text-muted-foreground">
              Tenha seu próprio canal de vendas digital com
              <span className="text-primary block mt-2 font-display">0% de taxa por pedido.</span>
            </p>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Sistema completo com <strong>Assistente IA no WhatsApp</strong> que atende seus clientes 24 horas por dia. 
              Cada cliente é <span className="text-primary font-bold">100% seu</span>.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link to="/auth" className="w-full sm:w-auto">
              <Button size="lg" className="w-full text-lg h-14 px-8 shadow-lg hover:shadow-xl transition-shadow">
                <Rocket className="mr-2 h-5 w-5" />
                Começar Agora
              </Button>
            </Link>
            <Link to="/users-demo" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full text-lg h-14 px-8">
                <Play className="mr-2 h-5 w-5" />
                Ver na Prática
              </Button>
            </Link>
          </div>

          {/* Banner de Cupons Promocionais */}
          <div className="w-full max-w-4xl">
            <PromotionBanner />
          </div>
        </div>
      </div>
    </section>
  );
};
