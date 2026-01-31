import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PromotionBanner } from '@/components/coupons/PromotionBanner';
import { 
  AlertTriangle,
  Calculator,
  MessageCircle
} from 'lucide-react';

export const HeroSection = () => {
  return (
    <section className="py-12 md:py-20 lg:py-32 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 w-full overflow-x-hidden">
      <div className="container px-4 md:px-6 max-w-full">
        <div className="flex flex-col items-center space-y-8 text-center w-full">
          <Badge variant="destructive" className="text-base px-4 py-2">
            <AlertTriangle className="w-4 h-4 mr-2" />
            A Verdade que Ninguém Conta
          </Badge>
          
          <div className="space-y-4 max-w-4xl w-full px-2">
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight break-words">
              PARE DE PAGAR PARA O
              <span className="block text-destructive dark:text-red-500 mt-2">iFOOD CRESCER</span>
              <span className="block mt-2">COM SEUS CLIENTES</span>
            </h1>
            <p className="text-xl md:text-2xl lg:text-3xl font-bold text-muted-foreground">
              A cada pedido, você financia a expansão do marketplace que compete com você.
              <span className="text-primary block mt-2 font-display">Invista no SEU negócio, não no deles.</span>
            </p>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Sistema completo com <strong>0% de taxa por pedido</strong> + <span className="text-orange-500 font-bold">SENTINELA:</span> <span className="text-green-600 dark:text-green-400 font-bold">WhatsApp Marketing automático</span> que recupera clientes inativos. Todos os clientes são 100% seus.
            </p>

            {/* Destaque SENTINELA WhatsApp */}
            <div className="mt-6 p-6 bg-gradient-to-r from-orange-50 via-green-50 to-emerald-50 dark:from-orange-950/30 dark:via-green-950/30 dark:to-emerald-950/30 rounded-2xl border-2 border-green-300 dark:border-green-700 max-w-3xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-3">
                <MessageCircle className="w-6 h-6 text-green-500" />
                <h3 className="text-xl md:text-2xl font-bold text-foreground">
                  E os clientes inativos?
                </h3>
              </div>
              <p className="text-lg md:text-xl font-semibold text-foreground">
                O <span className="text-orange-500 font-bold">SENTINELA</span> cuida disso pra você.
              </p>
              <p className="text-sm md:text-base text-muted-foreground mt-2">
                <strong className="text-orange-500">WhatsApp Marketing automático</strong> que recupera clientes inativos e aumenta suas vendas sem você fazer nada.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <Badge className="bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white">
                  🛡️ SENTINELA WhatsApp Incluso
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <a href="#calculadora" className="w-full sm:w-auto">
              <Button size="lg" className="w-full text-lg h-14 px-8 shadow-lg hover:shadow-xl transition-shadow">
                <Calculator className="mr-2 h-5 w-5" />
                Calcular Minha Economia
              </Button>
            </a>
            <Link to="/users-demo" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full text-lg h-14 px-8">
                Ver Sistema ao Vivo
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
